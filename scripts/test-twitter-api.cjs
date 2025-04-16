/**
 * Simple test script for the Twitter API using CommonJS syntax
 * 
 * Usage:
 * node scripts/test-twitter-api.cjs [username]
 */

// Using environment variable directly (already loaded in the Replit environment)
const API_KEY = process.env.X_RAPIDAPI_KEY;

// Make sure the API key is set
if (!API_KEY) {
  console.error('Error: X_RAPIDAPI_KEY environment variable is not set');
  process.exit(1);
}

console.log('API Key is available and ready to use');

// Get the Twitter handle from command line or use default
const username = process.argv[2] || 'Bondexapp';

console.log(`Testing Twitter API for @${username}`);

// API options
const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.X_RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
  }
};

// Make the API request
fetch(`https://twitter241.p.rapidapi.com/user?username=${username}`, options)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // Log the entire response for debugging
    console.log('API Response:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    if (data.errors) {
      console.error('API returned errors:', data.errors);
      throw new Error('Twitter API returned errors');
    }
    
    // The structure is different: data.result.data.user
    if (!data.result || !data.result.data || !data.result.data.user) {
      console.error('No user data found in response');
      throw new Error('Twitter API returned no user data');
    }
    
    const { result: { data: { user } } } = data;
    
    // Get user data from the correct path: user.result.legacy
    const userData = user.result || {};
    const legacy = userData.legacy || {};
    
    // Log legacy data for debugging
    console.log('User data structure:', Object.keys(userData));
    console.log('Legacy data structure:', Object.keys(legacy));
    
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
      verified: userData.is_blue_verified || legacy.verified || false,
      isBusinessAccount: userData.professional?.professional_type === 'Business',
      businessCategory: userData.professional?.category?.[0]?.name || null
    };
    
    console.log('Twitter API test successful! Profile details:');
    console.log(JSON.stringify(profile, null, 2));
    
    // Specifically highlight the image URL transformation
    console.log('\nProfile Image URL Transformation:');
    console.log(`Original URL: ${legacy.profile_image_url_https}`);
    console.log(`Transformed URL: ${profile.profileImageUrl}`);
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fetching Twitter profile:', error);
    process.exit(1);
  });