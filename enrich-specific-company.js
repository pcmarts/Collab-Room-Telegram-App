/**
 * This script enriches a specific company with Twitter data
 * and updates its logo and description.
 * 
 * Run with:
 * npx tsx enrich-specific-company.js
 */

import { db, companies } from './server/db.js';
import { eq } from 'drizzle-orm';
import { config } from './shared/config.js';

// Import the function from twitter-enrichment.js
import { getTwitterProfile } from './server/utils/twitter-api.js';

/**
 * Store Twitter data for company and update company attributes
 */
async function storeTwitterDataAndUpdateCompany(companyId, profile) {
  try {
    console.log(`Storing Twitter data for company ${companyId} with handle @${profile.username}...`);
    
    // First, store the Twitter data
    try {
      const query = `
        INSERT INTO company_twitter_data (
          company_id, 
          username, 
          name, 
          bio, 
          followers_count, 
          following_count, 
          tweet_count, 
          profile_image_url, 
          banner_image_url, 
          is_verified, 
          is_business_account, 
          business_category, 
          location, 
          website_url, 
          created_at, 
          twitter_created_at,
          rest_id,
          raw_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (company_id) DO UPDATE SET
          username = EXCLUDED.username,
          name = EXCLUDED.name,
          bio = EXCLUDED.bio,
          followers_count = EXCLUDED.followers_count,
          following_count = EXCLUDED.following_count,
          tweet_count = EXCLUDED.tweet_count,
          profile_image_url = EXCLUDED.profile_image_url,
          banner_image_url = EXCLUDED.banner_image_url,
          is_verified = EXCLUDED.is_verified,
          is_business_account = EXCLUDED.is_business_account,
          business_category = EXCLUDED.business_category,
          location = EXCLUDED.location,
          website_url = EXCLUDED.website_url,
          twitter_created_at = EXCLUDED.twitter_created_at,
          rest_id = EXCLUDED.rest_id,
          raw_data = EXCLUDED.raw_data,
          last_fetched_at = NOW()
        RETURNING id;
      `;
      
      const values = [
        companyId,
        profile.username,
        profile.name,
        profile.bio,
        profile.followers,
        profile.following,
        profile.tweets,
        profile.profileImageUrl,
        profile.bannerImageUrl,
        profile.verified,
        profile.isBusinessAccount,
        profile.businessCategory,
        profile.location,
        profile.url,
        new Date(),
        profile.createdAt,
        profile.restId,
        JSON.stringify(profile.rawData)
      ];
      
      const result = await db.execute(query, values);
      console.log(`Successfully stored Twitter data for company ${companyId}`);
      
      // Now update the company with the Twitter data
      const updates = {
        logo_url: profile.profileImageUrl,
        short_description: profile.bio || null
      };
      
      const [updatedCompany] = await db.update(companies)
        .set(updates)
        .where(eq(companies.id, companyId))
        .returning({
          id: companies.id,
          name: companies.name,
          short_description: companies.short_description,
          logo_url: companies.logo_url,
          twitter_handle: companies.twitter_handle
        });
      
      if (updatedCompany) {
        console.log(`Successfully updated company: ${updatedCompany.name} (${companyId})`);
        console.log(`- Logo URL: ${updatedCompany.logo_url}`);
        console.log(`- Short description: ${updatedCompany.short_description ? 'Updated' : 'Not updated'}`);
        return { success: true, company: updatedCompany };
      } else {
        console.error(`Failed to update company ${companyId}`);
        return { success: false, error: 'Update failed' };
      }
      
    } catch (dbError) {
      console.error(`Database error: ${dbError}`);
      throw dbError;
    }
  } catch (error) {
    console.error(`Error updating company ${companyId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Main function to enrich a specific company
 */
async function enrichSpecificCompany(companyId) {
  try {
    console.log(`Starting Twitter enrichment process for company ${companyId}...`);
    
    // Get the company details
    const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
    
    if (!company) {
      console.error(`Company ${companyId} not found`);
      return { success: false, error: 'Company not found' };
    }
    
    // Check if the company has a Twitter handle
    if (!company.twitter_handle) {
      console.warn(`Company ${company.id} (${company.name}) has no Twitter handle`);
      return { success: false, error: 'Company has no Twitter handle' };
    }
    
    console.log(`Processing company ${company.id} (${company.name}) with Twitter handle @${company.twitter_handle}`);
    
    // Step 1: Fetch Twitter profile
    const profile = await getTwitterProfile(company.twitter_handle);
    
    if (!profile) {
      console.error(`Failed to fetch Twitter profile for @${company.twitter_handle}`);
      return { success: false, error: 'Failed to fetch Twitter profile' };
    }
    
    console.log(`Successfully fetched Twitter profile for @${company.twitter_handle}`);
    console.log(`- Name: ${profile.name}`);
    console.log(`- Bio: ${profile.bio}`);
    console.log(`- Followers: ${profile.followers}`);
    console.log(`- Profile image: ${profile.profileImageUrl}`);
    
    // Step 2: Store Twitter data and update company
    const result = await storeTwitterDataAndUpdateCompany(company.id, profile);
    
    if (result.success) {
      console.log(`Successfully enriched company ${company.id} (${company.name}) with Twitter data`);
      return { 
        success: true, 
        message: `Successfully enriched company ${company.name} with Twitter data`,
        company: result.company
      };
    } else {
      console.error(`Failed to store Twitter data: ${result.error}`);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error during company Twitter enrichment:', error);
    return { success: false, error: error.message };
  }
}

// Execute the function with the specified company ID
const COMPANY_ID = 'f6ccc6ca-d1a4-4b76-8ab5-03e717bad1f6';

async function main() {
  try {
    console.log(`Starting enrichment for company ${COMPANY_ID}`);
    const result = await enrichSpecificCompany(COMPANY_ID);
    
    if (result.success) {
      console.log('✅ Enrichment completed successfully');
      console.log(result.company);
    } else {
      console.error('❌ Enrichment failed:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    // Close the database pool when done
    if (typeof db.end === 'function') {
      await db.end();
    } else if (db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
    console.log('Database connection closed');
  }
}

main().catch(err => {
  console.error('Critical error:', err);
  process.exit(1);
});