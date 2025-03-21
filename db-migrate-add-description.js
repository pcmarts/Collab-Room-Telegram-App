/**
 * This migration script adds the missing 'description' column to the collaborations table
 */
import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("⚙️ Running migration: Add description column to collaborations table");

  try {
    // Check if column exists first to avoid errors
    const columnExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'collaborations' AND column_name = 'description'
    `);

    if (columnExists.rows.length === 0) {
      // Add the description column to collaborations table
      await db.execute(sql`
        ALTER TABLE collaborations 
        ADD COLUMN description TEXT
      `);
      console.log("✅ Successfully added description column to collaborations table");
    } else {
      console.log("ℹ️ Description column already exists, no changes made");
    }

    // Now we're done with this migration
    console.log("✅ Migration completed successfully");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error in migration:", err);
    process.exit(1);
  });