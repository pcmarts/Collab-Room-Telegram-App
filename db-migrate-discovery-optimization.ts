/**
 * Migration script to optimize database indexes for Discovery card performance
 * 
 * This script adds specialized composite indexes to improve the performance
 * of the searchCollaborationsPaginated query, targeting the 96ms load time.
 * 
 * Run with:
 * npx tsx db-migrate-discovery-optimization.ts
 */

import { db } from './server/db';
import { sql } from 'drizzle-orm';
import { logger } from './server/utils/logger';

async function main() {
  logger.info('Starting Discovery card database optimization...');
  
  try {
    // 1. Add composite index for the swipes table to optimize the NOT EXISTS query
    // This is critical for efficiently excluding already swiped collaborations
    logger.info('Adding composite index for swipes (user_id + collaboration_id)...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_swipes_user_collab_composite 
      ON swipes (user_id, collaboration_id);
    `);
    
    // 2. Add composite index for collaborations table to optimize the common filter pattern
    // This helps with filtering by collab_type AND status
    logger.info('Adding composite index for collaborations (collab_type + status)...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_collaborations_type_status 
      ON collaborations (collab_type, status);
    `);
    
    // 3. Add composite index for filtering by topics which is a common filter
    logger.info('Adding GIN index for collaboration topics array...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_collaborations_topics_gin 
      ON collaborations USING GIN (topics);
    `);
    
    // 4. Add composite index for the most common join in the query
    // This optimizes the join between users and companies
    logger.info('Adding composite index for the users-companies join...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_companies_join 
      ON companies (user_id) 
      INCLUDE (name, short_description, long_description, website, twitter_handle, twitter_followers);
    `);
    
    // 5. Add composite index for the marketing preferences
    // This optimizes filtering by user preferences
    logger.info('Adding composite index for marketing preferences filters...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_marketing_prefs_filters
      ON marketing_preferences (
        user_id, 
        discovery_filter_enabled, 
        discovery_filter_collab_types_enabled,
        discovery_filter_topics_enabled
      );
    `);
    
    logger.info('Database index optimization completed successfully!');
    
    // 6. Analyze tables to update statistics for query planner
    logger.info('Analyzing tables to update statistics...');
    await db.execute(sql`ANALYZE collaborations;`);
    await db.execute(sql`ANALYZE swipes;`);
    await db.execute(sql`ANALYZE users;`);
    await db.execute(sql`ANALYZE companies;`);
    await db.execute(sql`ANALYZE marketing_preferences;`);
    
    logger.info('Table statistics updated for query optimizer.');
    
  } catch (error) {
    logger.error('Error during database optimization:', error);
    process.exit(1);
  }
}

// Execute the migration
main()
  .then(() => {
    logger.info('Discovery card database optimization completed');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });