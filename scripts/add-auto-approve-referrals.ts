/**
 * Migration script to add auto-approval functionality to referral system
 * 
 * This script adds the is_auto_approve column to user_referrals table
 * and creates helper functions for managing special referral codes.
 * 
 * Run with: npx tsx scripts/add-auto-approve-referrals.ts
 */

import { db } from "../server/db";
import { user_referrals } from "../shared/schema";
import { logger } from "../server/utils/logger";

export async function addAutoApprovalColumn() {
  try {
    logger.info("Adding auto-approval column to user_referrals table...");
    
    // Add the is_auto_approve column with default value false
    await db.execute(`
      ALTER TABLE user_referrals 
      ADD COLUMN IF NOT EXISTS is_auto_approve BOOLEAN NOT NULL DEFAULT false;
    `);
    
    logger.info("Successfully added is_auto_approve column to user_referrals table");
    
    // Optional: Set up some initial auto-approval codes for testing
    // You can uncomment this section and modify the telegram_ids as needed
    /*
    const adminTelegramIds = ['123456789']; // Replace with actual admin telegram IDs
    
    for (const adminId of adminTelegramIds) {
      await db.execute(`
        UPDATE user_referrals 
        SET is_auto_approve = true 
        WHERE referral_code LIKE '${adminId}_%';
      `);
      logger.info(`Enabled auto-approval for admin ${adminId} referral codes`);
    }
    */
    
  } catch (error) {
    logger.error('Failed to add auto-approval column', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Helper function to enable auto-approval for specific referral codes
export async function enableAutoApproval(referralCode: string) {
  try {
    const result = await db.execute(`
      UPDATE user_referrals 
      SET is_auto_approve = true 
      WHERE referral_code = '${referralCode}';
    `);
    
    logger.info(`Enabled auto-approval for referral code: ${referralCode}`);
    return result;
  } catch (error) {
    logger.error('Failed to enable auto-approval', {
      referralCode,
      error: error.message,
    });
    throw error;
  }
}

// Helper function to disable auto-approval for specific referral codes
export async function disableAutoApproval(referralCode: string) {
  try {
    const result = await db.execute(`
      UPDATE user_referrals 
      SET is_auto_approve = false 
      WHERE referral_code = '${referralCode}';
    `);
    
    logger.info(`Disabled auto-approval for referral code: ${referralCode}`);
    return result;
  } catch (error) {
    logger.error('Failed to disable auto-approval', {
      referralCode,
      error: error.message,
    });
    throw error;
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addAutoApprovalColumn()
    .then(() => {
      logger.info("Auto-approval migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Auto-approval migration failed", { error: error.message });
      process.exit(1);
    });
}