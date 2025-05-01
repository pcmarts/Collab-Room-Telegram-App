/**
 * This migration script adds the 'rest_id' column to the company_twitter_data table.
 * 
 * The rest_id is important as it's the unique identifier for a Twitter account
 * in the Twitter API, and is useful for API integrations.
 * 
 * Run with:
 * npx tsx db-migrate-add-twitter-rest-id.js
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { company_twitter_data } from './shared/schema.js';

async function main() {
  console.log('Starting migration to add rest_id column to company_twitter_data table...');

  // Create database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    // First check if the company_twitter_data table exists
    try {
      console.log('Checking if company_twitter_data table exists...');
      await db.select().from(company_twitter_data).limit(1);
      console.log('The company_twitter_data table exists.');
    } catch (error) {
      console.error('The company_twitter_data table does not exist. Run db-migrate-twitter-profiles.js first.');
      throw new Error('Table not found');
    }

    // Check if the rest_id column already exists
    try {
      console.log('Checking if rest_id column exists...');
      // Execute a simple query that accesses the rest_id column
      await sql`SELECT rest_id FROM company_twitter_data LIMIT 1`;
      console.log('The rest_id column already exists.');
    } catch (error) {
      // The column doesn't exist, so add it
      console.log('Adding rest_id column to company_twitter_data table...');
      
      await sql`
        ALTER TABLE company_twitter_data 
        ADD COLUMN IF NOT EXISTS rest_id TEXT;
      `;
      
      console.log('Successfully added rest_id column.');

      // Create an index on rest_id for faster lookups
      console.log('Creating index on rest_id column...');
      await sql`
        CREATE INDEX IF NOT EXISTS idx_company_twitter_data_rest_id 
        ON company_twitter_data (rest_id);
      `;
      
      console.log('Successfully created index on rest_id column.');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // No need to explicitly close the connection with neon serverless
    console.log('Connection will close automatically');
  }
}

main().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});