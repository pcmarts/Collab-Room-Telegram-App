# Referral System Implementation Guide

This technical guide provides detailed implementation instructions for developers working on The Collab Room's referral system. It should be used alongside the PRD.

## Table of Contents
1. [Database Schema Implementation](#1-database-schema-implementation)
2. [API Implementation](#2-api-implementation)
3. [Frontend Component Implementation](#3-frontend-component-implementation)
4. [Telegram Integration](#4-telegram-integration)
5. [Testing Guidelines](#5-testing-guidelines)

## 1. Database Schema Implementation

### Schema Updates

Add the following tables to `shared/schema.ts`:

```typescript
// Combined table for referral tracking and limits
export const user_referrals = pgTable("user_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referral_code: text("referral_code").notNull().unique(),
  total_available: integer("total_available").notNull().default(3),
  total_used: integer("total_used").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Table to track individual referrals
export const referral_events = pgTable("referral_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrer_id: uuid("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referred_user_id: uuid("referred_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, completed, expired
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});
```

### Create Zod Schemas

Add the following schemas to `shared/schema.ts`:

```typescript
// Schemas for referral-related operations
export const referralCodeSchema = z.string().regex(/^[0-9]+_[a-f0-9]{8}$/, 
  "Invalid referral code format");

export const createUserReferralSchema = createInsertSchema(user_referrals, {
  referral_code: referralCodeSchema,
});

export const createReferralEventSchema = createInsertSchema(referral_events);

// Derived types
export type UserReferral = typeof user_referrals.$inferSelect;
export type InsertUserReferral = z.infer<typeof createUserReferralSchema>;
export type ReferralEvent = typeof referral_events.$inferSelect;
export type InsertReferralEvent = z.infer<typeof createReferralEventSchema>;
```

### Migration Script

Create a migration script in `server/migrations/referral-system-init.ts`:

```typescript
import { db } from "../db";
import { users, user_referrals } from "@shared/schema";
import crypto from "crypto";

function generateReferralCode(telegramId: string): string {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `${telegramId}_${randomSuffix}`;
}

export async function initializeReferralSystem() {
  console.log("Initializing referral system for existing users...");
  
  // Get all existing users
  const existingUsers = await db.select({
    id: users.id,
    telegram_id: users.telegram_id
  }).from(users);
  
  console.log(`Found ${existingUsers.length} existing users to initialize`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process users in batches to prevent memory issues
  for (const user of existingUsers) {
    try {
      if (!user.telegram_id) {
        console.log(`Skipping user ${user.id}: No Telegram ID`);
        continue;
      }
      
      // Check if user already has a referral record
      const existing = await db.select().from(user_referrals)
        .where(eq(user_referrals.user_id, user.id))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`User ${user.id} already has referral data`);
        continue;
      }
      
      // Generate referral code
      const referralCode = generateReferralCode(user.telegram_id);
      
      // Create referral record
      await db.transaction(async (tx) => {
        await tx.insert(user_referrals).values({
          user_id: user.id,
          referral_code: referralCode,
          total_available: 3,
          total_used: 0,
        });
      });
      
      successCount++;
    } catch (error) {
      console.error(`Error processing user ${user.id}:`, error);
      errorCount++;
    }
  }
  
  console.log(`Referral initialization complete. Success: ${successCount}, Errors: ${errorCount}`);
}
```

## 2. API Implementation

### Create Referral Service

Create a new file `server/services/referral-service.ts`:

```typescript
import { db } from "../db";
import { users, user_referrals, referral_events } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { logger } from "../utils/logger";

/**
 * Generates a secure referral code using the user's Telegram ID and a random suffix
 */
export function generateReferralCode(telegramId: string): string {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `${telegramId}_${randomSuffix}`;
}

/**
 * Encodes referral information for use in deep links
 */
export function encodeReferralInfo(referralCode: string): string {
  return Buffer.from(referralCode).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decodes referral information from deep links
 */
export function decodeReferralInfo(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString();
}

/**
 * Gets or creates a referral code for a user
 */
export async function getOrCreateReferralCode(userId: string, telegramId: string): Promise<{
  referralCode: string;
  referralLink: string;
  isNew: boolean;
  totalAvailable: number;
  totalUsed: number;
}> {
  try {
    // Check if user already has a referral code
    const existingCode = await db.select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, userId))
      .limit(1);
      
    if (existingCode.length > 0) {
      const referral = existingCode[0];
      const encodedCode = encodeReferralInfo(referral.referral_code);
      const referralLink = `https://t.me/collab_room_bot?start=r_${encodedCode}`;
      
      return {
        referralCode: referral.referral_code,
        referralLink,
        isNew: false,
        totalAvailable: referral.total_available,
        totalUsed: referral.total_used
      };
    }
    
    // Generate new code
    const referralCode = generateReferralCode(telegramId);
    const encodedCode = encodeReferralInfo(referralCode);
    const referralLink = `https://t.me/collab_room_bot?start=r_${encodedCode}`;
    
    // Create new referral record
    await db.transaction(async (tx) => {
      await tx.insert(user_referrals).values({
        user_id: userId,
        referral_code: referralCode,
        total_available: 3,
        total_used: 0,
      });
    });
    
    return {
      referralCode,
      referralLink,
      isNew: true,
      totalAvailable: 3,
      totalUsed: 0
    };
  } catch (error) {
    logger.error('Failed to generate referral code', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to generate referral code');
  }
}

/**
 * Gets a user's referral information including referred users
 */
export async function getUserReferralInfo(userId: string) {
  try {
    // Get user's referral record
    const referralRecord = await db.select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, userId))
      .limit(1);
      
    if (referralRecord.length === 0) {
      return null;
    }
    
    const referral = referralRecord[0];
    
    // Get referred users
    const referredUsers = await db.select({
      id: referral_events.id,
      referredUserId: referral_events.referred_user_id,
      status: referral_events.status,
      createdAt: referral_events.created_at,
      completedAt: referral_events.completed_at,
      firstName: users.first_name,
      lastName: users.last_name,
      handle: users.handle,
    })
    .from(referral_events)
    .leftJoin(users, eq(referral_events.referred_user_id, users.id))
    .where(eq(referral_events.referrer_id, userId));
    
    const encodedCode = encodeReferralInfo(referral.referral_code);
    const referralLink = `https://t.me/collab_room_bot?start=r_${encodedCode}`;
    
    return {
      referralCode: referral.referral_code,
      referralLink,
      totalAvailable: referral.total_available,
      totalUsed: referral.total_used,
      referredUsers
    };
  } catch (error) {
    logger.error('Failed to get user referral info', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to get user referral information');
  }
}

/**
 * Verifies if a referral code is valid
 */
export async function verifyReferralCode(referralCode: string, newUserId: string) {
  try {
    // Find the referrer
    const referrerRecord = await db.select({
      id: user_referrals.user_id,
      available: user_referrals.total_available,
      used: user_referrals.total_used,
    })
    .from(user_referrals)
    .where(eq(user_referrals.referral_code, referralCode))
    .limit(1);
    
    if (referrerRecord.length === 0) {
      return {
        valid: false,
        error: 'INVALID_CODE',
        message: 'Invalid referral code'
      };
    }
    
    const referrer = referrerRecord[0];
    
    // Check if self-referral
    if (referrer.id === newUserId) {
      return {
        valid: false,
        error: 'SELF_REFERRAL',
        message: 'You cannot refer yourself'
      };
    }
    
    // Check if referrer has available slots
    if (referrer.used >= referrer.available) {
      return {
        valid: false,
        error: 'NO_AVAILABLE_REFERRALS',
        message: 'This referral code has reached its limit'
      };
    }
    
    return {
      valid: true,
      referrerId: referrer.id
    };
  } catch (error) {
    logger.error('Failed to verify referral code', {
      referralCode,
      newUserId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to verify referral code');
  }
}

/**
 * Applies a referral, creating the relationship and updating counts
 */
export async function applyReferral(referralCode: string, newUserId: string, idempotencyKey: string) {
  try {
    // First verify the code
    const verification = await verifyReferralCode(referralCode, newUserId);
    
    if (!verification.valid) {
      return verification;
    }
    
    const referrerId = verification.referrerId;
    
    // Check if this referral was already processed
    const existingReferral = await db.select()
      .from(referral_events)
      .where(
        and(
          eq(referral_events.referrer_id, referrerId),
          eq(referral_events.referred_user_id, newUserId)
        )
      )
      .limit(1);
      
    if (existingReferral.length > 0) {
      return {
        success: true,
        message: 'Referral already processed',
        referrerId
      };
    }
    
    // Process the referral in a transaction
    await db.transaction(async (tx) => {
      // Increment used count for referrer
      await tx.update(user_referrals)
        .set({ 
          total_used: sql`total_used + 1`,
          updated_at: new Date() 
        })
        .where(eq(user_referrals.user_id, referrerId));
      
      // Create referral event
      await tx.insert(referral_events).values({
        referrer_id: referrerId,
        referred_user_id: newUserId,
        status: 'completed',
        completed_at: new Date()
      });
      
      // Auto-approve the new user
      await tx.update(users)
        .set({ is_approved: true })
        .where(eq(users.id, newUserId));
    });
    
    return {
      success: true,
      message: 'Referral applied successfully',
      referrerId
    };
  } catch (error) {
    logger.error('Failed to apply referral', {
      referralCode,
      newUserId,
      idempotencyKey,
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to apply referral');
  }
}
```

### Create Referral Routes

Create a new file `server/routes/referral-routes.ts`:

```typescript
import express from 'express';
import { z } from 'zod';
import { getTelegramUserFromRequest } from '../middleware/auth';
import { 
  getOrCreateReferralCode, 
  getUserReferralInfo, 
  verifyReferralCode,
  applyReferral
} from '../services/referral-service';
import { referralLimiter } from '../middleware/rate-limiter';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = express.Router();

// Define validation schemas
const generateReferralSchema = z.object({});

const verifyReferralSchema = z.object({
  referralCode: z.string(),
});

const applyReferralSchema = z.object({
  referralCode: z.string(),
});

// Get user's referral information
router.get('/', async (req, res) => {
  try {
    const user = getTelegramUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const referralInfo = await getUserReferralInfo(user.id);
    
    if (!referralInfo) {
      return res.status(404).json({ error: 'No referral information found' });
    }
    
    res.json(referralInfo);
  } catch (error) {
    logger.error('Error in GET /api/referrals', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to get referral information' });
  }
});

// Generate or get referral code
router.post('/generate', referralLimiter, async (req, res) => {
  try {
    const user = getTelegramUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validatedData = generateReferralSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error });
    }
    
    if (!user.telegram_id) {
      return res.status(400).json({ error: 'User does not have a Telegram ID' });
    }
    
    const referralData = await getOrCreateReferralCode(user.id, user.telegram_id);
    
    res.json(referralData);
  } catch (error) {
    logger.error('Error in POST /api/referrals/generate', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to generate referral code' });
  }
});

// Verify referral code
router.post('/verify', async (req, res) => {
  try {
    const user = getTelegramUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validatedData = verifyReferralSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error });
    }
    
    const { referralCode } = validatedData.data;
    
    const verification = await verifyReferralCode(referralCode, user.id);
    
    res.json(verification);
  } catch (error) {
    logger.error('Error in POST /api/referrals/verify', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to verify referral code' });
  }
});

// Apply referral code
router.post('/apply', async (req, res) => {
  try {
    const user = getTelegramUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const validatedData = applyReferralSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error });
    }
    
    const { referralCode } = validatedData.data;
    const idempotencyKey = uuidv4(); // Generate unique idempotency key
    
    const result = await applyReferral(referralCode, user.id, idempotencyKey);
    
    res.json(result);
  } catch (error) {
    logger.error('Error in POST /api/referrals/apply', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to apply referral code' });
  }
});

export default router;
```

### Update Rate Limiter

Add the following to `server/middleware/rate-limiter.ts`:

```typescript
export const referralLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 requests per day
  message: "Too many referral requests, please try again tomorrow",
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Register Routes

Update main routes file in `server/routes.ts`:

```typescript
import referralRoutes from './routes/referral-routes';

// Add this to the routes setup section
app.use('/api/referrals', referralRoutes);
```

## 3. Frontend Component Implementation

### Create Common Components

Create a new directory `client/src/components/referrals/` and add the following components:

#### ReferralCard.tsx

```tsx
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface ReferralCardProps {
  className?: string;
}

export function ReferralCard({ className }: ReferralCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  
  // Get referral information
  const { data: referralInfo, isLoading, error } = useQuery({
    queryKey: ['/api/referrals'],
    // Only refetch when component mounts to avoid unnecessary requests
    refetchOnWindowFocus: false,
  });
  
  // Generate referral code mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/referrals/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
      toast({
        title: "Referral Code Generated",
        description: "Your referral code has been generated successfully."
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to Generate Code",
        description: error.message || "An error occurred while generating your referral code."
      });
    }
  });
  
  const handleGenerateReferralCode = () => {
    generateMutation.mutate();
  };
  
  const handleCopyLink = () => {
    if (referralInfo?.referralLink) {
      navigator.clipboard.writeText(referralInfo.referralLink);
      toast({
        title: "Link Copied",
        description: "Referral link copied to clipboard"
      });
    }
  };
  
  const handleShareTelegram = () => {
    if (referralInfo?.referralLink) {
      // Check if Telegram WebApp API is available
      if (window.Telegram?.WebApp?.openTelegramLink) {
        const encodedLink = encodeURIComponent(referralInfo.referralLink);
        const encodedMessage = encodeURIComponent("Hey, join my Collab Room!");
        window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodedLink}&text=${encodedMessage}`);
      } else {
        // Fallback to copy
        handleCopyLink();
        toast({
          title: "Telegram Sharing Unavailable",
          description: "Link copied to clipboard instead. You can paste it in Telegram manually."
        });
      }
    }
  };
  
  if (isLoading) {
    return (
      <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2 bg-gray-800" />
          <Skeleton className="h-4 w-1/2 bg-gray-800" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4 bg-gray-800" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full bg-gray-800" />
        </CardFooter>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={`bg-gray-950 text-white border-red-900 ${className}`}>
        <CardHeader>
          <CardTitle>Error Loading Referrals</CardTitle>
          <CardDescription className="text-gray-400">
            We couldn't load your referral information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Try refreshing the page or contact support if the issue persists.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="secondary" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/referrals'] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If no referral code yet, show generate button
  if (!referralInfo || !referralInfo.referralCode) {
    return (
      <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
        <CardHeader>
          <CardTitle>Invite Friends</CardTitle>
          <CardDescription className="text-gray-400">
            Generate a referral code to invite friends to The Collab Room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-4">
            You can invite up to 3 friends to join. They'll get instant access when they use your referral link!
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleGenerateReferralCode}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>Generate Referral Link</>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle>Invite Friends</CardTitle>
        <CardDescription className="text-gray-400">
          Share your referral link with friends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Referrals Available</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div 
                  className="bg-primary rounded-full h-2.5" 
                  style={{ width: `${(referralInfo.totalUsed / referralInfo.totalAvailable) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium">
                {referralInfo.totalUsed}/{referralInfo.totalAvailable}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-2">Your referral link:</p>
            <div className="p-3 bg-gray-900 rounded border border-gray-800 text-sm truncate">
              {referralInfo.referralLink}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="flex space-x-2 w-full">
          <Button 
            className="flex-1"
            variant="default"
            onClick={handleShareTelegram}
          >
            <Share className="mr-2 h-4 w-4" /> Share Link
          </Button>
          <Button 
            className="flex-1"
            variant="outline"
            onClick={handleCopyLink}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy Link
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

#### ReferredUsersList.tsx

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface ReferredUsersListProps {
  className?: string;
}

export function ReferredUsersList({ className }: ReferredUsersListProps) {
  // Get referral information including referred users
  const { data: referralInfo, isLoading, error } = useQuery({
    queryKey: ['/api/referrals'],
    refetchOnWindowFocus: false,
  });
  
  if (isLoading) {
    return (
      <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2 bg-gray-800" />
          <Skeleton className="h-4 w-1/2 bg-gray-800" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full mb-2 bg-gray-800" />
          <Skeleton className="h-16 w-full mb-2 bg-gray-800" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={`bg-gray-950 text-white border-red-900 ${className}`}>
        <CardHeader>
          <CardTitle>Error Loading Referred Users</CardTitle>
          <CardDescription className="text-gray-400">
            We couldn't load your referred users information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Try refreshing the page or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // If no referrals yet or no referred users
  if (!referralInfo || !referralInfo.referredUsers || referralInfo.referredUsers.length === 0) {
    return (
      <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
        <CardHeader>
          <CardTitle>Referred Friends</CardTitle>
          <CardDescription className="text-gray-400">
            People you've invited to The Collab Room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">
              You haven't referred anyone yet. Share your referral link to invite friends!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle>Referred Friends</CardTitle>
        <CardDescription className="text-gray-400">
          People you've invited to The Collab Room
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referralInfo.referredUsers.map((user) => (
            <div key={user.id} className="flex items-start p-3 bg-gray-900 rounded border border-gray-800">
              <div className="mr-3 mt-1">
                {user.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : user.status === 'pending' ? (
                  <Clock className="h-5 w-5 text-yellow-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {user.firstName} {user.lastName || ''}
                </p>
                <p className="text-sm text-gray-400">@{user.handle}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {user.status === 'completed' 
                    ? `Joined ${new Date(user.completedAt).toLocaleDateString()}`
                    : user.status === 'pending'
                    ? 'Pending completion'
                    : 'Expired'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### ReferralInfoPanel.tsx

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Gift, Zap, Users } from 'lucide-react';

interface ReferralInfoPanelProps {
  className?: string;
}

export function ReferralInfoPanel({ className }: ReferralInfoPanelProps) {
  return (
    <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle>Referral Program</CardTitle>
        <CardDescription className="text-gray-400">
          Invite friends and help them skip the waiting list
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="mr-3 bg-primary/20 p-2 rounded-full">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Limited Invitations</h4>
              <p className="text-xs text-gray-400">
                You can invite up to 3 friends to join The Collab Room.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-3 bg-primary/20 p-2 rounded-full">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Instant Access</h4>
              <p className="text-xs text-gray-400">
                Your invited friends get instant access, bypassing the waiting list.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-3 bg-primary/20 p-2 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Exclusive Community</h4>
              <p className="text-xs text-gray-400">
                Help build a high-quality network by inviting valuable connections.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Update Application Status Page

Update `client/src/pages/application-status.tsx` to add the referral components:

```tsx
// Add imports for referral components
import { ReferralCard } from '@/components/referrals/ReferralCard';
import { ReferralInfoPanel } from '@/components/referrals/ReferralInfoPanel';

// Within the main return statement, add this section after the status card:

{currentStatus !== 'approved' && (
  <Card className="mt-6 bg-gray-950 text-white border-gray-800 border-2 border-primary">
    <CardHeader>
      <CardTitle className="flex items-center">
        <Gift className="text-primary mr-2" /> Skip the Waiting List
      </CardTitle>
      <CardDescription className="text-gray-400">
        Get instant access by inviting friends to The Collab Room
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="mb-6">
        <p className="text-sm text-white mb-2">
          Want to skip the waiting list? Invite friends to join The Collab Room and get instant access!
        </p>
        <p className="text-sm text-gray-400">
          Each person who signs up using your referral link counts toward your instant approval.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReferralInfoPanel />
        <ReferralCard />
      </div>
    </CardContent>
  </Card>
)}
```

### Update Dashboard Page

Update `client/src/pages/dashboard.tsx` to add the referral components:

```tsx
// Add imports for referral components
import { ReferralCard } from '@/components/referrals/ReferralCard';
import { ReferredUsersList } from '@/components/referrals/ReferredUsersList';

// Find the appropriate section in the dashboard to add the referral section, for example:

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
  <h2 className="text-xl font-bold col-span-1 md:col-span-2 mb-2">Referrals</h2>
  <ReferralCard />
  <ReferredUsersList />
</div>
```

## 4. Telegram Integration

### Update Telegram Bot Handler

Update `server/telegram.ts` to add referral code handling:

```typescript
// Add these imports
import { 
  decodeReferralInfo, 
  verifyReferralCode, 
  applyReferral 
} from './services/referral-service';
import { v4 as uuidv4 } from 'uuid';

// Add these notification template functions
export function notifyReferrerSuccess(telegramId: string, referredName: string) {
  try {
    bot.sendMessage(
      telegramId,
      `🎉 Congratulations! ${referredName} has joined The Collab Room using your referral link.`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    logger.error('Failed to send referrer success notification', {
      telegramId,
      referredName,
      error: error.message,
    });
  }
}

export function notifyReferredSuccess(telegramId: string) {
  try {
    bot.sendMessage(
      telegramId,
      `🌟 Welcome to The Collab Room! You've been referred by a current member and have received instant access to the platform.`,
      { parse_mode: 'HTML' }
    );
  } catch (error) {
    logger.error('Failed to send referred success notification', {
      telegramId,
      error: error.message,
    });
  }
}

// Find the bot.onText handler for /start command and add referral handling
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const startParam = match?.[1];
  
  // Handle referral codes
  if (startParam && startParam.startsWith('r_')) {
    try {
      // Extract and decode referral code
      const encodedReferralInfo = startParam.substring(2);
      const referralCode = decodeReferralInfo(encodedReferralInfo);
      
      // Store the referral code in user session for later use during signup
      // This depends on your session management approach
      pendingReferrals.set(chatId.toString(), referralCode);
      
      bot.sendMessage(
        chatId,
        `Welcome to The Collab Room! You've been invited by a member. Complete the signup process to get instant access!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Start Application", web_app: { url: `${WEBAPP_URL}/apply` } }]
            ]
          }
        }
      );
      return;
    } catch (error) {
      logger.error('Error handling referral start parameter', {
        startParam,
        chatId,
        error: error.message,
      });
      // Fall through to normal welcome message
    }
  }
  
  // Normal start command handling...
});

// Add a function to process a referral when a user completes signup
export async function processReferralForNewUser(userId: string, telegramId: string) {
  try {
    // Check if this user came through a referral
    const referralCode = pendingReferrals.get(telegramId);
    
    if (!referralCode) {
      return false;
    }
    
    // Apply the referral
    const idempotencyKey = uuidv4();
    const result = await applyReferral(referralCode, userId, idempotencyKey);
    
    if (result.success) {
      // Get referrer details
      const referrerData = await db.select({
        telegram_id: users.telegram_id,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(users)
      .where(eq(users.id, result.referrerId))
      .limit(1);
      
      if (referrerData.length > 0) {
        const referrer = referrerData[0];
        
        // Get new user details
        const newUserData = await db.select({
          first_name: users.first_name,
          last_name: users.last_name,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
        
        const newUser = newUserData[0];
        
        // Send notifications
        if (referrer.telegram_id) {
          const referredName = `${newUser.first_name} ${newUser.last_name || ''}`.trim();
          notifyReferrerSuccess(referrer.telegram_id, referredName);
        }
        
        notifyReferredSuccess(telegramId);
      }
      
      // Clear the pending referral
      pendingReferrals.delete(telegramId);
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Failed to process referral for new user', {
      userId,
      telegramId,
      error: error.message,
    });
    return false;
  }
}

// Update user application handling to include referral processing
// This should be added to the function that processes new user applications
async function processUserApplication(userData: any) {
  // Existing application processing...
  
  // After creating the user, process any referral
  if (user.telegram_id) {
    await processReferralForNewUser(user.id, user.telegram_id);
  }
  
  // Continue with rest of function...
}
```

## 5. Testing Guidelines

### Unit Tests

Create tests for referral code generation and validation:

```typescript
// tests/referral-service.test.ts
import { 
  generateReferralCode, 
  encodeReferralInfo, 
  decodeReferralInfo 
} from '../server/services/referral-service';

describe('Referral Service', () => {
  describe('generateReferralCode', () => {
    it('should generate a valid referral code with correct format', () => {
      const telegramId = '123456789';
      const code = generateReferralCode(telegramId);
      
      // Format should be telegramId_randomSuffix
      expect(code).toMatch(/^123456789_[a-f0-9]{8}$/);
    });
    
    it('should generate unique codes for multiple calls', () => {
      const telegramId = '123456789';
      const code1 = generateReferralCode(telegramId);
      const code2 = generateReferralCode(telegramId);
      
      expect(code1).not.toEqual(code2);
    });
  });
  
  describe('encodeReferralInfo and decodeReferralInfo', () => {
    it('should correctly encode and decode referral codes', () => {
      const originalCode = '123456789_abcdef12';
      const encoded = encodeReferralInfo(originalCode);
      const decoded = decodeReferralInfo(encoded);
      
      expect(decoded).toEqual(originalCode);
    });
    
    it('should handle special characters in encoding', () => {
      const originalCode = '123+456/789=_abcdef12';
      const encoded = encodeReferralInfo(originalCode);
      
      // Encoded string should not contain +, / or =
      expect(encoded).not.toMatch(/[+/=]/);
      
      const decoded = decodeReferralInfo(encoded);
      expect(decoded).toEqual(originalCode);
    });
  });
});
```

### Integration Tests

Create manual testing scenarios:

1. **Referral Code Generation**
   - Generate a new referral code for a user
   - Verify it's saved in the database
   - Verify the correct format

2. **Referral Application Flow**
   - Create a test user with a referral code
   - Create a new user using the referral code
   - Verify the referral relationship is recorded
   - Verify the referral count is incremented
   - Verify both users receive appropriate notifications

3. **Edge Case Testing**
   - Test what happens when a user tries to refer themselves
   - Test what happens when a referral code is invalid
   - Test what happens when a user has exhausted their referral limit
   - Test what happens when a user tries to use multiple referral codes

### API Testing

Test the API endpoints using tools like Postman or cURL:

```bash
# Generate a referral code
curl -X POST http://localhost:5000/api/referrals/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{}'

# Get referral information
curl -X GET http://localhost:5000/api/referrals \
  -H "Authorization: Bearer <token>"

# Verify a referral code
curl -X POST http://localhost:5000/api/referrals/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"referralCode": "123456789_abcdef12"}'

# Apply a referral
curl -X POST http://localhost:5000/api/referrals/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"referralCode": "123456789_abcdef12"}'
```