/**
 * This script tests the full collaboration creation flow including notifications
 * It creates a new test collaboration and verifies that notifications are sent
 * 
 * Run with:
 * npx tsx scripts/tests/test-create-collaboration.ts
 */

import { db } from "../../server/db";
import { collaborations, users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { notifyUserCollabCreated, notifyAdminsNewCollaboration } from "../../server/telegram";

async function testCreateCollaboration() {
  try {
    console.log("===== Testing Collaboration Creation Flow =====");
    
    // Get a test user (first admin in the system)
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_admin, true))
      .limit(1);
      
    if (adminUsers.length === 0) {
      console.error("⚠️ No admin users found in the database");
      return;
    }
    
    const testUser = adminUsers[0];
    console.log(`Using test user: ${testUser.first_name} ${testUser.last_name || ""} (ID: ${testUser.id})`);
    
    // Create a test collaboration
    const timestamp = new Date().toISOString();
    const testCollaborationData = {
      creator_id: testUser.id,
      collab_type: "Twitter Spaces Guest",
      description: `Test collaboration ${timestamp}`,
      date_type: "any_future_date",
      is_free_collab: true,
      required_token_status: false,
      filter_company_sectors_enabled: false,
      filter_company_followers_enabled: true,
      filter_user_followers_enabled: true,
      filter_funding_stages_enabled: false,
      filter_token_status_enabled: false,
      filter_blockchain_networks_enabled: false,
      min_company_followers: "0-1K",
      min_user_followers: "0-1K",
      topics: ["Testing", "Development"],
      created_at: new Date(),
      updated_at: new Date(),
      details: {
        twitter_handle: "https://x.com/testhandle",
        host_follower_count: "0-1K"
      }
    };
    
    console.log("Creating test collaboration...");
    const [newCollaboration] = await db
      .insert(collaborations)
      .values(testCollaborationData)
      .returning();
      
    if (!newCollaboration) {
      console.error("⚠️ Failed to create test collaboration");
      return;
    }
    
    console.log(`Test collaboration created with ID: ${newCollaboration.id}`);
    
    // Test notifications
    console.log("\n1. Testing user notification...");
    try {
      const userResult = await notifyUserCollabCreated(testUser.id, newCollaboration.id);
      console.log(`User notification result: ${userResult ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.error("Error sending user notification:", error.message);
    }
    
    console.log("\n2. Testing admin notification...");
    try {
      await notifyAdminsNewCollaboration(newCollaboration.id, testUser.id);
      console.log("Admin notification completed");
    } catch (error) {
      console.error("Error sending admin notification:", error.message);
    }
    
    console.log("\n✅ Collaboration creation test complete! Check Telegram for the messages.");
    
  } catch (error) {
    console.error("Error in test:", error);
  }
}

// Run the test
testCreateCollaboration()
  .then(() => console.log("Test script completed"))
  .catch(error => console.error("Unhandled error:", error))
  .finally(() => process.exit(0));