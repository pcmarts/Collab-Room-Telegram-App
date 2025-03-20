import { 
  users, companies, collaborations, collab_applications, collab_notifications, 
  notification_preferences, marketing_preferences, conference_preferences,
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication,
  type CollabNotification, type InsertCollabNotification,
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
      
      // If Twitter co-marketing, ensure short_description is preserved
      if (collabData.collab_type === 'Co-Marketing on Twitter' && 
          collabData.details.short_description) {
        console.log("Preserving Twitter co-marketing short_description:", collabData.details.short_description);
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
    
    // Build the base query
    let query = db
      .select()
      .from(collaborations)
      .where(
        and(
          not(eq(collaborations.creator_id, userId)),
          eq(collaborations.status, 'active')
        )
      );
    
    // Apply type filters from request
    if (filters.collabTypes && filters.collabTypes.length > 0) {
      query = query.where(inArray(collaborations.collab_type, filters.collabTypes));
    }
    
    // Apply topic filters if enabled in marketing preferences
    if (marketingPrefs?.discovery_filter_topics_enabled && 
        marketingPrefs?.filtered_marketing_topics && 
        marketingPrefs.filtered_marketing_topics.length > 0) {
      
      console.log(`Filtering by excluded topics: ${marketingPrefs.filtered_marketing_topics.join(', ')}`);
      
      // This is a more complex filter - we want to exclude collaborations that have ANY of the filtered topics
      query = query.where(sql`NOT (${collaborations.topics} && ${marketingPrefs.filtered_marketing_topics}::text[])`);
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
      query = query.where(sql`${collaborations.required_funding_stages} && ${filters.fundingStages}::text[]`);
    }
    
    // Apply blockchain networks filter if enabled
    if (marketingPrefs?.discovery_filter_blockchain_networks_enabled && 
        filters.blockchainNetworks && 
        filters.blockchainNetworks.length > 0) {
      query = query.where(sql`${collaborations.company_blockchain_networks} && ${filters.blockchainNetworks}::text[]`);
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