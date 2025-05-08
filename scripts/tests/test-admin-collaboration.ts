/**
 * This script tests the admin notification system for new collaborations
 * It uses a known admin and collaboration to test if the admin notification works
 * 
 * Run with:
 * npx tsx scripts/tests/test-admin-collaboration.ts
 */

import { db } from "../../server/db";
import { collaborations, users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { notifyAdminsNewCollaboration } from "../../server/telegram";

async function testAdminNotificationSystem() {
  try {
    console.log("===== Testing Admin Notification System =====");
    
    // Get a sample collaboration
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
    
    // Get admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_admin, true));
      
    if (adminUsers.length === 0) {
      console.error("⚠️ No admin users found in the database");
      return;
    }
    
    console.log(`Found ${adminUsers.length} admin users:`);
    for (const admin of adminUsers) {
      console.log(`- ${admin.first_name} ${admin.last_name || ""} (Telegram ID: ${admin.telegram_id})`);
    }
    
    // Test admin notification
    console.log("\nTesting admin notification...");
    await notifyAdminsNewCollaboration(collaboration.id, collaboration.creator_id);
    console.log("Admin notification completed");
    
    console.log("\n✅ Notification test complete! Check Telegram for the messages.");
    
  } catch (error) {
    console.error("Error in test:", error);
  }
}

// Run the test
testAdminNotificationSystem()
  .then(() => console.log("Test script completed"))
  .catch(error => console.error("Unhandled error:", error))
  .finally(() => process.exit(0));