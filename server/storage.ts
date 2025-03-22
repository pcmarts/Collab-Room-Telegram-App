import { 
  users, companies, collaborations, collab_applications, collab_notifications, swipes,
  notification_preferences, marketing_preferences, conference_preferences,
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication,
  type CollabNotification, type InsertCollabNotification,
  type Swipe, type InsertSwipe,
  type NotificationPreferences, type MarketingPreferences, type ConferencePreferences
} from "@shared/schema";
import { z } from 'zod';
import { db } from "./db";
import { eq, and, inArray, isNull, not, desc, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined>;
  
  // Collaboration methods
  createCollaboration(collaboration: any): Promise<Collaboration>;
  getCollaboration(id: string): Promise<Collaboration | undefined>;
  getUserCollaborations(userId: string): Promise<Collaboration[]>;
  searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]>;
  updateCollaborationStatus(id: string, status: string): Promise<Collaboration | undefined>;
  
  // Collaboration applications
  applyToCollaboration(application: InsertCollabApplication): Promise<CollabApplication>;
  getCollaborationApplications(collaborationId: string): Promise<CollabApplication[]>;
  getUserApplications(userId: string): Promise<CollabApplication[]>;
  updateApplicationStatus(id: string, status: string): Promise<CollabApplication | undefined>;
  
  // Swipe methods
  createSwipe(swipe: InsertSwipe): Promise<Swipe>;
  getUserSwipes(userId: string): Promise<Swipe[]>;
  getCollaborationSwipes(collaborationId: string): Promise<Swipe[]>;
  getPotentialMatchesForHost(userId: string): Promise<any[]>; // Get users who swiped right on host's collaborations
  
  // Notification methods
  createNotification(notification: InsertCollabNotification): Promise<CollabNotification>;
  getUserNotifications(userId: string): Promise<CollabNotification[]>;
  markNotificationAsRead(id: string): Promise<CollabNotification | undefined>;
  markNotificationAsSent(id: string): Promise<CollabNotification | undefined>;
  
  // Notification preferences
  getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined>;
  updateUserNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences | undefined>;
  
  // Marketing preferences
  getUserMarketingPreferences(userId: string): Promise<MarketingPreferences | undefined>;
  updateUserMarketingPreferences(userId: string, preferences: Partial<MarketingPreferences>): Promise<MarketingPreferences | undefined>;
  
  // Conference preferences
  getUserConferencePreferences(userId: string): Promise<ConferencePreferences | undefined>;
  updateUserConferencePreferences(userId: string, preferences: Partial<ConferencePreferences>): Promise<ConferencePreferences | undefined>;
}

