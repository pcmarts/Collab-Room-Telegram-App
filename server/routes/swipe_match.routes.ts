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
import { storage } from "../storage"; // Import storage interface

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

    const swipeData = { 
      collaboration_id,
      direction,
      note,
      user_id: userId // Include user_id to satisfy type requirements
    };
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

// Function to transform the raw DB match data into the expected client format
function transformMatchData(rawMatch: any) {
  // Format date for display
  const matchDate = new Date(rawMatch.match_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Return transformed match object with properly named fields
  return {
    id: rawMatch.match_id,
    matchDate: matchDate,
    status: rawMatch.match_status || 'active',
    collaborationType: rawMatch.collab_type,
    description: rawMatch.collab_description,
    details: rawMatch.collab_details || {},
    matchedPerson: `${rawMatch.other_user_first_name} ${rawMatch.other_user_last_name || ''}`.trim(),
    companyName: rawMatch.company_name || 'Unknown Company',
    roleTitle: rawMatch.role_title || 'Team Member',
    companyDescription: rawMatch.company_description || '',
    userDescription: '', // not available in current schema
    username: rawMatch.other_user_handle,
    note: rawMatch.match_note,
    
    // Social links
    linkedinUrl: rawMatch.other_user_linkedin_url,
    twitterUrl: rawMatch.other_user_twitter_url,
    twitterHandle: rawMatch.other_user_handle,
    twitterFollowers: rawMatch.other_user_twitter_followers,
    
    // Company info
    companyWebsite: rawMatch.company_website,
    companyLinkedinUrl: rawMatch.company_linkedin_url,
    companyTwitterHandle: rawMatch.company_twitter_handle,
    companyTwitterFollowers: rawMatch.company_twitter_followers,
    fundingStage: rawMatch.funding_stage,
    hasToken: rawMatch.has_token,
    tokenTicker: rawMatch.token_ticker,
    blockchainNetworks: Array.isArray(rawMatch.blockchain_networks) 
      ? rawMatch.blockchain_networks 
      : (rawMatch.blockchain_networks ? String(rawMatch.blockchain_networks).replace(/{|}/g, '').split(',') : []),
    companyTags: Array.isArray(rawMatch.company_tags) 
      ? rawMatch.company_tags 
      : (rawMatch.company_tags ? String(rawMatch.company_tags).replace(/{|}/g, '').split(',') : [])
  };
}

// GET /api/matches
swipeMatchRouter.get("/matches", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const rawMatches = await getUserMatchesWithDetails(userId);
    
    // Transform the raw data to match the client's expected format
    const transformedMatches = rawMatches.map(transformMatchData);
    
    logger.debug(`Returning ${transformedMatches.length} transformed matches for user ${userId}`);
    return res.json(transformedMatches);
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

// GET /api/potential-matches
swipeMatchRouter.get("/potential-matches", async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(500).json({ error: 'User ID not found after auth' });
  try {
    const potentialMatches = await getPotentialMatchesForHost(userId);
    logger.debug(`Returning ${potentialMatches.length} potential matches for user ${userId}`);
    return res.json(potentialMatches);
  } catch (error) {
    logger.error('Error in GET /potential-matches route:', error);
    return res.status(500).json({ error: 'Failed to fetch potential matches' });
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