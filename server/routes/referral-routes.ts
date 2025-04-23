import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { referralCodeSchema } from '@shared/schema';

// Type for Telegram data in request
interface TelegramRequest extends Request {
  telegramData?: any;
}

// Function to extract user information from request
function getTelegramUserFromRequest(req: TelegramRequest) {
  // First check if we have auth data in telegramData (from middleware)
  if (req.telegramData && req.telegramData.user) {
    return req.telegramData.user;
  }
  
  // Otherwise check if we have data in session
  if (req.session && req.session.telegramUser) {
    return req.session.telegramUser;
  }
  
  // Try finding it as custom header (for dev/test)
  const telegramHeader = req.headers['x-telegram-data'];
  if (telegramHeader) {
    try {
      return JSON.parse(telegramHeader as string).user;
    } catch (e) {
      console.error('Failed to parse Telegram header:', e);
    }
  }
  
  return null;
}

// Create router
const router = Router();

// GET /api/referrals/my-code
// Get current user's referral code
router.get('/my-code', async (req: TelegramRequest, res: Response) => {
  console.log('============ DEBUG: Get My Referral Code Endpoint ============');
  console.log('Headers:', req.headers);
  
  try {
    // Get user from Telegram data
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      console.error('No Telegram user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get user from database
    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramUser.id.toString()));
    
    if (!user) {
      console.error('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's referral record
    const userReferral = await storage.getUserReferral(user.id);
    
    if (!userReferral) {
      console.error('User referral record not found');
      return res.status(404).json({ error: 'Referral record not found' });
    }
    
    // Return referral information
    return res.json({
      referral_code: userReferral.referral_code,
      total_available: userReferral.total_available,
      total_used: userReferral.total_used,
      remaining: userReferral.total_available - userReferral.total_used
    });
  } catch (error) {
    console.error('Failed to get user referral code:', error);
    return res.status(500).json({
      error: 'Failed to get referral code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/referrals/validate/:code
// Validate a referral code
router.get('/validate/:code', async (req: TelegramRequest, res: Response) => {
  console.log('============ DEBUG: Validate Referral Code Endpoint ============');
  console.log('Headers:', req.headers);
  console.log('Code:', req.params.code);
  
  try {
    const code = req.params.code;
    
    // Validate referral code format
    const result = referralCodeSchema.safeParse(code);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid referral code format',
        details: result.error.message
      });
    }
    
    // Get referral record
    const referral = await storage.getReferralByCode(code);
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral code not found' });
    }
    
    const remainingUses = referral.total_available - referral.total_used;
    
    if (remainingUses <= 0) {
      return res.status(400).json({ 
        error: 'Referral code has no remaining uses',
        valid: false
      });
    }
    
    // Get referrer user information
    const [referrer] = await db.select()
      .from(users)
      .where(eq(users.id, referral.user_id));
    
    if (!referrer) {
      return res.status(404).json({ error: 'Referrer not found' });
    }
    
    // Return success with referrer information
    return res.json({
      valid: true,
      referrer: {
        id: referrer.id,
        first_name: referrer.first_name,
        last_name: referrer.last_name || '',
        handle: referrer.handle
      },
      remaining_uses: remainingUses
    });
  } catch (error) {
    console.error('Failed to validate referral code:', error);
    return res.status(500).json({
      error: 'Failed to validate referral code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/referrals/use-code
// Use a referral code during signup
router.post('/use-code', async (req: TelegramRequest, res: Response) => {
  console.log('============ DEBUG: Use Referral Code Endpoint ============');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  try {
    // Define and validate the request schema
    const schema = z.object({
      referral_code: referralCodeSchema,
      user_id: z.string().uuid()
    });
    
    // Validate request body
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: result.error.message
      });
    }
    
    const { referral_code, user_id } = result.data;
    
    // Get the referral record
    const referral = await storage.getReferralByCode(referral_code);
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral code not found' });
    }
    
    // Check if referral has remaining uses
    if (referral.total_used >= referral.total_available) {
      return res.status(400).json({ error: 'Referral code has no remaining uses' });
    }
    
    // Get referrer information
    const [referrer] = await db.select()
      .from(users)
      .where(eq(users.id, referral.user_id));
    
    if (!referrer) {
      return res.status(404).json({ error: 'Referrer not found' });
    }
    
    // Get referred user
    const [referred] = await db.select()
      .from(users)
      .where(eq(users.id, user_id));
    
    if (!referred) {
      return res.status(404).json({ error: 'Referred user not found' });
    }
    
    // Update user with referrer information
    await db.update(users)
      .set({ 
        referred_by: referrer.id,
        is_approved: true,  // Auto-approve users who were referred
        approved_at: new Date()
      })
      .where(eq(users.id, user_id));
    
    // Create referral event
    const referralEvent = await storage.createReferralEvent({
      referrer_id: referrer.id,
      referred_user_id: user_id,
      status: 'completed',
      completed_at: new Date()
    });
    
    // Increment referral usage count
    const updatedReferral = await storage.incrementReferralUsage(referral.id);
    
    return res.json({
      success: true,
      referral_event: referralEvent,
      referral: updatedReferral
    });
  } catch (error) {
    console.error('Failed to use referral code:', error);
    return res.status(500).json({
      error: 'Failed to use referral code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/referrals/my-referrals
// Get users referred by the current user
router.get('/my-referrals', async (req: TelegramRequest, res: Response) => {
  console.log('============ DEBUG: Get My Referrals Endpoint ============');
  console.log('Headers:', req.headers);
  
  try {
    // Get user from Telegram data
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      console.error('No Telegram user ID found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get user from database
    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramUser.id.toString()));
    
    if (!user) {
      console.error('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get referral events
    const referralEvents = await storage.getUserReferralEvents(user.id);
    
    // Get referral details
    const userReferral = await storage.getUserReferral(user.id);
    
    if (!userReferral) {
      console.error('User referral record not found');
      return res.status(404).json({ error: 'Referral record not found' });
    }
    
    // Get more info about referred users
    const referredUserIds = referralEvents.map(event => event.referred_user_id);
    
    let referredUsers = [];
    if (referredUserIds.length > 0) {
      referredUsers = await db.select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        handle: users.handle,
        created_at: users.created_at
      })
      .from(users)
      .where(eq(users.referred_by, user.id));
    }
    
    // Return the combined information
    return res.json({
      referral_code: userReferral.referral_code,
      total_available: userReferral.total_available,
      total_used: userReferral.total_used,
      remaining: userReferral.total_available - userReferral.total_used,
      referred_users: referredUsers
    });
  } catch (error) {
    console.error('Failed to get user referrals:', error);
    return res.status(500).json({
      error: 'Failed to get referrals',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;