import { Router, type Request, type Response } from "express";
import {
  createSwipe,
  getUserMatchesWithDetails,
  getPotentialMatchesForHost,
  getMatchById,
  updateMatchStatus
} from "../services/swipe_match.service";
import { swipeLimiter } from "../middleware/rate-limiter";
import { db } from "../db"; // For user lookup
import { users } from "../../shared/schema"; // For user lookup
import { eq } from 'drizzle-orm'; // For user lookup
import { logger } from '../utils/logger';
import { getTelegramUserFromRequest } from "../utils/auth.utils";

const swipeMatchRouter = Router();

// --- Swipe Route --- 

// POST /api/swipes
swipeMatchRouter.post("/swipes", swipeLimiter, async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const { collaboration_id, direction, note } = req.body;
    if (!collaboration_id || !direction) {
      return res.status(400).json({ error: 'collaboration_id and direction are required' });
    }
    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction' });
    }

    const swipeData = { collaboration_id, direction, note }; // Pass note here
    const newSwipe = await createSwipe(userId, swipeData);

    // Check if a match was potentially created (service/storage layer handles the notification)
    // We don't need to explicitly return match status here, client relies on match list updates
    return res.status(201).json({ success: true, swipe: newSwipe }); // Return swipe data

  } catch (error) {
    logger.error('Error in POST /swipes route:', error);
    // Handle specific errors like collab not found if service throws them
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to record swipe' });
  }
});

// GET /api/user-swipes
swipeMatchRouter.get("/user-swipes", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    // Use the storage interface to get user swipes
    const swipes = await storage.getUserSwipes(userId);
    logger.debug(`Returning ${swipes.length} swipes for user ${userId}`);
    return res.json(swipes);
  } catch (error) {
    logger.error('Error in GET /user-swipes route:', error);
    return res.status(500).json({ error: 'Failed to fetch user swipes' });
  }
});

// --- Match Routes --- 

// GET /api/matches
swipeMatchRouter.get("/matches", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const matches = await getUserMatchesWithDetails(userId);
    return res.json(matches);
  } catch (error) {
    logger.error('Error in GET /matches route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/matches/potential
swipeMatchRouter.get("/matches/potential", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const potentialMatches = await getPotentialMatchesForHost(userId);
    return res.json(potentialMatches);
  } catch (error) {
    logger.error('Error in GET /matches/potential route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/matches/:id
swipeMatchRouter.get("/matches/:id", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  const matchId = req.params.id;
  try {
    const match = await getMatchById(matchId, userId);
    if (!match) {
      return res.status(404).json({ error: "Match not found or not authorized" });
    }
    return res.json(match);
  } catch (error) {
    logger.error('Error in GET /matches/:id route:', error);
    const statusCode = error instanceof Error && error.message.toLowerCase().includes('unauthorized') ? 403 : 404;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Failed to fetch match' });
  }
});

// PATCH /api/matches/:id
swipeMatchRouter.patch("/matches/:id", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  const matchId = req.params.id;
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedMatch = await updateMatchStatus(matchId, userId, status);
    if (!updatedMatch) {
      return res.status(404).json({ error: "Match not found or not authorized" });
    }
    return res.json(updatedMatch);
  } catch (error) {
    logger.error('Error in PATCH /matches/:id route:', error);
    const statusCode = error instanceof Error && error.message.toLowerCase().includes('unauthorized') ? 403 :
                       error instanceof Error && error.message.toLowerCase().includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ error: error instanceof Error ? error.message : 'Failed to update match status' });
  }
});

export default swipeMatchRouter; 