/**
 * This script tests the admin notification system for new collaborations
 * It uses a known admin and collaboration to test if the admin notification works
 * 
 * Run with:
 * npx tsx scripts/tests/test-admin-collaboration.ts
 * 
 * Optional parameters:
 * npx tsx scripts/tests/test-admin-collaboration.ts <collaboration_id> <creator_id>
 * 
 * If collaboration_id and creator_id are not provided, the script will use the first collaboration found
 * in the database.
 */

import { db } from "../../server/db";
import { collaborations, users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { notifyAdminsNewCollaboration } from "../../server/telegram";
import { randomUUID } from "crypto";

// Check if UUIDs are valid
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function testAdminNotificationSystem() {
  try {
    console.log("===== Testing Admin Notification System =====");
    console.log("================ " + new Date().toISOString() + " ================");
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    let collaborationId = args[0];
    let creatorId = args[1];
    let useRandomUUIDs = false;
    
    // If collaboration ID is set to "random", generate a random UUID
    if (collaborationId === "random") {
      useRandomUUIDs = true;
      collaborationId = randomUUID();
      creatorId = randomUUID();
      console.log(`Using random UUIDs for testing invalid IDs:`);
      console.log(`- Collaboration ID: ${collaborationId}`);
      console.log(`- Creator ID: ${creatorId}`);
    } else if (collaborationId && !creatorId) {
      // If only collaboration ID is provided, try to get the creator ID from the database
      const [collab] = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.id, collaborationId));
        
      if (collab) {
        creatorId = collab.creator_id;
        console.log(`Found creator ID ${creatorId} for collaboration ${collaborationId}`);
      } else {
        console.error(`⚠️ Collaboration with ID ${collaborationId} not found`);
        return;
      }
    } else if (!collaborationId && !creatorId) {
      // Get a sample collaboration if none is specified
      const [collaboration] = await db
        .select()
        .from(collaborations)
        .limit(1);
        
      if (!collaboration) {
        console.error("⚠️ No collaborations found in the database");
        return;
      }
      
      collaborationId = collaboration.id;
      creatorId = collaboration.creator_id;
    }
    
    // Validate UUIDs
    if (!useRandomUUIDs) {
      if (!isValidUUID(collaborationId)) {
        console.error(`⚠️ Invalid collaboration ID format: ${collaborationId}`);
        return;
      }
      
      if (!isValidUUID(creatorId)) {
        console.error(`⚠️ Invalid creator ID format: ${creatorId}`);
        return;
      }
    }
    
    console.log(`Using collaboration: ${collaborationId}`);
    console.log(`Using creator ID: ${creatorId}`);
    
    // Get collaboration details if not using random UUIDs
    if (!useRandomUUIDs) {
      const [collaboration] = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.id, collaborationId));
        
      if (collaboration) {
        console.log(`Collaboration details:`);
        console.log(`- Title: ${collaboration.title || 'No title'}`);
        console.log(`- Type: ${collaboration.collab_type}`);
        console.log(`- Status: ${collaboration.status}`);
      } else {
        console.warn(`⚠️ Couldn't find collaboration details for ID ${collaborationId}`);
      }
    }
    
    // Get admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_admin, true));
      
    if (adminUsers.length === 0) {
      console.error("⚠️ No admin users found in the database");
      return;
    }
    
    console.log(`\nFound ${adminUsers.length} admin users:`);
    for (const admin of adminUsers) {
      console.log(`- ${admin.first_name} ${admin.last_name || ""} (Telegram ID: ${admin.telegram_id})`);
    }
    
    // Test admin notification
    console.log("\nSending admin notification...");
    console.time("Notification time");
    
    try {
      await notifyAdminsNewCollaboration(collaborationId, creatorId);
      console.timeEnd("Notification time");
      console.log("Admin notification completed successfully");
    } catch (notificationError) {
      console.timeEnd("Notification time");
      console.error("Error during notification process:", notificationError);
    }
    
    console.log("\n✅ Notification test complete! Check Telegram for the messages.");
    
    // Return success
    return true;
  } catch (error) {
    console.error("Error in test:", error);
    return false;
  }
}

// Run the test
testAdminNotificationSystem()
  .then((success) => {
    console.log(`Test script completed${success ? " successfully" : " with errors"}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });