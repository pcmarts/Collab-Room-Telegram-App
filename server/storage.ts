import { 
  users, companies, collaborations, collab_applications, collab_notifications, preferences,
  type User, type InsertUser,
  type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication,
  type CollabNotification, type InsertCollabNotification,
  type Preferences
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, isNull, not, desc, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Collaboration methods
  createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration>;
  getCollaboration(id: string): Promise<Collaboration | undefined>;
  getUserCollaborations(userId: string): Promise<Collaboration[]>;
  searchCollaborations(userId: string, filters: CollaborationFilters): Promise<Collaboration[]>;
  
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
  
  // User preferences
  getUserPreferences(userId: string): Promise<Preferences | undefined>;
  updateUserPreferences(userId: string, preferences: Partial<Preferences>): Promise<Preferences | undefined>;
}

export interface CollaborationFilters {
  collabTypes?: string[];
  companyTags?: string[];
  minCompanyFollowers?: string;
  minUserFollowers?: string;
  hasToken?: boolean;
  fundingStages?: string[];
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
  
  // Collaboration methods
  async createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration> {
    const [newCollaboration] = await db
      .insert(collaborations)
      .values(collaboration)
      .returning();
    return newCollaboration;
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
    let query = db
      .select()
      .from(collaborations)
      .where(
        and(
          not(eq(collaborations.creator_id, userId)),
          eq(collaborations.status, 'active')
        )
      );
    
    // Apply filters
    if (filters.collabTypes && filters.collabTypes.length > 0) {
      query = query.where(inArray(collaborations.collab_type, filters.collabTypes));
    }
    
    // Other filters would be added here...
    
    return query.orderBy(desc(collaborations.created_at));
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
  
  // User preferences
  async getUserPreferences(userId: string): Promise<Preferences | undefined> {
    const [userPreferences] = await db
      .select()
      .from(preferences)
      .where(eq(preferences.user_id, userId));
    return userPreferences;
  }
  
  async updateUserPreferences(userId: string, prefs: Partial<Preferences>): Promise<Preferences | undefined> {
    // Check if preferences exist for this user
    const existingPrefs = await this.getUserPreferences(userId);
    
    if (existingPrefs) {
      // Update existing preferences
      const [updatedPrefs] = await db
        .update(preferences)
        .set(prefs)
        .where(eq(preferences.id, existingPrefs.id))
        .returning();
      return updatedPrefs;
    } else {
      // Create new preferences
      const [newPrefs] = await db
        .insert(preferences)
        .values({
          user_id: userId,
          notification_frequency: prefs.notification_frequency || 'Daily',
          collabs_to_discover: prefs.collabs_to_discover || [],
          collabs_to_host: prefs.collabs_to_host || [],
          excluded_tags: prefs.excluded_tags || []
        })
        .returning();
      return newPrefs;
    }
  }
}

export const storage = new DatabaseStorage();