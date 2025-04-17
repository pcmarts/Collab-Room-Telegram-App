/**
 * This migration script adds the 'logo_url' column to the companies table
 * 
 * Run with:
 * npx tsx db-migrate-add-logo-url.js
 */

import { sql } from "drizzle-orm";
import { db, pool } from "./server/db";

async function main() {
  console.log("Starting migration to add logo_url to companies table...");
  
  try {
    // Check if the column already exists
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'logo_url'
    `;
    
    const checkResult = await db.execute(checkColumnQuery);
    
    if (checkResult.length > 0) {
      console.log("Column 'logo_url' already exists in companies table. Skipping migration.");
    } else {
      // Add the logo_url column to the companies table
      const alterTableQuery = sql`
        ALTER TABLE companies 
        ADD COLUMN logo_url TEXT
      `;
      
      await db.execute(alterTableQuery);
      console.log("Successfully added 'logo_url' column to companies table");
    }
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();