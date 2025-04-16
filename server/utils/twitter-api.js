const https = require('https');
const { logger } = require('./logger');

/**
 * Fetches Twitter user information using the Twitter241 RapidAPI
 * @param {string} username - Twitter handle without the @ symbol
 * @returns {Promise<Object>} - Parsed user data
 */
function fetchTwitterUserInfo(username) {
  return new Promise((resolve, reject) => {
    // Remove @ if present at the beginning
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    
    const options = {
      method: 'GET',
      hostname: 'twitter241.p.rapidapi.com',
      port: null,
      path: `/user?username=${encodeURIComponent(cleanUsername)}`,
      headers: {
        'x-rapidapi-key': process.env.X_RAPIDAPI_KEY,
        'x-rapidapi-host': 'twitter241.p.rapidapi.com'
      }
    };

    logger.info(`Fetching Twitter profile for: @${cleanUsername}`);
    
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
            logger.error(`Twitter API error: ${res.statusCode} - ${JSON.stringify(parsedData)}`);
            reject(new Error(`Twitter API error: ${res.statusCode}`));
            return;
          }
          
          logger.info(`Successfully fetched Twitter profile for: @${cleanUsername}`);
          resolve(parsedData);
        } catch (error) {
          logger.error(`Error parsing Twitter API response: ${error.message}`);
          reject(error);
        }
      });
    });

    req.on('error', function (error) {
      logger.error(`Twitter API request error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

/**
 * Get essential Twitter profile data for a given username
 * @param {string} username - Twitter handle with or without @ symbol
 * @returns {Promise<Object>} - Essential profile data or null if error
 */
async function getTwitterProfile(username) {
  try {
    const userData = await fetchTwitterUserInfo(username);
    
    // Extract only the necessary data we need
    return {
      username: userData.screen_name || userData.username,
      name: userData.name,
      bio: userData.description,
      followers: userData.followers_count,
      following: userData.friends_count,
      profileImageUrl: userData.profile_image_url_https,
      verified: userData.verified || false,
      location: userData.location,
      url: userData.url,
      createdAt: userData.created_at,
      // Add any other fields you might need
    };
  } catch (error) {
    logger.error(`Failed to get Twitter profile for ${username}: ${error.message}`);
    return null;
  }
}

module.exports = {
  fetchTwitterUserInfo,
  getTwitterProfile
};