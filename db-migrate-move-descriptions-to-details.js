/**
 * This migration script:
 * 1. Updates all existing collaborations by moving the description from the main field to the details.short_description field
 * 2. Then clears the main description field
 * 
 * Run with:
 * node db-migrate-move-descriptions-to-details.js
 */

import pkg from 'pg';
const { Pool } = pkg;

// Connect to the database
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function main() {
  try {
    console.log('Starting migration to move descriptions to details.short_description...');
    
    // Execute raw SQL to get all collaborations
    const { rows: allCollaborations } = await pool.query(
      'SELECT id, collab_type, description, details FROM collaborations WHERE description IS NOT NULL AND description != \'\''
    );
    
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
        
        // Update the record - using direct SQL to avoid import issues
        await pool.query(
          'UPDATE collaborations SET details = $1, description = $2 WHERE id = $3',
          [details, '', collab.id]
        );
        
        updateCount++;
        console.log(`Updated collaboration ${collab.id}`);
      }
    }
    
    console.log(`Migration complete. ${updateCount} out of ${allCollaborations.length} collaborations were updated.`);
    
    // Close the connection
    await pool.end();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();