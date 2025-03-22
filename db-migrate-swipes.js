/**
 * This migration script creates the swipes table
 * 
 * Run with:
 * node db-migrate-swipes.js
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './shared/schema.js';

const { Pool } = pg;

// Use the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Starting swipes table migration...');
  
  // Create a connection pool
  const pool = new Pool({ connectionString });
  
  try {
    // Create a drizzle instance
    const db = drizzle(pool, { schema });

    // Create the swipes table
    console.log('Creating swipes table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS swipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
        direction TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    console.log('Swipes table successfully created');
  } catch (error) {
    console.error('Error creating swipes table:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

main();