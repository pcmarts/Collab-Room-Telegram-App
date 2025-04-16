import { Router, Request, Response } from 'express';
import { getTwitterProfile } from '../utils/twitter-api';
import { logger } from '../utils/logger';

// Create a new router instance
const router = Router();

/**
 * Fetch Twitter profile information for a given handle
 * 
 * @route GET /api/twitter/profile/:username
 * @param {string} username - Twitter handle without @ symbol
 * @returns {Object} - Twitter profile data
 */
router.get("/profile/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Twitter username is required' 
      });
    }
    
    // Remove @ if present
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    
    logger.info(`Fetching Twitter profile for: ${cleanUsername}`);
    const profileData = await getTwitterProfile(cleanUsername);
    
    if (!profileData) {
      return res.status(404).json({ 
        success: false,
        error: 'Could not fetch Twitter profile or user not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: profileData
    });
    
  } catch (error) {
    logger.error(`Error fetching Twitter profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Twitter profile data' 
    });
  }
});

export default router;