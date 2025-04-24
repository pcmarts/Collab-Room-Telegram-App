/**
 * Migration script to add database indexes for query optimization
 * 
 * This script pushes the schema changes to add indexes for key join columns
 * to improve query performance, especially for the discovery cards feature.
 * 
 * Run with:
 * npx tsx db-migrate-add-indexes.js
 */

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

/**
 * Pushes schema changes to add indexes
 */
async function main() {
  console.log('Starting migration to add database indexes...');
  
  try {
    console.log('Adding indexes directly via SQL statements...');
    
    // Add indexes for users table
    console.log('Adding indexes for users table...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS user_id_idx ON users(id)`);
    
    // Add indexes for companies table
    console.log('Adding indexes for companies table...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS company_user_id_idx ON companies(user_id)`);
    
    // Add indexes for collaborations table
    console.log('Adding indexes for collaborations table...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS collab_creator_id_idx ON collaborations(creator_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS collab_created_at_idx ON collaborations(created_at)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS collab_status_idx ON collaborations(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS collab_creator_status_idx ON collaborations(creator_id, status)`);
    
    // Add indexes for swipes table
    console.log('Adding indexes for swipes table...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS swipe_user_id_idx ON swipes(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS swipe_collab_id_idx ON swipes(collaboration_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS swipe_user_collab_idx ON swipes(user_id, collaboration_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS swipe_direction_user_idx ON swipes(direction, user_id)`);
    
    // Add indexes for matches table
    console.log('Adding indexes for matches table...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS match_host_id_idx ON matches(host_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS match_requester_id_idx ON matches(requester_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS match_collab_id_idx ON matches(collaboration_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS match_host_requester_idx ON matches(host_id, requester_id)`);
    
    // Add indexes for marketing_preferences table
    console.log('Adding indexes for marketing_preferences table...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS marketing_pref_user_id_idx ON marketing_preferences(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS marketing_filter_idx ON marketing_preferences(discovery_filter_enabled, discovery_filter_collab_types_enabled)`);
    
    console.log('Successfully added database indexes');
    console.log('The following indexes were added:');
    console.log('- user_id_idx on users(id)');
    console.log('- company_user_id_idx on companies(user_id)');
    console.log('- collab_creator_id_idx on collaborations(creator_id)');
    console.log('- collab_created_at_idx on collaborations(created_at)');
    console.log('- collab_status_idx on collaborations(status)');
    console.log('- collab_creator_status_idx on collaborations(creator_id, status)');
    console.log('- swipe_user_id_idx on swipes(user_id)');
    console.log('- swipe_collab_id_idx on swipes(collaboration_id)');
    console.log('- swipe_user_collab_idx on swipes(user_id, collaboration_id)');
    console.log('- swipe_direction_user_idx on swipes(direction, user_id)');
    console.log('- match_host_id_idx on matches(host_id)');
    console.log('- match_requester_id_idx on matches(requester_id)');
    console.log('- match_collab_id_idx on matches(collaboration_id)');
    console.log('- match_host_requester_idx on matches(host_id, requester_id)');
    console.log('- marketing_pref_user_id_idx on marketing_preferences(user_id)');
    console.log('- marketing_filter_idx on marketing_preferences(discovery_filter_enabled, discovery_filter_collab_types_enabled)');
  } catch (error) {
    console.error('Error applying database indexes:', error);
    process.exit(1);
  }
}

main().catch(console.error);