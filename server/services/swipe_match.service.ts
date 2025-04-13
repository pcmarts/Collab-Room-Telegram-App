import { db } from "../db";
import {
  users, collaborations, swipes, matches,
  type User, type Collaboration, type Swipe, type InsertSwipe, type Match, type InsertMatch
} from "../../shared/schema";
import { eq, and, desc, sql } from 'drizzle-orm';
import { storage } from "../storage"; // Assuming storage handles DB interactions
import { logger } from '../utils/logger';
import { notifyMatchCreated } from "../telegram"; // Potentially needed if match logic moves here

// --- Swipe Logic ---

export async function createSwipe(swiperUserId: string, swipeData: Omit<InsertSwipe, 'created_at'>): Promise<Swipe> {
  logger.debug('Creating swipe:', { swiperUserId, swipeData });
  try {
    // Make sure the user_id is set to swiperUserId 
    const fullSwipeData: InsertSwipe = {
      ...swipeData,
      user_id: swiperUserId, // Use user_id instead of swiper_user_id
      created_at: new Date()
    };
    // Delegate to storage, which handles match checking
    return await storage.createSwipe(fullSwipeData);
  } catch (error) {
    logger.error('Error creating swipe in service:', { swiperUserId, swipeData, error });
    throw error;
  }
}

// --- Match Logic ---

export async function getUserMatchesWithDetails(userId: string): Promise<any[]> {
  logger.debug('Fetching matches with details for user:', { userId });
  try {
    // Delegate to storage layer method that joins data
    return await storage.getUserMatchesWithDetails(userId);
  } catch (error) {
    logger.error('Error fetching user matches with details in service:', { userId, error });
    throw error;
  }
}

export async function getPotentialMatchesForHost(hostUserId: string): Promise<any[]> {
  logger.debug('Fetching potential matches for host:', { hostUserId });
  try {
    // Delegate to storage layer method
    return await storage.getPotentialMatchesForHost(hostUserId);
  } catch (error) {
    logger.error('Error fetching potential matches in service:', { hostUserId, error });
    throw error;
  }
}

export async function getMatchById(matchId: string, userId: string): Promise<Match | undefined> {
  logger.debug('Fetching match by ID:', { matchId, userId });
  try {
    const match = await storage.getMatchById(matchId);
    // Optional: Add authorization check - ensure the userId is part of the match
    if (match && match.host_user_id !== userId && match.requester_user_id !== userId) {
       logger.warn('User attempted to fetch match they are not part of', { userId, matchId });
       throw new Error("Unauthorized to view this match");
    }
    return match;
  } catch (error) {
    logger.error('Error fetching match by ID in service:', { matchId, userId, error });
    throw error;
  }
}

export async function updateMatchStatus(matchId: string, userId: string, status: 'pending' | 'accepted' | 'rejected'): Promise<Match | undefined> {
  logger.debug('Updating match status:', { matchId, userId, status });
  try {
    // Optional: Add authorization check - ensure the userId is part of the match
    const match = await storage.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }
    if (match.host_user_id !== userId && match.requester_user_id !== userId) {
      logger.warn('User attempted to update match status they are not part of', { userId, matchId });
      throw new Error("Unauthorized to update this match");
    }
    // Delegate to storage layer method
    return await storage.updateMatchStatus(matchId, status);
  } catch (error) {
    logger.error('Error updating match status in service:', { matchId, userId, status, error });
    throw error;
  }
} 