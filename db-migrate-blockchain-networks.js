import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("Starting database migration: Adding discovery_filter_blockchain_networks_enabled");

  try {
    // Use direct SQL execution to add the column
    await db.execute(sql`
      ALTER TABLE marketing_preferences 
      ADD COLUMN IF NOT EXISTS discovery_filter_blockchain_networks_enabled BOOLEAN DEFAULT FALSE;
    `);

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();