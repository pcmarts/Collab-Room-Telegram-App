/**
 * Test script to enrich company Twitter data
 * 
 * This is a simplified version using CommonJS format for better compatibility
 * Run with:
 * node scripts/test-twitter-enrichment.cjs
 */

// Environment variables are already available

// Check if API key is available
if (!process.env.X_RAPIDAPI_KEY) {
  console.error('Error: X_RAPIDAPI_KEY environment variable is missing');
  process.exit(1);
}

// API request options
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.X_RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
  }
};

// Function to fetch Twitter profile (using built-in fetch)
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
    };
    
    console.log('\nProfile data extracted:');
    console.log(`Name: ${profile.name}`);
    console.log(`Username: @${profile.username}`);
    console.log(`Bio: ${profile.bio}`);
    console.log(`Followers: ${profile.followers}`);
    console.log(`Following: ${profile.following}`);
    console.log(`Tweets: ${profile.tweets}`);
    console.log(`Profile Image: ${profile.profileImageUrl}`);
    console.log(`Verified: ${profile.verified}`);
    console.log(`Business Account: ${profile.isBusinessAccount}`);
    console.log(`Category: ${profile.businessCategory || 'N/A'}`);
    console.log(`Location: ${profile.location || 'N/A'}`);
    console.log(`URL: ${profile.url || 'N/A'}`);
    console.log(`Created At: ${profile.createdAt}`);
    console.log(`REST ID: ${profile.restId}`);
    
    return { success: true, profile };
  } catch (error) {
    console.error(`Error fetching Twitter profile for @${username}:`, error);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    // Test handles to fetch
    const handles = ['Bondexapp', 'twitter'];
    
    console.log('Starting Twitter profile test...');
    
    for (const handle of handles) {
      console.log(`\n========== Testing @${handle} ==========`);
      const result = await fetchTwitterProfile(handle);
      
      if (result.success) {
        console.log(`Successfully fetched Twitter profile for @${handle}`);
        // The profile data is already logged in the fetchTwitterProfile function
      } else {
        console.error(`Failed to fetch Twitter profile for @${handle}: ${result.error}`);
      }
      
      // Add a short delay to avoid rate limits
      if (handle !== handles[handles.length - 1]) {
        console.log('Waiting 2 seconds before next request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  });