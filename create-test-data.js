/**
 * Create Test Data Script
 * 
 * This script creates multiple test swipes and matches for the specified test user.
 * Used to test the reset-test-user.js script with multiple records.
 * 
 * Run with:
 * npx tsx create-test-data.js
 */

import { db } from './server/db.ts';
import { swipes, matches, collaborations, users } from './shared/schema.ts';
import { eq, ne } from 'drizzle-orm';

// Test user ID "reset"
const TEST_USER_ID = '38715556-ed2a-41f2-9daf-9bf82ac69867';

async function createTestData() {
  console.log('Creating test data for user:', TEST_USER_ID);
  
  try {
    // Find collaborations to use for swipes and matches
    console.log('Finding collaborations...');
    const collaborationList = await db
      .select()
      .from(collaborations)
      .limit(3);
    
    if (collaborationList.length === 0) {
      console.error('No collaborations found in the database.');
      process.exit(1);
    }
    
    console.log(`Found ${collaborationList.length} collaborations`);
    
    // Find other users for matches
    console.log('Finding other users for matches...');
    const otherUsers = await db
      .select()
      .from(users)
      .where(ne(users.id, TEST_USER_ID))
      .limit(2);
    
    if (otherUsers.length === 0) {
      console.error('No other users found in the database.');
      process.exit(1);
    }
    
    console.log(`Found ${otherUsers.length} other users`);
    
    // Create multiple swipes
    console.log('Creating test swipes...');
    const swipePromises = collaborationList.map(collab => 
      db.insert(swipes)
        .values({
          user_id: TEST_USER_ID,
          collaboration_id: collab.id,
          direction: Math.random() > 0.5 ? 'right' : 'left', // Randomly assign direction
          note: `Test swipe ${collab.id} for reset user`,
          created_at: new Date(),
        })
        .returning()
    );
    
    const swipeResults = await Promise.all(swipePromises);
    const createdSwipes = swipeResults.map(result => result[0]);
    
    console.log(`Successfully created ${createdSwipes.length} test swipes`);
    
    // Create matches (one as host, one as requester)
    console.log('Creating test matches...');
    
    // Match where test user is the host
    const [hostMatch] = await db
      .insert(matches)
      .values({
        collaboration_id: collaborationList[0].id,
        host_id: TEST_USER_ID,
        requester_id: otherUsers[0].id,
        status: 'active',
        host_accepted: true,
        requester_accepted: true,
        note: 'Test match (as host) for reset user',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
      
    console.log(`Created host match with ID: ${hostMatch.id}`);
    
    // Match where test user is the requester
    const [requesterMatch] = await db
      .insert(matches)
      .values({
        collaboration_id: collaborationList[1].id,
        host_id: otherUsers[1].id,
        requester_id: TEST_USER_ID,
        status: 'active',
        host_accepted: true,
        requester_accepted: true,
        note: 'Test match (as requester) for reset user',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
      
    console.log(`Created requester match with ID: ${requesterMatch.id}`);
    
    console.log('Created all test data successfully!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

// Run the function
createTestData()
  .then(() => {
    console.log('Test data creation completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error in test data creation:', err);
    process.exit(1);
  });