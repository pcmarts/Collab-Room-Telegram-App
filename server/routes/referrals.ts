import express from 'express';
import { z } from 'zod';
import { getTelegramUserFromRequest } from '../middleware/auth';
import { db } from '../db';
import { referral_events, user_referrals, users } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Generate a referral code using Telegram ID and a random suffix
 */
function generateReferralCode(telegramId: string): string {
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  return `${telegramId}_${randomSuffix}`;
}

/**
 * Simple encoding for referral codes in URLs
 */
function encodeReferralInfo(referralCode: string): string {
  return Buffer.from(referralCode).toString('base64url');
}

/**
 * Decode referral information from URL parameter
 */
function decodeReferralInfo(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString();
}

// Get user's referral information
router.get('/', async (req, res) => {
  try {
    const user = getTelegramUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Please login first.' 
      });
    }
    
    logger.info('Retrieving referral information', { userId: user.id });
    
    // Get user's referral record
    const [referralRecord] = await db.select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, user.id));
      
    if (!referralRecord) {
      logger.warn('No referral record found for user', { userId: user.id });
      return res.status(404).json({ 
        success: false, 
        message: 'No referral information found' 
      });
    }
    
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
    .where(eq(referral_events.referrer_id, user.id));
    
    const encodedCode = encodeReferralInfo(referralRecord.referral_code);
    const shareableLink = `https://t.me/collab_room_bot?start=r_${encodedCode}`;
    
    logger.info('Returning referral information', { 
      userId: user.id,
      referredCount: referredUsers.length
    });
    
    return res.status(200).json({
      success: true,
      referralCode: referralRecord.referral_code,
      shareableLink,
      totalAvailable: referralRecord.total_available,
      totalUsed: referralRecord.total_used,
      referredUsers
    });
  } catch (error) {
    logger.error('Error in GET /api/referrals', {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get referral information' 
    });
  }
});

// Verify referral code
router.post('/verify', async (req, res) => {
  try {
    const user = getTelegramUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Please login first.' 
      });
    }
    
    const schema = z.object({
      referralCode: z.string(),
    });
    
    const parsed = schema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request parameters',
        errors: parsed.error.format()
      });
    }
    
    const { referralCode } = parsed.data;
    
    logger.info('Verifying referral code', { 
      userId: user.id,
      referralCode 
    });
    
    // Find the referrer
    const [referrerRecord] = await db.select({
      id: user_referrals.user_id,
      available: user_referrals.total_available,
      used: user_referrals.total_used,
    })
    .from(user_referrals)
    .where(eq(user_referrals.referral_code, referralCode))
    .limit(1);
    
    if (!referrerRecord) {
      logger.warn('Invalid referral code', { 
        userId: user.id,
        referralCode 
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid referral code'
      });
    }
    
    // Check if self-referral
    if (referrerRecord.id === user.id) {
      logger.warn('Self-referral attempt', { 
        userId: user.id 
      });
      
      return res.status(400).json({
        success: false,
        message: 'You cannot refer yourself'
      });
    }
    
    // Check if referrer has available slots
    if (referrerRecord.used >= referrerRecord.available) {
      logger.warn('Referral code has reached limit', { 
        userId: user.id,
        referrerId: referrerRecord.id 
      });
      
      return res.status(400).json({
        success: false,
        message: 'This referral code has reached its limit'
      });
    }
    
    logger.info('Referral code verified successfully', {
      userId: user.id,
      referrerId: referrerRecord.id
    });
    
    return res.status(200).json({
      success: true,
      message: 'Valid referral code',
      referrerId: referrerRecord.id
    });
  } catch (error) {
    logger.error('Error in POST /api/referrals/verify', {
      error: error.message,
      stack: error.stack,
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to verify referral code'
    });
  }
});

// Apply referral code
router.post('/apply', async (req, res) => {
  try {
    const user = getTelegramUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized. Please login first.' 
      });
    }
    
    const schema = z.object({
      referralCode: z.string(),
      idempotencyKey: z.string().uuid().optional(),
    });
    
    const parsed = schema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request parameters',
        errors: parsed.error.format()
      });
    }
    
    const { referralCode, idempotencyKey = crypto.randomUUID() } = parsed.data;
    
    logger.info('Applying referral code', { 
      userId: user.id,
      referralCode,
      idempotencyKey 
    });
    
    // Verify the code first
    // Find the referrer
    const [referrerRecord] = await db.select({
      id: user_referrals.user_id,
      available: user_referrals.total_available,
      used: user_referrals.total_used,
    })
    .from(user_referrals)
    .where(eq(user_referrals.referral_code, referralCode))
    .limit(1);
    
    if (!referrerRecord) {
      logger.warn('Invalid referral code', { 
        userId: user.id,
        referralCode 
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid referral code'
      });
    }
    
    // Check if self-referral
    if (referrerRecord.id === user.id) {
      logger.warn('Self-referral attempt', { 
        userId: user.id 
      });
      
      return res.status(400).json({
        success: false,
        message: 'You cannot refer yourself'
      });
    }
    
    // Check if referrer has available slots
    if (referrerRecord.used >= referrerRecord.available) {
      logger.warn('Referral code has reached limit', { 
        userId: user.id,
        referrerId: referrerRecord.id 
      });
      
      return res.status(400).json({
        success: false,
        message: 'This referral code has reached its limit'
      });
    }
    
    // Check if this referral was already processed
    const [existingReferral] = await db.select()
      .from(referral_events)
      .where(
        and(
          eq(referral_events.referrer_id, referrerRecord.id),
          eq(referral_events.referred_user_id, user.id)
        )
      )
      .limit(1);
      
    if (existingReferral) {
      logger.info('Referral already processed', {
        userId: user.id,
        referrerId: referrerRecord.id,
      });
      
      return res.status(200).json({
        success: true,
        message: 'Referral already processed',
        referrerId: referrerRecord.id
      });
    }
    
    // Process the referral in a transaction
    await db.transaction(async (tx) => {
      // Increment used count for referrer
      await tx.update(user_referrals)
        .set({ 
          total_used: sql`total_used + 1`,
          updated_at: new Date() 
        })
        .where(eq(user_referrals.user_id, referrerRecord.id));
      
      // Create referral event
      await tx.insert(referral_events).values({
        referrer_id: referrerRecord.id,
        referred_user_id: user.id,
        status: 'completed',
        completed_at: new Date()
      });
      
      // Auto-approve the new user
      await tx.update(users)
        .set({ is_approved: true })
        .where(eq(users.id, user.id));
        
      logger.info('Applied referral successfully', {
        userId: user.id,
        referrerId: referrerRecord.id,
        idempotencyKey
      });
    });
    
    return res.status(200).json({
      success: true,
      message: 'Referral applied successfully',
      referrerId: referrerRecord.id
    });
  } catch (error) {
    logger.error('Error in POST /api/referrals/apply', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to apply referral'
    });
  }
});

export default router;