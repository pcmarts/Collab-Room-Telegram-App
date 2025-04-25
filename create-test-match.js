/**
 * Create Test Match Script
 * 
 * This script creates a test match for the specified test user.
 * Used to test the reset-test-user.js script.
 * 
 * Run with:
 * npx tsx create-test-match.js
 */

import { db } from './server/db.ts';
import { matches, collaborations, users } from './shared/schema.ts';
import { eq, desc, ne } from 'drizzle-orm';

// Test user ID "reset"
const TEST_USER_ID = '38715556-ed2a-41f2-9daf-9bf82ac69867';

async function createTestMatch() {
  console.log('Creating test match for user:', TEST_USER_ID);
  
  try {
    // First, find a collaboration to use for the match
    console.log('Finding a collaboration for the match...');
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .limit(1);
    
    if (!collaboration) {
      console.error('No collaborations found in the database.');
      process.exit(1);
    }
    
    console.log(`Found collaboration: ${collaboration.id}`);
    
    // Find another user (not the test user) to be the other party in the match
    console.log('Finding another user for the match...');
    const [otherUser] = await db
      .select()
      .from(users)
      .where(ne(users.id, TEST_USER_ID))
      .limit(1);
    
    if (!otherUser) {
      console.error('No other users found in the database.');
      process.exit(1);
    }
    
    console.log(`Found other user: ${otherUser.id}`);
    
    // Create a match record where the test user is the host
    console.log('Creating test match...');
    const [match] = await db
      .insert(matches)
      .values({
        collaboration_id: collaboration.id,
        host_id: TEST_USER_ID,
        requester_id: otherUser.id,
        status: 'active',
        host_accepted: true,
        requester_accepted: true,
        note: 'Test match for reset user',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
    
    console.log(`Successfully created test match with ID: ${match.id}`);
    console.log('Test match details:', match);
    
  } catch (error) {
    console.error('Error creating test match:', error);
    process.exit(1);
  }
}

// Run the function
createTestMatch()
  .then(() => {
    console.log('Test match creation completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error in test match creation:', err);
    process.exit(1);
  });