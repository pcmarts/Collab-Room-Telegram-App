/**
 * This script tests Twitter data enrichment for a specific company
 * It fetches the company's Twitter handle and enriches it with Twitter profile data
 * 
 * Run with:
 * npx tsx scripts/test-company-twitter-enrichment.js COMPANY_ID
 */

import { sql } from '@neondatabase/serverless';
import { getTwitterProfile } from '../server/utils/twitter-api.js';

// Get the company ID from the command line
const companyId = process.argv[2];
if (!companyId) {
  console.error('Please provide a company ID as an argument');
  process.exit(1);
}

console.log(`Testing Twitter enrichment for company ID: ${companyId}`);

async function getCompanyTwitterHandle(companyId) {
  try {
    const query = `
      SELECT id, name, twitter_handle
      FROM companies
      WHERE id = $1
    `;
    
    const result = await sql.unsafe(query, [companyId]);
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Company with ID ${companyId} not found`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}

async function enrichCompanyWithTwitterData(companyId, twitterHandle) {
  try {
    if (!twitterHandle) {
      throw new Error('Company does not have a Twitter handle');
    }
    
    // Clean the handle (remove @ if present)
    const handle = twitterHandle.replace(/^@/, '');
    
    console.log(`Fetching Twitter profile for @${handle}...`);
    
    // Fetch Twitter profile data
    const profile = await getTwitterProfile(handle);
    
    if (!profile) {
      throw new Error(`Could not fetch Twitter profile for @${handle}`);
    }
    
    console.log(`Twitter profile fetched successfully for @${handle}`);
    console.log('Profile data:', {
      name: profile.name,
      bio: profile.bio ? profile.bio.substring(0, 50) + '...' : 'No bio',
      followers: profile.followers,
      restId: profile.restId
    });
    
    // Store the profile data
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
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to store Twitter data');
    }
    
    console.log(`Successfully stored Twitter data with ID: ${result.rows[0].id}`);
    
    // Now retrieve the stored data to verify
    const verifyQuery = `
      SELECT * FROM company_twitter_data
      WHERE company_id = $1
    `;
    
    const verifyResult = await sql.unsafe(verifyQuery, [companyId]);
    
    if (!verifyResult.rows || verifyResult.rows.length === 0) {
      throw new Error('Failed to retrieve stored Twitter data');
    }
    
    const storedData = verifyResult.rows[0];
    
    console.log('\nVerification of stored data:');
    console.log('Username:', storedData.username);
    console.log('Name:', storedData.name);
    console.log('Followers:', storedData.followers);
    console.log('Rest ID:', storedData.rest_id);
    console.log('Verified:', storedData.verified ? 'Yes' : 'No');
    console.log('Business Account:', storedData.is_business_account ? 'Yes' : 'No');
    
    return {
      success: true,
      twitterData: storedData
    };
  } catch (error) {
    console.error('Error enriching company with Twitter data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  try {
    // Get company info with Twitter handle
    const company = await getCompanyTwitterHandle(companyId);
    console.log(`Found company: ${company.name} with Twitter handle: ${company.twitter_handle || 'None'}`);
    
    if (!company.twitter_handle) {
      console.error('Company does not have a Twitter handle. Exiting.');
      process.exit(1);
    }
    
    // Enrich company with Twitter data
    const result = await enrichCompanyWithTwitterData(companyId, company.twitter_handle);
    
    if (result.success) {
      console.log('\nTwitter enrichment completed successfully!');
      process.exit(0);
    } else {
      console.error('\nTwitter enrichment failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main();