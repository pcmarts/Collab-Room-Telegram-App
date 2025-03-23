/**
 * This migration script adds the 'details' JSON column to the swipes table
 * 
 * Run with:
 * node db-migrate-add-details-to-swipes.js
 */

const { pool } = require('./server/db.js');

async function main() {
  console.log('\n===== DB MIGRATION: Add details column to swipes table =====\n');
  
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');
    console.log('Transaction started');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'swipes' AND column_name = 'details'
    `;
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('Column details already exists in swipes table');
    } else {
      // Add details column
      console.log('Adding details column to swipes table...');
      const addDetailsQuery = `
        ALTER TABLE swipes
        ADD COLUMN details JSONB DEFAULT '{}'::jsonb
      `;
      await client.query(addDetailsQuery);
      console.log('Column added successfully');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Transaction committed');
    console.log('\n✅ Migration completed successfully\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    console.error('\n❌ Migration failed - transaction rolled back\n');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch(err => {
    console.error('Migration script error:', err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
    console.log('Pool ended');
  });