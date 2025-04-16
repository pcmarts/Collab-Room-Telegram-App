/**
 * Script to enrich a specific company with Twitter data
 * 
 * Run with:
 * node scripts/enrich-company-twitter-data.cjs COMPANY_ID TWITTER_HANDLE
 * 
 * Example:
 * node scripts/enrich-company-twitter-data.cjs "4c95f244-d5c1-4369-9531-834401fdce12" "Bondexapp"
 */

// Import Neon serverless PostgreSQL client
const { Pool } = require('pg');

// Check command line arguments
if (process.argv.length < 4) {
  console.error('Usage: node scripts/enrich-company-twitter-data.cjs COMPANY_ID TWITTER_HANDLE');
  process.exit(1);
}

// Get company ID and Twitter handle from command line arguments
const companyId = process.argv[2];
const twitterHandle = process.argv[3];

// Check if API key is available
if (!process.env.X_RAPIDAPI_KEY) {
  console.error('Error: X_RAPIDAPI_KEY environment variable is missing');
  process.exit(1);
}

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// API request options
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.X_RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
  }
};

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
    const user = data.result.data.user;
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
      name: legacy.name || `Unknown-${username}`, // Provide a default name to avoid null constraint violations
      bio: legacy.description || '', // Provide a default empty bio
      followers: legacy.followers_count || 0,
      following: legacy.friends_count || 0,
      tweets: legacy.statuses_count || 0,
      profileImageUrl: profileImageUrl || '',
      bannerImageUrl: legacy.profile_banner_url || null,
      verified: userData.is_blue_verified || legacy.verified || false,
      isBusinessAccount: userData.professional?.professional_type === 'Business' || false,
      businessCategory: userData.professional?.category?.[0]?.name || null,
      location: legacy.location || '',
      url: legacy.entities?.url?.urls?.[0]?.expanded_url || legacy.url || null,
      createdAt: legacy.created_at || new Date().toISOString(), // Provide current date as default
      restId: userData.rest_id || null, // Include the Twitter rest_id for API integrations
      rawData: JSON.stringify(data)
    };
    
    console.log('\nProfile data extracted:');
    console.log(`Name: ${profile.name}`);
    console.log(`Username: @${profile.username}`);
    console.log(`Bio: ${profile.bio}`);
    console.log(`Followers: ${profile.followers}`);
    console.log(`Following: ${profile.following}`);
    console.log(`Tweets: ${profile.tweets}`);
    console.log(`Profile Image: ${profile.profileImageUrl}`);
    console.log(`REST ID: ${profile.restId}`);
    
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
      profile.rawData
    ];
    
    const client = await pool.connect();
    try {
      const result = await client.query(query, values);
      
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
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error storing Twitter data for company ${companyId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function
async function main() {
  try {
    console.log(`Starting Twitter data enrichment for company ${companyId} with handle @${twitterHandle}...`);
    
    // Fetch Twitter profile
    const result = await fetchTwitterProfile(twitterHandle);
    
    if (!result.success) {
      console.error(`Failed to fetch Twitter profile for @${twitterHandle}: ${result.error}`);
      process.exit(1);
    }
    
    // Store the profile data
    const storeResult = await storeTwitterData(companyId, result.profile);
    
    if (storeResult.success) {
      console.log(`\nSuccessfully enriched company ${companyId} with Twitter data for handle @${twitterHandle}`);
      console.log(`Twitter REST ID: ${result.profile.restId}`);
    } else {
      console.error(`Failed to store Twitter data: ${storeResult.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\nEnrichment process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error during enrichment:', error);
    process.exit(1);
  });