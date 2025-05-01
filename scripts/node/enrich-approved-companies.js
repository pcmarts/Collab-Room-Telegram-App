/**
 * Script to enrich all approved companies with Twitter data
 * 
 * Run with:
 * npx tsx scripts/enrich-approved-companies.js
 */

// Import required packages
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Using built-in fetch API from Node.js 18+
// API request options
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.X_RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
  }
};

// Check if API key is available
if (!process.env.X_RAPIDAPI_KEY) {
  console.error('Error: X_RAPIDAPI_KEY environment variable is missing');
  process.exit(1);
}

// Function to fetch Twitter profile
async function fetchTwitterProfile(username) {
  try {
    // Clean the username (remove @ if present)
    username = username.replace(/^@/, '');
    
    console.log(`Fetching Twitter profile for @${username}...`);
    
    // Make the API request
    const response = await fetch(`https://twitter241.p.rapidapi.com/user?username=${username}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for errors in the response
    if (data.errors) {
      throw new Error(`Twitter API returned errors: ${JSON.stringify(data.errors)}`);
    }
    
    // The structure is: data.result.data.user.result
    if (!data.result || !data.result.data || !data.result.data.user || !data.result.data.user.result) {
      throw new Error('No user data found in response');
    }
    
    // Extract the user data
    const { result: { data: { user } } } = data;
    const userData = user.result || {};
    const legacy = userData.legacy || {};
    
    // Get profile image URL with safe handling
    let profileImageUrl = legacy.profile_image_url_https || '';
    if (profileImageUrl) {
      profileImageUrl = profileImageUrl.replace('_normal', '');
    }
    
    // Transform the response into a clean profile object
    const profile = {
      username: username,
      name: legacy.name,
      bio: legacy.description,
      followers: legacy.followers_count || 0,
      following: legacy.friends_count || 0,
      tweets: legacy.statuses_count || 0,
      profileImageUrl: profileImageUrl,
      bannerImageUrl: legacy.profile_banner_url,
      verified: userData.is_blue_verified || legacy.verified || false,
      isBusinessAccount: userData.professional?.professional_type === 'Business',
      businessCategory: userData.professional?.category?.[0]?.name || null,
      location: legacy.location,
      url: legacy.entities?.url?.urls?.[0]?.expanded_url || legacy.url,
      createdAt: legacy.created_at,
      restId: userData.rest_id || null, // Include the Twitter rest_id for API integrations
      rawData: data
    };
    
    return { success: true, profile };
  } catch (error) {
    console.error(`Error fetching Twitter profile for @${username}:`, error);
    return { success: false, error: error.message };
  }
}

// Function to store Twitter data
async function storeTwitterData(companyId, profile) {
  try {
    console.log(`Storing Twitter data for company ${companyId} with handle @${profile.username}...`);
    
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
      new Date(), // current timestamp
      profile.createdAt,
      profile.restId,
      JSON.stringify({ user_data: "Twitter profile data" }) // simplified raw data
    ];
    
    const result = await sql.unsafe(query, values);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`Successfully stored Twitter data for company ${companyId}`);
      return {
        success: true,
        id: result.rows[0].id
      };
    } else {
      console.error(`Failed to store Twitter data for company ${companyId}`);
      return {
        success: false,
        error: 'No rows returned after insert/update'
      };
    }
  } catch (error) {
    console.error(`Error storing Twitter data for company ${companyId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get all approved companies with Twitter handles that haven't been enriched yet
async function getApprovedCompaniesWithTwitter() {
  try {
    const query = `
      SELECT 
        c.id as company_id, 
        c.name as company_name, 
        c.twitter_handle
      FROM companies c
      JOIN users u ON c.user_id = u.id
      WHERE u.is_approved = true
      AND c.twitter_handle IS NOT NULL
      AND c.twitter_handle != ''
      AND c.id NOT IN (SELECT company_id FROM company_twitter_data)
      ORDER BY c.name;
    `;
    
    const result = await sql.unsafe(query);
    
    if (!result.rows || result.rows.length === 0) {
      console.log('No companies found that need Twitter enrichment');
      return [];
    }
    
    console.log(`Found ${result.rows.length} companies that need Twitter enrichment`);
    return result.rows;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

// Function to validate Twitter handle
function isValidTwitterHandle(handle) {
  if (!handle) return false;
  
  // Remove @ if present
  handle = handle.replace(/^@/, '');
  
  // Basic Twitter handle validation
  return handle.length >= 1 && handle.length <= 15 && /^[A-Za-z0-9_]+$/.test(handle);
}

// Main function
async function main() {
  try {
    console.log('Starting Twitter enrichment for approved companies...');
    
    // Get companies to enrich
    const companies = await getApprovedCompaniesWithTwitter();
    
    if (companies.length === 0) {
      console.log('No companies to enrich. Exiting.');
      return;
    }
    
    // Process each company
    let successCount = 0;
    let failureCount = 0;
    
    for (const company of companies) {
      const { company_id, company_name, twitter_handle } = company;
      
      if (!isValidTwitterHandle(twitter_handle)) {
        console.warn(`Skipping invalid Twitter handle: ${twitter_handle} for company ${company_name} (${company_id})`);
        failureCount++;
        continue;
      }
      
      console.log(`\nProcessing company: ${company_name} (${company_id})`);
      console.log(`Twitter handle: @${twitter_handle}`);
      
      // Fetch Twitter profile
      const result = await fetchTwitterProfile(twitter_handle);
      
      if (!result.success) {
        console.error(`Failed to fetch Twitter profile for ${company_name}: ${result.error}`);
        failureCount++;
        continue;
      }
      
      // Store the profile data
      const storeResult = await storeTwitterData(company_id, result.profile);
      
      if (storeResult.success) {
        console.log(`Successfully enriched ${company_name} with Twitter data`);
        successCount++;
      } else {
        console.error(`Failed to store Twitter data for ${company_name}: ${storeResult.error}`);
        failureCount++;
      }
      
      // Add a short delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n========== ENRICHMENT SUMMARY ==========');
    console.log(`Total companies processed: ${companies.length}`);
    console.log(`Successful enrichments: ${successCount}`);
    console.log(`Failed enrichments: ${failureCount}`);
    console.log('========================================');
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Enrichment process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error during enrichment:', error);
    process.exit(1);
  });