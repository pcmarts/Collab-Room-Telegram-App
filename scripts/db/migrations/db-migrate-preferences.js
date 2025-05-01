// Script to migrate data from the old preferences table to the new split tables
import { db } from "./server/db.js";
import { preferences, marketing_preferences, conference_preferences } from "@shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting preferences migration...");
  
  try {
    // Get all existing preferences
    const existingPreferences = await db.select().from(preferences);
    console.log(`Found ${existingPreferences.length} preferences records to migrate.`);
    
    for (const pref of existingPreferences) {
      // Migrate to general preferences (already done, but update notification_frequency)
      await db
        .update(preferences)
        .set({
          notification_frequency: pref.notification_frequency || 'Daily'
        })
        .where(eq(preferences.id, pref.id));
      
      // Create marketing preferences
      await db.insert(marketing_preferences).values({
        user_id: pref.user_id,
        collabs_to_discover: pref.collabs_to_discover || [],
        collabs_to_host: pref.collabs_to_host || [],
        twitter_collabs: pref.twitter_collabs || [],
        filtered_marketing_topics: pref.excluded_tags || [], // Renamed from excluded_tags
        discovery_filter_enabled: pref.discovery_filter_enabled || false,
        discovery_filter_topics_enabled: pref.discovery_filter_topics_enabled || false,
        discovery_filter_company_followers_enabled: pref.discovery_filter_company_followers_enabled || false,
        discovery_filter_user_followers_enabled: pref.discovery_filter_user_followers_enabled || false,
        discovery_filter_funding_stages_enabled: pref.discovery_filter_funding_stages_enabled || false,
        discovery_filter_token_status_enabled: pref.discovery_filter_token_status_enabled || false,
        discovery_filter_company_sectors_enabled: pref.discovery_filter_company_sectors_enabled || false
      });
      
      // Create conference preferences
      await db.insert(conference_preferences).values({
        user_id: pref.user_id,
        coffee_match_enabled: pref.coffee_match_enabled || false,
        coffee_match_company_sectors: pref.coffee_match_company_sectors || [],
        coffee_match_company_followers: pref.coffee_match_company_followers || null,
        coffee_match_user_followers: pref.coffee_match_user_followers || null,
        coffee_match_funding_stages: pref.coffee_match_funding_stages || [],
        coffee_match_token_status: pref.coffee_match_token_status || false,
        coffee_match_filter_company_sectors_enabled: pref.coffee_match_filter_company_sectors_enabled || false,
        coffee_match_filter_company_followers_enabled: pref.coffee_match_filter_company_followers_enabled || false,
        coffee_match_filter_user_followers_enabled: pref.coffee_match_filter_user_followers_enabled || false,
        coffee_match_filter_funding_stages_enabled: pref.coffee_match_filter_funding_stages_enabled || false,
        coffee_match_filter_token_status_enabled: pref.coffee_match_filter_token_status_enabled || false
      });
      
      console.log(`Migrated preferences for user: ${pref.user_id}`);
    }
    
    console.log("Preferences migration completed successfully!");
  } catch (error) {
    console.error("Error during preferences migration:", error);
    process.exit(1);
  }
}

main().then(() => {
  console.log("Migration script completed.");
  process.exit(0);
}).catch(err => {
  console.error("Migration script failed:", err);
  process.exit(1);
});