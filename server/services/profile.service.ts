import { db } from "../db";
import {
  users, companies, notification_preferences, marketing_preferences, conference_preferences,
  type User, type InsertUser, type Company, type InsertCompany,
  type NotificationPreferences, type InsertNotificationPreferences,
  type MarketingPreferences, type InsertMarketingPreferences,
  type ConferencePreferences, type InsertConferencePreferences
} from "../../shared/schema";
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { notifyAdminsNewUser } from "../telegram"; // Assuming telegram functions might be needed

interface TelegramUser {
  id: string;
  username?: string;
  first_name: string;
  last_name?: string;
  cachedAt?: number; // Keep for potential use if passing full object
}

/**
 * Fetches the complete user profile including user data, company data, and preferences.
 * @param userId - The internal database ID of the user.
 * @param session - The session object for checking impersonation.
 * @returns The combined profile data.
 * @throws Error if user not found or DB error occurs.
 */
export async function getUserProfile(userId: string, session: any): Promise<any> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error("User not found");
    }

    const [company] = await db.select().from(companies).where(eq(companies.user_id, user.id));
    const [notificationPreferences] = await db.select().from(notification_preferences).where(eq(notification_preferences.user_id, user.id));
    const [marketingPreferences] = await db.select().from(marketing_preferences).where(eq(marketing_preferences.user_id, user.id));
    const [conferencePreferences] = await db.select().from(conference_preferences).where(eq(conference_preferences.user_id, user.id));

    // Log notification preference state for debugging
    if (notificationPreferences) {
      logger.debug('Notification Preferences Found:', notificationPreferences);
    } else {
      logger.debug('No notification preferences found for user', { userId });
    }

    return {
      user,
      company: company || null,
      notificationPreferences: notificationPreferences || null,
      marketingPreferences: marketingPreferences || null,
      conferencePreferences: conferencePreferences || null,
      preferences: notificationPreferences || {}, // Backward compatibility
      impersonating: session?.impersonating ? { originalUser: session.impersonating.originalUser } : null
    };
  } catch (error) {
    logger.error('Error fetching profile in service:', { userId, error });
    throw error; // Re-throw for the route handler
  }
}

/**
 * Creates or updates company information for a given user.
 * @param userId - The internal database ID of the user.
 * @param companyData - The company data from the request body.
 * @returns The created or updated company record.
 * @throws Error if user not found or DB error occurs.
 */
export async function upsertUserCompany(userId: string, companyData: Omit<InsertCompany, 'user_id'>): Promise<Company> {
  try {
    const [existingCompany] = await db.select().from(companies).where(eq(companies.user_id, userId));

    let company: Company;

    if (existingCompany) {
      logger.debug('Updating existing company for user:', { userId });
      [company] = await db.update(companies)
        .set(companyData)
        .where(eq(companies.user_id, userId))
        .returning();
    } else {
      logger.debug('Creating new company for user:', { userId });
      [company] = await db.insert(companies)
        .values({ ...companyData, user_id: userId })
        .returning();
    }

    if (!company) {
      throw new Error("Failed to save company information.");
    }
    logger.debug('Company upsert successful:', { companyId: company.id });
    return company;
  } catch (error) {
    logger.error('Error upserting company in service:', { userId, error });
    throw error; // Re-throw for the route handler
  }
}

/**
 * Handles the user onboarding process, creating/updating user, company, and preferences.
 * This combines logic from the original /api/onboarding endpoint.
 * @param telegramUser - The validated Telegram user object.
 * @param onboardingData - The onboarding data from the request body.
 * @returns The created or updated user record.
 * @throws Error if validation fails or DB error occurs.
 */
