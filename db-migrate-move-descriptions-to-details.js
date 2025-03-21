/**
 * This migration script:
 * 1. Updates all existing collaborations by moving the description from the main field to the details.short_description field
 * 2. Then clears the main description field
 * 
 * Run with:
 * node db-migrate-move-descriptions-to-details.js
 */

import { eq } from 'drizzle-orm';
import { db } from './server/db.js';
import { collaborations } from './shared/schema.js';

async function main() {
  try {
    console.log('Starting migration to move descriptions to details.short_description...');
    
    // Get all collaborations
    const allCollaborations = await db.select().from(collaborations);
    console.log(`Found ${allCollaborations.length} collaborations to update`);
    
    let updateCount = 0;
    
    // Process each collaboration
    for (const collab of allCollaborations) {
      if (collab.description) {
        console.log(`Processing collaboration ${collab.id} (${collab.collab_type})`);
        
        // Get current details
        let details = collab.details || {};
        
        // Add the description to details.short_description
        details.short_description = collab.description;
        
        // Update the record
        await db
          .update(collaborations)
          .set({
            details: details,
            description: "" // Clear the description field
          })
          .where(eq(collaborations.id, collab.id));
        
        updateCount++;
        console.log(`Updated collaboration ${collab.id}`);
      }
    }
    
    console.log(`Migration complete. ${updateCount} out of ${allCollaborations.length} collaborations were updated.`);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();