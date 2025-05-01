/**
 * This script tests the new admin notification system for collaboration creation
 * It simulates a new collaboration being created and sends a notification to all admin users
 * 
 * Run with:
 * npx tsx test-admin-collaboration.ts
 */

import { db } from "./server/db";
import { collaborations, users } from "./shared/schema";
import { eq } from "drizzle-orm";
import { notifyAdminsNewCollaboration } from "./server/telegram";

async function testAdminCollaborationNotification() {
  try {
    console.log("Starting test for admin collaboration notification...");
    
    // Get an existing collaboration and its creator
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .limit(1);
      
    if (!collaboration) {
      console.error("No collaborations found in the database");
      return;
    }
    
    console.log(`Using collaboration: ${collaboration.id}`);
    console.log(`Creator ID: ${collaboration.creator_id}`);
    
    // Send the notification
    await notifyAdminsNewCollaboration(collaboration.id, collaboration.creator_id);
    
    console.log("✅ Notification sent successfully!");
    console.log("Check your Telegram to see the message");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testAdminCollaborationNotification();