export async function handleOnboarding(telegramUser: TelegramUser, onboardingData: any): Promise<{ user: User, isProfileUpdate: boolean }> {
  const {
    first_name, last_name, linkedin_url, email, twitter_url, twitter_followers,
    referral_code,
    company_name, company_website, twitter_handle, job_title,
    funding_stage, has_token, token_ticker, blockchain_networks, tags,
    company_linkedin_url, company_twitter_followers,
    collabs_to_host, notification_frequency, filtered_marketing_topics,
    // Assume other preference fields might be here too
  } = onboardingData;

  // Basic validation
  if (!first_name) {
    throw new Error('First name is required');
  }

  try {
    const [existingUser] = await db.select().from(users).where(eq(users.telegram_id, telegramUser.id.toString()));
    const isProfileUpdate = !!existingUser;

    logger.debug('Handling onboarding:', { telegramUserId: telegramUser.id, isProfileUpdate });

    const result = await db.transaction(async (tx) => {
      let user: User;

      // 1. Upsert User
      if (isProfileUpdate) {
        logger.debug('Updating user during onboarding:', { userId: existingUser.id });
        [user] = await tx.update(users).set({
          first_name,
          last_name,
          linkedin_url,
          email,
          twitter_url,
          twitter_followers,
          referral_code,
          updated_at: new Date(),
        }).where(eq(users.id, existingUser.id)).returning();
      } else {
        const handle = telegramUser.username || `user_${telegramUser.id.toString().substring(0, 8)}`;
        logger.debug('Creating new user during onboarding:', { telegramUserId: telegramUser.id, handle });
        [user] = await tx.insert(users).values({
          telegram_id: telegramUser.id.toString(),
          handle,
          first_name,
          last_name,
          linkedin_url,
          email,
          twitter_url,
          twitter_followers,
          referral_code,
          applied_at: new Date(),
          // is_approved defaults to false
        }).returning();
      }

      if (!user) {
        throw new Error('Failed to update/create user during onboarding transaction');
      }

      // 2. Create Company and Preferences *only* if it's a new user
      if (!isProfileUpdate) {
        logger.debug('Creating initial company and preferences for new user:', { userId: user.id });
        if (!company_name || !job_title || !company_website || !funding_stage) {
          throw new Error('Missing required company fields for new user during onboarding');
        }

        // Create Company
        await tx.insert(companies).values({
          user_id: user.id,
          name: company_name,
          job_title,
          website: company_website,
          twitter_handle,
          twitter_followers: company_twitter_followers,
          linkedin_url: company_linkedin_url,
          funding_stage,
          has_token: Boolean(has_token),
          token_ticker: has_token ? token_ticker : null,
          blockchain_networks: has_token ? blockchain_networks : [],
          tags: tags || []
        });

        // Create Notification Preferences
        await tx.insert(notification_preferences).values({
          user_id: user.id,
          notifications_enabled: true,
          notification_frequency: notification_frequency || 'Daily'
        });

        // Create Marketing Preferences (with defaults)
        await tx.insert(marketing_preferences).values({
          user_id: user.id,
          collabs_to_discover: [
             'Co-Marketing on Twitter', 'Podcast Guest Appearance', 'Twitter Spaces Guest',
             'Live Stream Guest Appearance', 'Report & Research Feature', 'Newsletter Feature',
             'Blog Post Feature', 'Thread Collab', 'Joint Campaign', 'Giveaway',
             'Retweet & Boost', 'Sponsored Tweet', 'Poll/Q&A', 'Shoutout',
             'Tweet Swap', 'Meme/Viral Collab', 'Twitter List Collab', 'Exclusive Announcement'
          ],
          collabs_to_host: collabs_to_host || [],
          filtered_marketing_topics: filtered_marketing_topics || [],
          matchingEnabled: true, // Default
          filter_company_sectors_enabled: true, // Default
          filter_company_followers_enabled: true, // Default
          filter_user_followers_enabled: true, // Default
          filter_funding_stages_enabled: true, // Default
          filter_token_status_enabled: true // Default
        });

        // Create Conference Preferences (with defaults)
        await tx.insert(conference_preferences).values({
          user_id: user.id,
          coffee_match_enabled: false // Default
          // Add other coffee match defaults if needed
        });
        logger.debug('Initial preferences created for user:', { userId: user.id });
      }

      return { user }; // Return only the user from the transaction
    });

    // Post-transaction: Notify admins if it was a new user
    if (!isProfileUpdate && result.user) {
      try {
        const [company] = await db.select().from(companies).where(eq(companies.user_id, result.user.id));
        if (company) {
          await notifyAdminsNewUser({
            telegram_id: result.user.telegram_id,
            first_name: result.user.first_name,
            last_name: result.user.last_name || undefined,
            handle: result.user.handle,
            company_name: company.name,
            company_website: company.website || undefined,
            job_title: company.job_title
          });
          logger.info('Admin notification sent for new user application', { userId: result.user.id });
        } else {
          logger.warn('Could not find company data for admin notification after onboarding', { userId: result.user.id });
        }
      } catch (notifyError) {
        logger.error('Failed to send admin notification after onboarding', { userId: result.user.id, error: notifyError });
        // Log error but don't fail the overall request
      }
    }

    return { user: result.user, isProfileUpdate };

  } catch (error) {
    logger.error('Error in onboarding service:', { telegramUserId: telegramUser.id, error });
    throw error; // Re-throw for the route handler
  }
} 