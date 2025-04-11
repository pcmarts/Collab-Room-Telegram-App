import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/**
 * This migration script:
 * 1. Removes title and description fields from collaborations table
 */
async function main() {
  console.log('Starting database migration (collab fields update)...');

  // Connect to the database
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to database...');
  
  try {
    // Connect with postgres.js for raw SQL execution
    const sql = postgres(connectionString, { max: 1 });
    
    // Remove title and description columns
    console.log('Removing title and description columns from collaborations table...');
    await sql`
      ALTER TABLE collaborations
      DROP COLUMN IF EXISTS title,
      DROP COLUMN IF EXISTS description;
    `;
    
    console.log('Migration successful!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();