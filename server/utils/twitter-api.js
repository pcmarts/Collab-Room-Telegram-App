/**
 * Twitter API utilities for fetching profile data using RapidAPI Twitter241 endpoint
 * 
 * This module provides functions to fetch Twitter profile data which is used to
 * enrich company information in the application.
 */

// Using built-in fetch API from Node.js 18+
// No need to import fetch as it's globally available in Node.js 18+

/**
 * @typedef {Object} TwitterProfile
 * @property {string} username - Twitter handle without @ symbol
 * @property {string} name - Display name
 * @property {string} bio - Twitter bio/description
 * @property {number} followers - Number of followers
 * @property {number} following - Number of accounts following
 * @property {number} tweets - Total number of tweets
 * @property {string} profileImageUrl - Profile image URL (full-sized)
 * @property {string} bannerImageUrl - Profile banner/header image
 * @property {boolean} verified - If account is verified
 * @property {boolean} isBusinessAccount - If it's a business account
 * @property {string} businessCategory - Category of the business
 * @property {string} location - User's location
 * @property {string} url - Website link from profile
 * @property {string} createdAt - When the Twitter account was created
 * @property {Object} rawData - The complete raw response for future reference
 */

/**
 * Fetches Twitter profile data using the RapidAPI Twitter241 endpoint
 * 
 * @param {string} username - Twitter handle without @ symbol
 * @returns {Promise<TwitterProfile|null>} Twitter profile data or null if not found
 */
export async function getTwitterProfile(username) {
  try {
    // Clean the username (remove @ if present)
    username = username.replace(/^@/, '');
    
    console.log(`Fetching Twitter profile for @${username}`);
    
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.X_RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
      }
    };
    
    const response = await fetch(`https://twitter241.p.rapidapi.com/user?username=${username}`, options);
    
    if (!response.ok) {
      console.error(`Twitter API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check for errors in the response
    if (data.errors) {
      console.error('Twitter API returned errors:', data.errors);
      return null;
    }
    
    // The structure is: data.result.data.user.result
    if (!data.result || !data.result.data || !data.result.data.user || !data.result.data.user.result) {
      console.error('No user data found in response');
      return null;
    }
    
    const { result: { data: { user } } } = data;
    const userData = user.result || {};
    const legacy = userData.legacy || {};
    
    // Get profile image URL with safe handling
    let profileImageUrl = legacy.profile_image_url_https || '';
    if (profileImageUrl) {
      profileImageUrl = profileImageUrl.replace('_normal', '');
    }
    
    // Transform the response into our TwitterProfile structure
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
    
    console.log(`Successfully fetched profile for @${username}`);
    return profile;
  } catch (error) {
    console.error(`Error fetching Twitter profile for @${username}:`, error);
    return null;
  }
}

/**
 * Simple test function to verify the Twitter API is working
 * 
 * @param {string} username - Twitter handle to test with
 */
export async function testTwitterApi(username = 'Bondexapp') {
  try {
    console.log(`Testing Twitter API with @${username}`);
    const profile = await getTwitterProfile(username);
    
    if (profile) {
      console.log('Twitter API test successful. Profile details:');
      
      // Print formatted profile information
      const details = {
        'Username          ': profile.username,
        'Name              ': profile.name,
        'Twitter Rest ID   ': profile.restId || 'N/A',
        'Verified          ': profile.verified ? 'Yes' : 'No',
        'Business Account  ': profile.isBusinessAccount ? 'Yes' : 'No',
        'Business Category ': profile.businessCategory || 'N/A',
        'Bio               ': profile.bio,
        'Location          ': profile.location || 'N/A',
        'Website           ': profile.url || 'N/A',
        'Created At        ': profile.createdAt,
        'Followers         ': profile.followers.toLocaleString(),
        'Following         ': profile.following.toLocaleString(),
        'Tweets            ': profile.tweets.toLocaleString(),
        'profileImageUrl   ': profile.profileImageUrl,
        'bannerImageUrl    ': profile.bannerImageUrl || 'N/A'
      };
      
      for (const [key, value] of Object.entries(details)) {
        console.log(`${key}: ${value}`);
      }
      
      return true;
    } else {
      console.error('Twitter API test failed: No profile returned');
      return false;
    }
  } catch (error) {
    console.error('Twitter API test failed with error:', error);
    return false;
  }
}

// If this file is run directly, execute the test
if (require.main === module) {
  const testUsername = process.argv[2] || 'Bondexapp';
  testTwitterApi(testUsername).then(success => {
    process.exit(success ? 0 : 1);
  });
}