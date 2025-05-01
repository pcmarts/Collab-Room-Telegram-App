/**
 * This migration script adds the 'details' JSON column to the swipes table if it doesn't exist
 * 
 * Run with:
 * node db-migrate-add-details-to-swipes.cjs
 */

const { Pool } = require('pg');

async function main() {
  console.log('Starting to add details column to swipes table...');
  
  // Create a database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Check if the column exists
    const checkResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'swipes' AND column_name = 'details'
    `);
    
    // If the column doesn't exist, add it
    if (checkResult.rows.length === 0) {
      console.log('Adding details column to swipes table...');
      await pool.query(`
        ALTER TABLE swipes
        ADD COLUMN details JSONB DEFAULT '{}'::jsonb
      `);
      console.log('Successfully added details column to swipes table');
    } else {
      console.log('Details column already exists in swipes table');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  // Close the database connection
  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unhandled error in migration:', err);
    process.exit(1);
  });