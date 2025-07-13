/**
 * Migration script to transfer legacy data from swipes/matches tables to requests table
 * 
 * This script will:
 * 1. Migrate right swipes from swipes table to requests table as 'pending' status
 * 2. Migrate left swipes from swipes table to requests table as 'skipped' status
 * 3. Update requests status based on matches table data
 * 4. Ensure no duplicate entries are created
 * 
 * Run with: npx tsx scripts/migrate-legacy-data.ts
 */

import { db } from '../server/db';
import { swipes, matches, requests, collaborations, users } from '../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

async function migrateLegacyData() {
  console.log('🔄 Starting migration of legacy swipes/matches data to requests table...');
  
  try {
    // First, get all swipes from the old swipes table
    const allSwipes = await db
      .select({
        id: swipes.id,
        user_id: swipes.user_id,
        collaboration_id: swipes.collaboration_id,
        direction: swipes.direction,
        note: swipes.note,
        details: swipes.details,
        created_at: swipes.created_at
      })
      .from(swipes)
      .orderBy(swipes.created_at);

    console.log(`📊 Found ${allSwipes.length} swipes to migrate`);

    // Get all matches from the old matches table
    const allMatches = await db
      .select({
        id: matches.id,
        collaboration_id: matches.collaboration_id,
        requester_id: matches.requester_id,
        host_id: matches.host_id,
        status: matches.status,
        note: matches.note,
        created_at: matches.created_at
      })
      .from(matches)
      .orderBy(matches.created_at);

    console.log(`📊 Found ${allMatches.length} matches to migrate`);

    // Get existing requests to avoid duplicates
    const existingRequests = await db
      .select({
        collaboration_id: requests.collaboration_id,
        requester_id: requests.requester_id
      })
      .from(requests);

    const existingRequestsSet = new Set(
      existingRequests.map(r => `${r.collaboration_id}-${r.requester_id}`)
    );

    console.log(`📊 Found ${existingRequests.length} existing requests in new table`);

    let migratedCount = 0;
    let skippedCount = 0;

    // Process each swipe
    for (const swipe of allSwipes) {
      const requestKey = `${swipe.collaboration_id}-${swipe.user_id}`;
      
      // Skip if already exists in requests table
      if (existingRequestsSet.has(requestKey)) {
        skippedCount++;
        continue;
      }

      // Get the collaboration to find the host
      const [collaboration] = await db
        .select({ creator_id: collaborations.creator_id })
        .from(collaborations)
        .where(eq(collaborations.id, swipe.collaboration_id));

      if (!collaboration) {
        console.warn(`⚠️ Collaboration ${swipe.collaboration_id} not found, skipping swipe ${swipe.id}`);
        continue;
      }

      // Determine the initial status based on swipe direction
      let initialStatus = swipe.direction === 'right' ? 'pending' : 'skipped';

      // Check if this swipe resulted in a match
      const relatedMatch = allMatches.find(match => 
        match.collaboration_id === swipe.collaboration_id && 
        match.requester_id === swipe.user_id
      );

      // Update status based on match data
      if (relatedMatch) {
        if (relatedMatch.status === 'active') {
          initialStatus = 'accepted';
        } else if (relatedMatch.status === 'hidden') {
          initialStatus = 'hidden';
        }
      }

      // Create the request entry
      try {
        await db.insert(requests).values({
          collaboration_id: swipe.collaboration_id,
          requester_id: swipe.user_id,
          host_id: collaboration.creator_id,
          status: initialStatus,
          note: swipe.note || null,
          created_at: swipe.created_at,
          updated_at: swipe.created_at
        });

        migratedCount++;
        console.log(`✅ Migrated swipe ${swipe.id} (${swipe.direction}) -> request (${initialStatus})`);
      } catch (error) {
        console.error(`❌ Failed to migrate swipe ${swipe.id}:`, error);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   - Total swipes processed: ${allSwipes.length}`);
    console.log(`   - Successfully migrated: ${migratedCount}`);
    console.log(`   - Skipped (already exists): ${skippedCount}`);
    console.log(`   - Errors: ${allSwipes.length - migratedCount - skippedCount}`);

    // Verify the migration by checking the specific user mentioned
    const testUserId = '2075c43e-aae9-4826-b9b6-5341112518b9';
    const userRequests = await db
      .select()
      .from(requests)
      .where(eq(requests.requester_id, testUserId));

    console.log(`\n🔍 Verification for user ${testUserId}:`);
    console.log(`   - Requests in new table: ${userRequests.length}`);
    userRequests.forEach(req => {
      console.log(`     - ${req.collaboration_id}: ${req.status} (${req.created_at})`);
    });

    console.log(`\n✅ Migration completed successfully!`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateLegacyData()
  .then(() => {
    console.log('🎉 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });