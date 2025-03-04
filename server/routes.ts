import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { users, companies, preferences } from "../shared/schema";
import { eq } from 'drizzle-orm';
import multer from 'multer';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from 'crypto';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: process.env.SUPABASE_URL,
  credentials: {
    accessKeyId: 'unused',
    secretAccessKey: process.env.SUPABASE_SERVICE_KEY || ''
  },
  region: 'unused'
});

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Logo upload endpoint
  app.post("/api/upload-logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const fileExtension = file.mimetype.split('/')[1];
      const fileName = `${randomUUID()}.${fileExtension}`;

      // Upload to Supabase Storage
      const command = new PutObjectCommand({
        Bucket: 'company-logos',
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Construct the public URL
      const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/company-logos/${fileName}`;

      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
    }
  });

  // Simple test endpoint that writes to database
  app.post("/api/onboarding", async (req, res) => {
    console.log('============ DEBUG: Test Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { first_name, last_name, linkedin_url, email, initData } = req.body;

      if (!first_name || !last_name) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse Telegram data
      console.log('Parsing Telegram data');
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id || !telegramUser.username) {
        console.error('No Telegram user ID or username found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Use Telegram username as handle
      const telegram_id = telegramUser.id.toString();
      const handle = telegramUser.username;

      // Check if user exists
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
      const { company_name, job_title, website, twitter_handle, linkedin_url, funding_stage, has_token, token_ticker, blockchain_networks, tags } = req.body;

      if (!company_name || !job_title || !website || !funding_stage) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      console.log('Parsing Telegram data:', initData);
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
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

        const companyData = {
          name: company_name,
          job_title,
          website,
          twitter_handle,
          linkedin_url,
          funding_stage,
          has_token: Boolean(has_token),
          token_ticker: has_token ? token_ticker : null,
          blockchain_networks: has_token ? blockchain_networks : [],
          tags: tags || []
        };

        console.log('Company data to save:', companyData);

        if (existingCompany.length > 0) {
          // Update existing company
          console.log('Updating existing company:', existingCompany[0]);
          [company] = await db.update(companies)
            .set(companyData)
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
          ...companyData
        });

        [company] = await db
          .insert(companies)
          .values({
            user_id: user.id,
            ...companyData
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
        throw new Error(`Failed to save company: ${dbError}`);
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
      const { collabs_to_discover, collabs_to_host, notification_frequency, excluded_tags } = req.body;

      if (!notification_frequency || !collabs_to_discover?.length || !collabs_to_host?.length) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      console.log('Parsing Telegram data:', initData);
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
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

        const preferencesData = {
          collabs_to_discover,
          collabs_to_host,
          notification_frequency,
          excluded_tags: excluded_tags || []
        };

        if (existingPreferences.length > 0) {
          // Update existing preferences
          console.log('Updating existing preferences:', existingPreferences[0]);
          [userPreferences] = await db.update(preferences)
            .set(preferencesData)
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
          ...preferencesData
        });

        [userPreferences] = await db
          .insert(preferences)
          .values({
            user_id: user.id,
            ...preferencesData
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
        throw new Error(`Failed to save preferences: ${dbError}`);
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