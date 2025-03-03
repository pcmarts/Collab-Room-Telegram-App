import type { Express } from "express";
import { createServer } from "http";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from 'drizzle-orm';

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Simple test endpoint that writes to database
  app.post("/api/onboarding", async (req, res) => {
    console.log('============ DEBUG: Test Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      const { first_name, last_name, handle, initData } = req.body;

      if (!first_name || !last_name || !handle) {
        console.error('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse Telegram data
      console.log('Parsing Telegram data');
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get('user') || '{}');
      console.log('Decoded Telegram user:', telegramUser);

      if (!telegramUser.id) {
        console.error('No Telegram user ID found');
        return res.status(400).json({ error: 'Invalid Telegram data' });
      }

      // Check if user exists
      const telegram_id = telegramUser.id.toString();
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegram_id));

      if (existingUser.length > 0) {
        console.log('User already exists:', existingUser[0]);
        return res.json({ 
          success: true,
          user: existingUser[0],
          message: 'User already exists'
        });
      }

      // Create new user
      const [user] = await db.insert(users)
        .values({
          telegram_id,
          first_name,
          last_name,
          handle
        })
        .returning();

      console.log('Created user:', user);

      res.json({ 
        success: true,
        user,
        message: 'User created successfully'
      });

    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  });

  return httpServer;
}