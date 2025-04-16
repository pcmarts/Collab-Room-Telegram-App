/**
 * Simplified Twitter API routes for The Collab Room
 * 
 * This file contains stub implementations for Twitter-related functionality:
 * - GET /api/twitter/profile/:username - Returns a stub response
 * - GET /api/twitter/company/:id - Returns a stub response
 * - GET /api/twitter/refresh-company/:id - Returns a stub response
 * 
 * Note: These routes return stub responses to maintain compatibility with the frontend
 * while avoiding any actual Twitter API calls or database enrichment processes.
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/twitter/profile/:username
 * Returns a stub response for Twitter profile
 */
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ 
        error: 'Missing Twitter username' 
      });
    }
    
    // Return a stub profile response
    res.json({
      success: true,
      profile: {
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
        restId: "stub-id"
      }
    });
  } catch (error) {
    console.error('Error in /api/twitter/profile/:username:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Twitter profile' 
    });
  }
});

/**
 * GET /api/twitter/company/:id
 * Returns a stub response for company Twitter data
 */
router.get('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Missing company ID' 
      });
    }
    
    // Return a stub response
    res.json({
      success: true,
      twitter_data: {
        id: "stub-twitter-data-id",
        company_id: id,
        username: "company",
        name: "Company Name",
        bio: "This is a stub Twitter data response. Twitter integration is disabled.",
        followers_count: 0,
        following_count: 0,
        tweet_count: 0,
        profile_image_url: "",
        banner_image_url: "",
        is_verified: false,
        is_business_account: false,
        business_category: null,
        location: "",
        website_url: "",
        created_at: new Date().toISOString(),
        twitter_created_at: new Date().toISOString(),
        rest_id: "stub-rest-id",
        last_fetched_at: new Date().toISOString(),
        twitter_handle: "company"
      }
    });
  } catch (error) {
    console.error('Error in /api/twitter/company/:id:', error);
    res.status(500).json({ 
      error: 'Failed to fetch company Twitter data' 
    });
  }
});

/**
 * GET /api/twitter/refresh-company/:id
 * Returns a stub response for refreshing company Twitter data
 */
router.get('/refresh-company/:id', async (req, res) => {
  try {
    // Check for admin user
    if (!req.session?.user?.is_admin) {
      return res.status(403).json({ 
        error: 'Admin access required' 
      });
    }
    
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Missing company ID' 
      });
    }
    
    // Return a stub response
    res.json({
      success: true,
      message: `Twitter integration is disabled. No actual refresh performed for company ID ${id}`,
      profile: {
        username: "company",
        name: "Company Name",
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
        url: ""
      }
    });
  } catch (error) {
    console.error('Error in /api/twitter/refresh-company/:id:', error);
    res.status(500).json({ 
      error: 'Failed to refresh company Twitter data' 
    });
  }
});

export default router;