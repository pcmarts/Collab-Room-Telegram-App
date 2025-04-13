import { db } from "../db";
import { users, collaborations, matches } from "../../shared/schema";
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

/**
 * Fetches network statistics: counts of approved users, active collaborations, and total matches.
 * @returns {Promise<object>} An object containing the counts.
 * @throws {Error} If there's an error querying the database.
 */
export async function getNetworkStats() {
  try {
    // Count all approved users
    const usersResult = await db.select({ count: sql<number>`count(*)` }).from(users)
      .where(eq(users.is_approved, true));

    // Count all active collaborations
    const collabsResult = await db.select({ count: sql<number>`count(*)` }).from(collaborations)
      .where(eq(collaborations.status, "active"));
      
    // Count all matches
    const matchesResult = await db.select({ count: sql<number>`count(*)` }).from(matches);

    return {
      users: Number(usersResult[0]?.count || 0),
      collaborations: Number(collabsResult[0]?.count || 0),
      matches: Number(matchesResult[0]?.count || 0)
    };
  } catch (error) {
    logger.error("Error fetching network stats:", error);
    // Rethrow the error to be handled by the route handler
    throw new Error("Failed to fetch network statistics");
  }
} 