/**
 * Direct test script for the Twitter API
 * This script directly tests the Twitter API functionality
 * 
 * Usage:
 * node scripts/direct-twitter-api-test.js [username]
 * 
 * Example:
 * node scripts/direct-twitter-api-test.js Bondexapp
 */

// Import required modules
// Using built-in fetch instead of node-fetch
import 'dotenv/config';

/**
 * Fetches Twitter profile data using the RapidAPI Twitter241 endpoint
 * 
 * @param {string} username - Twitter handle without @ symbol
 * @returns {Promise<Object|null>} Twitter profile data or null if not found
 */
async function getTwitterProfile(username) {
  try {
    // Clean the username (remove @ if present)
    username = username.replace(/^@/, '');
    
    console.log(`Fetching Twitter profile for @${username}`);
    
    if (!process.env.X_RAPIDAPI_KEY) {
      console.error('Error: X_RAPIDAPI_KEY environment variable is not set');
      process.exit(1);
    }
    
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
    if (data.errors || !data.data || !data.data.user) {
      console.error('Twitter API returned an error or no user data', data.errors || 'No user data');
      return null;
    }
    
    const { data: { user } } = data;
    const legacy = user.legacy || {};
    
    // Transform the response into our TwitterProfile structure
    const profile = {
      username: username,
      name: legacy.name,
      bio: legacy.description,
      followers: legacy.followers_count,
      following: legacy.friends_count,
      tweets: legacy.statuses_count,
      profileImageUrl: legacy.profile_image_url_https.replace('_normal', ''), // Get full-sized image
      bannerImageUrl: legacy.profile_banner_url,
      verified: user.is_blue_verified || legacy.verified || false,
      isBusinessAccount: user.professional?.professional_type === 'Business',
      businessCategory: user.professional?.category?.[0]?.name || null,
      location: legacy.location,
      url: legacy.entities?.url?.urls?.[0]?.expanded_url || legacy.url,
      createdAt: legacy.created_at
    };
    
    console.log(`Successfully fetched profile for @${username}`);
    return profile;
  } catch (error) {
    console.error(`Error fetching Twitter profile for @${username}:`, error);
    return null;
  }
}

/**
 * Main function to run the test
 */
async function main() {
  // Get username from command line argument, default to Bondexapp
  const username = process.argv[2] || 'Bondexapp';
  
  try {
    const profile = await getTwitterProfile(username);
    
    if (profile) {
      console.log('Twitter API test successful. Profile details:');
      
      // Print formatted profile information
      const details = {
        'Username          ': profile.username,
        'Name              ': profile.name,
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
      
      process.exit(0);
    } else {
      console.error('Twitter API test failed: No profile returned');
      process.exit(1);
    }
  } catch (error) {
    console.error('Twitter API test failed with error:', error);
    process.exit(1);
  }
}

// Run the main function
main();