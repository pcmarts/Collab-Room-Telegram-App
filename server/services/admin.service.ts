import { db } from "../db";
import {
  users, companies, collabApplications,
  type User, type CollabApplication
} from "../../shared/schema";
import { eq, desc, sql } from 'drizzle-orm';
import { storage } from "../storage"; // For setting admin status
import { logger } from '../utils/logger';
import { notifyUserApproved } from "../telegram"; // For user approval notification
import { sendApplicationStatusUpdate } from "../services/sse.service"; // Corrected import path

// --- User Management --- 

export async function checkAdminStatus(telegramId: string): Promise<{ success: boolean, isAdmin: boolean, userExists: boolean }> {
  try {
    const [user] = await db.select({ isAdmin: users.is_admin }).from(users).where(eq(users.telegram_id, telegramId));
    if (!user) {
      return { success: true, isAdmin: false, userExists: false };
    }
    return { success: true, isAdmin: !!user.isAdmin, userExists: true };
  } catch (error) {
    logger.error('Error checking admin status in service:', { telegramId, error });
    throw new Error("Failed to check admin status");
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.created_at)); // Or order as needed
    logger.debug(`Found ${allUsers.length} users in database`);
    return allUsers;
  } catch (error) {
    logger.error('Error fetching all users in service:', { error });
    throw new Error("Failed to fetch users");
  }
}

export async function setUserAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined> {
  logger.debug('Setting user admin status:', { userId, isAdmin });
  try {
    // Delegate to storage layer
    return await storage.setUserAdminStatus(userId, isAdmin);
  } catch (error) {
    logger.error('Error setting user admin status in service:', { userId, isAdmin, error });
    throw error; // Re-throw
  }
}

export async function approveUser(userId: string): Promise<User | undefined> {
  logger.debug('Approving user:', { userId });
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error("User not found");
    }
    if (user.is_approved) {
        logger.warn('Attempted to approve already approved user', { userId });
        return user; // Return the user without making changes
    }

    const [updatedUser] = await db.update(users)
      .set({ is_approved: true })
      .where(eq(users.id, userId))
      .returning();

    // Send Telegram notification
    try {
      await notifyUserApproved(parseInt(user.telegram_id));
      logger.info('Sent user approval notification', { telegramId: user.telegram_id });
    } catch (msgError) {
      logger.error('Failed to send user approval notification:', { userId, telegramId: user.telegram_id, error: msgError });
      // Do not fail the operation if notification fails
    }
      
    // Send real-time update via SSE
    try {
        sendApplicationStatusUpdate(
            userId, 
            'approved',
            'Your application has been approved! You can now access all platform features.'
        );
        logger.info('Sent SSE application status update for approval', { userId });
    } catch(sseError) {
        logger.error('Failed to send SSE update for user approval:', { userId, error: sseError });
    }

    return updatedUser;
  } catch (error) {
    logger.error('Error approving user in service:', { userId, error });
    throw error; // Re-throw
  }
}

// --- Application Management ---

export async function getAllApplications(): Promise<any[]> { // Use a more specific type if possible
  logger.debug('Fetching all applications (admin)');
  try {
    // Fetch applications and join with user/company data for context
    const allApplications = await db
      .select({
        application: collabApplications,
        user: {
          id: users.id,
          firstName: users.first_name,
          lastName: users.last_name,
          handle: users.handle,
          email: users.email,
          isAdmin: users.is_admin,
          isApproved: users.is_approved,
          createdAt: users.created_at
        },
        company: {
          name: companies.name,
          website: companies.website,
          jobTitle: companies.job_title
        }
      })
      .from(collabApplications)
      .leftJoin(users, eq(collabApplications.applicant_id, users.id))
      .leftJoin(companies, eq(users.id, companies.user_id))
      .orderBy(desc(collabApplications.created_at)); 
      
      logger.debug(`Found ${allApplications.length} applications`);
      return allApplications;
      
  } catch (error) {
    logger.error('Error fetching all applications in service:', { error });
    throw new Error("Failed to fetch applications");
  }
} 