/**
 * Test script for the updated match notification message format
 * 
 * Run with:
 * npx tsx test-match-notification-format.ts
 */

import { notifyMatchCreated } from "./server/telegram";

async function testMatchNotificationFormat() {
  console.log("Testing updated match notification format...");

  const params = {
    hostUserId: "b4093f49-f0c3-4bae-a294-35fb87c493eb", // Paul
    requesterUserId: "be9a9276-6577-47a5-8d08-0e9581ad65a5", // Capitual user
    collaborationId: "5b9187b9-bad5-4750-96ba-a21bdb929bae",
    matchId: "test-match-123" // This is just for testing
  };

  console.log("Sending match notification with parameters:", params);

  // Send the notification
  const success = await notifyMatchCreated(
    params.hostUserId,
    params.requesterUserId,
    params.collaborationId,
    params.matchId
  );

  if (success) {
    console.log("✅ Match notifications sent successfully with updated format!");
  } else {
    console.error("❌ Failed to send match notifications");
  }

  console.log("Test script completed");
}

// Run the test function
testMatchNotificationFormat().catch((error) => {
  console.error("Test script failed:", error);
});