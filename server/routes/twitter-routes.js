/**
 * Twitter API routes for The Collab Room
 * 
 * This file contains routes for Twitter-related functionality:
 * - GET /api/twitter/profile/:username - Get a Twitter profile by username
 * - GET /api/twitter/company/:id - Get Twitter data for a specific company
 */

import express from 'express';
import { getTwitterProfile } from '../utils/twitter-api.js';
import { sql } from '@neondatabase/serverless';

const router = express.Router();

/**
 * GET /api/twitter/profile/:username
 * Fetches a Twitter profile by username
 */
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ 
        error: 'Missing Twitter username' 
      });
    }
    
    const profile = await getTwitterProfile(username);
    
    if (!profile) {
      return res.status(404).json({ 
        error: `Twitter profile not found for @${username}` 
      });
    }
    
    // Remove the raw data before sending to client
    const { rawData, ...cleanProfile } = profile;
    
    res.json({
      success: true,
      profile: cleanProfile
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
 * Fetches Twitter data for a specific company
 */
router.get('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Missing company ID' 
      });
    }
    
    // Get the company Twitter data
    const query = `
      SELECT 
        ctd.*,
        c.twitter_handle
      FROM 
        company_twitter_data ctd
      JOIN 
        companies c ON ctd.company_id = c.id
      WHERE 
        c.id = $1
    `;
    
    const result = await sql.unsafe(query, [id]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ 
        error: `Twitter data not found for company ID ${id}` 
      });
    }
    
    const twitterData = result.rows[0];
    
    // Remove the raw data before sending to client
    delete twitterData.raw_data;
    
    res.json({
      success: true,
      twitter_data: twitterData
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
 * Refreshes Twitter data for a company from the Twitter API
 * Requires admin access
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
    
    // Get the company Twitter handle
    const companyQuery = `
      SELECT id, twitter_handle 
      FROM companies 
      WHERE id = $1
    `;
    
    const companyResult = await sql.unsafe(companyQuery, [id]);
    
    if (!companyResult.rows || companyResult.rows.length === 0) {
      return res.status(404).json({ 
        error: `Company not found with ID ${id}` 
      });
    }
    
    const { twitter_handle } = companyResult.rows[0];
    
    if (!twitter_handle) {
      return res.status(400).json({ 
        error: 'Company does not have a Twitter handle' 
      });
    }
    
    // Fetch fresh Twitter data
    const handle = twitter_handle.replace(/^@/, ''); // Remove @ if present
    const profile = await getTwitterProfile(handle);
    
    if (!profile) {
      return res.status(404).json({ 
        error: `Twitter profile not found for @${handle}` 
      });
    }
    
    // Store updated Twitter data
    const updateQuery = `
      INSERT INTO company_twitter_data (
        company_id, 
        username, 
        name, 
        bio, 
        followers, 
        following, 
        tweets, 
        profile_image_url, 
        banner_image_url, 
        verified, 
        is_business_account, 
        business_category, 
        location, 
        website_url, 
        created_at,
        rest_id,
        raw_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      ON CONFLICT (company_id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        bio = EXCLUDED.bio,
        followers = EXCLUDED.followers,
        following = EXCLUDED.following,
        tweets = EXCLUDED.tweets,
        profile_image_url = EXCLUDED.profile_image_url,
        banner_image_url = EXCLUDED.banner_image_url,
        verified = EXCLUDED.verified,
        is_business_account = EXCLUDED.is_business_account,
        business_category = EXCLUDED.business_category,
        location = EXCLUDED.location,
        website_url = EXCLUDED.website_url,
        rest_id = EXCLUDED.rest_id,
        raw_data = EXCLUDED.raw_data,
        updated_at = NOW()
      RETURNING id;
    `;
    
    const values = [
      id,
      profile.username,
      profile.name,
      profile.bio,
      profile.followers,
      profile.following,
      profile.tweets,
      profile.profileImageUrl,
      profile.bannerImageUrl,
      profile.verified,
      profile.isBusinessAccount,
      profile.businessCategory,
      profile.location,
      profile.url,
      new Date(), // current timestamp
      profile.restId, // Twitter API rest_id for account
      JSON.stringify(profile.rawData)
    ];
    
    const updateResult = await sql.unsafe(updateQuery, values);
    
    if (!updateResult.rows || updateResult.rows.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to update Twitter data' 
      });
    }
    
    // Return success with the updated profile
    const { rawData, ...cleanProfile } = profile;
    
    res.json({
      success: true,
      message: `Successfully refreshed Twitter data for company ID ${id}`,
      profile: cleanProfile
    });
  } catch (error) {
    console.error('Error in /api/twitter/refresh-company/:id:', error);
    res.status(500).json({ 
      error: 'Failed to refresh company Twitter data' 
    });
  }
});

export default router;