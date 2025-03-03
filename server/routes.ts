import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { users, companies, preferences } from "../shared/schema";
import { eq } from 'drizzle-orm';

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Simple test endpoint that writes to database
  app.post("/api/onboarding", async (req, res) => {
    console.log('============ DEBUG: Test Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { first_name, last_name, handle, linkedin_url, email, initData } = req.body;

      if (!first_name || !last_name || !handle) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse Telegram data
      console.log('Parsing Telegram data');
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Check if user exists
      const telegram_id = telegramUser.id.toString();
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegram_id));

      try {
        let user;

        if (existingUser.length > 0) {
          // Update existing user
          console.log('Updating existing user:', existingUser[0]);
          [user] = await db.update(users)
            .set({
              first_name,
              last_name,
              handle,
              linkedin_url,
              email
            })
            .where(eq(users.telegram_id, telegram_id))
            .returning();

          console.log('Updated user:', user);
          return res.json({
            success: true,
            user,
            message: 'User updated successfully'
          });
        }

        // Create new user
        console.log('Creating new user with data:', {
          telegram_id,
          first_name,
          last_name,
          handle,
          linkedin_url,
          email
        });

        [user] = await db
          .insert(users)
          .values({
            telegram_id,
            first_name,
            last_name,
            handle,
            linkedin_url,
            email
          })
          .returning();

        console.log('Created user:', user);

        res.json({
          success: true,
          user,
          message: 'User created successfully'
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save user: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Company information endpoint
  app.post("/api/company", async (req, res) => {
    console.log('============ DEBUG: Company Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { company_name, job_title, website, twitter_handle, linkedin_url, initData } = req.body;

      if (!company_name || !job_title || !website) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse Telegram data to get user
      console.log('Parsing Telegram data');
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      try {
        // Check if company exists for this user
        const existingCompany = await db.select()
          .from(companies)
          .where(eq(companies.user_id, user.id));

        let company;

        if (existingCompany.length > 0) {
          // Update existing company
          console.log('Updating existing company:', existingCompany[0]);
          [company] = await db.update(companies)
            .set({
              name: company_name,
              job_title,
              website,
              twitter_handle,
              linkedin_url
            })
            .where(eq(companies.user_id, user.id))
            .returning();

          console.log('Updated company:', company);
          return res.json({
            success: true,
            company,
            message: 'Company information updated successfully'
          });
        }

        // Create new company
        console.log('Creating new company with data:', {
          user_id: user.id,
          name: company_name,
          job_title,
          website,
          twitter_handle,
          linkedin_url
        });

        [company] = await db
          .insert(companies)
          .values({
            user_id: user.id,
            name: company_name,
            job_title,
            website,
            twitter_handle,
            linkedin_url
          })
          .returning();

        console.log('Created company:', company);

        res.json({
          success: true,
          company,
          message: 'Company information saved successfully'
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save company: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Preferences endpoint
  app.post("/api/preferences", async (req, res) => {
    console.log('============ DEBUG: Preferences Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { collabs_to_discover, collabs_to_host, notification_frequency, initData } = req.body;

      if (!notification_frequency || !collabs_to_discover?.length || !collabs_to_host?.length) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse Telegram data to get user
      console.log('Parsing Telegram data');
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      try {
        // Check if preferences exist for this user
        const existingPreferences = await db.select()
          .from(preferences)
          .where(eq(preferences.user_id, user.id));

        let userPreferences;

        if (existingPreferences.length > 0) {
          // Update existing preferences
          console.log('Updating existing preferences:', existingPreferences[0]);
          [userPreferences] = await db.update(preferences)
            .set({
              collabs_to_discover,
              collabs_to_host,
              notification_frequency
            })
            .where(eq(preferences.user_id, user.id))
            .returning();

          console.log('Updated preferences:', userPreferences);
          return res.json({
            success: true,
            preferences: userPreferences,
            message: 'Preferences updated successfully'
          });
        }

        // Create new preferences
        console.log('Creating new preferences with data:', {
          user_id: user.id,
          collabs_to_discover,
          collabs_to_host,
          notification_frequency
        });

        [userPreferences] = await db
          .insert(preferences)
          .values({
            user_id: user.id,
            collabs_to_discover,
            collabs_to_host,
            notification_frequency
          })
          .returning();

        console.log('Created preferences:', userPreferences);

        res.json({
          success: true,
          preferences: userPreferences,
          message: 'Preferences saved successfully'
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save preferences: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Profile endpoint
  app.get("/api/profile", async (req, res) => {
    console.log('============ DEBUG: Profile Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user and related data
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      // Get company info
      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.user_id, user.id));

      // Get preferences
      const [userPreferences] = await db.select()
        .from(preferences)
        .where(eq(preferences.user_id, user.id));

      res.json({
        user,
        company,
        preferences: userPreferences
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile data' });
    }
  });

  return httpServer;
}