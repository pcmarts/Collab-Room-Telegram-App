/**
 * Referral system routes for The Collab Room
 * 
 * These routes handle:
 * - Generating referral codes
 * - Validating referral codes
 * - Applying referrals
 * - Viewing referred users
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { storage } from '../storage';

const router = Router();

// Generate a random referral code
const generateReferralCode = (): string => {
  // Create a short, readable code using only alphanumeric characters
  return randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Get current user's referral code
 * If they don't have one, generate a new one
 */
router.get('/my-code', async (req: Request, res: Response) => {
  // Check if user is authenticated
  const userData = req.session?.passport?.user;
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = userData.id;
  try {
    // Get user data
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let referralCode = user.referral_code;

    // If user doesn't have a referral code yet, generate one and save it
    if (!referralCode) {
      referralCode = generateReferralCode();
      await storage.updateUserReferralCode(userId, referralCode);
    }

    // Get stats: how many referrals used and how many are available
    const referredUsers = await storage.getReferredUsers(userId);
    const totalUsed = referredUsers.length;
    const totalAvailable = 3; // Default limit
    const remaining = Math.max(0, totalAvailable - totalUsed);

    return res.json({
      referral_code: referralCode,
      total_used: totalUsed,
      total_available: totalAvailable,
      remaining
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get users who were referred by the current user
 */
router.get('/my-referrals', async (req: Request, res: Response) => {
  // Check if user is authenticated
  const userData = req.session?.passport?.user;
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = userData.id;
  try {
    // Get referred users
    const referredUsers = await storage.getReferredUsers(userId);
    
    // Get stats: how many referrals used and how many are available
    const totalUsed = referredUsers.length;
    const totalAvailable = 3; // Default limit
    const remaining = Math.max(0, totalAvailable - totalUsed);

    return res.json({
      referred_users: referredUsers,
      total_used: totalUsed,
      total_available: totalAvailable,
      remaining
    });
  } catch (error) {
    console.error('Error getting referred users:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Validate a referral code
 */
router.get('/validate/:code', async (req: Request, res: Response) => {
  const { code } = req.params;
  if (!code) {
    return res.status(400).json({ error: 'Referral code is required' });
  }

  try {
    // Find user with this referral code
    const referrer = await storage.getUserByReferralCode(code);
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Check if the referrer has reached their limit
    const referredUsers = await storage.getReferredUsers(referrer.id);
    const totalUsed = referredUsers.length;
    const totalAvailable = 3; // Default limit

    if (totalUsed >= totalAvailable) {
      return res.status(400).json({ error: 'Referral code has reached its usage limit' });
    }

    return res.json({
      valid: true,
      referrer: {
        id: referrer.id,
        first_name: referrer.first_name,
        last_name: referrer.last_name,
        handle: referrer.handle
      }
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Apply a referral code
 */
router.post('/use-code', async (req: Request, res: Response) => {
  // Validate request body
  const schema = z.object({
    referral_code: z.string(),
    user_id: z.string().optional() // Optional for admin usage
  });

  try {
    const data = schema.parse(req.body);
    
    // Get applying user ID (either from request body or session)
    const userId = data.user_id || req.session?.passport?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user with this referral code
    const referrer = await storage.getUserByReferralCode(data.referral_code);
    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Prevent self-referral
    if (referrer.id === userId) {
      return res.status(400).json({ error: 'Cannot use your own referral code' });
    }

    // Check if the user already has a referrer
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.referred_by) {
      return res.status(400).json({ error: 'User already has a referrer' });
    }

    // Check if the referrer has reached their limit
    const referredUsers = await storage.getReferredUsers(referrer.id);
    const totalUsed = referredUsers.length;
    const totalAvailable = 3; // Default limit

    if (totalUsed >= totalAvailable) {
      return res.status(400).json({ error: 'Referral code has reached its usage limit' });
    }

    // Apply referral: update user record and create referral event
    await storage.applyReferral(userId, referrer.id);

    return res.json({
      success: true,
      referrer: {
        id: referrer.id,
        first_name: referrer.first_name,
        last_name: referrer.last_name,
        handle: referrer.handle
      }
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Admin-only: List all referral events 
 */
router.get('/admin/events', async (req: Request, res: Response) => {
  // Check if user is authenticated and is an admin
  const userData = req.session?.passport?.user;
  if (!userData) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await storage.getUser(userData.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const events = await storage.getReferralEvents();
    return res.json(events);
  } catch (error) {
    console.error('Error getting referral events:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;