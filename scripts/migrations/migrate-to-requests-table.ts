/**
 * Migration script to move data from swipes and matches tables to unified requests table
 * 
 * This script will:
 * 1. Create the new requests table if it doesn't exist
 * 2. Migrate right swipes (requests) from swipes table
 * 3. Migrate matches, merging with existing swipe data where applicable
 * 4. Handle duplicate records by prioritizing match data
 * 
 * Run with: npx tsx scripts/migrations/migrate-to-requests-table.ts
 */

import { db } from '../../server/db.js';
import { sql } from 'drizzle-orm';

async function migrateToRequestsTable() {
  console.log('Starting migration from swipes/matches to requests table...');
  
  try {
    // Step 1: Create requests table if it doesn't exist
    console.log('Creating requests table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collaboration_id UUID NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
        requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Create indexes for performance
    console.log('Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS request_collab_id_idx ON requests(collaboration_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS request_requester_id_idx ON requests(requester_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS request_host_id_idx ON requests(host_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS request_status_idx ON requests(status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS request_host_status_idx ON requests(host_id, status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS request_requester_status_idx ON requests(requester_id, status);`);
    
    // Step 2: Get existing data counts
    const swipeCount = await db.execute(sql`SELECT COUNT(*) as count FROM swipes WHERE direction = 'right';`);
    const matchCount = await db.execute(sql`SELECT COUNT(*) as count FROM matches;`);
    
    console.log(`Found ${swipeCount.rows[0].count} right swipes to migrate`);
    console.log(`Found ${matchCount.rows[0].count} matches to migrate`);
    
    // Step 3: Migrate matches first (they have priority over swipes)
    console.log('Migrating matches to requests...');
    const matchInsertResult = await db.execute(sql`
      INSERT INTO requests (collaboration_id, requester_id, host_id, status, note, created_at, updated_at)
      SELECT 
        m.collaboration_id,
        m.requester_id,
        m.host_id,
        CASE 
          WHEN m.status = 'active' THEN 'accepted'
          WHEN m.status = 'hidden' THEN 'hidden'
          WHEN m.status = 'declined' THEN 'hidden'
          ELSE 'pending'
        END as status,
        m.note,
        m.created_at,
        m.updated_at
      FROM matches m
      ON CONFLICT DO NOTHING;
    `);
    
    console.log(`Migrated ${matchInsertResult.rowCount} matches to requests`);
    
    // Step 4: Migrate right swipes that don't have a corresponding match
    console.log('Migrating swipes (requests) that don\'t have matches...');
    const swipeInsertResult = await db.execute(sql`
      INSERT INTO requests (collaboration_id, requester_id, host_id, status, note, created_at)
      SELECT 
        s.collaboration_id,
        s.user_id as requester_id,
        c.creator_id as host_id,
        'pending' as status,
        s.note,
        s.created_at
      FROM swipes s
      JOIN collaborations c ON s.collaboration_id = c.id
      WHERE s.direction = 'right'
        AND NOT EXISTS (
          SELECT 1 FROM requests r 
          WHERE r.collaboration_id = s.collaboration_id 
          AND r.requester_id = s.user_id
        )
      ON CONFLICT DO NOTHING;
    `);
    
    console.log(`Migrated ${swipeInsertResult.rowCount} swipes to requests`);
    
    // Step 5: Get final count
    const finalCount = await db.execute(sql`SELECT COUNT(*) as count FROM requests;`);
    console.log(`Total requests after migration: ${finalCount.rows[0].count}`);
    
    // Step 6: Verify data integrity
    console.log('\nVerifying data integrity...');
    
    // Check for orphaned requests (no collaboration)
    const orphanedRequests = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM requests r 
      WHERE NOT EXISTS (
        SELECT 1 FROM collaborations c WHERE c.id = r.collaboration_id
      );
    `);
    console.log(`Orphaned requests (no collaboration): ${orphanedRequests.rows[0].count}`);
    
    // Check for requests with invalid users
    const invalidUsers = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM requests r 
      WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = r.requester_id
      ) OR NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = r.host_id
      );
    `);
    console.log(`Requests with invalid users: ${invalidUsers.rows[0].count}`);
    
    // Get status distribution
    const statusDistribution = await db.execute(sql`
      SELECT status, COUNT(*) as count 
      FROM requests 
      GROUP BY status 
      ORDER BY count DESC;
    `);
    console.log('\nStatus distribution:');
    statusDistribution.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    console.log('\nMigration completed successfully!');
    console.log('\nNote: The original swipes and matches tables have been preserved.');
    console.log('You can manually drop them after verifying the migration.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateToRequestsTable()
  .then(() => {
    console.log('\nMigration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });