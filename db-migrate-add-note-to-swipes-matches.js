/**
 * This migration script adds the 'note' column to the swipes and matches tables
 * 
 * Run with:
 * npx tsx db-migrate-add-note-to-swipes-matches.js
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

// Get the connection string from environment variables
const connectionString = process.env.DATABASE_URL;

async function main() {
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not defined');
    process.exit(1);
  }

  // Connect to the database
  const client = neon(connectionString);
  const db = drizzle(client);

  console.log('Running migration: Add note column to swipes and matches tables');

  try {
    // First, check if the columns already exist
    const checkSwipesColumnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'swipes' AND column_name = 'note'
      ) AS column_exists;
    `);

    const checkMatchesColumnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'note'
      ) AS column_exists;
    `);

    const swipesColumnExists = checkSwipesColumnExists.rows?.[0]?.column_exists === true;
    const matchesColumnExists = checkMatchesColumnExists.rows?.[0]?.column_exists === true;

    // Add note column to swipes table if it doesn't exist
    if (!swipesColumnExists) {
      console.log('Adding note column to swipes table...');
      await db.execute(sql`
        ALTER TABLE swipes
        ADD COLUMN IF NOT EXISTS note TEXT;
      `);
      console.log('Successfully added note column to swipes table');
    } else {
      console.log('Note column already exists in swipes table, skipping');
    }

    // Add note column to matches table if it doesn't exist
    if (!matchesColumnExists) {
      console.log('Adding note column to matches table...');
      await db.execute(sql`
        ALTER TABLE matches
        ADD COLUMN IF NOT EXISTS note TEXT;
      `);
      console.log('Successfully added note column to matches table');
    } else {
      console.log('Note column already exists in matches table, skipping');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
main()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });