import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { 
  users, companies, preferences, events, user_events, 
  collaborations, collab_applications, collab_notifications,
  createCollaborationSchema, applicationSchema
} from "../shared/schema";
import { eq, and, not, desc } from 'drizzle-orm';
import { sendApplicationConfirmation } from "./telegram";
import { storage } from "./storage";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/onboarding", async (req, res) => {
    console.log('============ DEBUG: Onboarding Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { 
        // User info
        first_name, last_name, linkedin_url, email, initData,
        // Company info
        company_name, company_website, twitter_handle, job_title, 
        funding_stage, has_token, token_ticker, blockchain_networks, tags,
        // Preferences
        collabs_to_discover, collabs_to_host, notification_frequency, excluded_tags
      } = req.body;

      // Parse Telegram data
      console.log('Parsing Telegram data');
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Use Telegram username as handle
      const telegram_id = telegramUser.id.toString();
      const handle = telegramUser.username;

      try {
        // Check if this is a profile update or full onboarding
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.telegram_id, telegram_id));

        const isProfileUpdate = existingUser.length > 0;

        // Validate required fields based on operation type
        if (!first_name) {
          console.error('Missing required user fields');
          return res.status(400).json({ error: 'First name is required' });
        }

        if (!isProfileUpdate && (!company_name || !job_title || !company_website || !funding_stage)) {
          console.error('Missing required company fields for new user');
          return res.status(400).json({ error: 'Missing required company fields' });
        }

        // Start a transaction
        const result = await db.transaction(async (tx) => {
          // 1. Create or update user
          const [user] = await tx
            .insert(users)
            .values({
              telegram_id,
              first_name,
              last_name,
              handle,
              linkedin_url,
              email,
              applied_at: new Date()
            })
            .onConflictDoUpdate({
              target: users.telegram_id,
              set: {
                first_name,
                last_name,
                handle,
                linkedin_url,
                email,
                applied_at: new Date()
              }
            })
            .returning();

          console.log('Created/Updated user:', user);

          // Only handle company and preferences for full onboarding
          if (!isProfileUpdate) {
            // 2. Create company record
            const [company] = await tx
              .insert(companies)
              .values({
                user_id: user.id,
                name: company_name,
                job_title,
                website: company_website,
                twitter_handle: twitter_handle?.replace('https://x.com/', '').replace('@', ''),
                funding_stage,
                has_token: Boolean(has_token),
                token_ticker: has_token ? token_ticker : null,
                blockchain_networks: has_token ? blockchain_networks : [],
                tags: tags || []
              })
              .returning();

            console.log('Created company:', company);

            // 3. Create preferences record
            const [userPreferences] = await tx
              .insert(preferences)
              .values({
                user_id: user.id,
                collabs_to_discover: collabs_to_discover || [],
                collabs_to_host: collabs_to_host || [],
                notification_frequency: notification_frequency || 'Daily',
                excluded_tags: excluded_tags || []
              })
              .returning();

            console.log('Created preferences:', userPreferences);

            return { user, company, preferences: userPreferences };
          }

          return { user };
        });

        // After successful transaction
        try {
          await sendApplicationConfirmation(parseInt(telegram_id));
        } catch (msgError) {
          console.error('Failed to send confirmation message:', msgError);
          // Don't throw here, as the application was still successful
        }

        res.json({
          success: true,
          message: isProfileUpdate ? 'Profile updated successfully' : 'Application submitted successfully',
          ...result
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save application data: ${dbError.message}`);
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
      const { 
        company_name, job_title, website, twitter_handle, linkedin_url, 
        funding_stage, has_token, token_ticker, blockchain_networks, tags,
        short_description, long_description 
      } = req.body;

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
          tags: tags || [],
          short_description,
          long_description
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
      let telegramUser;

      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '12345',
            username: 'test_user',
            first_name: 'Test',
            last_name: 'User'
          };
        } else {
          console.error('No Telegram init data found');
          return res.status(400).json({ error: 'Invalid Telegram data' });
        }
      } else {
        // Parse Telegram data
        const decodedInitData = new URLSearchParams(initData);
        telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      }

      if (!telegramUser?.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user and related data
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
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

  // Events endpoint
  app.get("/api/events", async (req, res) => {
    try {
      const allEvents = await db.select().from(events);
      res.json(allEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });
  
  // Create a new collaboration
  app.post("/api/collaborations", async (req, res) => {
    console.log('============ DEBUG: Create Collaboration Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      // Validate input using Zod schema
      const result = createCollaborationSchema.safeParse(req.body);
      if (!result.success) {
        console.error('Validation error:', result.error);
        return res.status(400).json({ 
          error: 'Invalid collaboration data', 
          details: result.error.format() 
        });
      }
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      
      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      // Prepare collaboration data
      const collabData = {
        creator_id: user.id,
        ...result.data
      };

      // Create the collaboration
      try {
        const newCollaboration = await storage.createCollaboration(collabData);
        res.status(201).json({
          success: true,
          collaboration: newCollaboration,
          message: 'Collaboration created successfully'
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to create collaboration: ${String(dbError)}`);
      }

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ 
        error: 'Server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get user's collaborations
  app.get("/api/collaborations/my", async (req, res) => {
    console.log('============ DEBUG: My Collaborations Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;

      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '12345',
            username: 'test_user',
            first_name: 'Test',
            last_name: 'User'
          };
        } else {
          console.error('No Telegram init data found');
          return res.status(400).json({ error: 'Invalid Telegram data' });
        }
      } else {
        // Parse Telegram data
        const decodedInitData = new URLSearchParams(initData);
        telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      }

      if (!telegramUser?.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get collaborations created by this user
      const collaborations = await storage.getUserCollaborations(user.id);
      res.json(collaborations);

    } catch (error) {
      console.error('Failed to fetch user collaborations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collaborations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Search collaborations
  app.get("/api/collaborations/search", async (req, res) => {
    console.log('============ DEBUG: Search Collaborations Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);

    try {
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;

      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '12345',
            username: 'test_user',
            first_name: 'Test',
            last_name: 'User'
          };
        } else {
          console.error('No Telegram init data found');
          return res.status(400).json({ error: 'Invalid Telegram data' });
        }
      } else {
        // Parse Telegram data
        const decodedInitData = new URLSearchParams(initData);
        telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      }

      if (!telegramUser?.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Parse filters from query params
      const filters = {
        collabTypes: req.query.collabTypes ? (req.query.collabTypes as string).split(',') : undefined,
        companyTags: req.query.companyTags ? (req.query.companyTags as string).split(',') : undefined,
        minCompanyFollowers: req.query.minCompanyFollowers as string | undefined,
        minUserFollowers: req.query.minUserFollowers as string | undefined,
        hasToken: req.query.hasToken ? req.query.hasToken === 'true' : undefined,
        fundingStages: req.query.fundingStages ? (req.query.fundingStages as string).split(',') : undefined
      };

      // Get filtered collaborations
      const collaborations = await storage.searchCollaborations(user.id, filters);
      res.json(collaborations);

    } catch (error) {
      console.error('Failed to search collaborations:', error);
      res.status(500).json({ 
        error: 'Failed to search collaborations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Update application status (approve/reject)
  app.patch("/api/collaborations/applications/:id", async (req, res) => {
    console.log('============ DEBUG: Update Application Status Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);
    console.log('Body:', req.body);

    try {
      const { id } = req.params;
      const { status, message } = req.body;
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      
      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the application
      const [application] = await db.select()
        .from(collab_applications)
        .where(eq(collab_applications.id, id));
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Get the collaboration to check permissions
      const [collaboration] = await db.select()
        .from(collaborations)
        .where(eq(collaborations.id, application.collaboration_id));
      
      if (!collaboration) {
        return res.status(404).json({ error: 'Collaboration not found' });
      }

      // Check if user is the owner of the collaboration
      if (collaboration.creator_id !== user.id) {
        return res.status(403).json({ error: 'You are not authorized to update this application' });
      }

      // Update application status
      try {
        const updatedApplication = await storage.updateApplicationStatus(id, status);
        
        // Get applicant details
        const [applicant] = await db.select()
          .from(users)
          .where(eq(users.id, application.applicant_id));
        
        if (applicant) {
          // Create notification for the applicant
          await storage.createNotification({
            user_id: applicant.id,
            type: `application_${status}`,
            content: `Your application for "${collaboration.title}" has been ${status}`,
            collaboration_id: collaboration.id,
            application_id: application.id,
            is_read: false,
            is_sent: false,
            created_at: new Date()
          });
          
          // Send message via Telegram bot (optional implementation)
          // This would call the appropriate method in telegram.ts
          // await sendApplicationStatusUpdate(applicant.telegram_id, status, collaboration.title);
        }

        res.json({
          success: true,
          application: updatedApplication,
          message: `Application ${status} successfully`
        });
      } catch (err) {
        console.error('Database error:', err);
        throw new Error(`Failed to update application status: ${String(err)}`);
      }

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ 
        error: 'Server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Apply to a collaboration
  app.post("/api/collaborations/:id/apply", async (req, res) => {
    console.log('============ DEBUG: Apply to Collaboration Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);
    console.log('Body:', req.body);

    try {
      const { id } = req.params;
      
      // Validate application data
      const result = applicationSchema.safeParse(req.body);
      if (!result.success) {
        console.error('Validation error:', result.error);
        return res.status(400).json({ 
          error: 'Invalid application data', 
          details: result.error.format() 
        });
      }
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      
      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if the collaboration exists
      const collaboration = await storage.getCollaboration(id);
      if (!collaboration) {
        return res.status(404).json({ error: 'Collaboration not found' });
      }

      // Check if user is applying to their own collaboration
      if (collaboration.creator_id === user.id) {
        return res.status(400).json({ error: 'You cannot apply to your own collaboration' });
      }

      // Prepare application data
      const applicationData = {
        collaboration_id: id,
        applicant_id: user.id,
        status: 'pending',
        application_data: result.data,
        notes: req.body.notes || '',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Submit the application
      try {
        const application = await storage.applyToCollaboration(applicationData);
        
        // Create notification for collaboration creator
        await storage.createNotification({
          user_id: collaboration.creator_id,
          type: 'new_application',
          content: `${user.first_name} ${user.last_name || ''} applied to your ${collaboration.title} collaboration`,
          collaboration_id: collaboration.id,
          application_id: application.id,
          is_read: false,
          is_sent: false,
          created_at: new Date()
        });

        res.status(201).json({
          success: true,
          application,
          message: 'Application submitted successfully'
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to submit application: ${String(dbError)}`);
      }

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ 
        error: 'Server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // User events endpoint
  app.get("/api/user-events", async (req, res) => {
    try {
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');

      if (!telegramUser.id) {
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's event attendance
      const userEventAttendance = await db.select()
        .from(user_events)
        .where(eq(user_events.user_id, user.id));

      res.json(userEventAttendance);

    } catch (error) {
      console.error('Failed to fetch user events:', error);
      res.status(500).json({ error: 'Failed to fetch user events' });
    }
  });

  // Get user notifications
  app.get("/api/notifications", async (req, res) => {
    console.log('============ DEBUG: User Notifications Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;

      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '12345',
            username: 'test_user',
            first_name: 'Test',
            last_name: 'User'
          };
        } else {
          console.error('No Telegram init data found');
          return res.status(400).json({ error: 'Invalid Telegram data' });
        }
      } else {
        // Parse Telegram data
        const decodedInitData = new URLSearchParams(initData);
        telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      }

      if (!telegramUser?.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's notifications
      const notifications = await storage.getUserNotifications(user.id);
      res.json(notifications);

    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      res.status(500).json({ 
        error: 'Failed to fetch notifications', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    console.log('============ DEBUG: Mark Notification Read Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);

    try {
      const { id } = req.params;
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      
      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the notification
      const [notification] = await db.select()
        .from(collab_notifications)
        .where(eq(collab_notifications.id, id));
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Check if user owns this notification
      if (notification.user_id !== user.id) {
        return res.status(403).json({ error: 'You are not authorized to update this notification' });
      }

      // Mark notification as read
      const updatedNotification = await storage.markNotificationAsRead(id);
      
      res.json({
        success: true,
        notification: updatedNotification,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ 
        error: 'Server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Toggle user event attendance
  app.post("/api/user-events", async (req, res) => {
    try {
      const { event_id } = req.body;

      if (!event_id) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');

      if (!telegramUser.id) {
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is already attending this event
      const [existingAttendance] = await db.select()
        .from(user_events)
        .where(eq(user_events.user_id, user.id))
        .where(eq(user_events.event_id, event_id));

      if (existingAttendance) {
        // Remove attendance if exists
        await db.delete(user_events)
          .where(eq(user_events.id, existingAttendance.id));
      } else {
        // Add new attendance
        await db.insert(user_events)
          .values({
            user_id: user.id,
            event_id
          });
      }

      res.json({ success: true });

    } catch (error) {
      console.error('Failed to toggle event attendance:', error);
      res.status(500).json({ error: 'Failed to update event attendance' });
    }
  });

  return httpServer;
}