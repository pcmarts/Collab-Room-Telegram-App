/**
 * Script to remove test Twitter co-marketing collaborations
 * 
 * Run with:
 * npx tsx remove-test-collaborations.ts
 */

import { db } from './server/db';
import { collaborations } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function removeTestCollaborations() {
  console.log('Starting removal of test collaborations...');
  
  try {
    // Find Twitter Co-Marketing collaborations
    const testCollabs = await db.select({ id: collaborations.id })
      .from(collaborations)
      .where(eq(collaborations.collab_type, 'Twitter Co-Marketing'))
      .execute();
    
    if (testCollabs.length === 0) {
      console.log('No test collaborations found.');
      return;
    }
    
    console.log(`Found ${testCollabs.length} test collaborations to remove:`, testCollabs);
    
    // Delete each test collaboration
    for (const collab of testCollabs) {
      await db.delete(collaborations)
        .where(eq(collaborations.id, collab.id))
        .execute();
      console.log(`Deleted collaboration: ${collab.id}`);
    }
    
    console.log('Successfully removed all test collaborations!');
  } catch (error) {
    console.error('Error removing test collaborations:', error);
  }
}

// Run the function
removeTestCollaborations().catch(console.error);