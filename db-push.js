// Simple script to push the schema to the database
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

async function main() {
  console.log('Starting database migration...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create the client
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  
  try {
    // Drop the table causing issues
    console.log('Dropping the collaborations table...');
    await client.unsafe('DROP TABLE IF EXISTS collaborations CASCADE');
    
    // Push the schema again
    console.log('Recreating tables with the updated schema...');
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS collaborations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collab_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        required_company_sectors TEXT[],
        required_funding_stages TEXT[],
        required_token_status BOOLEAN,
        min_company_followers TEXT,
        min_user_followers TEXT,
        details JSONB NOT NULL,
        date_type TEXT NOT NULL,
        specific_date TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.end();
  }
}

main();