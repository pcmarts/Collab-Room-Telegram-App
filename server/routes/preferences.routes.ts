import { Router, type Request, type Response } from "express";
import { upsertUserPreferences } from "../services/preferences.service";
import { authLimiter } from '../middleware/rate-limiter';
import { db } from "../db"; // Needed for user lookup
import { users } from "../../shared/schema"; // Needed for user lookup
import { eq } from 'drizzle-orm'; // Needed for user lookup
import { logger } from '../utils/logger';
import { getTelegramUserFromRequest } from "../utils/auth.utils"; // Import from new location

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

export default preferencesRouter; 