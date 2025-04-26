/**
 * Script to remove all swipes, matches, and collaborations for a specific user
 * 
 * This script will delete:
 * 1. All swipes that involve the user
 * 2. All matches where the user is either host or requester
 * 3. All collaborations created by the user
 * 4. All notifications related to the user or their collaborations
 * 
 * Run with:
 * npx tsx remove-user-data.ts
 */

import { db } from "./server/db";
import { swipes, matches, collaborations, collab_notifications } from "./shared/schema";
import { eq, or } from "drizzle-orm";

// The user ID to remove data for
const USER_ID = "3c784ed0-2322-4f06-91c6-83f1ede9b944";

async function removeUserData() {
  console.log(`🧹 Starting data cleanup for user: ${USER_ID}`);

  try {
    // Step 1: Find all collaborations created by this user
    console.log("🔍 Finding collaborations created by the user...");
    const userCollaborations = await db.select({ id: collaborations.id })
      .from(collaborations)
      .where(eq(collaborations.creator_id, USER_ID));
    
    const collaborationIds = userCollaborations.map(c => c.id);
    console.log(`📊 Found ${collaborationIds.length} collaborations created by the user`);

    // Step 2: Delete notifications related to the user or their collaborations
    console.log("🗑️ Removing notifications...");
    
    // Delete notifications directly related to the user
    const userNotificationsDeleted = await db.delete(collab_notifications)
      .where(eq(collab_notifications.user_id, USER_ID))
      .returning();
    
    console.log(`✅ Deleted ${userNotificationsDeleted.length} user notifications`);
    
    // Delete notifications related to the user's collaborations if any exist
    if (collaborationIds.length > 0) {
      // Handle each collaboration ID separately since we're having issues with the IN operator
      let totalCollabNotificationsDeleted = 0;
      
      for (const collabId of collaborationIds) {
        const deleteResult = await db.delete(collab_notifications)
          .where(eq(collab_notifications.collaboration_id, collabId))
          .returning();
          
        totalCollabNotificationsDeleted += deleteResult.length;
      }
      
      console.log(`✅ Deleted ${totalCollabNotificationsDeleted} collaboration notifications`);
    }

    // Step 3: Delete swipes by or for the user
    console.log("🗑️ Removing swipes...");
    const swipesDeleted = await db.delete(swipes)
      .where(eq(swipes.user_id, USER_ID))
      .returning();
    
    console.log(`✅ Deleted ${swipesDeleted.length} swipes`);

    // Step 4: Delete matches where the user is host or requester
    console.log("🗑️ Removing matches...");
    const matchesDeleted = await db.delete(matches)
      .where(
        or(
          eq(matches.host_id, USER_ID),
          eq(matches.requester_id, USER_ID)
        )
      )
      .returning();
    
    console.log(`✅ Deleted ${matchesDeleted.length} matches`);

    // Step 5: Delete the user's collaborations
    console.log("🗑️ Removing collaborations...");
    const collaborationsDeleted = await db.delete(collaborations)
      .where(eq(collaborations.creator_id, USER_ID))
      .returning();
    
    console.log(`✅ Deleted ${collaborationsDeleted.length} collaborations`);

    console.log("✅ Data cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during data cleanup:", error);
  }
}

// Run the main function
removeUserData()
  .then(() => {
    console.log("🏁 Script execution completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script execution failed:", error);
    process.exit(1);
  });