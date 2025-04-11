/**
 * This migration script:
 * 1. Drops the old matches table with incorrect foreign key references
 * 2. Creates a new matches table with correct references to collaborations and users
 * 
 * Run with:
 * node db-migrate-fix-matches-table.js
 */

import { db } from './server/db.js';
import { matches } from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Starting to fix matches table...');
  
  try {
    // First, drop the old matches table if it exists
    console.log('Dropping old matches table...');
    await db.execute(sql`DROP TABLE IF EXISTS matches CASCADE`);
    console.log('Successfully dropped old matches table');
    
    // Create the new matches table based on the schema
    console.log('Creating new matches table with correct references...');
    await db.execute(sql`
      CREATE TABLE matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
        host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'active',
        host_accepted BOOLEAN DEFAULT false,
        requester_accepted BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('Successfully created new matches table');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unhandled error in migration:', err);
    process.exit(1);
  });