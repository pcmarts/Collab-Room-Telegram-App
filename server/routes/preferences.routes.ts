import { Router, type Request, type Response } from "express";
import { upsertUserPreferences, getUserMarketingPreferences } from "../services/preferences.service";
import { authLimiter } from '../middleware/rate-limiter';
import { db } from "../db"; // Needed for user lookup
import { users } from "../../shared/schema"; // Needed for user lookup
import { eq } from 'drizzle-orm'; // Needed for user lookup
import { logger } from '../utils/logger';
import { getTelegramUserFromRequest } from "../utils/auth.utils"; // Import from new location
import { storage } from "../storage"; // Import storage for direct access to preferences

const preferencesRouter = Router();

/**
 * POST /api/preferences
 * Updates the preferences for the current user.
 */
preferencesRouter.post("/preferences", authLimiter, async (req: Request, res: Response) => {
  logger.debug('Preferences update request received');
  const userId = req.userId; // Use userId attached by global middleware
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' }); // Add check
  try {
    // Basic validation (can be enhanced with Zod)
    const { notification_frequency } = req.body;
    if (!notification_frequency) {
       return res.status(400).json({ error: 'Missing required field: notification_frequency' });
    }

    const prefsData = req.body; // Pass the whole body to the service
    const result = await upsertUserPreferences(userId, prefsData);

    return res.json({
      success: true,
      preferences: result.notificationPreferences, // For backward compatibility
      notificationPreferences: result.notificationPreferences,
      marketingPreferences: result.marketingPreferences,
      conferencePreferences: result.conferencePreferences,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Error in /api/preferences route:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update preferences" });
  }
});

/**
 * GET /api/marketing-preferences
 * Get marketing preferences for the current user.
 */
preferencesRouter.get("/marketing-preferences", async (req: Request, res: Response) => {
  logger.debug('Marketing preferences request received');
  const userId = req.userId; // Use userId attached by global middleware
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  
  try {
    const marketingPreferences = await getUserMarketingPreferences(userId);
    return res.json(marketingPreferences || {});
  } catch (error) {
    logger.error('Error in GET /api/marketing-preferences route:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get marketing preferences" });
  }
});

/**
 * POST /api/marketing-preferences
 * Updates the marketing preferences for the current user.
 */
preferencesRouter.post("/marketing-preferences", authLimiter, async (req: Request, res: Response) => {
  logger.debug('Marketing preferences update request received');
  const userId = req.userId; // Use userId attached by global middleware
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  
  try {
    const marketingData = req.body;
    logger.debug('Received marketing preferences data:', marketingData);
    
    // Extract marketing preferences fields
    const {
      collabs_to_discover,
      collabs_to_host,
      filtered_marketing_topics,
      twitter_collabs,
      company_twitter_followers,
      twitter_followers,
      funding_stage,
      company_has_token,
      company_token_ticker,
      company_blockchain_networks,
      company_tags,
      discovery_filter_enabled,
      discovery_filter_collab_types_enabled,
      discovery_filter_topics_enabled,
      discovery_filter_company_followers_enabled,
      discovery_filter_user_followers_enabled,
      discovery_filter_funding_stages_enabled,
      discovery_filter_token_status_enabled,
      discovery_filter_company_sectors_enabled,
      discovery_filter_blockchain_networks_enabled,
    } = marketingData;
    
    // Pass the fields directly to the service
    const result = await upsertUserPreferences(userId, { 
      collabs_to_discover,
      collabs_to_host,
      filtered_marketing_topics,
      twitter_collabs,
      // Other marketing-related fields from the request
    });
    
    // Update the rest of marketing preferences directly using storage
    if (result.marketingPreferences?.id) {
      await storage.updateUserMarketingPreferences(userId, marketingData);
    }
    
    // Get the updated marketing preferences
    const updatedPrefs = await storage.getUserMarketingPreferences(userId);
    
    return res.json({
      success: true,
      ...updatedPrefs,
      message: 'Marketing preferences updated successfully'
    });
  } catch (error) {
    logger.error('Error in POST /api/marketing-preferences route:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update marketing preferences" });
  }
});

export default preferencesRouter; 