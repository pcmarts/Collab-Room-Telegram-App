/**
 * Migration script to add referral system tables and fields
 * 
 * This script:
 * 1. Adds referral-related fields to users table
 * 2. Creates user_referrals and referral_events tables
 * 
 * Run with:
 * npx tsx db-migrate-referral-system.js
 */

import { db, pool } from './server/db.js';
import { users, user_referrals, referral_events } from './shared/schema.js';
import { sql } from 'drizzle-orm';
import { logger } from './server/utils/logger.js';

async function main() {
  logger.info('Starting referral system migration...');

  try {
    // Add columns to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
    `);
    logger.info('Added referral-related columns to users table');

    // Create user_referrals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referral_code TEXT NOT NULL UNIQUE,
        total_available INTEGER NOT NULL DEFAULT 3,
        total_used INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    logger.info('Created user_referrals table');

    // Create referral_events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    logger.info('Created referral_events table');

    // First, clean up existing referral codes to ensure uniqueness
    await pool.query(`
      -- Update duplicate referral codes to ensure uniqueness
      WITH duplicate_codes AS (
        SELECT referral_code, array_agg(id) AS user_ids
        FROM users 
        WHERE referral_code IS NOT NULL
        GROUP BY referral_code
        HAVING COUNT(*) > 1
      )
      UPDATE users u
      SET referral_code = CONCAT(u.telegram_id, '_', SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
      FROM duplicate_codes dc
      WHERE u.referral_code = dc.referral_code
      AND u.id = ANY(dc.user_ids[2:]);
    `);
    logger.info('Updated duplicate referral codes to ensure uniqueness');

    // Generate referral codes for users who don't have one
    await pool.query(`
      WITH existing_users AS (
        SELECT id, telegram_id FROM users WHERE referral_code IS NULL
      )
      UPDATE users u
      SET referral_code = CONCAT(eu.telegram_id, '_', SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
      FROM existing_users eu
      WHERE u.id = eu.id;
    `);
    logger.info('Generated referral codes for users without codes');

    // Check if user_referrals table is empty
    const { rows: countResult } = await pool.query(`
      SELECT COUNT(*) FROM user_referrals;
    `);
    
    if (parseInt(countResult[0].count) === 0) {
      // Create user_referrals records for existing users but ensure uniqueness
      await pool.query(`
        -- Insert records ensuring uniqueness of referral_code
        INSERT INTO user_referrals (user_id, referral_code)
        SELECT id, referral_code FROM users
        WHERE referral_code IS NOT NULL;
      `);
      logger.info('Created user_referrals records for existing users');
    } else {
      logger.info('Skipped creating user_referrals records since the table already has data');
    }

    logger.info('Referral system migration completed successfully');
  } catch (error) {
    logger.error('Error during referral system migration', { error });
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  logger.error('Migration failed', { error: err });
  process.exit(1);
});