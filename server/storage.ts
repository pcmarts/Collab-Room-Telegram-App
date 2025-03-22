import { 
  users, companies, collaborations, collab_applications, collab_notifications, 
  notification_preferences, marketing_preferences, conference_preferences,
  swipes,
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication,
  type CollabNotification, type InsertCollabNotification,
  type NotificationPreferences, type MarketingPreferences, type ConferencePreferences,
  type Swipe, type InsertSwipe
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
  
  // Swipe methods
  createSwipe(swipe: InsertSwipe): Promise<Swipe>;
  getUserSwipes(userId: string): Promise<Swipe[]>;
  getDiscoveryCards(userId: string, filters: CollaborationFilters): Promise<Collaboration[]>;
  undoLastSwipe(userId: string): Promise<boolean>;
  
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
    console.log(`searchCollaborations - Starting search for user: ${userId}`);
    console.log(`searchCollaborations - Filters provided:`, JSON.stringify(filters));
    
    // First get the user's marketing preferences to apply any filtering
    const marketingPrefs = await this.getUserMarketingPreferences(userId);
    console.log(`searchCollaborations - User marketing preferences:`, 
      marketingPrefs 
        ? `Found, discovery_filter_enabled: ${marketingPrefs.discovery_filter_enabled}` 
        : 'Not found'
    );
    
    // Show all collaborations available for debugging
    const allCollabs = await db
      .select({
        id: collaborations.id,
        creator_id: collaborations.creator_id,
        collab_type: collaborations.collab_type,
        status: collaborations.status,
        title: collaborations.title
      })
      .from(collaborations);
      
    console.log(`Total collaborations in database before filtering: ${allCollabs.length}`);
    for (const collab of allCollabs) {
      console.log(`Collab: ${collab.id}, Type: ${collab.collab_type}, Status: ${collab.status}, Title: ${collab.title}`);
    }
    
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
    
    // Show active collaborations not created by this user
    const baseFilteredCollabs = await db
      .select({
        id: collaborations.id,
        collab_type: collaborations.collab_type,
        title: collaborations.title
      })
      .from(collaborations)
      .where(
        and(
          not(eq(collaborations.creator_id, userId)),
          eq(collaborations.status, 'active')
        )
      );
      
    console.log(`Active collaborations not created by user before additional filtering: ${baseFilteredCollabs.length}`);
    for (const collab of baseFilteredCollabs) {
      console.log(`Active Collab: ${collab.id}, Type: ${collab.collab_type}, Title: ${collab.title}`);
    }
    
    // Apply type filters from explicit request parameters - these override preferences
    if (filters.collabTypes && filters.collabTypes.length > 0) {
      console.log(`searchCollaborations - Filtering by collab types: ${filters.collabTypes.join(', ')}`);
      query = query.where(inArray(collaborations.collab_type, filters.collabTypes));
    }
    
    // Only apply marketing preference filters if discovery filtering is enabled
    if (marketingPrefs?.discovery_filter_enabled) {
      console.log('User has discovery filters enabled, applying filters');
      
      // Apply topic filters if enabled in marketing preferences
      if (marketingPrefs.discovery_filter_topics_enabled && 
          marketingPrefs.filtered_marketing_topics && 
          marketingPrefs.filtered_marketing_topics.length > 0) {
        
        console.log(`Filtering by excluded topics: ${marketingPrefs.filtered_marketing_topics.join(', ')}`);
        
        // This is a more complex filter - we want to exclude collaborations that have ANY of the filtered topics
        query = query.where(sql`NOT (${collaborations.topics} && ${marketingPrefs.filtered_marketing_topics}::text[])`);
      }
      
      // Apply company followers filter if enabled
      if (marketingPrefs.discovery_filter_company_followers_enabled && filters.minCompanyFollowers) {
        console.log(`Filtering by min company followers: ${filters.minCompanyFollowers}`);
        query = query.where(sql`${collaborations.min_company_followers} >= ${filters.minCompanyFollowers}`);
      }
      
      // Apply user followers filter if enabled
      if (marketingPrefs.discovery_filter_user_followers_enabled && filters.minUserFollowers) {
        console.log(`Filtering by min user followers: ${filters.minUserFollowers}`);
        query = query.where(sql`${collaborations.min_user_followers} >= ${filters.minUserFollowers}`);
      }
      
      // Apply token status filter if enabled
      if (marketingPrefs.discovery_filter_token_status_enabled && filters.hasToken !== undefined) {
        console.log(`Filtering by token status: ${filters.hasToken}`);
        query = query.where(eq(collaborations.required_token_status, filters.hasToken));
      }
      
      // Apply funding stages filter if enabled
      if (marketingPrefs.discovery_filter_funding_stages_enabled && 
          filters.fundingStages && 
          filters.fundingStages.length > 0) {
        console.log(`Filtering by funding stages: ${filters.fundingStages.join(', ')}`);
        query = query.where(sql`${collaborations.required_funding_stages} && ${filters.fundingStages}::text[]`);
      }
      
      // Apply blockchain networks filter if enabled
      if (marketingPrefs.discovery_filter_blockchain_networks_enabled && 
          filters.blockchainNetworks && 
          filters.blockchainNetworks.length > 0) {
        console.log(`Filtering by blockchain networks: ${filters.blockchainNetworks.join(', ')}`);
        query = query.where(sql`${collaborations.company_blockchain_networks} && ${filters.blockchainNetworks}::text[]`);
      }
    } else {
      console.log('User has discovery filters disabled, showing all collaborations');
    }
    
    // First check how many collaborations exist in total for debugging
    const totalCollabs = await db
      .select({ count: sql<number>`count(*)` })
      .from(collaborations);
    console.log(`Total collaborations in database: ${totalCollabs[0]?.count || 0}`);
    
    // Check how many active collaborations not created by this user exist
    const activeCollabsNotByUser = await db
      .select({ count: sql<number>`count(*)` })
      .from(collaborations)
      .where(
        and(
          not(eq(collaborations.creator_id, userId)),
          eq(collaborations.status, 'active')
        )
      );
    console.log(`Active collaborations not created by user: ${activeCollabsNotByUser[0]?.count || 0}`);
    
    // Execute the query
    const results = await query.orderBy(desc(collaborations.created_at));
    console.log(`searchCollaborations - Found ${results.length} matching collaborations`);
    
    return results;
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
  
  // Swipe methods
  async createSwipe(swipe: InsertSwipe): Promise<Swipe> {
    try {
      // Make sure direction is either 'left' or 'right'
      if (swipe.direction !== 'left' && swipe.direction !== 'right') {
        throw new Error('Invalid swipe direction. Direction must be either "left" or "right".');
      }
      
      const [newSwipe] = await db
        .insert(swipes)
        .values(swipe)
        .returning();
      
      // If this is a right swipe (request to collaborate), check for a match
      if (swipe.direction === 'right') {
        // Get the collaboration that was swiped on
        const collaboration = await this.getCollaboration(swipe.collaboration_id);
        
        if (collaboration) {
          // Create a notification for the collaboration creator about the interest
          await this.createNotification({
            user_id: collaboration.creator_id,
            collaboration_id: collaboration.id,
            type: 'new_interest',
            content: `Someone is interested in your "${collaboration.collab_type}" collaboration.`,
            is_read: false,
            is_sent: false
          });
        }
      }
      
      return newSwipe;
    } catch (error) {
      console.error("Error creating swipe:", error);
      throw error;
    }
  }
  
  async getUserSwipes(userId: string): Promise<Swipe[]> {
    return db
      .select()
      .from(swipes)
      .where(eq(swipes.user_id, userId))
      .orderBy(desc(swipes.created_at));
  }
  
  async getDiscoveryCards(userId: string, filters: CollaborationFilters): Promise<Collaboration[]> {
    console.log(`getDiscoveryCards - SHOWING ALL ACTIVE COLLABORATIONS NOT BY USER (as requested)`);
    
    // Get all active collaborations not created by this user directly, bypassing filters
    const discoveryCards = await db
      .select()
      .from(collaborations)
      .where(
        and(
          not(eq(collaborations.creator_id, userId)),
          eq(collaborations.status, 'active')
        )
      )
      .orderBy(desc(collaborations.created_at));
    
    // Debug log
    console.log(`getDiscoveryCards - Found ${discoveryCards.length} active cards not created by user ${userId}`);
    if (discoveryCards.length > 0) {
      console.log('Cards to display in feed:');
      discoveryCards.forEach(card => {
        console.log(`- Card ID: ${card.id}, Type: ${card.collab_type}, Creator: ${card.creator_id}`);
      });
    }
    
    return discoveryCards;
  }
  
  async undoLastSwipe(userId: string): Promise<boolean> {
    try {
      // Get the user's most recent swipe
      const [lastSwipe] = await db
        .select()
        .from(swipes)
        .where(eq(swipes.user_id, userId))
        .orderBy(desc(swipes.created_at))
        .limit(1);
      
      if (!lastSwipe) {
        return false; // No swipes to undo
      }
      
      // Delete the last swipe
      const result = await db
        .delete(swipes)
        .where(eq(swipes.id, lastSwipe.id));
      
      return true;
    } catch (error) {
      console.error("Error undoing last swipe:", error);
      return false;
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