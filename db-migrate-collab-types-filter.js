import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

/**
 * This migration script adds the missing 'discovery_filter_collab_types_enabled' column to the marketing_preferences table
 * 
 * Run with:
 * node db-migrate-collab-types-filter.js
 */

async function main() {
  console.log("Starting database migration: Adding discovery_filter_collab_types_enabled column");

  try {
    // Use direct SQL execution to add the column
    await db.execute(sql`
      ALTER TABLE marketing_preferences 
      ADD COLUMN IF NOT EXISTS discovery_filter_collab_types_enabled BOOLEAN DEFAULT FALSE;
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();