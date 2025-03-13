import pg from 'pg';

async function main() {
  try {
    const { Pool } = pg;
    console.log('Starting migration');
    
    // Connect to the database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    console.log('Database connected');
    
    // Add the new column if it doesn't exist
    try {
      console.log('Adding coffee_match_filter_blockchain_networks_enabled column to conference_preferences table');
      await pool.query(`
        ALTER TABLE conference_preferences 
        ADD COLUMN IF NOT EXISTS coffee_match_filter_blockchain_networks_enabled BOOLEAN DEFAULT FALSE
      `);
      console.log('Column added successfully');
    } catch (error) {
      console.error('Error adding column:', error);
      throw error;
    }
    
    console.log('Migration completed successfully');
    await pool.end();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();