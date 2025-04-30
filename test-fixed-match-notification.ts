/**
 * Test script for the fixed match notification with corrected button
 * 
 * This script tests the updated match notification that directs users
 * to the matches page instead of a specific match detail page
 * 
 * Run with:
 * npx tsx test-fixed-match-notification.ts
 */

import { notifyMatchCreated } from "./server/telegram";

async function testFixedMatchNotification() {
  console.log("Testing fixed match notification with direct matches page link...");

  const params = {
    hostUserId: "b4093f49-f0c3-4bae-a294-35fb87c493eb", // Paul
    requesterUserId: "3c784ed0-2322-4f06-91c6-83f1ede9b944", // Jim Test
    collaborationId: "5b9187b9-bad5-4750-96ba-a21bdb929bae",
    matchId: "test-fixed-button-" + Date.now() // This is just for testing
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
    console.log("✅ Match notifications with fixed button sent successfully!");
    console.log("Button now directs to the matches list page instead of individual match page");
  } else {
    console.error("❌ Failed to send match notifications");
  }

  console.log("Test script completed");
}

// Run the test function
testFixedMatchNotification().catch((error) => {
  console.error("Test script failed:", error);
});