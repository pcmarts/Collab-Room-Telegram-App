import { Pool } from 'pg';

// Direct SQL execution approach - no ORM dependencies
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

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
    await pool.query(`
      ALTER TABLE marketing_preferences 
      ADD COLUMN IF NOT EXISTS discovery_filter_collab_types_enabled BOOLEAN DEFAULT FALSE;
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

main();