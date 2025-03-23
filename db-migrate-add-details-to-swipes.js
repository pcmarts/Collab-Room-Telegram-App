/**
 * This migration script adds the 'details' JSON column to the swipes table
 * 
 * Run with:
 * node db-migrate-add-details-to-swipes.js
 */

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('\n===== DB MIGRATION: Add details column to swipes table =====\n');
  
  try {
    // Use direct SQL execution to add the column
    await db.execute(sql`
      ALTER TABLE swipes
      ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
    `);
    
    console.log('\n✅ Migration completed successfully\n');
  } catch (error) {
    console.error('Error during migration:', error);
    console.error('\n❌ Migration failed\n');
    process.exit(1);
  }
}

main();