/**
 * Direct Twitter API test for a specific company
 * Uses global fetch to call the Twitter API directly
 * 
 * Run with:
 * node scripts/direct-twitter-api-test.js [twitter_handle]
 */

const TWITTER_HANDLE = process.argv[2] || 'Bondexapp';
const COMPANY_ID = '4c95f244-d5c1-4369-9531-834401fdce12';

// Check if API key is available
if (!process.env.X_RAPIDAPI_KEY) {
  console.error('Error: X_RAPIDAPI_KEY environment variable is missing');
  process.exit(1);
}

console.log(`Testing Twitter API enrichment for company ID: ${COMPANY_ID}`);
console.log(`Using Twitter handle: @${TWITTER_HANDLE}`);

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
    };
    
    return { success: true, profile };
  } catch (error) {
    console.error(`Error fetching Twitter profile for @${username}:`, error);
    return { success: false, error: error.message };
  }
}

// Function to simulate storing data in the database
function simulateStore(companyId, profile) {
  console.log('\n========== TWITTER DATA ENRICHMENT SIMULATION ==========');
  console.log(`Company ID: ${companyId}`);
  console.log('Twitter Data:');
  console.log('-----------------');
  console.log(`Username: ${profile.username}`);
  console.log(`Display Name: ${profile.name}`);
  console.log(`Twitter Rest ID: ${profile.restId}`);
  console.log(`Bio: ${profile.bio ? profile.bio.substring(0, 50) + (profile.bio.length > 50 ? '...' : '') : 'N/A'}`);
  console.log(`Followers: ${profile.followers.toLocaleString()}`);
  console.log(`Following: ${profile.following.toLocaleString()}`);
  console.log(`Tweets: ${profile.tweets.toLocaleString()}`);
  console.log(`Verified: ${profile.verified ? 'Yes' : 'No'}`);
  console.log(`Business Account: ${profile.isBusinessAccount ? 'Yes' : 'No'}`);
  console.log(`Business Category: ${profile.businessCategory || 'N/A'}`);
  console.log(`Location: ${profile.location || 'N/A'}`);
  console.log(`Website: ${profile.url || 'N/A'}`);
  console.log(`Account Created: ${profile.createdAt || 'N/A'}`);
  console.log(`Profile Image: ${profile.profileImageUrl || 'N/A'}`);
  console.log('\nSQL that would be executed:');
  console.log(`
INSERT INTO company_twitter_data (
  company_id, username, name, bio, followers, following, tweets, 
  profile_image_url, banner_image_url, verified, is_business_account, 
  business_category, location, website_url, created_at, rest_id
) VALUES (
  '${companyId}', 
  '${profile.username}', 
  '${profile.name}', 
  '${profile.bio ? profile.bio.replace(/'/g, "''") : ''}', 
  ${profile.followers}, 
  ${profile.following}, 
  ${profile.tweets}, 
  '${profile.profileImageUrl || ''}', 
  '${profile.bannerImageUrl || ''}', 
  ${profile.verified}, 
  ${profile.isBusinessAccount}, 
  '${profile.businessCategory || ''}', 
  '${profile.location || ''}', 
  '${profile.url || ''}', 
  NOW(), 
  '${profile.restId}'
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
  updated_at = NOW()
RETURNING id;
  `);
  console.log('========== END SIMULATION ==========\n');
  
  return { success: true };
}

// Main function
async function main() {
  try {
    // Fetch Twitter profile
    const result = await fetchTwitterProfile(TWITTER_HANDLE);
    
    if (!result.success) {
      console.error('Failed to fetch Twitter profile:', result.error);
      process.exit(1);
    }
    
    console.log('\nSuccessfully fetched Twitter profile data:');
    console.log(`Name: ${result.profile.name}`);
    console.log(`Followers: ${result.profile.followers.toLocaleString()}`);
    console.log(`Twitter Rest ID: ${result.profile.restId}`);
    
    // Simulate storing in database
    const storeResult = simulateStore(COMPANY_ID, result.profile);
    
    if (storeResult.success) {
      console.log('\nTwitter data enrichment simulation successful!');
      console.log('Rest ID successfully captured and would be stored in the database.');
      process.exit(0);
    } else {
      console.error('\nTwitter data enrichment simulation failed:', storeResult.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();