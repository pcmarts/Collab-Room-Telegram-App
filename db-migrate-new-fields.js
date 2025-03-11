import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log('Starting database field migration...');

  try {
    // Add new standardized fields to marketing_preferences
    await db.execute(sql`
      ALTER TABLE marketing_preferences 
      ADD COLUMN IF NOT EXISTS twitter_followers TEXT,
      ADD COLUMN IF NOT EXISTS company_twitter_followers TEXT,
      ADD COLUMN IF NOT EXISTS funding_stage TEXT,
      ADD COLUMN IF NOT EXISTS company_has_token BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS company_token_ticker TEXT,
      ADD COLUMN IF NOT EXISTS company_blockchain_networks TEXT[],
      ADD COLUMN IF NOT EXISTS company_tags TEXT[]
    `);
    console.log('Added new fields to marketing_preferences table');

    // Add new standardized fields to conference_preferences
    await db.execute(sql`
      ALTER TABLE conference_preferences 
      ADD COLUMN IF NOT EXISTS twitter_followers TEXT,
      ADD COLUMN IF NOT EXISTS company_twitter_followers TEXT,
      ADD COLUMN IF NOT EXISTS funding_stage TEXT,
      ADD COLUMN IF NOT EXISTS company_has_token BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS company_token_ticker TEXT,
      ADD COLUMN IF NOT EXISTS company_blockchain_networks TEXT[],
      ADD COLUMN IF NOT EXISTS company_tags TEXT[]
    `);
    console.log('Added new fields to conference_preferences table');

    // Add new standardized fields to collaborations
    await db.execute(sql`
      ALTER TABLE collaborations 
      ADD COLUMN IF NOT EXISTS twitter_followers TEXT,
      ADD COLUMN IF NOT EXISTS company_twitter_followers TEXT,
      ADD COLUMN IF NOT EXISTS funding_stage TEXT,
      ADD COLUMN IF NOT EXISTS company_has_token BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS company_token_ticker TEXT,
      ADD COLUMN IF NOT EXISTS company_blockchain_networks TEXT[],
      ADD COLUMN IF NOT EXISTS company_tags TEXT[]
    `);
    console.log('Added new fields to collaborations table');

    // For any existing data, migrate relevant information from legacy fields to new fields
    // This ensures we have data in the new fields for consistent matching
    
    // For collaborations table
    await db.execute(sql`
      UPDATE collaborations 
      SET 
        twitter_followers = min_user_followers,
        company_twitter_followers = min_company_followers,
        funding_stage = CASE 
          WHEN required_funding_stages IS NOT NULL AND array_length(required_funding_stages, 1) > 0 
          THEN required_funding_stages[1] 
          ELSE NULL 
        END,
        company_has_token = required_token_status,
        company_blockchain_networks = required_blockchain_networks,
        company_tags = required_company_sectors
      WHERE 
        twitter_followers IS NULL OR
        company_twitter_followers IS NULL OR
        company_blockchain_networks IS NULL OR
        company_tags IS NULL
    `);
    console.log('Migrated existing data from legacy fields to new standardized fields');

    console.log('Database field migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);