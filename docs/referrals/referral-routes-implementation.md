# Referral Routes Implementation Guide

This document outlines the implementation details for the referral system routes in `server/routes/referrals.ts`.

## File Structure

```typescript
// server/routes/referrals.ts
import express from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, referrals, referredUsers } from '@shared/schema';
import { referralLimiter } from '../middleware/rate-limiter';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';
import { zodResolver } from '@/lib/zod-resolver';

// Create a router instance
export const referralRoutes = express.Router();

// Apply authentication to all routes
referralRoutes.use(requireAuth);

// 1. Generate or retrieve user's existing referral code
referralRoutes.post('/generate', referralLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Transaction to either get existing or create new referral code
    const referralInfo = await db.transaction(async (tx) => {
      // Check if user already has a referral code
      const [existingReferral] = await tx.select()
        .from(referrals)
        .where(eq(referrals.userId, userId));
        
      // If user already has a referral code, return it
      if (existingReferral) {
        return {
          referralCode: existingReferral.referralCode,
          totalAvailable: existingReferral.totalAvailable,
          totalUsed: existingReferral.totalUsed
        };
      }
      
      // Otherwise, create a new permanent referral code
      const telegramId = req.user.telegramId;
      const randomPart = generateRandomString(8);
      const generatedCode = `${telegramId}_${randomPart}`;
      
      // Create referral record
      const [newReferral] = await tx.insert(referrals).values({
        userId,
        referralCode: generatedCode,
        totalAvailable: 3,  // Default value
        totalUsed: 0
      }).returning();
      
      // Update user record to indicate they have a referral code
      await tx.update(users)
        .set({ hasReferralCode: true })
        .where(eq(users.id, userId));
        
      return {
        referralCode: newReferral.referralCode,
        totalAvailable: newReferral.totalAvailable,
        totalUsed: newReferral.totalUsed
      };
    });
    
    // Construct shareable link
    const shareableLink = `https://t.me/collab_room_bot?start=r_${referralInfo.referralCode}`;
    
    // Log the action (sensitive data redacted by logger)
    logger.info('Referral code accessed', {
      userId: req.user.id,
      referralCode: referralInfo.referralCode
    });
    
    return res.status(200).json({
      success: true,
      referralCode: referralInfo.referralCode,
      shareableLink,
      totalAvailable: referralInfo.totalAvailable,
      totalUsed: referralInfo.totalUsed
    });
  } catch (error) {
    logger.error('Error in referral code generation', {
      error: error.message,
      userId: req.user?.id
    });
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
});

// 2. Get user's referral information and referred friends
referralRoutes.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's referral record
    const [userReferral] = await db.select()
      .from(referrals)
      .where(eq(referrals.userId, userId));
    
    if (!userReferral) {
      return res.status(200).json({
        success: true,
        hasReferralCode: false,
        referredFriends: []
      });
    }
    
    // Get list of referred users
    const referredFriends = await db.select({
      id: referredUsers.id,
      referredUserId: referredUsers.referredUserId,
      createdAt: referredUsers.createdAt,
      status: referredUsers.status,
      // Get referred user details
      userName: users.name,
      userUsername: users.username,
      userApproved: users.approved
    })
    .from(referredUsers)
    .leftJoin(users, eq(referredUsers.referredUserId, users.id))
    .where(eq(referredUsers.referrerId, userId));
    
    // Construct shareable link
    const shareableLink = `https://t.me/collab_room_bot?start=r_${userReferral.referralCode}`;
    
    return res.status(200).json({
      success: true,
      hasReferralCode: true,
      referralCode: userReferral.referralCode,
      shareableLink,
      totalAvailable: userReferral.totalAvailable,
      totalUsed: userReferral.totalUsed,
      referredFriends
    });
  } catch (error) {
    logger.error('Error fetching referral information', {
      error: error.message,
      userId: req.user?.id
    });
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving your referral information'
    });
  }
});

// 3. Verify referral code
const verifySchema = z.object({
  referralCode: z.string().min(1)
});

