import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { db } from "./db";
import { 
  users, companies, notification_preferences, marketing_preferences, conference_preferences, 
  events, user_events, collaborations, collab_applications, collab_notifications,
  createCollaborationSchema, applicationSchema, collabApplicationSchema,
  InsertCollaboration,
  type NotificationPreferences, type MarketingPreferences, type ConferencePreferences
} from "../shared/schema";
import { eq, and, not, desc } from 'drizzle-orm';
import { sendApplicationConfirmation } from "./telegram";
import { storage } from "./storage";

// Helper function to extract Telegram user data from request
// This type allows us to accept either a full Request or just an object with the header we need
type TelegramReq = { headers: { 'x-telegram-init-data': string } | any };

function getTelegramUserFromRequest(req: TelegramReq) {
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

// Middleware to check if the current user is an admin
async function checkAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get Telegram user from request
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      res.status(401);
      return res.json({ error: "Unauthorized - Not logged in" });
    }
    
    // Get user from database
    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramUser.id.toString()));
    
    if (!user) {
      res.status(401);
      return res.json({ error: "Unauthorized - User not found" });
    }
    
    // Check if user is admin
    if (!user.is_admin) {
      res.status(403);
      return res.json({ error: "Forbidden - Admin access required" });
    }
    
    // Admin check passed, continue
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    res.status(500);
    return res.json({ error: "Internal server error" });
  }
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);
  
  // Admin API endpoints
  app.get("/api/admin/check", async (req, res) => {
    try {
      // Get Telegram user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        res.status(401);
        return res.json({ error: "Unauthorized" });
      }
      
      // Get user from database
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));
      
      if (!user) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      
      return res.json({ 
        success: true, 
        isAdmin: !!user.is_admin
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500);
      return res.json({ error: "Failed to check admin status" });
    }
  });
  
  app.get("/api/admin/users", checkAdminMiddleware, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      
      // Return array of users directly for frontend compatibility
      return res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500);
      return res.json({ error: "Failed to fetch users" });
    }
  });
  
  app.post("/api/admin/set-user-admin-status", checkAdminMiddleware, async (req, res) => {
    try {
      const { userId, isAdmin } = req.body;
      
      if (!userId) {
        res.status(400);
        return res.json({ error: "User ID is required" });
      }
      
      if (typeof isAdmin !== 'boolean') {
        res.status(400);
        return res.json({ error: "isAdmin must be a boolean value" });
      }
      
      const updatedUser = await storage.setUserAdminStatus(userId, isAdmin);
      
      if (!updatedUser) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      
      return res.json({ 
        success: true, 
        user: updatedUser,
        message: `User admin status ${isAdmin ? 'granted' : 'revoked'} successfully`
      });
    } catch (error) {
      console.error("Error setting user admin status:", error);
      res.status(500);
      return res.json({ error: "Failed to update user admin status" });
    }
  });
  
  // For compatibility with frontend - additional endpoint that matches our frontend implementation
  app.patch("/api/admin/users/:userId/admin-status", checkAdminMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      
      if (typeof isAdmin !== 'boolean') {
        res.status(400);
        return res.json({ error: "isAdmin must be a boolean value" });
      }
      
      const updatedUser = await storage.setUserAdminStatus(userId, isAdmin);
      
      if (!updatedUser) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      
      return res.json({ 
        success: true, 
        user: updatedUser,
        message: `User admin status ${isAdmin ? 'granted' : 'revoked'} successfully`
      });
    } catch (error) {
      console.error("Error setting user admin status:", error);
      res.status(500);
      return res.json({ error: "Failed to update user admin status" });
    }
  });

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
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
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
          res.status(400);
          return res.json({ error: 'First name is required' });
        }

        if (!isProfileUpdate && (!company_name || !job_title || !company_website || !funding_stage)) {
          console.error('Missing required company fields for new user');
          res.status(400);
          return res.json({ error: 'Missing required company fields' });
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

            // 3. Create notification preferences record
            const [notificationPrefs] = await tx
              .insert(notification_preferences)
              .values({
                user_id: user.id,
                notifications_enabled: true,
                notification_frequency: notification_frequency || 'Daily'
              })
              .returning();

            console.log('Created notification preferences:', notificationPrefs);
            
            // 4. Create marketing preferences
            const [marketingPrefs] = await tx
              .insert(marketing_preferences)
              .values({
                user_id: user.id,
                collabs_to_discover: collabs_to_discover || [],
                collabs_to_host: collabs_to_host || [],
                filtered_marketing_topics: excluded_tags || [] // Renamed from excluded_tags
              })
              .returning();
              
            console.log('Created marketing preferences:', marketingPrefs);
            
            // 5. Create conference preferences
            const [conferencePrefs] = await tx
              .insert(conference_preferences)
              .values({
                user_id: user.id,
                coffee_match_enabled: false
              })
              .returning();
              
            console.log('Created conference preferences:', conferencePrefs);

            return { user, company, notificationPreferences: notificationPrefs };
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

        return res.json({
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
      res.status(500);
      return res.json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' });
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
        res.status(400);
        return res.json({ error: 'Missing required fields' });
      }

      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      console.log('Parsing Telegram data:', initData);
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        res.status(404);
        return res.json({ error: 'User not found' });
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

        return res.json({
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
      res.status(500);
      return res.json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Preferences endpoint
  app.post("/api/preferences", async (req, res) => {
    console.log('============ DEBUG: Preferences Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const {
        // General preferences
        notification_frequency,
        
        // Marketing preferences 
        collabs_to_discover, 
        collabs_to_host, 
        excluded_tags, // Will be stored as filtered_marketing_topics
        twitter_collabs,
        
        // Conference preferences
        coffee_match_enabled,
        coffee_match_company_sectors,
        coffee_match_company_followers,
        coffee_match_user_followers,
        coffee_match_funding_stages,
        coffee_match_token_status,
        // Coffee match filter toggle states
        coffee_match_filter_company_sectors_enabled,
        coffee_match_filter_company_followers_enabled,
        coffee_match_filter_user_followers_enabled,
        coffee_match_filter_funding_stages_enabled,
        coffee_match_filter_token_status_enabled
      } = req.body;

      if (!notification_frequency) {
        console.error('Missing required field: notification_frequency');
        res.status(400);
        return res.json({ error: 'Missing required field: notification_frequency' });
      }
      
      // Make arrays optional - use empty arrays if not provided
      const collab_discover = Array.isArray(collabs_to_discover) ? collabs_to_discover : [];
      const collab_host = Array.isArray(collabs_to_host) ? collabs_to_host : [];
      const filtered_topics = Array.isArray(excluded_tags) ? excluded_tags : []; // Renamed from excluded
      const company_sectors = Array.isArray(coffee_match_company_sectors) ? coffee_match_company_sectors : [];
      const funding_stages = Array.isArray(coffee_match_funding_stages) ? coffee_match_funding_stages : [];
      const twitter_collab_types = Array.isArray(twitter_collabs) ? twitter_collabs : [];

      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      if (!initData) {
        console.error('No Telegram init data found in headers');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      // Parse Telegram data
      console.log('Parsing Telegram data:', initData);
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        res.status(404);
        return res.json({ error: 'User not found' });
      }

      try {
        // Check if notification preferences exist for this user
        const existingNotificationPrefs = await db.select()
          .from(notification_preferences)
          .where(eq(notification_preferences.user_id, user.id));
          
        const existingMarketingPrefs = await db.select()
          .from(marketing_preferences)
          .where(eq(marketing_preferences.user_id, user.id));
          
        const existingConferencePrefs = await db.select()
          .from(conference_preferences)
          .where(eq(conference_preferences.user_id, user.id));

        // Start transaction to ensure all preferences are updated together
        const result = await db.transaction(async (tx) => {
          let generalPrefs;
          let marketingPrefs;
          let conferencePrefs;
          
          // 1. Handle Notification Preferences
          if (existingNotificationPrefs.length > 0) {
            // Update existing notification preferences
            [generalPrefs] = await tx.update(notification_preferences)
              .set({ 
                notification_frequency,
                notifications_enabled: true
              })
              .where(eq(notification_preferences.user_id, user.id))
              .returning();
            console.log('Updated notification preferences:', generalPrefs);
          } else {
            // Create new notification preferences
            [generalPrefs] = await tx.insert(notification_preferences)
              .values({
                user_id: user.id,
                notifications_enabled: true,
                notification_frequency
              })
              .returning();
            console.log('Created notification preferences:', generalPrefs);
          }
          
          // 2. Handle Marketing Preferences
          const marketingPrefsData = {
            collabs_to_discover: collab_discover,
            collabs_to_host: collab_host,
            filtered_marketing_topics: filtered_topics, // Renamed from excluded_tags
            twitter_collabs: twitter_collab_types
          };
          
          if (existingMarketingPrefs.length > 0) {
            // Update existing marketing preferences
            [marketingPrefs] = await tx.update(marketing_preferences)
              .set(marketingPrefsData)
              .where(eq(marketing_preferences.user_id, user.id))
              .returning();
            console.log('Updated marketing preferences:', marketingPrefs);
          } else {
            // Create new marketing preferences
            [marketingPrefs] = await tx.insert(marketing_preferences)
              .values({
                user_id: user.id,
                ...marketingPrefsData
              })
              .returning();
            console.log('Created marketing preferences:', marketingPrefs);
          }
          
          // 3. Handle Conference Preferences
          const conferencePrefsData = {
            coffee_match_enabled: coffee_match_enabled === true,
            coffee_match_company_sectors: company_sectors,
            coffee_match_company_followers: coffee_match_company_followers || null,
            coffee_match_user_followers: coffee_match_user_followers || null,
            coffee_match_funding_stages: funding_stages,
            coffee_match_token_status: coffee_match_token_status === true,
            // Coffee match filter toggle states
            coffee_match_filter_company_sectors_enabled: coffee_match_filter_company_sectors_enabled === true,
            coffee_match_filter_company_followers_enabled: coffee_match_filter_company_followers_enabled === true,
            coffee_match_filter_user_followers_enabled: coffee_match_filter_user_followers_enabled === true,
            coffee_match_filter_funding_stages_enabled: coffee_match_filter_funding_stages_enabled === true,
            coffee_match_filter_token_status_enabled: coffee_match_filter_token_status_enabled === true
          };
          
          if (existingConferencePrefs.length > 0) {
            // Update existing conference preferences
            [conferencePrefs] = await tx.update(conference_preferences)
              .set(conferencePrefsData)
              .where(eq(conference_preferences.user_id, user.id))
              .returning();
            console.log('Updated conference preferences:', conferencePrefs);
          } else {
            // Create new conference preferences
            [conferencePrefs] = await tx.insert(conference_preferences)
              .values({
                user_id: user.id,
                ...conferencePrefsData
              })
              .returning();
            console.log('Created conference preferences:', conferencePrefs);
          }
          
          return { generalPrefs, marketingPrefs, conferencePrefs };
        });
        
        return res.json({
          success: true,
          preferences: result.generalPrefs,
          marketingPreferences: result.marketingPrefs,
          conferencePreferences: result.conferencePrefs,
          message: 'All preferences updated successfully'
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

  // Marketing Preferences API endpoint
  app.post("/api/marketing-preferences", async (req, res) => {
    console.log('============ DEBUG: Marketing Preferences Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Log topics specifically for debugging
    const filtered_marketing_topics = req.body.filtered_marketing_topics || [];
    console.log('TOPICS DEBUG: filtered_marketing_topics array length:', filtered_marketing_topics.length);
    console.log('TOPICS DEBUG: filtered_marketing_topics raw data:', JSON.stringify(filtered_marketing_topics));
    
    // Log all topic-related entries
    const topicEntries = filtered_marketing_topics
      .filter(t => t && typeof t === 'string' && t.startsWith('filter:topic:'));
    console.log('TOPICS DEBUG: topic entries count:', topicEntries.length);
    console.log('TOPICS DEBUG: topic entries raw data:', JSON.stringify(topicEntries));
    
    // Log extracted topic values
    const topicValues = topicEntries.map(t => t.replace('filter:topic:', ''));
    console.log('TOPICS DEBUG: extracted topic values:', JSON.stringify(topicValues));

    try {
      const {
        collabs_to_discover, 
        collabs_to_host, 
        filtered_marketing_topics,
        twitter_collabs,
        discovery_filter_enabled,
        discovery_filter_topics_enabled,
        discovery_filter_company_sectors_enabled,
        discovery_filter_company_followers_enabled,
        discovery_filter_user_followers_enabled,
        discovery_filter_funding_stages_enabled,
        discovery_filter_token_status_enabled
      } = req.body;

      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;

      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: 123456789,
            first_name: 'Dev',
            username: 'dev_user'
          };
        } else {
          console.error('No Telegram init data found in headers');
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
      } else {
        try {
          // Parse Telegram data using the helper
          telegramUser = getTelegramUserFromRequest({ headers: { 'x-telegram-init-data': initData } });
        } catch (error) {
          console.error('Error parsing Telegram data:', error);
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
      }

      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        res.status(404);
        return res.json({ error: 'User not found' });
      }

      try {
        // Check if marketing preferences exist for this user
        const existingMarketingPrefs = await db.select()
          .from(marketing_preferences)
          .where(eq(marketing_preferences.user_id, user.id));
          
        let result;
        
        // Log specific details about filtered marketing topics for debugging
        console.log('MARKETING PREFERENCES DEBUG: Received filtered_marketing_topics:', JSON.stringify(filtered_marketing_topics));
        
        // Ensure filtered_marketing_topics is an array
        const safeFilteredTopics = Array.isArray(filtered_marketing_topics) ? filtered_marketing_topics : [];
        console.log(`MARKETING PREFERENCES DEBUG: Safe filtered_marketing_topics (${safeFilteredTopics.length} items):`, JSON.stringify(safeFilteredTopics));
        
        // Count topic-related entries in filtered_marketing_topics
        const topicEntries = safeFilteredTopics.filter(item => 
          item && typeof item === 'string' && item.startsWith('filter:topic:')
        );
        console.log(`MARKETING PREFERENCES DEBUG: Found ${topicEntries.length} topic entries:`, JSON.stringify(topicEntries));
        
        // Extract just the topic values for easier debugging
        const topicValues = topicEntries.map(item => item.replace('filter:topic:', ''));
        console.log('MARKETING PREFERENCES DEBUG: Extracted topic values:', JSON.stringify(topicValues));
        
        // Make sure all arrays are properly handled with sensible defaults
        const safeCollabsToDiscover = Array.isArray(collabs_to_discover) ? collabs_to_discover : [];
        const safeCollabsToHost = Array.isArray(collabs_to_host) ? collabs_to_host : [];
        const safeTwitterCollabs = Array.isArray(twitter_collabs) ? twitter_collabs : [];

        // Process filtered_marketing_topics with extra validation
        // Create a new variable we can modify if needed
        let processedTopics = Array.isArray(filtered_marketing_topics) ? [...filtered_marketing_topics] : [];
        
        // Debug the specific topics that are being saved
        const saveTopicEntries = processedTopics.filter(item => 
          item && typeof item === 'string' && item.startsWith('filter:topic:')
        );
        console.log('SAVE OPERATION: Topics being saved:', JSON.stringify(saveTopicEntries.map(t => t.replace('filter:topic:', ''))));
        console.log('SAVE OPERATION: Full filtered_marketing_topics array:', JSON.stringify(processedTopics));
        
        // Filter out any non-string items for safety
        processedTopics = processedTopics.filter(item => typeof item === 'string');
        
        // Log the final validated array
        console.log('FINAL SAVE OPERATION: filtered_marketing_topics array after safety checks:', JSON.stringify(processedTopics));
        
        // Handle Marketing Preferences
        const marketingPrefsData = {
          collabs_to_discover: safeCollabsToDiscover,
          collabs_to_host: safeCollabsToHost,
          filtered_marketing_topics: processedTopics,
          twitter_collabs: safeTwitterCollabs,
          // Include all filter toggles with proper defaults if not provided
          discovery_filter_enabled: discovery_filter_enabled === undefined ? false : discovery_filter_enabled,
          discovery_filter_topics_enabled: discovery_filter_topics_enabled === undefined ? false : discovery_filter_topics_enabled,
          discovery_filter_company_sectors_enabled: discovery_filter_company_sectors_enabled === undefined ? false : discovery_filter_company_sectors_enabled,
          discovery_filter_company_followers_enabled: discovery_filter_company_followers_enabled === undefined ? false : discovery_filter_company_followers_enabled,
          discovery_filter_user_followers_enabled: discovery_filter_user_followers_enabled === undefined ? false : discovery_filter_user_followers_enabled,
          discovery_filter_funding_stages_enabled: discovery_filter_funding_stages_enabled === undefined ? false : discovery_filter_funding_stages_enabled,
          discovery_filter_token_status_enabled: discovery_filter_token_status_enabled === undefined ? false : discovery_filter_token_status_enabled
        };
        
        if (existingMarketingPrefs.length > 0) {
          // Update existing marketing preferences
          [result] = await db.update(marketing_preferences)
            .set(marketingPrefsData)
            .where(eq(marketing_preferences.user_id, user.id))
            .returning();
          console.log('Updated marketing preferences:', result);
        } else {
          // Create new marketing preferences
          [result] = await db.insert(marketing_preferences)
            .values({
              user_id: user.id,
              ...marketingPrefsData
            })
            .returning();
          console.log('Created marketing preferences:', result);
        }
        
        // Return a more explicitly formatted response to help client-side processing
        return res.json({
          success: true,
          message: 'Marketing preferences updated successfully',
          marketingPrefs: result
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save marketing preferences: ${dbError}`);
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
  
  // Conference Preferences API endpoint
  app.post("/api/conference-preferences", async (req, res) => {
    console.log('============ DEBUG: Conference Preferences Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const {
        filtered_conference_sectors,
        coffee_match_enabled,
        coffee_match_company_sectors,
        coffee_match_company_followers,
        coffee_match_user_followers,
        coffee_match_funding_stages,
        coffee_match_token_status,
        coffee_match_filter_company_sectors_enabled,
        coffee_match_filter_company_followers_enabled,
        coffee_match_filter_user_followers_enabled,
        coffee_match_filter_funding_stages_enabled,
        coffee_match_filter_token_status_enabled
      } = req.body;

      // Get Telegram data from header
      const initData = req.headers['x-telegram-init-data'] as string;
      let telegramUser;

      if (!initData) {
        // In development, use fallback data if Telegram data is missing
        if (process.env.NODE_ENV !== 'production') {
          console.log('Using development fallback for Telegram data');
          telegramUser = {
            id: 123456789,
            first_name: 'Dev',
            username: 'dev_user'
          };
        } else {
          console.error('No Telegram init data found in headers');
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
      } else {
        try {
          // Parse Telegram data using the helper
          telegramUser = getTelegramUserFromRequest({ headers: { 'x-telegram-init-data': initData } });
        } catch (error) {
          console.error('Error parsing Telegram data:', error);
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
      }

      if (!telegramUser.id) {
        console.error('No Telegram user ID found in parsed data');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      // Get user ID from telegram_id
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        res.status(404);
        return res.json({ error: 'User not found' });
      }

      try {
        // Check if conference preferences exist for this user
        const existingConferencePrefs = await db.select()
          .from(conference_preferences)
          .where(eq(conference_preferences.user_id, user.id));
          
        let result;
        
        // Handle Conference Preferences
        const updateData: any = {};
        
        // Only update fields that were provided in the request
        if (filtered_conference_sectors !== undefined) {
          updateData.filtered_conference_sectors = filtered_conference_sectors;
        }
        
        if (coffee_match_enabled !== undefined) {
          updateData.coffee_match_enabled = coffee_match_enabled === true;
        }
        
        if (coffee_match_company_sectors !== undefined) {
          updateData.coffee_match_company_sectors = coffee_match_company_sectors;
        }
        
        if (coffee_match_company_followers !== undefined) {
          updateData.coffee_match_company_followers = coffee_match_company_followers || null;
        }
        
        if (coffee_match_user_followers !== undefined) {
          updateData.coffee_match_user_followers = coffee_match_user_followers || null;
        }
        
        if (coffee_match_funding_stages !== undefined) {
          updateData.coffee_match_funding_stages = coffee_match_funding_stages;
        }
        
        if (coffee_match_token_status !== undefined) {
          updateData.coffee_match_token_status = coffee_match_token_status === true;
        }
        
        if (coffee_match_filter_company_sectors_enabled !== undefined) {
          updateData.coffee_match_filter_company_sectors_enabled = coffee_match_filter_company_sectors_enabled === true;
        }
        
        if (coffee_match_filter_company_followers_enabled !== undefined) {
          updateData.coffee_match_filter_company_followers_enabled = coffee_match_filter_company_followers_enabled === true;
        }
        
        if (coffee_match_filter_user_followers_enabled !== undefined) {
          updateData.coffee_match_filter_user_followers_enabled = coffee_match_filter_user_followers_enabled === true;
        }
        
        if (coffee_match_filter_funding_stages_enabled !== undefined) {
          updateData.coffee_match_filter_funding_stages_enabled = coffee_match_filter_funding_stages_enabled === true;
        }
        
        if (coffee_match_filter_token_status_enabled !== undefined) {
          updateData.coffee_match_filter_token_status_enabled = coffee_match_filter_token_status_enabled === true;
        }
        
        if (existingConferencePrefs.length > 0) {
          // Update existing conference preferences
          [result] = await db.update(conference_preferences)
            .set(updateData)
            .where(eq(conference_preferences.user_id, user.id))
            .returning();
          console.log('Updated conference preferences:', result);
        } else {
          // Create new conference preferences
          [result] = await db.insert(conference_preferences)
            .values({
              user_id: user.id,
              ...updateData
            })
            .returning();
          console.log('Created conference preferences:', result);
        }
        
        // Return a more explicitly formatted response to help client-side processing
        return res.json({
          success: true,
          message: 'Conference preferences updated successfully',
          conferencePrefs: result
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save conference preferences: ${dbError}`);
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
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
      } else {
        // Parse Telegram data
        const decodedInitData = new URLSearchParams(initData);
        telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      }

      if (!telegramUser?.id) {
        console.error('No Telegram user ID found');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      // Get user and related data
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        res.status(404);
        return res.json({ error: 'User not found' });
      }

      // Get company info
      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.user_id, user.id));

      // Get marketing preferences
      const [marketingPreferences] = await db.select()
        .from(marketing_preferences)
        .where(eq(marketing_preferences.user_id, user.id));
        
      // Get conference preferences
      const [conferencePreferences] = await db.select()
        .from(conference_preferences)
        .where(eq(conference_preferences.user_id, user.id));
        
      // Get notification preferences
      const [notificationPrefs] = await db.select()
        .from(notification_preferences)
        .where(eq(notification_preferences.user_id, user.id))
        .catch(() => [null]); // Catch error if table doesn't exist yet

      return res.json({
        user,
        company,
        // Still return the preferences object for backward compatibility
        preferences: {
          id: '',
          user_id: user.id,
          notification_frequency: notificationPrefs?.notification_frequency || 'Daily',
          // Empty fields that used to be in preferences but are now in specialized tables
          collabs_to_discover: [],
          collabs_to_host: [],
          twitter_collabs: [],
          excluded_tags: []
        },
        marketingPreferences,
        conferencePreferences
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500);
      return res.json({ error: 'Failed to fetch profile data' });
    }
  });

  // Events endpoint
  app.get("/api/events", async (req, res) => {
    try {
      const allEvents = await db.select().from(events);
      return res.json(allEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      res.status(500);
      return res.json({ error: 'Failed to fetch events' });
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

      return res.json(applicationsWithCollabData);
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
        res.status(201);
        return res.json({
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
      return res.json(updatedCollaboration);
    } catch (error) {
      console.error('Failed to update collaboration status:', error);
      res.status(500);
      return res.json({ error: 'Failed to update collaboration status' });
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
      return res.json(userCollabs);

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
      return res.json(collaborations);

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

        return res.json({
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
      return res.json(allEvents);
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

      return res.json(userEventAttendance);

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
      return res.json(notifications);

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
      
      return res.json({
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

      return res.json({ success: true });

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
        
      return res.json({ success: true });
      
    } catch (error) {
      console.error('Failed to delete event attendance:', error);
      res.status(500).json({ error: 'Failed to delete event attendance' });
    }
  });

  return httpServer;
}