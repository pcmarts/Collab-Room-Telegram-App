/**
 * This script tests the notification system that sends a message 
 * when someone swipes right on a collaboration
 * 
 * Run with:
 * npx tsx test-notification.ts
 */

import { notifyNewCollabRequest } from "./server/telegram";

async function testNotificationSystem() {
  try {
    console.log("Testing notification system...");
    
    // Use actual IDs from the database
    const hostUserId = "b4093f49-f0c3-4bae-a294-35fb87c493eb"; // Paul Martin
    const requesterUserId = "a8364e70-de01-4b7d-b7f8-52f6f186391d"; // Jim Bean
    const collaborationId = "ddac0ac6-f79a-4ccd-a3c0-0eff52f1b8f5"; // Blog Post Feature
    
    console.log("Sending notification with parameters:", {
      hostUserId,
      requesterUserId,
      collaborationId
    });
    
    // Send notification
    await notifyNewCollabRequest(hostUserId, requesterUserId, collaborationId);
    
    console.log("Notification test complete!");
  } catch (error) {
    console.error("Error testing notification system:", error);
  }
}

// Run the test
testNotificationSystem().then(() => {
  console.log("Test script completed");
  process.exit(0);
}).catch(error => {
  console.error("Unhandled error:", error);
  process.exit(1);
});