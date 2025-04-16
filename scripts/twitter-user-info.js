const https = require('https');

/**
 * Fetches Twitter user information using the Twitter241 RapidAPI
 * @param {string} username - Twitter handle without the @ symbol
 * @param {string} apiKey - The RapidAPI key
 * @returns {Promise<Object>} - Parsed user data
 */
function fetchTwitterUserInfo(username, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: 'twitter241.p.rapidapi.com',
      port: null,
      path: `/user?username=${encodeURIComponent(username)}`,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'twitter241.p.rapidapi.com'
      }
    };

    const req = https.request(options, function (res) {
      const chunks = [];

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        const body = Buffer.concat(chunks);
        try {
          const parsedData = JSON.parse(body.toString());
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', function (error) {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
}

/**
 * Main function to run the script
 */
async function main() {
  // Check if there's a RapidAPI key in the environment
  const apiKey = process.env.X_RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('Error: X_RAPIDAPI_KEY environment variable is not set');
    console.error('Please set the API key before running this script');
    process.exit(1);
  }
  
  const username = process.argv[2] || 'Bondexapp';
  
  console.log(`Fetching Twitter info for: @${username}`);
  try {
    const userData = await fetchTwitterUserInfo(username, apiKey);
    console.log(JSON.stringify(userData, null, 2));
  } catch (error) {
    console.error('Failed to fetch Twitter user data:', error);
  }
}

// Run the script
main().catch(console.error);