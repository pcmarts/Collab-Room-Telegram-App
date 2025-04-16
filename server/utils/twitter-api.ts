/**
 * Twitter API Utilities
 * 
 * This module provides functions to interact with the Twitter API via RapidAPI.
 */

import https from 'https';
import { logger } from './logger';

/**
 * Fetches Twitter user information using the Twitter241 RapidAPI
 * @param {string} username - Twitter handle with or without @ symbol
 * @returns {Promise<Object>} - Parsed user data
 */
async function fetchTwitterUserInfo(username: string): Promise<any> {
  // Get API key from environment variable
  const apiKey = process.env.X_RAPIDAPI_KEY;
  
  if (!apiKey) {
    throw new Error('X_RAPIDAPI_KEY environment variable is not set');
  }
  
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
    
    logger.debug(`Making Twitter API request for username: ${cleanUsername}`);
    
    const req = https.request(options, function (res) {
      const chunks: Buffer[] = [];

      res.on('data', function (chunk) {
        chunks.push(chunk);
      });

      res.on('end', function () {
        const body = Buffer.concat(chunks);
        try {
          const parsedData = JSON.parse(body.toString());
          if (res.statusCode && res.statusCode >= 400) {
            logger.error(`Twitter API error: ${res.statusCode} - ${JSON.stringify(parsedData)}`);
            reject(new Error(`Twitter API error: ${res.statusCode}`));
            return;
          }
          
          logger.debug(`Successfully received Twitter profile data for: ${cleanUsername}`);
          resolve(parsedData);
        } catch (error) {
          logger.error(`Error parsing Twitter API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
          reject(error);
        }
      });
    });

    req.on('error', function (error) {
      logger.error(`Twitter API request error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reject(error);
    });

    req.end();
  });
}

interface TwitterProfile {
  username: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  tweets: number;
  profileImageUrl: string;
  bannerImageUrl?: string;
  verified: boolean;
  isBusinessAccount: boolean;
  businessCategory: string | null;
  location: string | null;
  url: string | null;
  createdAt: string;
  rawData?: any;
}

/**
 * Get essential Twitter profile data for a given username
 * @param {string} username - Twitter handle with or without @ symbol
 * @returns {Promise<TwitterProfile | null>} - Essential profile data or null if error
 */
async function getTwitterProfile(username: string): Promise<TwitterProfile | null> {
  try {
    const userData = await fetchTwitterUserInfo(username);
    
    // Check if we have valid data structure
    if (!userData?.result?.data?.user?.result) {
      logger.error(`Invalid or unexpected Twitter API response format for ${username}`);
      return null;
    }
    
    const user = userData.result.data.user.result;
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
      createdAt: legacy.created_at,
      // Raw data for any additional processing
      rawData: userData
    };
  } catch (error) {
    logger.error(`Failed to get Twitter profile for ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

export {
  fetchTwitterUserInfo,
  getTwitterProfile,
  type TwitterProfile
};