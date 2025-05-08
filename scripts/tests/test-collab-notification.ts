/**
 * This script tests the collaboration notification system
 * It simulates a new collaboration being created and sends notifications to 
 * both the creator and the admins
 * 
 * Run with:
 * npx tsx scripts/tests/test-collab-notification.ts
 */

import { db } from "../../server/db";
import { collaborations, users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { notifyUserCollabCreated, notifyAdminsNewCollaboration } from "../../server/telegram";

async function testCollabNotificationSystem() {
  try {
    console.log("===== Testing Collaboration Notification System =====");
    
    // Get a sample collaboration and its creator
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .limit(1);
      
    if (!collaboration) {
      console.error("⚠️ No collaborations found in the database");
      return;
    }
    
    console.log(`Found collaboration: ${collaboration.id}`);
    console.log(`Creator ID: ${collaboration.creator_id}`);
    
    // Get creator details
    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, collaboration.creator_id));
      
    if (!creator) {
      console.error(`⚠️ Creator with ID ${collaboration.creator_id} not found`);
      return;
    }
    
    console.log(`Creator: ${creator.first_name} ${creator.last_name || ""} (Telegram ID: ${creator.telegram_id})`);
    
    // Test user notification
    console.log("\n1. Testing user notification...");
    const userResult = await notifyUserCollabCreated(collaboration.creator_id, collaboration.id);
    console.log(`User notification result: ${userResult ? '✅ Success' : '❌ Failed'}`);
    
    // Test admin notification
    console.log("\n2. Testing admin notification...");
    await notifyAdminsNewCollaboration(collaboration.id, collaboration.creator_id);
    console.log("Admin notification completed");
    
    console.log("\n✅ Notification test complete! Check Telegram for the messages.");
    
  } catch (error) {
    console.error("Error in test:", error);
  }
}

// Run the test
testCollabNotificationSystem()
  .then(() => console.log("Test script completed"))
  .catch(error => console.error("Unhandled error:", error))
  .finally(() => process.exit(0));