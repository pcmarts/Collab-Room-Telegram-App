/**
 * Migration script to add database indexes for optimizing the discovery cards queries
 * 
 * This script adds strategic indexes to improve performance of join queries and
 * frequently filtered columns in the discovery card implementation.
 * 
 * Run with:
 * npx tsx db-migrate-add-indexes.js
 */

import { sql } from 'drizzle-orm';
import { pool, db } from './server/db.js';

async function main() {
  console.log('Starting index creation migration...');
  
  try {
    // Add index to collaborations.creator_id (used in joins and filtering)
    console.log('Adding index on collaborations.creator_id...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_collaborations_creator_id 
      ON collaborations (creator_id);
    `);
    
    // Add index to collaborations.created_at (used for ordering and pagination)
    console.log('Adding index on collaborations.created_at...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_collaborations_created_at 
      ON collaborations (created_at DESC);
    `);
    
    // Add index to collaborations.status (frequently filtered)
    console.log('Adding index on collaborations.status...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_collaborations_status 
      ON collaborations (status);
    `);
    
    // Add index for telegram ID lookups
    console.log('Adding index on users.telegram_id...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id 
      ON users (telegram_id);
    `);
    
    // Add index to companies.user_id (used in joins)
    console.log('Adding index on companies.user_id...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_companies_user_id 
      ON companies (user_id);
    `);
    
    // Add indexes to swipes table (used in NOT EXISTS subquery)
    console.log('Adding compound index on swipes (user_id, collaboration_id)...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_swipes_user_collab 
      ON swipes (user_id, collaboration_id);
    `);
    
    // Add index to marketing_preferences.user_id (used in left joins)
    console.log('Adding index on marketing_preferences.user_id...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_marketing_preferences_user_id 
      ON marketing_preferences (user_id);
    `);
    
    // Add compound index for collaborations filtering (most common filter combination)
    console.log('Adding compound index on collaborations (status, created_at)...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_collaborations_status_created_at 
      ON collaborations (status, created_at DESC);
    `);
    
    // Add compound index for frequently used filtering conditions
    console.log('Adding compound index on collaborations (creator_id, status)...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_collaborations_creator_status 
      ON collaborations (creator_id, status);
    `);

    console.log('All indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Index migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Index migration failed:', err);
    process.exit(1);
  });