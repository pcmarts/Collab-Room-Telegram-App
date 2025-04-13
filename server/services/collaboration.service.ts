import { db } from "../db";
import {
  users, collaborations, /* collabApplications removed - table doesn't exist */
  type User, type Collaboration, type InsertCollaboration, 
  type CollabApplication, type InsertCollabApplication
} from "../../shared/schema";
import { eq, and, desc, sql } from 'drizzle-orm';
import { storage, type CollaborationFilters, type PaginatedCollaborations } from "../storage"; // Assuming storage handles DB interactions
import { logger } from '../utils/logger';
import { notifyNewCollabRequest, notifyMatchCreated } from "../telegram"; // Needed for application/match logic

// --- Collaboration Retrieval --- 

export async function getUserCollaborations(userId: string): Promise<Collaboration[]> {
  logger.debug('Fetching collaborations for user:', { userId });
  try {
    // Delegate to storage layer method
    return await storage.getUserCollaborations(userId);
  } catch (error) {
    logger.error('Error fetching user collaborations in service:', { userId, error });
    throw error;
  }
}

export async function searchCollaborationsPaginated(userId: string, filters: CollaborationFilters): Promise<PaginatedCollaborations> {
  logger.debug('Searching collaborations with pagination:', { userId, filters });
  try {
    // Delegate to storage layer method
    return await storage.searchCollaborationsPaginated(userId, filters);
  } catch (error) {
    logger.error('Error searching collaborations in service:', { userId, error });
    throw error;
  }
}

export async function getCollaborationById(collaborationId: string): Promise<Collaboration | undefined> {
  logger.debug('Fetching collaboration by ID:', { collaborationId });
  try {
    // Delegate to storage layer method
    return await storage.getCollaboration(collaborationId);
  } catch (error) {
    logger.error('Error fetching collaboration by ID in service:', { collaborationId, error });
    throw error;
  }
}

// --- Collaboration Creation & Modification --- 

export async function createCollaboration(creatorId: string, collabData: any): Promise<Collaboration> {
  logger.debug('Creating new collaboration:', { creatorId, collabData });
  try {
    // Add creator_id before passing to storage
    const dataWithCreator = { ...collabData, creator_id: creatorId };
    // Delegate validation and creation to storage layer method
    return await storage.createCollaboration(dataWithCreator);
  } catch (error) {
    logger.error('Error creating collaboration in service:', { creatorId, error });
    throw error;
  }
}

export async function updateCollaboration(collaborationId: string, userId: string, collabData: Partial<Collaboration>): Promise<Collaboration | undefined> {
  logger.debug('Updating collaboration:', { collaborationId, userId });
  try {
    // Verify ownership before updating
    const [existingCollab] = await db.select({ creator_id: collaborations.creator_id })
                                     .from(collaborations)
                                     .where(eq(collaborations.id, collaborationId));

    if (!existingCollab) {
      throw new Error("Collaboration not found");
    }
    if (existingCollab.creator_id !== userId) {
      throw new Error("Unauthorized to update this collaboration");
    }

    // Update the collaboration
    const [updatedCollab] = await db.update(collaborations)
      .set({ ...collabData, updated_at: new Date() })
      .where(eq(collaborations.id, collaborationId))
      .returning();

    return updatedCollab;
  } catch (error) {
    logger.error('Error updating collaboration in service:', { collaborationId, userId, error });
    throw error;
  }
}

export async function updateCollaborationStatus(collaborationId: string, userId: string, status: 'active' | 'inactive' | 'completed'): Promise<Collaboration | undefined> {
  logger.debug('Updating collaboration status:', { collaborationId, userId, status });
  try {
     // Verify ownership before updating status
    const [existingCollab] = await db.select({ creator_id: collaborations.creator_id })
                                     .from(collaborations)
                                     .where(eq(collaborations.id, collaborationId));

    if (!existingCollab) {
      throw new Error("Collaboration not found");
    }
    if (existingCollab.creator_id !== userId) {
      throw new Error("Unauthorized to update status for this collaboration");
    }
    
    // Delegate to storage layer method
    return await storage.updateCollaborationStatus(collaborationId, status);
  } catch (error) {
    logger.error('Error updating collaboration status in service:', { collaborationId, userId, status, error });
    throw error;
  }
}

// --- Collaboration Applications ---

export async function applyToCollaboration(collaborationId: string, applicantUserId: string, note?: string): Promise<CollabApplication> {
  logger.debug('Applying to collaboration:', { collaborationId, applicantUserId });
  try {
    // Since collabApplications no longer exists, check with storage layer instead
    const existingApplications = await storage.checkExistingApplication(collaborationId, applicantUserId);
    
    if (existingApplications && existingApplications.length > 0) {
        throw new Error("You have already applied to this collaboration.");
    }
    
    // Get collaboration details (needed by storage layer anyway for notifications)
    const collab = await getCollaborationById(collaborationId);
    if (!collab) {
      throw new Error("Collaboration not found");
    }

    // Prepare application data according to InsertCollabApplication type
    const applicationData: InsertCollabApplication = {
      collaboration_id: collaborationId,
      applicant_id: applicantUserId,
      status: 'pending',
      details: note ? { note } : {} // Store note in details JSON field
    };
    
    // Delegate to storage layer method
    const newApplication = await storage.applyToCollaboration(applicationData);

    return newApplication;
  } catch (error) {
    logger.error('Error applying to collaboration in service:', { collaborationId, applicantUserId, error });
    throw error;
  }
}

export async function getApplicationsForCollaboration(collaborationId: string, hostUserId: string): Promise<CollabApplication[]> {
   logger.debug('Fetching applications for collaboration:', { collaborationId, hostUserId });
   try {
    // Verify host owns the collaboration
    const [collab] = await db.select({ creator_id: collaborations.creator_id })
                             .from(collaborations)
                             .where(eq(collaborations.id, collaborationId));
    if (!collab) {
      throw new Error("Collaboration not found");
    }
    if (collab.creator_id !== hostUserId) {
      throw new Error("Unauthorized to view applications for this collaboration");
    }
    
    // Delegate to storage layer
    return await storage.getCollaborationApplications(collaborationId);
  } catch (error) {
    logger.error('Error fetching collaboration applications in service:', { collaborationId, hostUserId, error });
    throw error;
  }
}

export async function getUserApplications(userId: string): Promise<CollabApplication[]> {
  logger.debug('Fetching applications submitted by user:', { userId });
  try {
    // Delegate to storage layer
    return await storage.getUserApplications(userId);
  } catch (error) {
    logger.error('Error fetching user applications in service:', { userId, error });
    throw error;
  }
} 