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
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Pushes schema changes to add indexes
 */
async function main() {
  console.log('Starting migration to add database indexes...');
  
  try {
    // Create a connection for migrations
    const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
    
    // Run the migration
    console.log('Applying schema changes to add indexes...');
    await migrate(drizzle(migrationClient), { migrationsFolder: 'drizzle' });
    
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
    
    // Close the connection
    await migrationClient.end();
  } catch (error) {
    console.error('Error applying database indexes:', error);
    process.exit(1);
  }
}

main().catch(console.error);