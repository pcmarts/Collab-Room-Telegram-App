import { db } from "../db";
import {
  users, notification_preferences, marketing_preferences, conference_preferences,
  type NotificationPreferences, type InsertNotificationPreferences,
  type MarketingPreferences, type InsertMarketingPreferences,
  type ConferencePreferences, type InsertConferencePreferences
} from "../../shared/schema";
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { storage } from "../storage"; // For getUserMarketingPreferences

/**
 * Gets the marketing preferences for a user.
 * @param userId - The user's ID.
 * @returns The user's marketing preferences, or undefined if not found.
 */
export async function getUserMarketingPreferences(userId: string): Promise<MarketingPreferences | undefined> {
  try {
    logger.debug('Getting marketing preferences for user:', userId);
    const preferences = await storage.getUserMarketingPreferences(userId);
    return preferences;
  } catch (error) {
    logger.error('Error getting marketing preferences:', { userId, error });
    throw new Error(`Failed to get marketing preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

interface PreferenceUpdateData {
  // Notification Prefs
  notifications_enabled?: boolean;
  notification_frequency?: string;
  // Marketing Prefs
  collabs_to_discover?: string[];
  collabs_to_host?: string[];
  filtered_marketing_topics?: string[];
  twitter_collabs?: string[];
  // Conference Prefs (assuming structure based on routes.ts)
  coffee_match_enabled?: boolean;
  coffee_match_company_sectors?: string[];
  coffee_match_company_followers?: string | null;
  coffee_match_user_followers?: string | null;
  coffee_match_funding_stages?: string[];
  coffee_match_token_status?: boolean;
  coffee_match_filter_company_sectors_enabled?: boolean;
  coffee_match_filter_company_followers_enabled?: boolean;
  coffee_match_filter_user_followers_enabled?: boolean;
  coffee_match_filter_funding_stages_enabled?: boolean;
  coffee_match_filter_token_status_enabled?: boolean;
}

/**
 * Updates or creates notification, marketing, and conference preferences for a user within a transaction.
 * @param userId - The internal database ID of the user.
 * @param prefsData - An object containing the preference fields to update.
 * @returns An object containing the updated/created preference records.
 * @throws Error if user not found or DB error occurs.
 */
export async function upsertUserPreferences(userId: string, prefsData: PreferenceUpdateData): Promise<{
  notificationPreferences: NotificationPreferences | null,
  marketingPreferences: MarketingPreferences | null,
  conferencePreferences: ConferencePreferences | null
}> {
  logger.debug('Upserting preferences for user:', { userId });

  try {
    const result = await db.transaction(async (tx) => {
      let updatedNotificationPrefs: NotificationPreferences | null = null;
      let updatedMarketingPrefs: MarketingPreferences | null = null;
      let updatedConferencePrefs: ConferencePreferences | null = null;

      // 1. Upsert Notification Preferences
      const notificationData: Partial<InsertNotificationPreferences> = {};
      if (prefsData.notification_frequency !== undefined) notificationData.notification_frequency = prefsData.notification_frequency;
      if (prefsData.notifications_enabled !== undefined) notificationData.notifications_enabled = prefsData.notifications_enabled;

      if (Object.keys(notificationData).length > 0) {
        const [existing] = await tx.select({ id: notification_preferences.id }).from(notification_preferences).where(eq(notification_preferences.user_id, userId));
        if (existing) {
          [updatedNotificationPrefs] = await tx.update(notification_preferences).set(notificationData).where(eq(notification_preferences.user_id, userId)).returning();
        } else {
          [updatedNotificationPrefs] = await tx.insert(notification_preferences).values({ ...notificationData, user_id: userId }).returning();
        }
        logger.debug('Upserted notification preferences:', updatedNotificationPrefs);
      }

      // 2. Upsert Marketing Preferences
      const marketingData: Partial<InsertMarketingPreferences> = {};
      if (prefsData.collabs_to_discover !== undefined) marketingData.collabs_to_discover = prefsData.collabs_to_discover;
      if (prefsData.collabs_to_host !== undefined) marketingData.collabs_to_host = prefsData.collabs_to_host;
      if (prefsData.filtered_marketing_topics !== undefined) marketingData.filtered_marketing_topics = prefsData.filtered_marketing_topics;
      if (prefsData.twitter_collabs !== undefined) marketingData.twitter_collabs = prefsData.twitter_collabs;
      // Add other marketing flags if they exist in prefsData (e.g., matchingEnabled)

      if (Object.keys(marketingData).length > 0) {
         const [existing] = await tx.select({ id: marketing_preferences.id }).from(marketing_preferences).where(eq(marketing_preferences.user_id, userId));
         if (existing) {
           [updatedMarketingPrefs] = await tx.update(marketing_preferences).set(marketingData).where(eq(marketing_preferences.user_id, userId)).returning();
         } else {
           [updatedMarketingPrefs] = await tx.insert(marketing_preferences).values({ ...marketingData, user_id: userId }).returning();
         }
         logger.debug('Upserted marketing preferences:', updatedMarketingPrefs);
      }

      // 3. Upsert Conference Preferences
      const conferenceData: Partial<InsertConferencePreferences> = {};
      if (prefsData.coffee_match_enabled !== undefined) conferenceData.coffee_match_enabled = prefsData.coffee_match_enabled;
      if (prefsData.coffee_match_company_sectors !== undefined) conferenceData.coffee_match_company_sectors = prefsData.coffee_match_company_sectors;
      if (prefsData.coffee_match_company_followers !== undefined) conferenceData.coffee_match_company_followers = prefsData.coffee_match_company_followers;
      if (prefsData.coffee_match_user_followers !== undefined) conferenceData.coffee_match_user_followers = prefsData.coffee_match_user_followers;
      if (prefsData.coffee_match_funding_stages !== undefined) conferenceData.coffee_match_funding_stages = prefsData.coffee_match_funding_stages;
      if (prefsData.coffee_match_token_status !== undefined) conferenceData.coffee_match_token_status = prefsData.coffee_match_token_status;
      if (prefsData.coffee_match_filter_company_sectors_enabled !== undefined) conferenceData.coffee_match_filter_company_sectors_enabled = prefsData.coffee_match_filter_company_sectors_enabled;
      if (prefsData.coffee_match_filter_company_followers_enabled !== undefined) conferenceData.coffee_match_filter_company_followers_enabled = prefsData.coffee_match_filter_company_followers_enabled;
      if (prefsData.coffee_match_filter_user_followers_enabled !== undefined) conferenceData.coffee_match_filter_user_followers_enabled = prefsData.coffee_match_filter_user_followers_enabled;
      if (prefsData.coffee_match_filter_funding_stages_enabled !== undefined) conferenceData.coffee_match_filter_funding_stages_enabled = prefsData.coffee_match_filter_funding_stages_enabled;
      if (prefsData.coffee_match_filter_token_status_enabled !== undefined) conferenceData.coffee_match_filter_token_status_enabled = prefsData.coffee_match_filter_token_status_enabled;

      if (Object.keys(conferenceData).length > 0) {
         const [existing] = await tx.select({ id: conference_preferences.id }).from(conference_preferences).where(eq(conference_preferences.user_id, userId));
         if (existing) {
           [updatedConferencePrefs] = await tx.update(conference_preferences).set(conferenceData).where(eq(conference_preferences.user_id, userId)).returning();
         } else {
           [updatedConferencePrefs] = await tx.insert(conference_preferences).values({ ...conferenceData, user_id: userId }).returning();
         }
         logger.debug('Upserted conference preferences:', updatedConferencePrefs);
      }

      // Fetch the potentially updated/created prefs again to return consistent state
      // Or return the results from the upsert operations directly
      const finalNotificationPrefs = await tx.select().from(notification_preferences).where(eq(notification_preferences.user_id, userId));
      const finalMarketingPrefs = await tx.select().from(marketing_preferences).where(eq(marketing_preferences.user_id, userId));
      const finalConferencePrefs = await tx.select().from(conference_preferences).where(eq(conference_preferences.user_id, userId));

      return {
        notificationPreferences: finalNotificationPrefs[0] || null,
        marketingPreferences: finalMarketingPrefs[0] || null,
        conferencePreferences: finalConferencePrefs[0] || null
      };
    });

    return result;

  } catch (error) {
    logger.error('Error upserting preferences in service:', { userId, error });
    throw new Error(`Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown DB error'}`);
  }
} 