/**
 * Direct Twitter API Test
 * This script tests the Twitter API functionality directly without relying on the server.
 * 
 * Run with:
 * export X_RAPIDAPI_KEY=$(printenv X_RAPIDAPI_KEY) && node scripts/direct-twitter-api-test.js [handle]
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
 * Process and extract meaningful data from the Twitter API response
 * @param {Object} data - Raw API response
 * @returns {Object} - Processed data
 */
function processTwitterResponse(data) {
  if (!data?.result?.data?.user?.result) {
    console.error('Invalid or unexpected Twitter API response format');
    return null;
  }
  
  const user = data.result.data.user.result;
  const legacy = user.legacy;
  
  // Extract only the necessary data we need
  return {
    username: legacy.screen_name,
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
    const rawData = await fetchTwitterUserInfo(handle, apiKey);
    
    // Process the data
    const profileData = processTwitterResponse(rawData);
    
    if (profileData) {
      console.log('\nProcessed Twitter Profile:');
      console.log('=========================');
      
      // Display in a nice format
      Object.entries(profileData).forEach(([key, value]) => {
        console.log(`${key.padEnd(20)}: ${value}`);
      });
    } else {
      console.log('Failed to process Twitter profile data');
    }
  } catch (error) {
    console.error('\nERROR: Failed to fetch Twitter profile:');
    console.error(error);
  }
}

// Run the test
main().catch(console.error);