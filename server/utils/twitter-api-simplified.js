/**
 * Simplified Twitter API utilities for The Collab Room
 * 
 * This module provides stub implementations for Twitter profile data functions
 * to maintain compatibility with the rest of the application while disabling
 * actual API calls.
 */

/**
 * Returns a stub Twitter profile data object
 * 
 * @param {string} username - Twitter handle without @ symbol
 * @returns {Object|null} Stub Twitter profile data 
 */
export async function getTwitterProfile(username) {
  try {
    // Clean the username (remove @ if present)
    username = username.replace(/^@/, '');
    
    console.log(`Twitter API disabled. Returning stub profile for @${username}`);
    
    // Return a stub profile with minimal data
    return {
      username: username,
      name: "Twitter User",
      bio: "This is a stub profile response. Twitter integration is disabled.",
      followers: 0,
      following: 0,
      tweets: 0,
      profileImageUrl: "",
      bannerImageUrl: "",
      verified: false,
      isBusinessAccount: false,
      businessCategory: null,
      location: "",
      url: "",
      createdAt: new Date().toISOString(),
      restId: "stub-rest-id",
      rawData: { message: "Twitter integration is disabled" }
    };
  } catch (error) {
    console.error(`Error creating stub Twitter profile for @${username}:`, error);
    return null;
  }
}

/**
 * Test function that returns success without making actual API calls
 * 
 * @param {string} username - Twitter handle to test with
 * @returns {boolean} Always returns true
 */
export async function testTwitterApi(username = 'test') {
  console.log(`Twitter API testing is disabled. Using stub implementation for @${username}`);
  return true;
}