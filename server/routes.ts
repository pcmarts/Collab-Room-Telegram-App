import type { Express, Request, Response, NextFunction } from "express";
import type { Session } from 'express-session';
import { createServer } from "http";
import session from 'express-session';
import MemoryStore from 'memorystore';
import { db } from "./db";

const MemoryStoreSession = MemoryStore(session);
import { 
  users, companies, notification_preferences, marketing_preferences, conference_preferences, 
  events, user_events, collaborations, collab_applications, collab_notifications,
  createCollaborationSchema, applicationSchema, collabApplicationSchema,
  InsertCollaboration,
  type NotificationPreferences, type MarketingPreferences, type ConferencePreferences
} from "../shared/schema";
import { eq, and, not, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { sendApplicationConfirmation, notifyAdminsNewUser, notifyUserApproved } from "./telegram";
import { storage } from "./storage";

// Define our session data structure
interface ImpersonationSession extends Session {
  impersonating?: {
    originalUser: any;
    impersonatedUser: {
      id: string;
      first_name: string;
      last_name?: string;
      username?: string;
    }
  }
}

// Extend Express Request type to include session
declare module 'express-serve-static-core' {
  interface Request {
    session: ImpersonationSession;
  }
}

// Extend Request type with our custom fields
interface TelegramRequest extends Request {
  telegramData?: {
    id: string;
    username?: string;
    first_name: string;
    last_name?: string;
  }
}

// Helper function to extract Telegram user data from request
// This type allows us to accept either a full Request or just an object with the header we need
type TelegramReq = TelegramRequest | { 
  headers: { 'x-telegram-init-data': string } | any;
  path?: string;
  session?: ImpersonationSession;
};

function getTelegramUserFromRequest(req: TelegramReq) {
  try {
    // If impersonating and not an admin endpoint, return impersonated user
    if (req.session?.impersonating && !req.path?.startsWith('/api/admin')) {
      return req.session.impersonating.impersonatedUser;
    }

    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      console.log('No Telegram init data found in request headers');
      // Log full headers for debugging (but sanitize any sensitive info)
      const safeHeaders = { ...req.headers };
      delete safeHeaders.cookie; // Remove cookies for security
      delete safeHeaders.authorization; // Remove auth tokens
      console.log('Available headers:', JSON.stringify(safeHeaders, null, 2));
      
      // In development mode, provide a fallback test user
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using development fallback for Telegram data');
        return {
          id: '123456789',
          first_name: 'Dev',
          last_name: 'Test',
          username: 'dev_user'
        };
      }
      
      console.warn('⚠️ No Telegram data found in request');
      return null;
    }
    
    // Parse Telegram data
    const decodedInitData = new URLSearchParams(initData);
    const userJson = decodedInitData.get('user') || '{}';
    console.log('Parsed Telegram user data:', userJson);
    const telegramUser = JSON.parse(userJson);
    
    if (!telegramUser.id) {
      console.error('Telegram user ID missing from parsed data');
      return null;
    }
    
    return telegramUser;
  } catch (error) {
    console.error('Error in getTelegramUserFromRequest:', error);
    console.error(error instanceof Error ? error.stack : String(error));
    return null;
  }
}

