import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { users, preferences, companies } from "../shared/schema";
import { bot } from "./telegram";
import { eq } from "drizzle-orm";
import { onboardingSchema } from "../shared/schema";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Profile endpoint
  app.get("/api/profile", async (req, res) => {
    try {
      const telegramInitData = req.query.initData as string;

      if (!telegramInitData) {
        res.status(400).json({ error: 'Missing Telegram initialization data' });
        return;
      }

      const decodedInitData = new URLSearchParams(telegramInitData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');

      if (!telegramUser.id) {
        res.status(400).json({ error: 'Invalid user data' });
        return;
      }

      // Get user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get company data
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.user_id, user.id));

      // Get preferences
      const [userPreferences] = await db
        .select()
        .from(preferences)
        .where(eq(preferences.user_id, user.id));

      res.json({
        user,
        company,
        preferences: userPreferences
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Companies endpoints
  app.get("/api/companies", async (_req, res) => {
    try {
      const companies = await db.query.companies.findMany();
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/companies", async (req, res) => {
    const validation = insertCompanySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const [company] = await db
        .insert(companies)
        .values(validation.data)
        .returning();
      res.json(company);
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Collaborations endpoints with better error logging
  app.get("/api/collaborations", async (_req, res) => {
    try {
      console.log('Starting collaborations fetch...');
      // Simplified query without relations for now
      const result = await db
        .select()
        .from(collaborations);

      console.log('Collaborations fetched successfully:', result);
      res.json(result);
    } catch (error) {
      console.error('Detailed error in collaborations fetch:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  app.post("/api/collaborations", async (req, res) => {
    try {
      console.log('Creating new collaboration:', req.body);
      const validation = insertCollaborationSchema.safeParse(req.body);

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        res.status(400).json({ error: validation.error });
        return;
      }

      const [collaboration] = await db
        .insert(collaborations)
        .values(validation.data)
        .returning();

      console.log('Collaboration created:', collaboration);

      res.json(collaboration);
    } catch (error) {
      console.error('Error creating collaboration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Onboarding endpoint with detailed logging
  app.post("/api/onboarding", async (req, res) => {
    console.log('============ DEBUG: Onboarding Request Started ============');
    console.log('Request body:', req.body);

    try {
      // Step 1: Validate request data
      console.log('Step 1: Validating request data');
      const validation = onboardingSchema.safeParse(req.body);

      if (!validation.success) {
        console.error('Validation failed:', validation.error);
        return res.status(400).json({ 
          error: 'Invalid data provided',
          details: validation.error.errors 
        });
      }

      const {
        first_name,
        last_name,
        handle,
        linkedin_url,
        company_name,
        company_website,
        twitter_handle,
        company_category,
        company_size,
        collabs_to_discover,
        collabs_to_host,
        notification_frequency,
        initData
      } = validation.data;

      // Step 2: Parse and validate Telegram data
      console.log('Step 2: Parsing Telegram data');
      console.log('initData:', initData);

      try {
        const decodedInitData = new URLSearchParams(initData);
        const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
        console.log('Decoded Telegram user:', telegramUser);

        if (!telegramUser.id) {
          return res.status(400).json({ error: 'Invalid Telegram user data' });
        }

        // Step 3: Create user
        console.log('Step 3: Creating user');
        const userData = {
          telegram_id: telegramUser.id.toString(),
          first_name,
          last_name,
          handle,
          linkedin_url
        };
        console.log('User data:', userData);

        const [user] = await db.insert(users)
          .values(userData)
          .returning();
        console.log('Created user:', user);

        // Step 4: Create company
        console.log('Step 4: Creating company');
        const companyData = {
          name: company_name,
          user_id: user.id,
          website: company_website,
          category: company_category,
          size: company_size,
          twitter_handle
        };
        console.log('Company data:', companyData);

        await db.insert(companies)
          .values(companyData);

        // Step 5: Create preferences
        console.log('Step 5: Creating preferences');
        const preferencesData = {
          user_id: user.id,
          collabs_to_discover,
          collabs_to_host,
          notification_frequency
        };
        console.log('Preferences data:', preferencesData);

        await db.insert(preferences)
          .values(preferencesData);

        console.log('Successfully completed onboarding process');
        res.json({ success: true });

      } catch (telegramError) {
        console.error('Error processing Telegram data:', telegramError);
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

    } catch (error) {
      console.error('Onboarding error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      console.log('============ DEBUG: Onboarding Request Ended ============');
    }
  });

  return httpServer;
}