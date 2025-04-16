/**
 * Test script for Twitter API integration
 * 
 * This script tests the Twitter API integration with the RapidAPI Twitter241 service.
 * It fetches profile data for a given Twitter handle.
 * 
 * Run with:
 * node scripts/test-twitter-api.js [twitter_handle]
 */

const { fetchTwitterUserInfo } = require('../server/utils/twitter-api');

async function testTwitterAPI() {
  // Get Twitter handle from command line or use default
  const handle = process.argv[2] || 'Bondexapp';
  
  console.log(`\n=============================================`);
  console.log(`Testing Twitter API with handle: @${handle}`);
  console.log(`=============================================\n`);
  
  try {
    // Make sure we have the API key
    if (!process.env.X_RAPIDAPI_KEY) {
      console.error('ERROR: X_RAPIDAPI_KEY environment variable not set!');
      console.error('Please set this environment variable and try again.');
      process.exit(1);
    }
    
    // Fetch the Twitter profile data
    console.log(`Fetching data for @${handle}...`);
    const profileData = await fetchTwitterUserInfo(handle);
    
    // Display the profile data in a formatted way
    console.log('\nProfile Data:');
    console.log('=============');
    
    if (profileData) {
      const importantFields = {
        'Username': profileData.username || profileData.screen_name,
        'Display Name': profileData.name,
        'Bio': profileData.description,
        'Location': profileData.location,
        'Followers': profileData.followers_count,
        'Following': profileData.friends_count,
        'Tweets': profileData.statuses_count,
        'Verified': profileData.verified ? 'Yes' : 'No',
        'Created At': profileData.created_at,
        'Profile Image': profileData.profile_image_url_https,
        'Website': profileData.url
      };
      
      Object.entries(importantFields).forEach(([key, value]) => {
        if (value !== undefined) {
          console.log(`${key.padEnd(15)}: ${value}`);
        }
      });
      
      // Print the full JSON for reference
      console.log('\nFull JSON Response:');
      console.log('==================');
      console.log(JSON.stringify(profileData, null, 2));
    } else {
      console.log('No profile data received or an error occurred.');
    }
  } catch (error) {
    console.error('\nERROR: Failed to fetch Twitter profile:');
    console.error(error);
  }
}

// Run the test
testTwitterAPI().catch(console.error);