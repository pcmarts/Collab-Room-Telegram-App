import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { users } from "../shared/schema";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Simple test endpoint that writes to database
  app.post("/api/onboarding", async (req, res) => {
    console.log('============ DEBUG: Test Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { first_name, last_name, handle, initData } = req.body;

      // Parse Telegram data
      console.log('Parsing Telegram data');
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Insert into database
      console.log('Inserting user into database');
      const [user] = await db.insert(users).values({
        telegram_id: telegramUser.id.toString(),
        first_name,
        last_name,
        handle
      }).returning();

      console.log('Created user:', user);
      res.json({ 
        success: true,
        user 
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return httpServer;
}