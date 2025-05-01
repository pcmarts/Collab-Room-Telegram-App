/**
 * This migration script adds the company_twitter_data table to the database
 * for storing enriched Twitter profile information for companies.
 * 
 * Run with:
 * npx tsx db-migrate-twitter-profiles.js
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { company_twitter_data, companies } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Starting Company Twitter Profiles migration...');

  // Create database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    // Check if the table already exists by attempting to query it
    try {
      console.log('Checking if company_twitter_data table exists...');
      await db.select().from(company_twitter_data).limit(1);
      console.log('The company_twitter_data table already exists.');
    } catch (error) {
      // If the table doesn't exist, we'll get an error, which is expected
      console.log('Creating company_twitter_data table...');
      
      // Create the table using a raw SQL query since drizzle doesn't support
      // CREATE TABLE operations directly
      await sql`
        CREATE TABLE IF NOT EXISTS company_twitter_data (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          username TEXT NOT NULL,
          name TEXT NOT NULL,
          bio TEXT,
          followers_count INTEGER NOT NULL,
          following_count INTEGER NOT NULL,
          tweet_count INTEGER NOT NULL,
          profile_image_url TEXT,
          banner_image_url TEXT,
          is_verified BOOLEAN DEFAULT FALSE,
          is_business_account BOOLEAN DEFAULT FALSE,
          business_category TEXT,
          location TEXT,
          website_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          twitter_created_at TEXT,
          last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
          raw_data JSONB,
          UNIQUE (company_id)
        );
      `;
      
      console.log('Successfully created company_twitter_data table.');
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