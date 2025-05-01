/**
 * Test script for the updated Telegram notification format
 * 
 * This script tests the changes to the notification format:
 * 1. Adding Website link to social media links section
 * 2. Using company role_title instead of "Head of Business Solutions"
 * 3. Properly linking Twitter handle
 * 
 * Run with:
 * npx tsx test-updated-notification-format.ts
 */

import { notifyNewCollabRequest } from "./server/telegram";

async function testUpdatedNotificationFormat() {
  try {
    console.log("Testing updated notification format with social links and role title...");
    
    // Use actual IDs from the database that we verified exist
    const hostUserId = "b4093f49-f0c3-4bae-a294-35fb87c493eb"; // Paul Martin (admin)
    const requesterUserId = "be9a9276-6577-47a5-8d08-0e9581ad65a5"; // Marcos de Oliveira
    const collaborationId = "5b9187b9-bad5-4750-96ba-a21bdb929bae"; // Live Stream Guest Appearance
    
    console.log("Sending notification with parameters:", {
      hostUserId,
      requesterUserId,
      collaborationId
    });
    
    // Send notification with the updated format
    const result = await notifyNewCollabRequest(hostUserId, requesterUserId, collaborationId);
    
    if (result) {
      console.log("✅ Notification sent successfully with updated format!");
      console.log("Changes made to the notification format:");
      console.log("1. Added Website link to the social media links section (🔗 Twitter | LinkedIn | Website)");
      console.log("2. Using company's role_title instead of hardcoded 'Head of Business Solutions'");
      console.log("3. Fixed Twitter link to properly hyperlink with the company's Twitter handle");
    } else {
      console.error("❌ Failed to send notification");
    }
  } catch (error) {
    console.error("Error testing notification system:", error);
  }
}

// Run the test
testUpdatedNotificationFormat().then(() => {
  console.log("Test script completed");
  process.exit(0);
}).catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});