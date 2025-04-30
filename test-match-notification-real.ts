/**
 * Test script for the match notification with real users
 * 
 * This script tests the match notification format with real user data
 * to ensure the handles are displayed correctly.
 * 
 * Run with:
 * npx tsx test-match-notification-real.ts
 */

import { db } from "./server/db";
import { users, collaborations } from "./shared/schema";
import { eq } from "drizzle-orm";
import { notifyMatchCreated } from "./server/telegram";

async function testRealMatchNotification() {
  console.log("Testing match notification with real users...");

  try {
    // Get two real users from the database
    const realUsers = await db.select().from(users).limit(2);

    if (realUsers.length < 2) {
      console.error("Not enough users in the database for testing");
      return;
    }

    const user1 = realUsers[0];
    const user2 = realUsers[1];

    console.log(`Selected users for testing:`);
    console.log(`User 1: ${user1.first_name} ${user1.last_name || ""} (${user1.handle || "no handle"})`);
    console.log(`User 2: ${user2.first_name} ${user2.last_name || ""} (${user2.handle || "no handle"})`);

    // Get a real collaboration
    const collabs = await db.select()
      .from(collaborations)
      .where(eq(collaborations.user_id, user1.id))
      .limit(1);

    if (collaborations.length === 0) {
      console.error("No collaborations found for testing");
      return;
    }

    const collaboration = collaborations[0];
    console.log(`Using collaboration: ${collaboration.collab_type}`);

    // Send a test match notification
    console.log("Sending test match notification...");
    const success = await notifyMatchCreated(
      user1.id,
      user2.id,
      collaboration.id,
      "test-match-" + Date.now()
    );

    if (success) {
      console.log("✅ Match notification sent successfully!");
    } else {
      console.error("❌ Failed to send match notification");
    }
  } catch (error) {
    console.error("Error testing match notification:", error);
  }
}

// Run the test
testRealMatchNotification().catch(console.error);