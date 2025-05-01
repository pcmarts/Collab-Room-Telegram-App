/**
 * Test script for the updated notification message format
 * 
 * Run with:
 * npx tsx test-notification-format.ts
 */

import { notifyNewCollabRequest } from "./server/telegram";

async function testNotificationFormat() {
  try {
    console.log("Testing updated notification format...");
    
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
    } else {
      console.error("❌ Failed to send notification");
    }
  } catch (error) {
    console.error("Error testing notification system:", error);
  }
}

// Run the test
testNotificationFormat().then(() => {
  console.log("Test script completed");
  process.exit(0);
}).catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});