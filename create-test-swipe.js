/**
 * Create Test Swipe Script
 * 
 * This script creates a test swipe for the specified test user.
 * Used to test the reset-test-user.js script.
 * 
 * Run with:
 * npx tsx create-test-swipe.js
 */

import { db } from './server/db.ts';
import { swipes, collaborations } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Test user ID "reset"
const TEST_USER_ID = '38715556-ed2a-41f2-9daf-9bf82ac69867';

async function createTestSwipe() {
  console.log('Creating test swipe for user:', TEST_USER_ID);
  
  try {
    // First, find a collaboration to swipe on
    console.log('Finding a collaboration to swipe on...');
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .limit(1);
    
    if (!collaboration) {
      console.error('No collaborations found in the database.');
      process.exit(1);
    }
    
    console.log(`Found collaboration: ${collaboration.id}`);
    
    // Create a swipe record
    console.log('Creating test swipe...');
    const [swipe] = await db
      .insert(swipes)
      .values({
        user_id: TEST_USER_ID,
        collaboration_id: collaboration.id,
        direction: 'right',
        note: 'Test swipe for reset user',
        created_at: new Date(),
      })
      .returning();
    
    console.log(`Successfully created test swipe with ID: ${swipe.id}`);
    console.log('Test swipe details:', swipe);
    
  } catch (error) {
    console.error('Error creating test swipe:', error);
    process.exit(1);
  }
}

// Run the function
createTestSwipe()
  .then(() => {
    console.log('Test swipe creation completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error in test swipe creation:', err);
    process.exit(1);
  });