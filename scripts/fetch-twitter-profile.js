/**
 * Simple Twitter API test script
 * 
 * Usage: node scripts/fetch-twitter-profile.js [twitter_handle]
 * Example: node scripts/fetch-twitter-profile.js Bondexapp
 */

import https from 'https';

/**
 * Fetches Twitter user information using the Twitter241 RapidAPI
 * @param {string} username - Twitter handle without the @ symbol
 * @param {string} apiKey - The RapidAPI key
 * @returns {Promise<Object>} - Parsed user data
 */
function fetchTwitterUserInfo(username, apiKey) {
  return new Promise((resolve, reject) => {
    // Remove @ if present at the beginning
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    
    const options = {
      method: 'GET',
      hostname: 'twitter241.p.rapidapi.com',
      port: null,
      path: `/user?username=${encodeURIComponent(cleanUsername)}`,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'twitter241.p.rapidapi.com'
      }
    };

    console.log(`Fetching Twitter profile for: @${cleanUsername}`);
    
    const req = https.request(options, function (res) {
      const chunks = [];

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        const body = Buffer.concat(chunks);
        try {
          const parsedData = JSON.parse(body.toString());
          if (res.statusCode >= 400) {
            console.error(`Twitter API error: ${res.statusCode} - ${JSON.stringify(parsedData)}`);
            reject(new Error(`Twitter API error: ${res.statusCode}`));
            return;
          }
          
          console.log(`Successfully fetched Twitter profile for: @${cleanUsername}`);
          resolve(parsedData);
        } catch (error) {
          console.error(`Error parsing Twitter API response: ${error.message}`);
          reject(error);
        }
      });
    });

    req.on('error', function (error) {
      console.error(`Twitter API request error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

/**
 * Main function to run the script
 */
async function main() {
  // Get API key from environment variable
  const apiKey = process.env.X_RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('Error: X_RAPIDAPI_KEY environment variable is not set');
    console.error('Please set the API key before running this script');
    process.exit(1);
  }
  
  // Get Twitter handle from command line or use default
  const handle = process.argv[2] || 'Bondexapp';
  
  console.log(`\n=============================================`);
  console.log(`Testing Twitter API with handle: @${handle}`);
  console.log(`=============================================\n`);
  
  try {
    // Fetch the Twitter profile data
    const profileData = await fetchTwitterUserInfo(handle, apiKey);
    
    // Display the profile data in a formatted way
    console.log('\nProfile Data:');
    console.log('=============');
    
    if (profileData && profileData.result && profileData.result.data && profileData.result.data.user) {
      const user = profileData.result.data.user.result;
      const legacy = user.legacy;
      
      const importantFields = {
        'Username': legacy.screen_name,
        'Display Name': legacy.name,
        'Bio': legacy.description,
        'Location': legacy.location,
        'Followers': legacy.followers_count,
        'Following': legacy.friends_count,
        'Tweets': legacy.statuses_count,
        'Verified': user.is_blue_verified ? 'Yes (Blue)' : (legacy.verified ? 'Yes' : 'No'),
        'Business Type': user.professional?.professional_type || 'N/A',
        'Category': user.professional?.category?.[0]?.name || 'N/A',
        'Created At': legacy.created_at,
        'Profile Image': legacy.profile_image_url_https,
        'Banner Image': legacy.profile_banner_url,
        'Website': legacy.url
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
main().catch(console.error);