/**
 * This script finds companies with Twitter handles but no Twitter data,
 * then calls the Twitter API to fetch their profiles and stores them
 * in the company_twitter_data table.
 * 
 * Run with:
 * npx tsx scripts/enrich-company-twitter-data.js
 */

import { sql } from 'drizzle-orm';
import { getTwitterProfile } from '../server/utils/twitter-api.js';

// Validate that we have a proper Twitter handle
function isValidTwitterHandle(handle) {
  if (!handle) return false;
  
  // Remove @ symbol if present
  handle = handle.replace(/^@/, '');
  
  // Twitter handles must be between 1-15 characters and can only contain
  // alphanumeric characters and underscores
  return handle.length > 0 && 
         handle.length <= 15 && 
         /^[A-Za-z0-9_]+$/.test(handle);
}

/**
 * Get all companies that have Twitter handles but no associated Twitter data
 * @returns {Promise<Array>} Array of company records
 */
async function getCompaniesWithTwitterHandles() {
  try {
    const query = `
      SELECT c.id, c.twitter_handle
      FROM companies c
      LEFT JOIN company_twitter_data ctd ON c.id = ctd.company_id
      WHERE c.twitter_handle IS NOT NULL
        AND c.twitter_handle != ''
        AND ctd.id IS NULL
      LIMIT 10;
    `;
    
    const result = await sql.unsafe(query);
    return result.rows || [];
  } catch (error) {
    console.error('Error finding companies with Twitter handles:', error);
    return [];
  }
}

/**
 * Stores Twitter profile data in the company_twitter_data table
 * 
 * @param {string} companyId - The company ID
 * @param {Object} profile - Twitter profile data
 * @returns {Promise<boolean>} Success status
 */
async function storeTwitterData(companyId, profile) {
  try {
    const query = `
      INSERT INTO company_twitter_data (
        company_id, 
        username, 
        name, 
        bio, 
        followers, 
        following, 
        tweets, 
        profile_image_url, 
        banner_image_url, 
        verified, 
        is_business_account, 
        business_category, 
        location, 
        website_url, 
        created_at, 
        rest_id,
        raw_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      ON CONFLICT (company_id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        followers = EXCLUDED.followers,
        following = EXCLUDED.following,
        tweets = EXCLUDED.tweets,
        profile_image_url = EXCLUDED.profile_image_url,
        banner_image_url = EXCLUDED.banner_image_url,
        verified = EXCLUDED.verified,
        is_business_account = EXCLUDED.is_business_account,
        business_category = EXCLUDED.business_category,
        location = EXCLUDED.location,
        website_url = EXCLUDED.website_url,
        rest_id = EXCLUDED.rest_id,
        created_at = EXCLUDED.created_at,
        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
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
      new Date(), // current timestamp
      profile.restId, // Twitter API rest_id for account
      JSON.stringify(profile.rawData)
    ];
    
    const result = await sql.unsafe(query, values);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`Stored Twitter data for company ${companyId} with Twitter handle @${profile.username}`);
      return true;
    } else {
      console.error(`Failed to store Twitter data for company ${companyId}`);
      return false;
    }
  } catch (error) {
    console.error(`Error storing Twitter data for company ${companyId}:`, error);
    return false;
  }
}

/**
 * Main function to enrich company data with Twitter profiles
 */
async function main() {
  try {
    console.log('Starting company Twitter data enrichment...');
    
    // Get companies with Twitter handles but no Twitter data
    const companies = await getCompaniesWithTwitterHandles();
    console.log(`Found ${companies.length} companies with Twitter handles but no Twitter data`);
    
    if (companies.length === 0) {
      console.log('No companies to enrich');
      return;
    }
    
    // Process each company
    let successCount = 0;
    let failureCount = 0;
    
    for (const company of companies) {
      const { id, twitter_handle } = company;
      
      if (!isValidTwitterHandle(twitter_handle)) {
        console.warn(`Skipping invalid Twitter handle: ${twitter_handle} for company ${id}`);
        failureCount++;
        continue;
      }
      
      // Clean the handle (remove @ if present)
      const handle = twitter_handle.replace(/^@/, '');
      
      console.log(`Processing company ${id} with Twitter handle: @${handle}`);
      
      // Fetch Twitter profile data
      const profile = await getTwitterProfile(handle);
      
      if (!profile) {
        console.warn(`Could not fetch Twitter profile for @${handle}`);
        failureCount++;
        continue;
      }
      
      // Store the profile data
      const success = await storeTwitterData(id, profile);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a short delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Enrichment completed. Success: ${successCount}, Failures: ${failureCount}`);
    console.log('Company Twitter data enrichment completed.');
  } catch (error) {
    console.error('Enrichment script failed:', error);
    throw error;
  } finally {
    // No need to explicitly close the connection with neon serverless
    console.log('Connection will close automatically');
  }
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});