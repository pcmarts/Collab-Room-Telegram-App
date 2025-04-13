import { Router, type Request, type Response } from "express";
import {
  getUserCollaborations,
  searchCollaborationsPaginated,
  getCollaborationById,
  createCollaboration,
  updateCollaboration,
  updateCollaborationStatus,
  applyToCollaboration,
  getApplicationsForCollaboration,
  getUserApplications
} from "../services/collaboration.service";
import { applicationLimiter, authLimiter } from "../middleware/rate-limiter";
import { db } from "../db"; // For user lookup
import { users } from "../../shared/schema"; // For user lookup
import { eq } from 'drizzle-orm'; // For user lookup
import { logger } from '../utils/logger';
import { createCollaborationSchema, collabApplicationSchema } from "../../shared/schema"; // Import Zod schemas for validation
import { z } from 'zod';
import { getTelegramUserFromRequest } from "../utils/auth.utils";

const collaborationRouter = Router();

// --- Collaboration Routes --- 

// GET /api/collaborations/my
collaborationRouter.get("/collaborations/my", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const myCollaborations = await getUserCollaborations(userId);
    return res.json(myCollaborations);
  } catch (error) {
    logger.error('Error in GET /collaborations/my route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/collaborations/search
collaborationRouter.post("/collaborations/search", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const filters = req.body;
    const results = await searchCollaborationsPaginated(userId, filters);
    return res.json(results);
  } catch (error) {
    logger.error('Error in POST /collaborations/search route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/collaborations/:id
collaborationRouter.get("/collaborations/:id", async (req: Request, res: Response) => {
  try {
    const collaborationId = req.params.id;
    const collaboration = await getCollaborationById(collaborationId);
    if (!collaboration) {
      return res.status(404).json({ error: "Collaboration not found" });
    }
    return res.json(collaboration);
  } catch (error) {
    logger.error('Error in GET /collaborations/:id route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/collaborations
collaborationRouter.post("/collaborations", authLimiter, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const validationResult = createCollaborationSchema.safeParse(req.body);
    if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid collaboration data", details: validationResult.error.errors });
    }
    const validatedData = validationResult.data;
    
    const newCollaboration = await createCollaboration(userId, validatedData);
    return res.status(201).json(newCollaboration);
  } catch (error) {
    logger.error('Error in POST /collaborations route:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create collaboration' });
  }
});

// PUT /api/collaborations/:id
collaborationRouter.put("/collaborations/:id", authLimiter, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  const collaborationId = req.params.id;
  try {
    const collabData = req.body;

    const updatedCollaboration = await updateCollaboration(collaborationId, userId, collabData);
    if (!updatedCollaboration) {
      return res.status(404).json({ error: "Collaboration not found or not authorized" });
    }
    return res.json(updatedCollaboration);
  } catch (error) {
    logger.error('Error in PUT /collaborations/:id route:', error);
    const statusCode = error instanceof Error && error.message.toLowerCase().includes('unauthorized') ? 403 : 
                       error instanceof Error && error.message.toLowerCase().includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Failed to update collaboration' });
  }
});

// PATCH /api/collaborations/:id/status
collaborationRouter.patch("/collaborations/:id/status", authLimiter, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  const collaborationId = req.params.id;
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedCollaboration = await updateCollaborationStatus(collaborationId, userId, status);
    if (!updatedCollaboration) {
      return res.status(404).json({ error: "Collaboration not found or not authorized" });
    }
    return res.json(updatedCollaboration);
  } catch (error) {
    logger.error('Error in PATCH /collaborations/:id/status route:', error);
    const statusCode = error instanceof Error && error.message.toLowerCase().includes('unauthorized') ? 403 : 
                       error instanceof Error && error.message.toLowerCase().includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Failed to update collaboration status' });
  }
});

// --- Application Routes --- 

// GET /api/applications/my
collaborationRouter.get("/applications/my", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const myApplications = await getUserApplications(userId);
    return res.json(myApplications);
  } catch (error) {
    logger.error('Error in GET /applications/my route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/collaborations/:id/apply
collaborationRouter.post("/collaborations/:id/apply", applicationLimiter, async (req: Request, res: Response) => {
  const applicantUserId = req.userId;
  if (!applicantUserId) return res.status(500).json({ error: 'User ID not found after auth' });
  const collaborationId = req.params.id;
  try {
    const NoteSchema = z.object({ 
      note: z.string().optional().nullable() 
    });
    const validationResult = NoteSchema.safeParse(req.body);

    let note: string | undefined | null = null;
    if (validationResult.success) {
        note = validationResult.data.note;
    } else {
        logger.warn('Application request body validation failed, proceeding without note.', { error: validationResult.error });
    }
    
    const newApplication = await applyToCollaboration(collaborationId, applicantUserId, note || undefined);
    return res.status(201).json(newApplication);
  } catch (error) {
    logger.error('Error in POST /collaborations/:id/apply route:', error);
    const statusCode = error instanceof Error && error.message.toLowerCase().includes('already applied') ? 409 :
                       error instanceof Error && error.message.toLowerCase().includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Failed to apply to collaboration' });
  }
});

// GET /api/collaborations/:id/applications
collaborationRouter.get("/collaborations/:id/applications", async (req: Request, res: Response) => {
  const hostUserId = req.userId;
  if (!hostUserId) return res.status(500).json({ error: 'User ID not found after auth' });
  const collaborationId = req.params.id;
  try {
    const applications = await getApplicationsForCollaboration(collaborationId, hostUserId);
    return res.json(applications);
  } catch (error) {
    logger.error('Error in GET /collaborations/:id/applications route:', error);
    const statusCode = error instanceof Error && error.message.toLowerCase().includes('unauthorized') ? 403 :
                       error instanceof Error && error.message.toLowerCase().includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Failed to fetch applications' });
  }
});

export default collaborationRouter; 