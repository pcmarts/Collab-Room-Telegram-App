import type { Express, Request } from "express";
import { createServer } from "http";
import { db } from "./db";
import { 
  users, companies, preferences, events, user_events, 
  collaborations, collab_applications, collab_notifications,
  createCollaborationSchema, applicationSchema, collabApplicationSchema,
  InsertCollaboration
} from "../shared/schema";
import { eq, and, not, desc } from 'drizzle-orm';
import { sendApplicationConfirmation } from "./telegram";
import { storage } from "./storage";

// Helper function to extract Telegram user data from request
function getTelegramUserFromRequest(req: Request) {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      console.log('No Telegram init data in headers, using development fallback');
      if (process.env.NODE_ENV !== 'production') {
        return {
          id: process.env.DEV_USER_ID || '8319c02a-f1bd-4f93-abc3-e223c9100bea',
          username: 'dev_user',
          first_name: 'Dev',
          last_name: 'User'
        };
      }
      return null;
    }
    
    // Parse Telegram data
    const decodedInitData = new URLSearchParams(initData);
    const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
    
    if (!telegramUser.id) {
      console.error('No Telegram user ID found in parsed data');
      return null;
    }
    
    return telegramUser;
  } catch (error) {
    console.error('Error parsing Telegram data:', error);
    return null;
  }
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/onboarding", async (req, res) => {
    console.log('============ DEBUG: Onboarding Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { 
        // User info
        first_name, last_name, linkedin_url, email, initData, twitter_url, twitter_followers,
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
              twitter_url,
              twitter_followers,
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
                twitter_url,
                twitter_followers,
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
        // Only send confirmation for new users, not for profile updates
        if (!isProfileUpdate) {
          try {
            await sendApplicationConfirmation(parseInt(telegram_id));
          } catch (msgError) {
            console.error('Failed to send confirmation message:', msgError);
            // Don't throw here, as the application was still successful
          }
        }

        res.json({
          success: true,
          message: isProfileUpdate ? 'Profile updated successfully' : 'Application submitted successfully',
          ...result
        });

      } catch (dbError: unknown) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save application data: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
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
        company_name, job_title, website, twitter_handle, twitter_followers, linkedin_url, 
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
          twitter_followers,
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
      const { 
        collabs_to_discover, 
        collabs_to_host, 
        notification_frequency, 
        excluded_tags,
        // Twitter specific collabs
        twitter_collabs,
        // Coffee match preferences
        coffee_match_enabled,
        coffee_match_company_sectors,
        coffee_match_company_followers,
        coffee_match_user_followers,
        coffee_match_funding_stages,
        coffee_match_token_status
      } = req.body;

      if (!notification_frequency) {
        console.error('Missing required field: notification_frequency');
        return res.status(400).json({ error: 'Missing required field: notification_frequency' });
      }
      
      // Make arrays optional - use empty arrays if not provided
      const collab_discover = Array.isArray(collabs_to_discover) ? collabs_to_discover : [];
      const collab_host = Array.isArray(collabs_to_host) ? collabs_to_host : [];
      const excluded = Array.isArray(excluded_tags) ? excluded_tags : [];
      const company_sectors = Array.isArray(coffee_match_company_sectors) ? coffee_match_company_sectors : [];
      const funding_stages = Array.isArray(coffee_match_funding_stages) ? coffee_match_funding_stages : [];

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
          collabs_to_discover: collab_discover,
          collabs_to_host: collab_host,
          notification_frequency,
          excluded_tags: excluded,
          // Twitter specific preferences
          twitter_collabs: Array.isArray(twitter_collabs) ? twitter_collabs : [],
          // Include coffee match preferences
          coffee_match_enabled: coffee_match_enabled === true,
          coffee_match_company_sectors: company_sectors,
          coffee_match_company_followers: coffee_match_company_followers || null,
          coffee_match_user_followers: coffee_match_user_followers || null,
          coffee_match_funding_stages: funding_stages,
          coffee_match_token_status: coffee_match_token_status === true
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
            id: '1211030693',
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
  
  // Endpoint to fetch user's applications
  app.get("/api/my-applications", async (req, res) => {
    try {
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;

      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '1211030693',
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

      // Get user from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get user's applications
      const userApplications = await storage.getUserApplications(user.id);
      
      // We need to join collaboration data to each application
      const applicationsWithCollabData = await Promise.all(
        userApplications.map(async (app) => {
          const collab = await storage.getCollaboration(app.collaboration_id);
          return {
            ...app,
            collaboration: collab
          };
        })
      );

      res.json(applicationsWithCollabData);
    } catch (error) {
      console.error('Failed to fetch user applications:', error);
      res.status(500).json({ error: 'Failed to fetch applications' });
    }
  });
  
  // Update a collaboration directly (alternative to PATCH)
  app.post("/api/collaborations/update", async (req, res) => {
    console.log('============ DEBUG: Direct Collaboration Update Endpoint ============');
    console.log('Body:', req.body);
    
    try {
      const updateData = req.body;
      const id = updateData.id;
      
      if (!id) {
        return res.status(400).json({ error: 'Collaboration ID is required' });
      }
      
      // Get Telegram user ID from request
      const telegramData = getTelegramUserFromRequest(req);
      const telegramId = telegramData?.id?.toString() || process.env.DEV_USER_ID || '';
      console.log(`Telegram ID: ${telegramId} attempting to update collaboration: ${id}`);
      
      // First, get the actual user from the database using telegram_id
      const [dbUser] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramId));
      
      if (!dbUser) {
        console.log('User not found with telegramId:', telegramId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userId = dbUser.id; // This is the UUID from the database
      console.log(`Found user with ID: ${userId}`);
      
      // Verify the collaboration exists and belongs to the user
      const existingCollab = await db.select()
        .from(collaborations)
        .where(and(eq(collaborations.id, id), eq(collaborations.creator_id, userId)))
        .limit(1);
      
      if (!existingCollab.length) {
        console.log('Collaboration not found or does not belong to the user');
        return res.status(404).json({ error: 'Collaboration not found or you do not have permission to update it' });
      }
      
      // Clean up data for update 
      delete updateData.id; // Prevent updating ID
      delete updateData.creator_id; // Prevent updating creator
      
      // Handle date conversion - these timestamps might be strings from the client
      if (updateData.created_at && typeof updateData.created_at === 'string') {
        delete updateData.created_at; // Don't update creation timestamp
      }
      
      // Convert specific_date if needed
      if (updateData.specific_date && typeof updateData.specific_date === 'string') {
        // Keep as string, it's already in the correct format
      }
      
      // Remove any string timestamps that should be dates
      if (updateData.updated_at && typeof updateData.updated_at === 'string') {
        delete updateData.updated_at;
      }
      
      // Ensure nested details fields are properly set
      // If details is coming as a string, parse it
      if (typeof updateData.details === 'string') {
        try {
          updateData.details = JSON.parse(updateData.details);
        } catch (e) {
          console.error('Error parsing details JSON:', e);
        }
      }
      
      // Ensure key filtering fields are properly set 
      console.log('Handling special fields:');
      
      // Process host_follower_count (could be in details object)
      if (updateData.details && updateData.details.host_follower_count) {
        console.log('Found host_follower_count in details:', updateData.details.host_follower_count);
      }
      
      // Process min_company_followers
      if (updateData.min_company_followers) {
        console.log('Found min_company_followers:', updateData.min_company_followers);
      }
      
      // Process min_user_followers
      if (updateData.min_user_followers) {
        console.log('Found min_user_followers:', updateData.min_user_followers);
      }
      
      // Process required_funding_stages
      if (updateData.required_funding_stages) {
        console.log('Found required_funding_stages:', updateData.required_funding_stages);
        // Ensure it's an array
        if (typeof updateData.required_funding_stages === 'string') {
          try {
            updateData.required_funding_stages = JSON.parse(updateData.required_funding_stages);
          } catch (e) {
            console.error('Error parsing required_funding_stages:', e);
          }
        }
      }
      
      // Process required_company_sectors
      if (updateData.required_company_sectors) {
        console.log('Found required_company_sectors:', updateData.required_company_sectors);
        // Ensure it's an array
        if (typeof updateData.required_company_sectors === 'string') {
          try {
            updateData.required_company_sectors = JSON.parse(updateData.required_company_sectors);
          } catch (e) {
            console.error('Error parsing required_company_sectors:', e);
          }
        }
      }
      
      // Set fresh updated timestamp
      updateData.updated_at = new Date();
      
      // Better detailed logging
      console.log('=== DETAILED UPDATE DATA DEBUG ===');
      console.log('1. Original data received:', JSON.stringify(req.body, null, 2));
      console.log('2. Type of details object:', typeof updateData.details);
      
      // Log specific nested fields we're concerned about
      if (updateData.details && typeof updateData.details === 'object') {
        console.log('3. Nested details fields:');
        console.log('   - collaboration_types:', JSON.stringify(updateData.details.collaboration_types));
        console.log('   - host_follower_count:', updateData.details.host_follower_count);
        console.log('   - host_twitter_handle:', updateData.details.host_twitter_handle);
      }
      
      console.log('4. Other important fields:');
      console.log('   - required_company_sectors:', JSON.stringify(updateData.required_company_sectors));
      console.log('   - required_funding_stages:', JSON.stringify(updateData.required_funding_stages));
      console.log('   - min_company_followers:', updateData.min_company_followers);
      console.log('   - min_user_followers:', updateData.min_user_followers);
      
      console.log('5. Cleaned update data:', JSON.stringify(updateData, null, 2));
      console.log('=== END DEBUG ===');
      
      // Update the collaboration
      const [updatedCollab] = await db.update(collaborations)
        .set(updateData)
        .where(eq(collaborations.id, id))
        .returning();
      
      console.log(`Successfully updated collaboration ${id}`);
      return res.status(200).json(updatedCollab);
    } catch (error) {
      console.error('Error updating collaboration:', error);
      return res.status(500).json({ error: 'Failed to update collaboration' });
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

      // Prepare collaboration data from validated input
      // We need to create a properly typed object for the database
      const validatedData = result.data;
      
      // Create plain JavaScript object with all data
      // This bypasses TypeScript's typing to avoid errors with array fields
      const collabData = {
        creator_id: user.id,
        collab_type: validatedData.collab_type,
        title: validatedData.title,
        description: validatedData.description,
        date_type: validatedData.date_type,
        specific_date: validatedData.specific_date,
        is_free_collab: validatedData.is_free_collab,
        required_token_status: validatedData.required_token_status || false,
        min_company_followers: validatedData.min_company_followers || null,
        min_user_followers: validatedData.min_user_followers || null,
        details: validatedData.details,
        // Convert arrays to ensure they're string arrays
        topics: validatedData.topics.map(String),
        required_company_sectors: validatedData.required_company_sectors 
          ? validatedData.required_company_sectors.map(String) 
          : [],
        required_funding_stages: validatedData.required_funding_stages 
          ? validatedData.required_funding_stages.map(String) 
          : []
      };

      // Create the collaboration
      try {
        // Pass data to storage without strict type checking
        const newCollaboration = await storage.createCollaboration(collabData as any);
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
  // Update collaboration status (active/paused)
  app.patch("/api/collaborations/:id/status", async (req, res) => {
    try {
      // Get Telegram data from header
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate request body
      const { status } = req.body;
      if (!status || (status !== 'active' && status !== 'paused')) {
        return res.status(400).json({ error: 'Invalid status value. Status must be either "active" or "paused".' });
      }

      // Get user
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get collaboration
      const collabId = req.params.id;
      const [collaboration] = await db.select()
        .from(collaborations)
        .where(eq(collaborations.id, collabId));

      if (!collaboration) {
        return res.status(404).json({ error: 'Collaboration not found' });
      }

      // Check ownership
      if (collaboration.creator_id !== user.id) {
        return res.status(403).json({ error: 'Not authorized to update this collaboration' });
      }

      // Update collaboration status
      const updatedCollaboration = await storage.updateCollaborationStatus(collabId, status);
      res.json(updatedCollaboration);
    } catch (error) {
      console.error('Failed to update collaboration status:', error);
      res.status(500).json({ error: 'Failed to update collaboration status' });
    }
  });

  app.get("/api/collaborations/my", async (req, res) => {
    console.log('============ DEBUG: My Collaborations Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      let userId = '8319c02a-f1bd-4f93-abc3-e223c9100bea'; // Default to the provided user ID
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      
      if (initData) {
        // Parse Telegram data if available
        const decodedInitData = new URLSearchParams(initData);
        const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
        
        if (telegramUser?.id) {
          // Get user from telegram_id
          const user = await storage.getUserByTelegramId(telegramUser.id.toString());
          if (user) {
            userId = user.id;
          } else {
            console.log('User not found by Telegram ID, using default user ID');
          }
        }
      } else {
        console.log('No Telegram init data, using default user ID for development');
      }

      console.log('Using user ID:', userId);
      
      // Directly fetch collaborations from the database for the user
      const userCollabs = await db.select()
        .from(collaborations)
        .where(eq(collaborations.creator_id, userId));
        
      console.log('Found collaborations:', userCollabs.length);
      console.log('Collaborations data:', JSON.stringify(userCollabs, null, 2));
      
      // Log the full list of collab types for debugging
      const collabTypes = userCollabs.map(collab => collab.collab_type);
      console.log('Collaboration types:', collabTypes);
      
      // Return found collaborations (empty array if none)
      res.json(userCollabs);

    } catch (error) {
      console.error('Failed to fetch user collaborations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collaborations', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get single collaboration by ID
  app.get("/api/collaborations/get/:id", async (req, res) => {
    console.log('============ DEBUG: Get Collaboration Endpoint ============');
    console.log('Params:', req.params);
    
    try {
      const { id } = req.params;
      
      // Get the collaboration directly from the database
      const [collaboration] = await db.select()
        .from(collaborations)
        .where(eq(collaborations.id, id))
        .limit(1);
      
      if (!collaboration) {
        console.log(`Collaboration with ID ${id} not found`);
        return res.status(404).json({ error: 'Collaboration not found' });
      }

      console.log(`Found collaboration: ${collaboration.title}`);
      return res.json(collaboration);
    } catch (error) {
      console.error("Error fetching collaboration:", error);
      return res.status(500).json({ error: "Failed to fetch collaboration" });
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
            id: '1211030693',
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

  // Update a collaboration
  app.patch("/api/collaborations/:id", async (req, res) => {
    console.log('============ DEBUG: Update Collaboration Endpoint ============');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Get Telegram user ID from request
      const telegramData = getTelegramUserFromRequest(req);
      const telegramId = telegramData?.id?.toString() || process.env.DEV_USER_ID || '';
      console.log(`Telegram ID: ${telegramId} attempting to update collaboration: ${id}`);
      
      // First, get the actual user from the database using telegram_id
      const [dbUser] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramId));
      
      if (!dbUser) {
        console.log('User not found with telegramId:', telegramId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userId = dbUser.id; // This is the UUID from the database
      console.log(`Found user with ID: ${userId}`);
      
      // Verify the collaboration exists and belongs to the user
      const existingCollab = await db.select()
        .from(collaborations)
        .where(and(eq(collaborations.id, id), eq(collaborations.creator_id, userId)))
        .limit(1);
      
      if (!existingCollab.length) {
        console.log('Collaboration not found or does not belong to the user');
        return res.status(404).json({ error: 'Collaboration not found or you do not have permission to update it' });
      }
      
      // Clean up data for update 
      delete updateData.id; // Prevent updating ID
      delete updateData.creator_id; // Prevent updating creator
      
      // Make sure required fields are present
      if (!updateData.collab_type || !updateData.description || !updateData.date_type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Set updated timestamp
      updateData.updated_at = new Date();
      
      // Update the collaboration
      const [updatedCollab] = await db.update(collaborations)
        .set(updateData)
        .where(eq(collaborations.id, id))
        .returning();
      
      console.log(`Successfully updated collaboration ${id}`);
      return res.status(200).json(updatedCollab);
    } catch (error) {
      console.error('Error updating collaboration:', error);
      return res.status(500).json({ error: 'Failed to update collaboration' });
    }
  });
  
  // Apply to a collaboration
  // Delete a collaboration
  app.delete("/api/collaborations/:id", async (req, res) => {
    console.log('============ DEBUG: Delete Collaboration Endpoint ============');
    console.log('Params:', req.params);
    
    try {
      const { id } = req.params;
      
      // Get Telegram user ID from request
      const telegramData = getTelegramUserFromRequest(req);
      const telegramId = telegramData?.id?.toString() || process.env.DEV_USER_ID || '';
      console.log(`Telegram ID: ${telegramId} attempting to delete collaboration: ${id}`);
      
      // First, get the actual user from the database using telegram_id
      const [dbUser] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramId));
      
      if (!dbUser) {
        console.log('User not found with telegramId:', telegramId);
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userId = dbUser.id; // This is the UUID from the database
      console.log(`Found user with ID: ${userId}`);
      
      // Verify the collaboration exists and belongs to the user
      const existingCollab = await db.select()
        .from(collaborations)
        .where(and(eq(collaborations.id, id), eq(collaborations.creator_id, userId)))
        .limit(1);
      
      if (!existingCollab.length) {
        console.log('Collaboration not found or does not belong to the user');
        return res.status(404).json({ error: 'Collaboration not found or you do not have permission to delete it' });
      }
      
      // Delete the collaboration
      await db.delete(collaborations)
        .where(eq(collaborations.id, id));
      
      // Also delete any applications for this collaboration
      await db.delete(collab_applications)
        .where(eq(collab_applications.collaboration_id, id));
      
      console.log(`Successfully deleted collaboration ${id}`);
      return res.status(200).json({ success: true, message: 'Collaboration deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting collaboration:', error);
      return res.status(500).json({ error: 'Failed to delete collaboration' });
    }
  });

  app.post("/api/collaborations/:id/apply", async (req, res) => {
    console.log('============ DEBUG: Apply to Collaboration Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);
    console.log('Body:', req.body);

    try {
      const { id } = req.params;
      
      // Validate application data using the enhanced schema
      const result = collabApplicationSchema.safeParse(req.body);
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

  // User events endpoint
  app.get("/api/user-events", async (req, res) => {
    console.log('============ DEBUG: User Events Endpoint ============');
    console.log('Headers:', req.headers);
    
    try {
      let userId = '8319c02a-f1bd-4f93-abc3-e223c9100bea'; // Default to the provided user ID
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;
      
      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '1211030693',
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

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.log('User not found by Telegram ID, using default user ID');
        userId = '8319c02a-f1bd-4f93-abc3-e223c9100bea';
      } else {
        userId = user.id;
      }
      
      console.log('Using user ID:', userId);
      
      // Get user's event attendance
      const userEventAttendance = await db.select()
        .from(user_events)
        .where(eq(user_events.user_id, userId));

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
            id: '1211030693',
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
    console.log('============ DEBUG: Toggle User Event Attendance Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    try {
      const { event_id } = req.body;

      if (!event_id) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      let userId = '8319c02a-f1bd-4f93-abc3-e223c9100bea'; // Default to the provided user ID
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;
      
      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '1211030693',
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

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.log('User not found by Telegram ID, using default user ID');
        userId = '8319c02a-f1bd-4f93-abc3-e223c9100bea';
      } else {
        userId = user.id;
      }
      
      console.log('Using user ID:', userId);

      // Check if user is already attending this event
      const [existingAttendance] = await db.select()
        .from(user_events)
        .where(eq(user_events.user_id, userId))
        .where(eq(user_events.event_id, event_id));

      if (existingAttendance) {
        // Remove attendance if exists
        await db.delete(user_events)
          .where(eq(user_events.id, existingAttendance.id));
      } else {
        // Add new attendance
        await db.insert(user_events)
          .values({
            user_id: userId,
            event_id
          });
      }

      res.json({ success: true });

    } catch (error) {
      console.error('Failed to toggle event attendance:', error);
      res.status(500).json({ error: 'Failed to update event attendance' });
    }
  });
  
  // Delete user event attendance
  app.delete("/api/user-events/:id", async (req, res) => {
    console.log('============ DEBUG: Delete User Event Attendance Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);
    
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'User event ID is required' });
      }
      
      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;
      
      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: '1211030693',
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
      
      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));
        
      // Check if the user event belongs to the current user
      const [userEvent] = await db.select()
        .from(user_events)
        .where(eq(user_events.id, id));
        
      if (!userEvent) {
        return res.status(404).json({ error: 'User event not found' });
      }
      
      if (user && userEvent.user_id !== user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Delete the user event
      await db.delete(user_events)
        .where(eq(user_events.id, id));
        
      res.json({ success: true });
      
    } catch (error) {
      console.error('Failed to delete event attendance:', error);
      res.status(500).json({ error: 'Failed to delete event attendance' });
    }
  });

  return httpServer;
}