/**
 * Test script for the enhanced match notification format
 * 
 * This script tests the new match notification format that includes
 * user's Telegram handle and company information
 * 
 * Run with:
 * npx tsx test-enhanced-match-notification.ts
 */

import { notifyMatchCreated } from "./server/telegram";

async function testEnhancedMatchNotification() {
  console.log("Testing enhanced match notification format...");

  const params = {
    hostUserId: "b4093f49-f0c3-4bae-a294-35fb87c493eb", // Paul
    requesterUserId: "3c784ed0-2322-4f06-91c6-83f1ede9b944", // Jim Test
    collaborationId: "5b9187b9-bad5-4750-96ba-a21bdb929bae",
    matchId: "test-enhanced-match-" + Date.now() // This is just for testing
  };

  console.log("Sending enhanced match notification with parameters:", params);

  // Send the notification
  const success = await notifyMatchCreated(
    params.hostUserId,
    params.requesterUserId,
    params.collaborationId,
    params.matchId
  );

  if (success) {
    console.log("✅ Enhanced match notifications sent successfully!");
  } else {
    console.error("❌ Failed to send enhanced match notifications");
  }

  console.log("Test script completed");
}

// Run the test function
testEnhancedMatchNotification().catch((error) => {
  console.error("Test script failed:", error);
});