referralRoutes.post('/verify', zodResolver(verifySchema), async (req, res) => {
  try {
    const { referralCode } = req.body;
    const currentUserId = req.user?.id;
    
    // Find the referral code in the database
    const [referralRecord] = await db.select()
      .from(referrals)
      .where(eq(referrals.referralCode, referralCode));
    
    if (!referralRecord) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid referral code'
      });
    }
    
    // Check if the user is trying to use their own code
    if (referralRecord.userId === currentUserId) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'You cannot use your own referral code'
      });
    }
    
    // Check if the referrer has available slots
    if (referralRecord.totalUsed >= referralRecord.totalAvailable) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'This referral code has reached its usage limit'
      });
    }
    
    return res.status(200).json({
      success: true,
      valid: true,
      referrerId: referralRecord.userId
    });
  } catch (error) {
    logger.error('Error verifying referral code', {
      error: error.message,
      referralCode: req.body?.referralCode,
      userId: req.user?.id
    });
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the referral code'
    });
  }
});

// 4. Apply referral
const applySchema = z.object({
  referralCode: z.string().min(1)
});

referralRoutes.post('/apply', zodResolver(applySchema), async (req, res) => {
  try {
    const { referralCode } = req.body;
    const userId = req.user.id;
    
    // Find the referral code in the database
    const [referralRecord] = await db.select()
      .from(referrals)
      .where(eq(referrals.referralCode, referralCode));
    
    if (!referralRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }
    
    const referrerId = referralRecord.userId;
    
    // Check if the user is trying to use their own code
    if (referrerId === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot use your own referral code'
      });
    }
    
    // Check if the user has already been referred
    const [existingReferral] = await db.select()
      .from(referredUsers)
      .where(eq(referredUsers.referredUserId, userId));
    
    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: 'You have already used a referral code'
      });
    }
    
    // Check if the referrer has available slots
    if (referralRecord.totalUsed >= referralRecord.totalAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This referral code has reached its usage limit'
      });
    }
    
    // Transaction to update referral counts and user status
    await db.transaction(async (tx) => {
      // Update the referrer's used count
      await tx.update(referrals)
        .set({ totalUsed: referralRecord.totalUsed + 1 })
        .where(eq(referrals.userId, referrerId));
      
      // Create referral relationship record
      await tx.insert(referredUsers).values({
        referrerId,
        referredUserId: userId,
        status: 'completed'
      });
      
      // Auto-approve the user
      await tx.update(users)
        .set({ 
          approved: true,
          approvedAt: new Date(),
          referredBy: referrerId
        })
        .where(eq(users.id, userId));
    });
    
    // Send notification to referrer (implementation omitted for brevity)
    
    return res.status(200).json({
      success: true,
      message: 'Referral applied successfully'
    });
  } catch (error) {
    logger.error('Error applying referral', {
      error: error.message,
      referralCode: req.body?.referralCode,
      userId: req.user?.id
    });
    return res.status(500).json({
      success: false,
      message: 'An error occurred while applying the referral'
    });
  }
});

// Helper function to generate random string for referral codes
function generateRandomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
```

## Route Registration

In `server/routes.ts`, register the referral routes:

```typescript
import { referralRoutes } from './routes/referrals';

// Rest of your existing code...

// Register routes
app.use('/api/referrals', referralRoutes);
```

## Rate Limiter Configuration

Ensure the rate limiter is configured properly in `server/middleware/rate-limiter.ts`:

```typescript
export const referralLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 requests per day
  message: "Too many referral requests, please try again tomorrow",
  skipIfDevelopment: true
});
```

## Frontend Example Usage

```tsx
// client/src/pages/dashboard.tsx

// In your component
const { data: referralInfo, isLoading } = useQuery({
  queryKey: ['/api/referrals'],
  staleTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  retry: false,
});

// Example UI
return (
  <div className="p-4">
    <h2 className="text-2xl font-bold mb-4">Invite Friends</h2>
    
    {isLoading ? (
      <Skeleton className="h-32 w-full" />
    ) : referralInfo?.hasReferralCode ? (
      <div className="space-y-4">
        <ReferralCard 
          referralCode={referralInfo.referralCode}
          shareableLink={referralInfo.shareableLink}
          totalAvailable={referralInfo.totalAvailable}
          totalUsed={referralInfo.totalUsed}
        />
        
        <ReferredUsersList 
          users={referralInfo.referredFriends} 
        />
      </div>
    ) : (
      <NoReferralsYet />
    )}
  </div>
);
```