import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { users, userPreferences, companies, collaborations } from "../shared/schema";
import { bot } from "./telegram";
import { eq } from "drizzle-orm";
import { insertCollaborationSchema, insertCompanySchema, onboardingSchema } from "../shared/schema";

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
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.user_id, user.id));

      res.json({
        user,
        company,
        preferences
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

  // Onboarding endpoint
  app.post("/api/onboarding", async (req, res) => {
    try {
      console.log('Received onboarding request:', req.body);

      const validation = onboardingSchema.safeParse(req.body);

      if (!validation.success) {
        console.log('Validation failed:', validation.error);
        res.status(400).json({ error: validation.error });
        return;
      }

      const {
        first_name,
        last_name,
        telegram_handle,
        linkedin_url,
        email,
        company_name,
        job_title,
        company_website,
        twitter_handle,
        company_linkedin,
        company_telegram,
        company_category,
        company_size,
        funding_stage,
        geographic_focus,
        collabs_to_discover,
        collabs_to_host,
        notification_frequency,
        additional_opportunities,
        initData
      } = validation.data;

      // Parse the initData to get user information
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');

      if (!telegramUser.id) {
        res.status(400).json({ error: 'Invalid user data' });
        return;
      }

      // Start a transaction
      const [user] = await db.insert(users).values({
        telegram_id: telegramUser.id.toString(),
        first_name,
        last_name,
        handle: telegram_handle,
        linkedin_url,
        email
      }).returning();

      console.log('Created user:', user);

      await db.insert(companies).values({
        name: company_name,
        user_id: user.id,
        website: company_website,
        category: company_category,
        size: company_size,
        funding_stage,
        geographic_focus,
        twitter_handle,
        linkedin_url: company_linkedin,
        telegram_group: company_telegram
      });

      await db.insert(userPreferences).values({
        user_id: user.id,
        collabs_to_discover,
        collabs_to_host,
        notification_frequency,
        additional_opportunities
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error in onboarding:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return httpServer;
}