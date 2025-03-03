import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { users } from "../shared/schema";
import { bot } from "./telegram";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { insertCollaborationSchema, insertCompanySchema } from "../shared/schema";

const onboardingSchema = z.object({
  bio: z.string().min(10).max(300),
  interests: z.string(),
  collaborationTypes: z.string(),
  initData: z.string()
});

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Companies endpoints
  app.get("/api/companies", async (_req, res) => {
    try {
      const companies = await db.query.companies.findMany();
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/companies", async (req, res) => {
    const validation = insertCompanySchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const [company] = await db
        .insert(users)
        .values(validation.data)
        .returning();
      res.json(company);
    } catch (error) {
      console.error('Error creating company:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Collaborations endpoints
  app.get("/api/collaborations", async (_req, res) => {
    try {
      const collaborations = await db.query.collaborations.findMany({
        with: {
          host: true,
          company: true,
          applicant: true
        }
      });
      res.json(collaborations);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/collaborations", async (req, res) => {
    const validation = insertCollaborationSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({ error: validation.error });
      return;
    }

    try {
      const [collaboration] = await db
        .insert(users)
        .values(validation.data)
        .returning();

      // Notify via Telegram bot
      if (collaboration.host_id) {
        const [host] = await db
          .select()
          .from(users)
          .where(eq(users.id, collaboration.host_id));

        if (host?.telegram_id) {
          await bot.sendMessage(
            host.telegram_id,
            `New collaboration created: ${collaboration.title}`
          );
        }
      }

      res.json(collaboration);
    } catch (error) {
      console.error('Error creating collaboration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add onboarding endpoint
  app.post("/api/onboarding", async (req, res) => {
    try {
      const validation = onboardingSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const { bio, interests, collaborationTypes, initData } = validation.data;

      // Parse the initData to get user information
      const decodedInitData = new URLSearchParams(initData);
      const user = JSON.parse(decodedInitData.get('user') || '{}');

      if (!user.id) {
        res.status(400).json({ error: 'Invalid user data' });
        return;
      }

      await db
        .update(users)
        .set({
          profile_info: {
            bio,
            interests: interests.split(',').map(i => i.trim()),
            preferred_collaboration_types: collaborationTypes.split(',').map(t => t.trim()),
            onboarding_complete: true
          }
        })
        .where(eq(users.telegram_id, user.id.toString()));

      res.json({ success: true });
    } catch (error) {
      console.error('Error in onboarding:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return httpServer;
}