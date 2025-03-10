// Simple script to push the schema to the database
import pkg from 'pg';
const { Pool } = pkg;

async function main() {
  console.log('Starting database migration...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create a raw pg pool for SQL queries
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  
  try {
    // Update the users table to add is_admin column
    console.log('Updating the users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);
    
    // Create the marketing_preferences table
    console.log('Creating the marketing_preferences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS marketing_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collabs_to_discover TEXT[],
        collabs_to_host TEXT[],
        filtered_marketing_topics TEXT[],
        twitter_collabs TEXT[],
        discovery_filter_enabled BOOLEAN DEFAULT FALSE,
        discovery_filter_topics_enabled BOOLEAN DEFAULT FALSE,
        discovery_filter_company_followers_enabled BOOLEAN DEFAULT FALSE,
        discovery_filter_user_followers_enabled BOOLEAN DEFAULT FALSE,
        discovery_filter_funding_stages_enabled BOOLEAN DEFAULT FALSE,
        discovery_filter_token_status_enabled BOOLEAN DEFAULT FALSE,
        discovery_filter_company_sectors_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);
    
    // Create the conference_preferences table
    console.log('Creating the conference_preferences table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS conference_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coffee_match_enabled BOOLEAN DEFAULT FALSE,
        coffee_match_company_sectors TEXT[],
        coffee_match_company_followers TEXT,
        coffee_match_user_followers TEXT,
        coffee_match_funding_stages TEXT[],
        coffee_match_token_status BOOLEAN DEFAULT FALSE,
        coffee_match_filter_company_sectors_enabled BOOLEAN DEFAULT FALSE,
        coffee_match_filter_company_followers_enabled BOOLEAN DEFAULT FALSE,
        coffee_match_filter_user_followers_enabled BOOLEAN DEFAULT FALSE,
        coffee_match_filter_funding_stages_enabled BOOLEAN DEFAULT FALSE,
        coffee_match_filter_token_status_enabled BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);
    
    // Update the preferences table
    console.log('Updating the preferences table...');
    await client.query(`
      ALTER TABLE preferences ALTER COLUMN collabs_to_discover DROP NOT NULL,
      ALTER COLUMN collabs_to_host DROP NOT NULL,
      ALTER COLUMN excluded_tags DROP NOT NULL;
    `);
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main();