export interface CollaborationFilters {
  collabTypes?: string[];
  companyTags?: string[];
  minCompanyFollowers?: string;
  minUserFollowers?: string;
  hasToken?: boolean;
  fundingStages?: string[];
  blockchainNetworks?: string[];
  excludeOwn?: boolean; // Controls whether to exclude collaborations created by the current user
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async setUserAdminStatus(id: string, isAdmin: boolean): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ is_admin: isAdmin })
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user admin status:", error);
      throw error;
    }
  }
  
  // Collaboration methods
  async createCollaboration(collaboration: any): Promise<Collaboration> {
    console.log("Creating collaboration with data:", collaboration);
    
    // Make a clean copy
    let collabData = { ...collaboration };
    
    // Validate creator_id is present
    if (!collabData.creator_id) {
      console.error("Missing creator_id in collaboration data");
      throw new Error("creator_id is required for collaboration creation");
    }
    
    // Handle specific_date - remove if not needed
    if (collabData.date_type === 'any_future_date') {
      console.log("Removing specific_date for any_future_date option");
      delete collabData.specific_date;
    } else if (collabData.date_type === 'specific_date' && collabData.specific_date) {
      // Ensure it's a string in YYYY-MM-DD format
      console.log("Formatting specific_date:", collabData.specific_date);
      // specific_date is already a string from our schema change
    }
    
    // Process the details object - ensure all details are preserved
    if (collabData.details) {
      console.log("Processing details object:", collabData.details);
      
      // Check if description is already set from client code
      if (collabData.description) {
        console.log("Description already set from client:", collabData.description);
      } else {
        // No longer extract short_description from details as we've migrated to root-level description
        console.log("No description provided, setting empty string as default");
        collabData.description = "";
      }
      
      // Process collaboration type-specific details
      if (collabData.collab_type === 'Co-Marketing on Twitter') {
        console.log("Processing Twitter co-marketing details:", collabData.details);
        
        // Ensure twittercomarketing_type is properly formatted as an array
        if (collabData.details.twittercomarketing_type) {
          if (!Array.isArray(collabData.details.twittercomarketing_type)) {
            collabData.details.twittercomarketing_type = [collabData.details.twittercomarketing_type];
            console.log("Converted twittercomarketing_type to array:", collabData.details.twittercomarketing_type);
          }
        }
      } else if (collabData.collab_type === 'Twitter Spaces Guest') {
        console.log("Processing Twitter Spaces Guest details:", collabData.details);
      }
    }
    
    // Ensure array fields are properly formatted
    const preparedData = {
      ...collabData,
      // Make sure each array field is properly formatted as an array of strings
      topics: Array.isArray(collabData.topics) 
        ? collabData.topics.map((topic: any) => String(topic))
        : (collabData.topics ? [String(collabData.topics)] : []),
      required_company_sectors: Array.isArray(collabData.required_company_sectors) 
        ? collabData.required_company_sectors.map((sector: any) => String(sector))
        : (collabData.required_company_sectors ? [String(collabData.required_company_sectors)] : []),
      required_funding_stages: Array.isArray(collabData.required_funding_stages) 
        ? collabData.required_funding_stages.map((stage: any) => String(stage))
        : (collabData.required_funding_stages ? [String(collabData.required_funding_stages)] : []),
      
      // Special handling based on collaboration type
      details: (() => {
        // Twitter co-marketing special handling
        if (collabData.collab_type === 'Co-Marketing on Twitter') {
          return {
            twittercomarketing_type: Array.isArray(collabData.details?.twittercomarketing_type)
              ? collabData.details.twittercomarketing_type
              : (collabData.details?.twittercomarketing_type ? [collabData.details.twittercomarketing_type] : ["Thread Collab"]),
            host_twitter_handle: collabData.details?.host_twitter_handle || "https://x.com/",
            host_follower_count: collabData.details?.host_follower_count || "0-1K"
            // No longer add short_description to details as we're using root-level description
          };
        }
        // Twitter Spaces Guest special handling
        else if (collabData.collab_type === 'Twitter Spaces Guest') {
          return {
            twitter_handle: collabData.details?.twitter_handle || "https://x.com/",
            host_follower_count: collabData.details?.host_follower_count || "0-1K"
            // No longer add short_description to details as we're using root-level description
          };
        }
        // Default to original details
        return collabData.details;
      })(),
      
      // Ensure description is set
      description: collabData.description || "",
      
      created_at: new Date(),
      updated_at: new Date()
    };
    
    console.log("Final prepared data:", preparedData);
    
    try {
      const [newCollaboration] = await db
        .insert(collaborations)
        .values(preparedData)
        .returning();
      return newCollaboration;
    } catch (error) {
      console.error("Database error inserting collaboration:", error);
      throw error;
    }
  }
  
  async getCollaboration(id: string): Promise<Collaboration | undefined> {
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, id));
    return collaboration;
  }
  
  async getUserCollaborations(userId: string): Promise<Collaboration[]> {
    return db
      .select()
      .from(collaborations)
      .where(eq(collaborations.creator_id, userId))
      .orderBy(desc(collaborations.created_at));
  }
  
  async searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]> {
    // First get the user's marketing preferences to apply any filtering
    const marketingPrefs = await this.getUserMarketingPreferences(userId);
    
    // Get user's previous swipes to exclude already swiped collaborations
    const userSwipes = await this.getUserSwipes(userId);
    const swipedCollaborationIds = userSwipes.map(swipe => swipe.collaboration_id);
    
    console.log(`Found ${userSwipes.length} previous swipes by user ${userId}`);
    
    // Get user's own collaborations to ensure they're properly excluded
    const userCollaborations = await this.getUserCollaborations(userId);
    const userCollaborationIds = userCollaborations.map(collab => collab.id);
    
    console.log(`Found ${userCollaborations.length} collaborations created by user ${userId}`);
    
    // Create a combined array of IDs to exclude (both user's own and previously swiped)
    // Use simple concatenation and filtering to remove duplicates
    const allIds = [...userCollaborationIds, ...swipedCollaborationIds];
    const excludeIds = allIds.filter((id, index) => allIds.indexOf(id) === index);
    console.log(`Total IDs to exclude: ${excludeIds.length} (${userCollaborationIds.length} own + ${swipedCollaborationIds.length} swiped)`);
    
    // Build the base query - we'll handle all exclusions together 
    let query = db
      .select()
      .from(collaborations)
      .where(
        eq(collaborations.status, 'active')
      );
    
    // Exclude both user's own collaborations and previously swiped ones
    if (excludeIds.length > 0) {
      console.log(`Excluding ${excludeIds.length} total collaborations from results`);
      query = query.where(not(inArray(collaborations.id, excludeIds)));
    } else {
      // Fallback if no IDs to exclude but we still want to exclude own collaborations
      if (filters.excludeOwn === undefined || filters.excludeOwn === true) {
        console.log('No specific IDs to exclude, using fallback creator_id filtering');
        query = query.where(not(eq(collaborations.creator_id, userId)));
      }
    }
    
    // Apply type filters from request
    if (filters.collabTypes && filters.collabTypes.length > 0) {
      query = query.where(inArray(collaborations.collab_type, filters.collabTypes));
    }
    
    // Apply topic filters if enabled in marketing preferences
    if (marketingPrefs?.discovery_filter_topics_enabled && 
        marketingPrefs?.filtered_marketing_topics && 
        marketingPrefs.filtered_marketing_topics.length > 0) {
      
      console.log(`Filtering by excluded topics: ${marketingPrefs.filtered_marketing_topics.join(', ')}`);
      
      // For array parameters, we need to ensure proper PostgreSQL array format
      // Convert JavaScript array to PostgreSQL array format string: {item1,item2,item3}
      const pgArrayStr = '{' + marketingPrefs.filtered_marketing_topics.join(',') + '}';
      console.log(`Converting to PostgreSQL array format: ${pgArrayStr}`);
      
      // This is a more complex filter - we want to exclude collaborations that have ANY of the filtered topics
      query = query.where(sql`NOT (${collaborations.topics} && ${pgArrayStr}::text[])`);
    }
    
    // Apply company followers filter if enabled
    if (marketingPrefs?.discovery_filter_company_followers_enabled && filters.minCompanyFollowers) {
      query = query.where(sql`${collaborations.min_company_followers} >= ${filters.minCompanyFollowers}`);
    }
    
    // Apply user followers filter if enabled
    if (marketingPrefs?.discovery_filter_user_followers_enabled && filters.minUserFollowers) {
      query = query.where(sql`${collaborations.min_user_followers} >= ${filters.minUserFollowers}`);
    }
    
    // Apply token status filter if enabled
    if (marketingPrefs?.discovery_filter_token_status_enabled && filters.hasToken !== undefined) {
      query = query.where(eq(collaborations.required_token_status, filters.hasToken));
    }
    
    // Apply funding stages filter if enabled
    if (marketingPrefs?.discovery_filter_funding_stages_enabled && 
        filters.fundingStages && 
        filters.fundingStages.length > 0) {
      // Convert to PostgreSQL array format
      const fundingStagesPgArray = '{' + filters.fundingStages.join(',') + '}';
      console.log(`Converting funding stages to PostgreSQL array format: ${fundingStagesPgArray}`);
      
      query = query.where(sql`${collaborations.required_funding_stages} && ${fundingStagesPgArray}::text[]`);
    }
    
    // Apply blockchain networks filter if enabled
    if (marketingPrefs?.discovery_filter_blockchain_networks_enabled && 
        filters.blockchainNetworks && 
        filters.blockchainNetworks.length > 0) {
      // Convert to PostgreSQL array format
      const networksPgArray = '{' + filters.blockchainNetworks.join(',') + '}';
      console.log(`Converting blockchain networks to PostgreSQL array format: ${networksPgArray}`);
      
      query = query.where(sql`${collaborations.company_blockchain_networks} && ${networksPgArray}::text[]`);
    }
    
    return query.orderBy(desc(collaborations.created_at));
  }
  
  async updateCollaborationStatus(id: string, status: string): Promise<Collaboration | undefined> {
    try {
      // Make sure status is either 'active' or 'paused'
      if (status !== 'active' && status !== 'paused') {
        throw new Error('Invalid status value. Status must be either "active" or "paused".');
      }
      
      const [updatedCollaboration] = await db
        .update(collaborations)
        .set({ 
          status,
          updated_at: new Date()
        })
        .where(eq(collaborations.id, id))
        .returning();
        
      return updatedCollaboration;
    } catch (error) {
      console.error("Error updating collaboration status:", error);
      throw error;
    }
  }
  
  // Collaboration applications
  async applyToCollaboration(application: InsertCollabApplication): Promise<CollabApplication> {
    const [newApplication] = await db
      .insert(collab_applications)
      .values(application)
      .returning();
    return newApplication;
  }
  
  async getCollaborationApplications(collaborationId: string): Promise<CollabApplication[]> {
    return db
      .select()
      .from(collab_applications)
      .where(eq(collab_applications.collaboration_id, collaborationId))
      .orderBy(desc(collab_applications.created_at));
  }
  
  async getUserApplications(userId: string): Promise<CollabApplication[]> {
    return db
      .select()
      .from(collab_applications)
      .where(eq(collab_applications.applicant_id, userId))
      .orderBy(desc(collab_applications.created_at));
  }
  
  async updateApplicationStatus(id: string, status: string): Promise<CollabApplication | undefined> {
    const [application] = await db
      .update(collab_applications)
      .set({ 
        status, 
        updated_at: new Date()
      })
      .where(eq(collab_applications.id, id))
      .returning();
    return application;
  }
  
  // Notification methods
  async createNotification(notification: InsertCollabNotification): Promise<CollabNotification> {
    const [newNotification] = await db
      .insert(collab_notifications)
      .values(notification)
      .returning();
    return newNotification;
  }
  
  async getUserNotifications(userId: string): Promise<CollabNotification[]> {
    return db
      .select()
      .from(collab_notifications)
      .where(eq(collab_notifications.user_id, userId))
      .orderBy(desc(collab_notifications.created_at));
  }
  
  async markNotificationAsRead(id: string): Promise<CollabNotification | undefined> {
    const [notification] = await db
      .update(collab_notifications)
      .set({ is_read: true })
      .where(eq(collab_notifications.id, id))
      .returning();
    return notification;
  }
  
  async markNotificationAsSent(id: string): Promise<CollabNotification | undefined> {
    const [notification] = await db
      .update(collab_notifications)
      .set({ is_sent: true })
      .where(eq(collab_notifications.id, id))
      .returning();
    return notification;
  }
  
  // Swipe methods
  async createSwipe(swipe: InsertSwipe): Promise<Swipe> {
    try {
      const [newSwipe] = await db
        .insert(swipes)
        .values(swipe)
        .returning();
      return newSwipe;
    } catch (error) {
      console.error("Error creating swipe:", error);
      throw error;
    }
  }
  
  async getUserSwipes(userId: string): Promise<Swipe[]> {
    try {
      return db
        .select()
        .from(swipes)
        .where(eq(swipes.user_id, userId))
        .orderBy(desc(swipes.created_at));
    } catch (error) {
      console.error("Error getting user swipes:", error);
      throw error;
    }
  }
  
  async getCollaborationSwipes(collaborationId: string): Promise<Swipe[]> {
    try {
      return db
        .select()
        .from(swipes)
        .where(eq(swipes.collaboration_id, collaborationId))
        .orderBy(desc(swipes.created_at));
    } catch (error) {
      console.error("Error getting collaboration swipes:", error);
      throw error;
    }
  }
  
  async getPotentialMatchesForHost(userId: string): Promise<any[]> {
    try {
      // 1. Get all collaborations created by this user
      const userCollabs = await this.getUserCollaborations(userId);
      if (!userCollabs.length) {
        return [];
      }
      
      const collabIds = userCollabs.map(collab => collab.id);
      
      // 2. Find all right swipes by other users on these collaborations
      const rightSwipes = await db
        .select({
          swipe: swipes,
          user: users,
          company: companies,
          collaboration: collaborations
        })
        .from(swipes)
        .where(and(
          inArray(swipes.collaboration_id, collabIds),
          eq(swipes.direction, 'right') // Only get right swipes (interest)
        ))
        .innerJoin(users, eq(swipes.user_id, users.id))
        .innerJoin(companies, eq(users.id, companies.user_id))
        .innerJoin(collaborations, eq(swipes.collaboration_id, collaborations.id))
        .orderBy(desc(swipes.created_at));
      
      // 3. Filter out users that the host has already swiped on
      // Get all swipes made by the host
      const hostSwipes = await this.getUserSwipes(userId);
      const hostSwipeMap = new Map();
      
      // Create a map of user_id -> collaboration_id -> direction
      // This lets us quickly check if the host has already swiped on a particular user for a particular collab
      hostSwipes.forEach(swipe => {
        if (!hostSwipeMap.has(swipe.user_id)) {
          hostSwipeMap.set(swipe.user_id, new Map());
        }
        hostSwipeMap.get(swipe.user_id).set(swipe.collaboration_id, swipe.direction);
      });
      
      // Filter out already-swiped users
      const potentialMatches = rightSwipes.filter(match => {
        const userMap = hostSwipeMap.get(match.user.id);
        if (!userMap) return true; // Host hasn't swiped on this user at all
        
        // Check if host has swiped on this user for this collaboration
        return !userMap.has(match.collaboration.id);
      });
      
      // 4. Format the data for the frontend
      return potentialMatches.map(match => ({
        id: match.swipe.id,
        swipe_id: match.swipe.id,
        user_id: match.user.id,
        collaboration_id: match.collaboration.id,
        collaboration_type: match.collaboration.collab_type,
        collaboration_description: match.collaboration.description,
        collaboration_topics: match.collaboration.topics,
        swipe_direction: match.swipe.direction,
        swipe_created_at: match.swipe.created_at,
        user_first_name: match.user.first_name,
        user_last_name: match.user.last_name,
        user_twitter_followers: match.user.twitter_followers,
        company_name: match.company.name,
        company_job_title: match.company.job_title,
        company_twitter_followers: match.company.twitter_followers,
        requester_company: match.company.name,
        requester_role: match.company.job_title
      }));
    } catch (error) {
      console.error("Error getting potential matches for host:", error);
      throw error;
    }
  }
  
  // Notification preferences
  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | undefined> {
    const [userPreferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userId));
    return userPreferences;
  }
  
  async updateUserNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences | undefined> {
    // Check if notification preferences exist for this user
    const existingPrefs = await this.getUserNotificationPreferences(userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(notification_preferences)
        .set(prefs)
        .where(eq(notification_preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(notification_preferences)
        .values({
          user_id: userId,
          notifications_enabled: prefs.notifications_enabled !== undefined ? prefs.notifications_enabled : true,
          notification_frequency: prefs.notification_frequency || 'Daily'
        })
        .returning();
      return newPrefs;
    }
  }
  
  // Marketing preferences methods
  async getUserMarketingPreferences(userId: string): Promise<MarketingPreferences | undefined> {
    const [userPreferences] = await db
      .select()
      .from(marketing_preferences)
      .where(eq(marketing_preferences.user_id, userId));
    return userPreferences;
  }
  
  async updateUserMarketingPreferences(userId: string, prefs: Partial<MarketingPreferences>): Promise<MarketingPreferences | undefined> {
    // Check if preferences exist for this user
    const existingPrefs = await this.getUserMarketingPreferences(userId);
    
    // Ensure all array fields are properly initialized and validated
    const safePrefs = {
      ...prefs,
      collabs_to_discover: Array.isArray(prefs.collabs_to_discover) ? prefs.collabs_to_discover : [],
      collabs_to_host: Array.isArray(prefs.collabs_to_host) ? prefs.collabs_to_host : [],
      twitter_collabs: Array.isArray(prefs.twitter_collabs) ? prefs.twitter_collabs : [],
      filtered_marketing_topics: Array.isArray(prefs.filtered_marketing_topics) ? prefs.filtered_marketing_topics : [],
      company_blockchain_networks: Array.isArray(prefs.company_blockchain_networks) ? prefs.company_blockchain_networks : []
    };
    
    console.log("STORAGE: Saving marketing preferences with arrays:", {
      collabs_to_discover: safePrefs.collabs_to_discover,
      collabs_to_host: safePrefs.collabs_to_host,
      twitter_collabs: safePrefs.twitter_collabs,
      filtered_marketing_topics: safePrefs.filtered_marketing_topics,
      company_blockchain_networks: safePrefs.company_blockchain_networks
    });
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(marketing_preferences)
        .set(safePrefs)
        .where(eq(marketing_preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(marketing_preferences)
        .values({
          user_id: userId,
          collabs_to_discover: safePrefs.collabs_to_discover,
          collabs_to_host: safePrefs.collabs_to_host,
          twitter_collabs: safePrefs.twitter_collabs,
          filtered_marketing_topics: safePrefs.filtered_marketing_topics,
          company_blockchain_networks: safePrefs.company_blockchain_networks,
          discovery_filter_enabled: prefs.discovery_filter_enabled || false,
          discovery_filter_topics_enabled: prefs.discovery_filter_topics_enabled || false,
          discovery_filter_company_followers_enabled: prefs.discovery_filter_company_followers_enabled || false,
          discovery_filter_user_followers_enabled: prefs.discovery_filter_user_followers_enabled || false,
          discovery_filter_funding_stages_enabled: prefs.discovery_filter_funding_stages_enabled || false,
          discovery_filter_token_status_enabled: prefs.discovery_filter_token_status_enabled || false,
          discovery_filter_company_sectors_enabled: prefs.discovery_filter_company_sectors_enabled || false,
          discovery_filter_blockchain_networks_enabled: prefs.discovery_filter_blockchain_networks_enabled || false
        })
        .returning();
      return newPrefs;
    }
  }
  
  // Conference preferences methods
  async getUserConferencePreferences(userId: string): Promise<ConferencePreferences | undefined> {
    const [userPreferences] = await db
      .select()
      .from(conference_preferences)
      .where(eq(conference_preferences.user_id, userId));
    return userPreferences;
  }
  
  async updateUserConferencePreferences(userId: string, prefs: Partial<ConferencePreferences>): Promise<ConferencePreferences | undefined> {
    // Check if preferences exist for this user
    const existingPrefs = await this.getUserConferencePreferences(userId);
    
    // Ensure all array fields are properly initialized and validated
    const safePrefs = {
      ...prefs,
      coffee_match_company_sectors: Array.isArray(prefs.coffee_match_company_sectors) ? prefs.coffee_match_company_sectors : [],
      coffee_match_funding_stages: Array.isArray(prefs.coffee_match_funding_stages) ? prefs.coffee_match_funding_stages : [],
      filtered_conference_sectors: Array.isArray(prefs.filtered_conference_sectors) ? prefs.filtered_conference_sectors : []
    };
    
    console.log("STORAGE: Saving conference preferences with arrays:", {
      coffee_match_company_sectors: safePrefs.coffee_match_company_sectors,
      coffee_match_funding_stages: safePrefs.coffee_match_funding_stages,
      filtered_conference_sectors: safePrefs.filtered_conference_sectors
    });
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(conference_preferences)
        .set(safePrefs)
        .where(eq(conference_preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(conference_preferences)
        .values({
          user_id: userId,
          coffee_match_enabled: prefs.coffee_match_enabled || false,
          coffee_match_company_sectors: safePrefs.coffee_match_company_sectors,
          coffee_match_company_followers: prefs.coffee_match_company_followers || null,
          coffee_match_user_followers: prefs.coffee_match_user_followers || null,
          coffee_match_funding_stages: safePrefs.coffee_match_funding_stages,
          coffee_match_token_status: prefs.coffee_match_token_status || false,
          filtered_conference_sectors: safePrefs.filtered_conference_sectors, 
          coffee_match_filter_company_sectors_enabled: prefs.coffee_match_filter_company_sectors_enabled || false,
          coffee_match_filter_company_followers_enabled: prefs.coffee_match_filter_company_followers_enabled || false,
          coffee_match_filter_user_followers_enabled: prefs.coffee_match_filter_user_followers_enabled || false,
          coffee_match_filter_funding_stages_enabled: prefs.coffee_match_filter_funding_stages_enabled || false,
          coffee_match_filter_token_status_enabled: prefs.coffee_match_filter_token_status_enabled || false
        })
        .returning();
      return newPrefs;
    }
  }
}

export const storage = new DatabaseStorage();