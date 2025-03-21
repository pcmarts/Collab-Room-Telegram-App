/**
 * This migration script:
 * 1. Updates all existing collaborations by copying the short_description from the details object to the main description field
 * 
 * Run with:
 * node db-migrate-fill-descriptions.js
 */

import pg from 'pg';
const { Client } = pg;

async function main() {
  console.log('Starting migration: Filling descriptions from details.short_description');
  
  // Create a new PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');
    
    // Get all collaborations that have a short_description in their details
    const result = await client.query(`
      SELECT id, details 
      FROM collaborations 
      WHERE description IS NULL OR description = '';
    `);
    
    console.log(`Found ${result.rows.length} collaborations that need description updates`);
    
    // Process each collaboration
    let updatedCount = 0;
    for (const row of result.rows) {
      const { id, details } = row;
      
      if (details && details.short_description) {
        console.log(`Updating collaboration ${id} with description: "${details.short_description}"`);
        
        // Update the collaboration with the short_description from details
        await client.query(`
          UPDATE collaborations 
          SET description = $1 
          WHERE id = $2
        `, [details.short_description, id]);
        
        updatedCount++;
      } else {
        console.log(`Skipping collaboration ${id} - no short_description found in details`);
      }
    }
    
    console.log(`Migration complete. Updated ${updatedCount} out of ${result.rows.length} collaborations.`);
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

main().catch(console.error);