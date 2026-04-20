
import { Express, Request, Response } from "express";
import { db } from "../db";
import { users, collaborations, requests } from "../../shared/schema";
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export default function registerStatsRoutes(app: Express) {
  // Network statistics endpoint
  app.get("/api/stats/engagement", async (_req: Request, res: Response) => {
    try {
      // Count all approved users
      const usersResult = await db.select({ count: sql`count(*)` }).from(users)
        .where(eq(users.is_approved, true));

      // Count all active collaborations
      const collabsResult = await db.select({ count: sql`count(*)` }).from(collaborations)
        .where(eq(collaborations.status, "active"));
        
      // Count all accepted requests (matches)
      const matchesResult = await db.select({ count: sql`count(*)` }).from(requests)
        .where(eq(requests.status, "accepted"));

      res.json({
        users: Number(usersResult[0]?.count || 0),
        collaborations: Number(collabsResult[0]?.count || 0),
        matches: Number(matchesResult[0]?.count || 0)
      });
    } catch (error) {
      console.error("Error fetching network stats:", error);
      res.status(500).json({ error: "Failed to fetch network statistics" });
    }
  });
}
