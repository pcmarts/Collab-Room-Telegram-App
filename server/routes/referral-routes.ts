import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, user_referrals, referral_events } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { storage } from '../storage';
import crypto from 'crypto';

// Simple in-memory rate limiter
const requestCounts: Record<string, { count: number, resetTime: number }> = {};

// Basic rate limiter middleware
const referralLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  // Clean up expired entries
  if (requestCounts[ip] && requestCounts[ip].resetTime < now) {
    delete requestCounts[ip];
  }
  
  // Create new entry if doesn't exist
  if (!requestCounts[ip]) {
    requestCounts[ip] = {
      count: 0,
      resetTime: now + windowMs
    };
  }
  
  // Increment count
  requestCounts[ip].count++;
  
  // Check limit
  if (requestCounts[ip].count > 20) { // 20 requests per hour
    return res.status(429).json({
      success: false,
      message: 'Too many referral requests, please try again later'
    });
  }
  
  next();
};

// Create a router instance
const router = express.Router();

interface TelegramRequest extends express.Request {
  telegramData?: {
    id: string;
    username?: string;
    first_name: string;
    last_name?: string;
  }
}

// Define validation schemas
const validateReferralSchema = z.object({
  referral_code: z.string().min(5),
});

const applyReferralSchema = z.object({
  referral_code: z.string().min(5),
});

// Get current user's referral code
router.get('/my-code', async (req: TelegramRequest, res) => {
  try {
    // Check if user is authenticated
    if (!req.telegramData || !req.telegramData.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user from database
    const telegramId = req.telegramData.id;
    const user = await storage.getUserByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get or create referral code
    const [userReferral] = await db
      .select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, user.id));

    if (!userReferral) {
      // Create new referral code
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      const referralCode = `r_${user.telegram_id}_${randomSuffix}`;

      // Create user_referral record
      const [newUserReferral] = await db
        .insert(user_referrals)
        .values({
          user_id: user.id,
          referral_code: referralCode,
          total_available: 3, // Default limit
          total_used: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();

      // Update user's referral code
      await db
        .update(users)
        .set({ referral_code: referralCode })
        .where(eq(users.id, user.id));

      // Generate shareable Telegram bot link
      const shareableLink = `https://t.me/collabroom_test_bot?start=${referralCode}`;

      return res.status(200).json({
        success: true,
        referral_code: referralCode,
        total_available: newUserReferral.total_available,
        total_used: newUserReferral.total_used,
        remaining: newUserReferral.total_available - newUserReferral.total_used,
        shareable_link: shareableLink
      });
    } else {
      // Generate shareable Telegram bot link
      const shareableLink = `https://t.me/collabroom_test_bot?start=${userReferral.referral_code}`;

      return res.status(200).json({
        success: true,
        referral_code: userReferral.referral_code,
        total_available: userReferral.total_available,
        total_used: userReferral.total_used,
        remaining: userReferral.total_available - userReferral.total_used,
        shareable_link: shareableLink
      });
    }
  } catch (error) {
    console.error('Error getting referral code:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving referral code'
    });
  }
});

// Get users referred by current user
router.get('/my-referrals', async (req: TelegramRequest, res) => {
  try {
    // Check if user is authenticated
    if (!req.telegramData || !req.telegramData.id) {
      return res.status(401).json({
        success: false, 
        message: 'Authentication required'
      });
    }

    // Get user from database
    const telegramId = req.telegramData.id;
    const user = await storage.getUserByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get users referred by this user
    const referredUsers = await db
      .select({
        user: users
      })
      .from(users)
      .where(eq(users.referred_by, user.id));

    const formattedUsers = referredUsers.map(item => ({
      id: item.user.id,
      first_name: item.user.first_name,
      last_name: item.user.last_name,
      handle: item.user.handle,
      created_at: item.user.created_at
    }));

    // Get referral information
    const [userReferral] = await db
      .select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, user.id));

    if (!userReferral) {
      return res.status(200).json({
        success: true,
        referral_code: null,
        total_available: 3,
        total_used: 0,
        remaining: 3,
        referred_users: formattedUsers
      });
    }

    return res.status(200).json({
      success: true,
      referral_code: userReferral.referral_code,
      total_available: userReferral.total_available,
      total_used: userReferral.total_used,
      remaining: userReferral.total_available - userReferral.total_used,
      referred_users: formattedUsers
    });
  } catch (error) {
    console.error('Error getting referred users:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving referred users'
    });
  }
});

// Validate a referral code
router.post('/validate', referralLimiter, async (req, res) => {
  try {
    // Validate request body
    const validation = validateReferralSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid referral code format'
      });
    }

    const { referral_code } = validation.data;

    // Check if referral code exists
    const [referral] = await db
      .select({
        user_referral: user_referrals,
        user: users
      })
      .from(user_referrals)
      .innerJoin(users, eq(user_referrals.user_id, users.id))
      .where(eq(user_referrals.referral_code, referral_code));

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral code not found'
      });
    }

    // Check if referral slots are available
    if (referral.user_referral.total_used >= referral.user_referral.total_available) {
      return res.status(400).json({
        success: false,
        message: 'Referral code has reached its usage limit'
      });
    }

    // Return referrer info (without sensitive data)
    return res.status(200).json({
      success: true,
      referrer: {
        first_name: referral.user.first_name,
        last_name: referral.user.last_name
      }
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while validating referral code'
    });
  }
});

// Log referral activity
router.post('/log-activity', referralLimiter, async (req: TelegramRequest, res) => {
  try {
    // Check if user is authenticated
    if (!req.telegramData || !req.telegramData.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user from database
    const telegramId = req.telegramData.id;
    const user = await storage.getUserByTelegramId(telegramId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate request body
    const { activity_type, details } = req.body;
    
    if (!activity_type || !['share', 'view', 'copy', 'generate'].includes(activity_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type'
      });
    }

    // Log the activity
    await storage.logReferralActivity({
      userId: user.id,
      eventType: activity_type,
      details
    });

    return res.status(200).json({
      success: true,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging referral activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging activity'
    });
  }
});

export default router;