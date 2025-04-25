/**
 * Reset Test User Script
 * 
 * This script removes all swipes by the specified test user and all matches that include this user.
 * 
 * Run with:
 * npx tsx reset-test-user.js
 */

import { db } from './server/db.ts';
import { swipes, matches } from './shared/schema.ts';
import { eq, or } from 'drizzle-orm';

// Test user ID "reset"
const TEST_USER_ID = '38715556-ed2a-41f2-9daf-9bf82ac69867';

async function resetTestUser() {
  console.log('Starting reset for test user:', TEST_USER_ID);
  
  try {
    // Find and delete all swipes by this user
    console.log('Finding swipes by test user...');
    const userSwipes = await db
      .select()
      .from(swipes)
      .where(eq(swipes.user_id, TEST_USER_ID));
    
    console.log(`Found ${userSwipes.length} swipes by the test user.`);
    
    if (userSwipes.length > 0) {
      console.log('Deleting all swipes by test user...');
      const deleteSwipesResult = await db
        .delete(swipes)
        .where(eq(swipes.user_id, TEST_USER_ID))
        .returning();
      
      console.log(`Successfully deleted ${deleteSwipesResult.length} swipes.`);
    } else {
      console.log('No swipes found for this user.');
    }
    
    // Find and delete all matches that include this user (either as host or requester)
    console.log('Finding matches for test user...');
    const userMatches = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.host_id, TEST_USER_ID),
          eq(matches.requester_id, TEST_USER_ID)
        )
      );
    
    console.log(`Found ${userMatches.length} matches for the test user.`);
    
    if (userMatches.length > 0) {
      console.log('Deleting all matches for test user...');
      const deleteMatchesResult = await db
        .delete(matches)
        .where(
          or(
            eq(matches.host_id, TEST_USER_ID),
            eq(matches.requester_id, TEST_USER_ID)
          )
        )
        .returning();
      
      console.log(`Successfully deleted ${deleteMatchesResult.length} matches.`);
    } else {
      console.log('No matches found for this user.');
    }
    
    console.log('Reset completed successfully for test user:', TEST_USER_ID);
  } catch (error) {
    console.error('Error during reset:', error);
    process.exit(1);
  }
}

// Run the reset function
resetTestUser()
  .then(() => {
    console.log('Reset process completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error in reset process:', err);
    process.exit(1);
  });