// Middleware to check if the current user is an admin
async function checkAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get Telegram user from request
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      console.log('Admin check failed: No Telegram user found');
      res.status(401);
      return res.json({ error: "Unauthorized - Not logged in" });
    }
    
    // Get user from database
    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramUser.id.toString()));
    
    if (!user) {
      console.log('Admin check failed: User not found in database');
      res.status(401);
      return res.json({ error: "Unauthorized - User not found" });
    }
    
    // Check if user is admin
    if (!user.is_admin) {
      console.log('Admin check failed: User is not an admin');
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
  // Network statistics endpoint
  app.get("/api/network-stats", async (_req: Request, res: Response) => {
    try {
      // Count all approved users
      const usersResult = await db.select({ count: sql`count(*)` }).from(users)
        .where(eq(users.is_approved, true));

      // Count all active collaborations
      const collabsResult = await db.select({ count: sql`count(*)` }).from(collaborations)
        .where(eq(collaborations.status, "active"));

      res.json({
        users: Number(usersResult[0]?.count || 0),
        collaborations: Number(collabsResult[0]?.count || 0)
      });
    } catch (error) {
      console.error("Error fetching network stats:", error);
      res.status(500).json({ error: "Failed to fetch network statistics" });
    }
  });
  const httpServer = createServer(app);

  // Initialize session middleware
  app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Profile API endpoint
  app.get("/api/profile", async (req: TelegramRequest, res: Response) => {
    try {
      console.log('============ DEBUG: Profile Endpoint ============');
      console.log('Headers:', req.headers);

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
        console.log('User not found with telegram ID:', telegramUser.id);
        
        // For development environment only - create a test user if it doesn't exist
        if (process.env.NODE_ENV !== 'production') {
          console.log('Creating test user for development...');
          
          try {
            // Create a test user
            const [newUser] = await db.insert(users)
              .values({
                telegram_id: telegramUser.id.toString(),
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name || null,
                username: telegramUser.username || null,
                handle: telegramUser.username || 'dev_user',
                is_admin: true, // Make this user an admin for testing
                is_approved: true,
                applied_at: new Date(),
                created_at: new Date()
              })
              .returning();
              
            console.log('Created test user:', newUser);
            
            // Create a company for this user
            const [newCompany] = await db.insert(companies)
              .values({
                user_id: newUser.id,
                name: 'Test Company',
                job_title: 'Developer',
                website: 'https://example.com',
                funding_stage: 'Seed',
                has_token: false
              })
              .returning();
              
            console.log('Created test company:', newCompany);
            
            // Create empty notification preferences
            await db.insert(notification_preferences)
              .values({
                user_id: newUser.id,
                frequency: 'Daily'
              });
              
            // Create empty marketing preferences
            await db.insert(marketing_preferences)
              .values({
                user_id: newUser.id
              });
              
            // Create empty conference preferences
            await db.insert(conference_preferences)
              .values({
                user_id: newUser.id
              });
              
            // Return the newly created user and company
            return res.json({
              user: newUser,
              company: newCompany,
              impersonating: null
            });
          } catch (error) {
            console.error('Error creating test user:', error);
            res.status(500);
            return res.json({ error: "Failed to create test user" });
          }
        } else {
          res.status(404);
          return res.json({ error: "User not found" });
        }
      }

      // Get company information
      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.user_id, user.id));

      // Add impersonation information to the response
      const response = {
        user,
        company,
        impersonating: req.session?.impersonating ? {
          originalUser: req.session.impersonating.originalUser
        } : null
      };

      return res.json(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500);
      return res.json({ error: "Internal server error" });
    }
  });
  
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
      // Since we passed middleware, we can fetch users
      const allUsers = await db.select().from(users);
      console.log(`Found ${allUsers.length} users in database`);
      
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

  // Admin Impersonation Routes
  app.post("/api/admin/impersonate", checkAdminMiddleware, async (req: TelegramRequest, res: Response) => {
    try {
      const { telegram_id } = req.body;
      console.log('Impersonation request for telegram_id:', telegram_id);
      
      if (!telegram_id) {
        res.status(400);
        return res.json({ error: "Telegram ID is required" });
      }

      // Get the user to impersonate
      const [userToImpersonate] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegram_id));
      
      if (!userToImpersonate) {
        res.status(404);
        return res.json({ error: "User not found" });
      }

      console.log('Found user to impersonate:', userToImpersonate);

      // Get original admin user for later reference  
      const adminUser = getTelegramUserFromRequest(req);
      
      if (!req.session) {
        console.error('No session object found');
        res.status(500);
        return res.json({ error: "Session not initialized" });
      }

      // Store impersonation data in session
      req.session.impersonating = {
        originalUser: adminUser,
        impersonatedUser: {
          id: userToImpersonate.telegram_id,
          first_name: userToImpersonate.first_name,
          last_name: userToImpersonate.last_name || undefined,
          username: userToImpersonate.handle || undefined
        }
      };

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          res.status(500);
          return res.json({ error: "Failed to save session" });
        }

        console.log('Impersonation session saved successfully');
        return res.json({
          success: true,
          message: "Impersonation started", 
          user: userToImpersonate
        });
      });

    } catch (error) {
      console.error("Error starting impersonation:", error);
      res.status(500);
      return res.json({ error: "Failed to start impersonation" });
    }
  });

  app.post("/api/admin/stop-impersonation", checkAdminMiddleware, async (req: TelegramRequest, res: Response) => {
    try {
      if (!req.session?.impersonating) {
        res.status(400);
        return res.json({ error: "Not currently impersonating" });
      }

      // Clear impersonation data
      delete req.session.impersonating;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
          res.status(500);
          return res.json({ error: "Failed to save session" });
        }

        console.log('Impersonation session cleared successfully');
        return res.json({
          success: true,
          message: "Impersonation ended"
        });
      });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      res.status(500); 
      return res.json({ error: "Failed to end impersonation" });
    }
  });

  // New route to approve a user
  app.post("/api/admin/approve-user", checkAdminMiddleware, async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        res.status(400);
        return res.json({ error: "User ID is required" });
      }

      // Get the user to approve
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        res.status(404);
        return res.json({ error: "User not found" });
      }

      // Update user approval status
      const [updatedUser] = await db.update(users)
        .set({ is_approved: true })
        .where(eq(users.id, userId))
        .returning();

      // Send Telegram notification to the approved user
      try {
        await notifyUserApproved(parseInt(user.telegram_id));
      } catch (msgError) {
        console.error('Failed to send user approval notification:', msgError);
      }

      return res.json({
        success: true,
        user: updatedUser,
        message: "User approved successfully"
      });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500);
      return res.json({ error: "Failed to approve user" });
    }
  });

  app.post("/api/onboarding", async (req: TelegramRequest, res) => {
    try {
      const { 
        first_name, last_name, linkedin_url, email, twitter_url, twitter_followers,
        referral_code,
        company_name, company_website, twitter_handle, job_title, 
        funding_stage, has_token, token_ticker, blockchain_networks, tags,
        company_linkedin_url, company_twitter_followers,
        collabs_to_host, notification_frequency, filtered_marketing_topics
      } = req.body;

      // Get Telegram user data from request
      let telegramUser = getTelegramUserFromRequest(req);
      
      // Only for development: If no telegram data is found, create a test user in development
      if (!telegramUser && process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Creating test user data for onboarding');
        telegramUser = {
          id: '12345678901', // Unique test ID
          first_name: req.body.first_name || 'Test',
          last_name: req.body.last_name || 'User',
          username: req.body.handle || 'test_user',
        };
      }
      
      // Production environments still require valid Telegram data
      if (!telegramUser) {
        console.error('No Telegram user data found and not in development mode');
        res.status(400);
        return res.json({ error: 'Invalid Telegram data' });
      }

      const existingUsers = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      const isProfileUpdate = existingUsers.length > 0;

      if (!first_name) {
        res.status(400);
        return res.json({ error: 'First name is required' });
      }

      const result = await db.transaction(async (tx) => {
        let user;
        
        if (isProfileUpdate) {
          [user] = await tx
            .update(users)
            .set({
              first_name,
              last_name,
              linkedin_url,
              email,
              twitter_url,
              twitter_followers,
              referral_code,
            })
            .where(eq(users.telegram_id, telegramUser.id.toString()))
            .returning();
        } else {
          // Create a display handle if the user doesn't have a Telegram username
          const handle = telegramUser.username || `user_${telegramUser.id.toString().substring(0, 8)}`;
          
          // Log what we're using to help with debugging
          console.log(`Creating user with Telegram ID: ${telegramUser.id} and handle: ${handle}`);
          
          [user] = await tx
            .insert(users)
            .values({
              telegram_id: telegramUser.id.toString(),
              handle: handle,
              first_name,
              last_name,
              linkedin_url,
              email,
              twitter_url,
              twitter_followers,
              referral_code,
              applied_at: new Date()
            })
            .returning();
        }

        if (!user) {
          throw new Error('Failed to update/create user');
        }

        if (!isProfileUpdate) {
          if (!company_name || !job_title || !company_website || !funding_stage) {
            throw new Error('Missing required company fields for new user');
          }

          await tx
            .insert(companies)
            .values({
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

          await tx
            .insert(notification_preferences)
            .values({
              user_id: user.id,
              notifications_enabled: true,
              notification_frequency: notification_frequency || 'Daily'
            });
        
          await tx
            .insert(marketing_preferences)
            .values({
              user_id: user.id,
              // Enable all collaboration types by default
              collabs_to_discover: [
                'Co-Marketing on Twitter',
                'Podcast Guest Appearance', 
                'Twitter Spaces Guest',
                'Live Stream Guest Appearance',
                'Report & Research Feature',
                'Newsletter Feature',
                'Blog Post Feature',
                'Thread Collab',
                'Joint Campaign',
                'Giveaway',
                'Retweet & Boost',
                'Sponsored Tweet', 
                'Poll/Q&A',
                'Shoutout',
                'Tweet Swap',
                'Meme/Viral Collab',
                'Twitter List Collab',
                'Exclusive Announcement'
              ],
              collabs_to_host: collabs_to_host || [],
              filtered_marketing_topics: filtered_marketing_topics || [],
              // Enable all filters by default
              matchingEnabled: true,
              filter_company_sectors_enabled: true,
              filter_company_followers_enabled: true,
              filter_user_followers_enabled: true,
              filter_funding_stages_enabled: true,
              filter_token_status_enabled: true
            });
        
          await tx
            .insert(conference_preferences)
            .values({
              user_id: user.id,
              coffee_match_enabled: false
            });
        }

        return { user };
      });

      return res.json({
        success: true,
        message: isProfileUpdate ? 'Profile updated successfully' : 'Application submitted successfully',
        ...result
      });

    } catch (error) {
      console.error('Error in onboarding:', error instanceof Error ? error.message : 'Unknown error');
      res.status(500);
      return res.json({ error: 'Server error' });
    }
  });

  // Company information endpoint
  app.post("/api/company", async (req: TelegramRequest, res) => {
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

      // Get user from impersonation session or Telegram data
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user ID found');
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
          twitter_handle, // Store full URL without parsing
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
  app.post("/api/preferences", async (req: TelegramRequest, res) => {
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
        filtered_marketing_topics, // Previously named excluded_tags
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
      const filtered_topics = Array.isArray(filtered_marketing_topics) ? filtered_marketing_topics : []; // Array of filtered marketing topics
      const company_sectors = Array.isArray(coffee_match_company_sectors) ? coffee_match_company_sectors : [];
      const funding_stages = Array.isArray(coffee_match_funding_stages) ? coffee_match_funding_stages : [];
      const twitter_collab_types = Array.isArray(twitter_collabs) ? twitter_collabs : [];

      // Get user from impersonation session or Telegram data
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user ID found');
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

  // My Collaborations endpoint
  app.get("/api/collaborations/my", async (req: TelegramRequest, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const myCollaborations = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.creator_id, user.id))
        .orderBy(desc(collaborations.created_at));

      return res.json(myCollaborations);

    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Search Collaborations endpoint
  app.get("/api/collaborations/search", async (req: TelegramRequest, res: Response) => {
    try {
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const collaborations = await db.select()
        .from(collaborations)
        .where(not(eq(collaborations.creator_id, user.id)))
        .orderBy(desc(collaborations.created_at));
      
      return res.json(collaborations);

    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch collaborations' });
    }
  });

  // Apply to Collaboration endpoint
  app.post("/api/collaborations/:id/apply", async (req: TelegramRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Collaboration ID is required' });
      }

      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const application = await storage.createCollabApplication(id, user.id, message);
      if (!application) {
        return res.status(404).json({ error: 'Failed to create application' });
      }

      return res.json({
        success: true,
        application,
        message: 'Application submitted successfully'
      });

    } catch (error) {
      return res.status(500).json({ error: 'Failed to submit application' });
    }
  });

  // Marketing Preferences API endpoint
  app.get("/api/marketing-preferences", async (req: TelegramRequest, res) => {
    const telegramUser = getTelegramUserFromRequest(req);
    if (!telegramUser) {
      console.log('No Telegram user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Find the user by Telegram ID
      const user = await storage.getUserByTelegramId(telegramUser.id);
      if (!user) {
        console.log(`User not found for Telegram ID: ${telegramUser.id}`);
        return res.status(401).json({ error: 'User not found' });
      }

      // Get marketing preferences
      const prefs = await storage.getUserMarketingPreferences(user.id);
      
      if (!prefs) {
        console.log(`No marketing preferences found for user: ${user.id}`);
        return res.status(200).json({
          collabs_to_discover: [],
          filtered_marketing_topics: [],
          company_tags: [],
          company_blockchain_networks: [],
          company_twitter_followers: null,
          twitter_followers: null,
          company_has_token: false,
          discovery_filter_enabled: false,
          discovery_filter_collab_types_enabled: false,
          discovery_filter_topics_enabled: false,
          discovery_filter_company_sectors_enabled: false,
          discovery_filter_company_followers_enabled: false,
          discovery_filter_user_followers_enabled: false,
          discovery_filter_funding_stages_enabled: false,
          discovery_filter_token_status_enabled: false,
          discovery_filter_blockchain_networks_enabled: false
        });
      }
      
      // Return the preference data
      return res.status(200).json(prefs);
    } catch (error) {
      console.error('Error getting marketing preferences:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.post("/api/marketing-preferences", async (req: TelegramRequest, res) => {
    console.log('============ DEBUG: Marketing Preferences Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Raw Body:', req.body);
    
    // Validate arrays
    const collabs_to_discover = Array.isArray(req.body.collabs_to_discover) ? req.body.collabs_to_discover : [];
    const collabs_to_host = Array.isArray(req.body.collabs_to_host) ? req.body.collabs_to_host : [];
    const twitter_collabs = Array.isArray(req.body.twitter_collabs) ? req.body.twitter_collabs : [];
    const filtered_marketing_topics = Array.isArray(req.body.filtered_marketing_topics) ? req.body.filtered_marketing_topics : [];
    
    console.log('DEBUG ARRAYS: collabs_to_discover:', JSON.stringify(collabs_to_discover));
    console.log('DEBUG ARRAYS: collabs_to_host:', JSON.stringify(collabs_to_host));
    console.log('DEBUG ARRAYS: twitter_collabs:', JSON.stringify(twitter_collabs));
    console.log('DEBUG ARRAYS: filtered_marketing_topics:', JSON.stringify(filtered_marketing_topics));
    
    // Log topics specifically for debugging
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
        discovery_filter_collab_types_enabled,
        discovery_filter_topics_enabled,
        discovery_filter_company_sectors_enabled,
        discovery_filter_company_followers_enabled,
        discovery_filter_user_followers_enabled,
        discovery_filter_funding_stages_enabled,
        discovery_filter_token_status_enabled,
        discovery_filter_blockchain_networks_enabled,
        // Direct field values for filter criteria
        company_tags,
        company_twitter_followers,
        twitter_followers,
        funding_stage,
        company_has_token,
        company_blockchain_networks
      } = req.body;

      // Get user from impersonation session or Telegram data
      let telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user ID found');
        if (process.env.NODE_ENV === 'production') {
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
        // In development, fallback to test user
        console.log('Using development fallback for Telegram data');
        telegramUser = {
          id: '123456789',
          first_name: 'Dev',
          username: 'dev_user'
        };
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
        const safeFilteredTopics: string[] = Array.isArray(filtered_marketing_topics) ? filtered_marketing_topics.filter(item => typeof item === 'string') : [];
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
        
        // Check for potential duplicate topic entries and remove them
        const uniqueFilteredTopics: string[] = [];
        const seen = new Set<string>();
        
        for (const item of safeFilteredTopics) {
          if (typeof item !== 'string') continue;
          
          // For topics, ensure we have no duplicates
          if (item.startsWith('filter:topic:')) {
            if (seen.has(item)) {
              console.log(`MARKETING PREFERENCES DEBUG: Found duplicate topic entry: ${item}`);
              continue; // Skip this duplicate
            }
            seen.add(item);
          }
          
          uniqueFilteredTopics.push(item);
        }
        
        // Create a variable to store our final topics array
        let finalFilteredTopics: string[] = safeFilteredTopics;
        
        // Check if we need deduplication
        if (safeFilteredTopics.length !== uniqueFilteredTopics.length) {
          console.log(`MARKETING PREFERENCES DEBUG: Removed ${safeFilteredTopics.length - uniqueFilteredTopics.length} duplicate topic entries`);
          // Use the deduplicated array
          finalFilteredTopics = uniqueFilteredTopics;
          console.log('MARKETING PREFERENCES DEBUG: Using deduplicated topics array');
        }
        
        // Process filtered_marketing_topics with either original or deduplicated array
        let processedTopics = finalFilteredTopics;
        
        // Debug the specific topics that are being saved
        const topicDebugEntries = processedTopics.filter(item => 
          item && typeof item === 'string' && item.startsWith('filter:topic:')
        );
        console.log('SAVE OPERATION: Topics being saved:', JSON.stringify(topicDebugEntries.map(t => t.replace('filter:topic:', ''))));
        console.log('SAVE OPERATION: Full filtered_marketing_topics array:', JSON.stringify(processedTopics));
        
        // Filter out any non-string items for safety
        processedTopics = processedTopics.filter(item => typeof item === 'string');
        
        // Log the final validated array
        console.log('FINAL SAVE OPERATION: filtered_marketing_topics array after safety checks:', JSON.stringify(processedTopics));
        
        // Validate the direct field values
        const safeCompanyTags = Array.isArray(company_tags) ? company_tags : null;
        const safeCompanyBlockchainNetworks = Array.isArray(company_blockchain_networks) ? company_blockchain_networks : null;
        
        // Log the direct field values for debugging
        console.log('DIRECT FIELDS DEBUG: company_tags:', JSON.stringify(safeCompanyTags));
        console.log('DIRECT FIELDS DEBUG: company_blockchain_networks:', JSON.stringify(safeCompanyBlockchainNetworks));
        console.log('DIRECT FIELDS DEBUG: company_twitter_followers:', company_twitter_followers);
        console.log('DIRECT FIELDS DEBUG: twitter_followers:', twitter_followers);
        console.log('DIRECT FIELDS DEBUG: funding_stage:', funding_stage);
        console.log('DIRECT FIELDS DEBUG: company_has_token:', company_has_token);
        
        // Check if blockchain networks filter is enabled but the networks array is null or empty
        if (discovery_filter_blockchain_networks_enabled && (!safeCompanyBlockchainNetworks || safeCompanyBlockchainNetworks.length === 0)) {
          console.log('WARNING: Blockchain networks filter is enabled but no networks are selected');
        }
        
        // Extract blockchain networks from form data
        let blockchainNetworks = safeCompanyBlockchainNetworks;
        
        // Create dedicated blockchain networks filter data structure
        if (discovery_filter_blockchain_networks_enabled && blockchainNetworks) {
          console.log('BLOCKCHAIN NETWORKS: Storing selected blockchain networks:', JSON.stringify(blockchainNetworks));
        } else {
          console.log('BLOCKCHAIN NETWORKS: No blockchain networks selected or filter disabled');
          // If filter is disabled, set to null
          blockchainNetworks = null;
        }
        
        // Handle Marketing Preferences with direct field values
        const marketingPrefsData = {
          collabs_to_discover: safeCollabsToDiscover,
          collabs_to_host: safeCollabsToHost,
          filtered_marketing_topics: processedTopics,
          
          // All filter toggle states
          discovery_filter_enabled: discovery_filter_enabled === undefined ? false : discovery_filter_enabled,
          discovery_filter_collab_types_enabled: discovery_filter_collab_types_enabled === undefined ? false : discovery_filter_collab_types_enabled,
          discovery_filter_topics_enabled: discovery_filter_topics_enabled === undefined ? false : discovery_filter_topics_enabled,
          discovery_filter_company_sectors_enabled: discovery_filter_company_sectors_enabled === undefined ? false : discovery_filter_company_sectors_enabled,
          discovery_filter_company_followers_enabled: discovery_filter_company_followers_enabled === undefined ? false : discovery_filter_company_followers_enabled,
          discovery_filter_user_followers_enabled: discovery_filter_user_followers_enabled === undefined ? false : discovery_filter_user_followers_enabled,
          discovery_filter_funding_stages_enabled: discovery_filter_funding_stages_enabled === undefined ? false : discovery_filter_funding_stages_enabled,
          discovery_filter_token_status_enabled: discovery_filter_token_status_enabled === undefined ? false : discovery_filter_token_status_enabled,
          discovery_filter_blockchain_networks_enabled: discovery_filter_blockchain_networks_enabled === undefined ? false : discovery_filter_blockchain_networks_enabled,
          
          // Direct field values for each filter criteria
          company_tags: discovery_filter_company_sectors_enabled ? safeCompanyTags : null,
          company_twitter_followers: discovery_filter_company_followers_enabled ? company_twitter_followers : null,
          twitter_followers: discovery_filter_user_followers_enabled ? twitter_followers : null,
          funding_stage: discovery_filter_funding_stages_enabled ? (funding_stage || null) : null,
          company_has_token: discovery_filter_token_status_enabled ? (company_has_token === undefined ? false : company_has_token) : null,
          company_blockchain_networks: blockchainNetworks
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
  app.post("/api/conference-preferences", async (req: TelegramRequest, res) => {
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
        coffee_match_filter_token_status_enabled,
        coffee_match_filter_blockchain_networks_enabled,
        company_blockchain_networks
      } = req.body;

      // Get user from impersonation session or Telegram data
      let telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user ID found');
        if (process.env.NODE_ENV === 'production') {
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
        // In development, fallback to test user
        console.log('Using development fallback for Telegram data');
        telegramUser = {
          id: '123456789',
          first_name: 'Dev',
          username: 'dev_user'
        };
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
        
        // Add blockchain networks enabled filter
        if (coffee_match_filter_blockchain_networks_enabled !== undefined) {
          updateData.coffee_match_filter_blockchain_networks_enabled = coffee_match_filter_blockchain_networks_enabled === true;
        }
        
        // Add blockchain networks array
        if (company_blockchain_networks !== undefined) {
          updateData.company_blockchain_networks = Array.isArray(company_blockchain_networks) ? company_blockchain_networks : [];
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
  app.get("/api/profile", async (req: TelegramRequest, res) => {
    console.log('============ DEBUG: Profile Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      // Get user from impersonation session or Telegram data
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user ID found');
        if (process.env.NODE_ENV === 'production') {
          res.status(400);
          return res.json({ error: 'Invalid Telegram data' });
        }
        // In development, fallback to test user
        console.log('Using development fallback for Telegram data');
        const devUser = {
          id: '1211030693',
          username: 'test_user',
          first_name: 'Test',
          last_name: 'User'
        };
        return res.json({ user: devUser });
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
          filtered_marketing_topics: []
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
  app.get("/api/my-applications", async (req: TelegramRequest, res) => {
    try {
      // Get user from impersonation session or Telegram data
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user ID found');
        if (process.env.NODE_ENV === 'production') {
          return res.status(400).json({ error: 'Invalid Telegram data' });
        }
        // In development, fallback to test user
        console.log('Using development fallback for Telegram data');
        const devUser = {
          id: '1211030693',
          username: 'test_user',
          first_name: 'Test',
          last_name: 'User'
        };
        return devUser;
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
      
      // Log details object to check if short_description is present
      console.log("Details from form data:", validatedData.details);
      
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
          : [],
        required_blockchain_networks: validatedData.required_blockchain_networks
          ? validatedData.required_blockchain_networks.map(String)
          : [],
        
        // Add standardized fields for consistent filtering across all tables
        company_tags: validatedData.required_company_sectors 
          ? validatedData.required_company_sectors.map(String)
          : [],
        company_twitter_followers: validatedData.min_company_followers,
        twitter_followers: validatedData.min_user_followers,
        funding_stage: validatedData.required_funding_stages && validatedData.required_funding_stages.length > 0
          ? validatedData.required_funding_stages[0]
          : null,
        company_has_token: validatedData.required_token_status || false,
        company_blockchain_networks: validatedData.required_blockchain_networks
          ? validatedData.required_blockchain_networks.map(String)
          : [],
        
        // Set filter toggle states based on whether requirements are specified
        filter_company_sectors_enabled: Array.isArray(validatedData.required_company_sectors) && validatedData.required_company_sectors.length > 0,
        filter_company_followers_enabled: !!validatedData.min_company_followers,
        filter_user_followers_enabled: !!validatedData.min_user_followers,
        filter_funding_stages_enabled: Array.isArray(validatedData.required_funding_stages) && validatedData.required_funding_stages.length > 0,
        filter_token_status_enabled: !!validatedData.required_token_status,
        filter_blockchain_networks_enabled: Array.isArray(validatedData.required_blockchain_networks) && validatedData.required_blockchain_networks.length > 0
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

  app.get("/api/collaborations/my", async (req: TelegramRequest, res) => {
    console.log('============ DEBUG: My Collaborations Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      // Get user from impersonation session or Telegram data
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user ID found');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user from database
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramUser.id.toString()));

      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }

      // Get collaborations for this user
      const myCollaborations = await db
        .select()
        .from(collaborations)
        .where(eq(collaborations.creator_id, user.id))
        .orderBy(desc(collaborations.created_at));
        
      console.log('Found collaborations:', myCollaborations.length);
      console.log('Collaborations data:', JSON.stringify(myCollaborations, null, 2));
      
      // Log the full list of collab types for debugging
      const collabTypes = myCollaborations.map(collab => collab.collab_type);
      console.log('Collaboration types:', collabTypes);
      
      // Return found collaborations (empty array if none)
      return res.json(myCollaborations);

    } catch (error) {
      console.error('Failed to fetch user collaborations:', error);
      return res.status(500).json({ 
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
  app.get("/api/collaborations/search", async (req: TelegramRequest, res: Response) => {
    console.log('============ DEBUG: Search Collaborations Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);

    try {
      // Get Telegram user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
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
        fundingStages: req.query.fundingStages ? (req.query.fundingStages as string).split(',') : undefined,
        blockchainNetworks: req.query.blockchainNetworks ? (req.query.blockchainNetworks as string).split(',') : undefined
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

  // Get discovery cards for swiping
  app.get("/api/discovery/cards", async (req: TelegramRequest, res: Response) => {
    console.log('============ DEBUG: Discovery Cards Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);

    try {
      // Get Telegram user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
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
        fundingStages: req.query.fundingStages ? (req.query.fundingStages as string).split(',') : undefined,
        blockchainNetworks: req.query.blockchainNetworks ? (req.query.blockchainNetworks as string).split(',') : undefined
      };

      // Get discovery cards (excludes already swiped collaborations)
      const cards = await storage.getDiscoveryCards(user.id, filters);
      return res.json(cards);

    } catch (error) {
      console.error('Failed to get discovery cards:', error);
      res.status(500).json({ 
        error: 'Failed to get discovery cards', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Record a swipe (left/right)
  app.post("/api/swipes", async (req: TelegramRequest, res: Response) => {
    console.log('============ DEBUG: Create Swipe Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      // Get Telegram user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate request body
      const { collaborationId, direction } = req.body;
      if (!collaborationId || !direction) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (direction !== 'left' && direction !== 'right') {
        return res.status(400).json({ error: 'Invalid direction, must be "left" or "right"' });
      }

      // Create the swipe record
      const swipe = await storage.createSwipe({
        user_id: user.id,
        collaboration_id: collaborationId,
        direction
      });

      // Check if this is a match (both parties swiped right on each other's collaborations)
      let isMatch = false;
      if (direction === 'right') {
        // Get the collaboration that was swiped on
        const collaboration = await storage.getCollaboration(collaborationId);
        
        if (collaboration) {
          // Get the creator's collaborations
          const creatorCollaborations = await storage.getUserCollaborations(collaboration.creator_id);
          
          // Get user's swipes on the creator's collaborations
          const creatorSwipes = await storage.getUserSwipes(collaboration.creator_id);
          
          // Check if the creator has swiped right on any of the user's collaborations
          const userCollaborations = await storage.getUserCollaborations(user.id);
          const userCollabIds = userCollaborations.map(collab => collab.id);
          
          // Find right swipes from the creator on the user's collaborations
          const matchingSwipes = creatorSwipes.filter(s => 
            s.direction === 'right' && userCollabIds.includes(s.collaboration_id)
          );
          
          if (matchingSwipes.length > 0) {
            isMatch = true;
            
            // Create match notifications for both users
            await storage.createNotification({
              user_id: user.id,
              collaboration_id: collaborationId,
              type: 'match',
              content: `You matched with ${collaboration.creator_name || 'someone'} on their "${collaboration.collab_type}" collaboration!`,
              is_read: false,
              is_sent: false
            });
            
            // Also notify the collaboration creator
            await storage.createNotification({
              user_id: collaboration.creator_id,
              collaboration_id: matchingSwipes[0].collaboration_id, // Use the first matched collab
              type: 'match',
              content: `You matched with ${user.first_name} ${user.last_name || ''} on your "${collaboration.collab_type}" collaboration!`,
              is_read: false,
              is_sent: false
            });
          }
        }
      }

      return res.json({ swipe, isMatch });

    } catch (error) {
      console.error('Failed to create swipe:', error);
      res.status(500).json({ 
        error: 'Failed to create swipe', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Undo last swipe
  app.post("/api/swipes/undo", async (req: TelegramRequest, res: Response) => {
    console.log('============ DEBUG: Undo Swipe Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      // Get Telegram user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Undo the last swipe
      const success = await storage.undoLastSwipe(user.id);
      return res.json({ success });

    } catch (error) {
      console.error('Failed to undo swipe:', error);
      res.status(500).json({ 
        error: 'Failed to undo swipe', 
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

  app.post("/api/collaborations/:id/apply", async (req: TelegramRequest, res: Response) => {
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
      
      // Get Telegram user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
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
  app.get("/api/user-events", async (req: TelegramRequest, res: Response) => {
    console.log('============ DEBUG: User Events Endpoint ============');
    console.log('Headers:', req.headers);
    
    try {
      // Get user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user from database
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error('User not found');
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log('Using user:', user);
      
      // Get user's event attendance
      const userEventAttendance = await db.select()
        .from(user_events)
        .where(eq(user_events.user_id, user.id));

      return res.json(userEventAttendance);

    } catch (error) {
      console.error('Failed to fetch user events:', error);
      res.status(500).json({ error: 'Failed to fetch user events' });
    }
  });

  // Get user notifications
  app.get("/api/notifications", async (req: TelegramRequest, res: Response) => {
    console.log('============ DEBUG: User Notifications Endpoint ============');
    console.log('Headers:', req.headers);

    try {
      // Get user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user from database
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error('User not found');
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
  app.patch("/api/notifications/:id/read", async (req: TelegramRequest, res: Response) => {
    console.log('============ DEBUG: Mark Notification Read Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Params:', req.params);

    try {
      const { id } = req.params;
      
      // Get user from request
      const telegramUser = getTelegramUserFromRequest(req);
      if (!telegramUser) {
        console.error('No Telegram user found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Get user from database
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