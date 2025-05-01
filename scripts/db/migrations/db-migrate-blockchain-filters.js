// db-migrate-blockchain-filters.js
import pkg from 'pg';
const { Pool } = pkg;

// Use the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Starting database migration for blockchain filters...');
  
  // Create a connection pool
  const pool = new Pool({ connectionString });
  
  try {
    // Add missing columns to marketing_preferences table
    await pool.query(`
      ALTER TABLE marketing_preferences
      ADD COLUMN IF NOT EXISTS discovery_filter_blockchain_networks_enabled BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added discovery_filter_blockchain_networks_enabled to marketing_preferences');

    // Add missing columns to collaborations table if needed
    await pool.query(`
      ALTER TABLE collaborations
      ADD COLUMN IF NOT EXISTS filter_blockchain_networks_enabled BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added filter_blockchain_networks_enabled to collaborations');

    // Add other potentially missing filter columns
    await pool.query(`
      ALTER TABLE marketing_preferences
      ADD COLUMN IF NOT EXISTS discovery_filter_topics_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS discovery_filter_company_followers_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS discovery_filter_user_followers_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS discovery_filter_funding_stages_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS discovery_filter_token_status_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS discovery_filter_company_sectors_enabled BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added remaining filter toggle columns to marketing_preferences');

    // Add filter enablement columns to collaborations
    await pool.query(`
      ALTER TABLE collaborations
      ADD COLUMN IF NOT EXISTS filter_company_sectors_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS filter_company_followers_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS filter_user_followers_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS filter_funding_stages_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS filter_token_status_enabled BOOLEAN DEFAULT FALSE;
    `);
    console.log('Added filter toggle columns to collaborations');

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during database migration:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

main();