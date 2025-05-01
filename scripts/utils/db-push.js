import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from './shared/schema.js';

// Use the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Starting database push...');
  
  // Create a connection pool
  const pool = new pg.Pool({ connectionString });
  
  try {
    // Create a drizzle instance
    const db = drizzle(pool, { schema });

    // Run the migration (push the schema changes to the database)
    console.log('Pushing schema to database...');
    await db.query.marketing_preferences.findMany();
    console.log('Schema successfully pushed to database');
  } catch (error) {
    console.error('Error pushing schema to database:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

main();