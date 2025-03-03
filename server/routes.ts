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
      const { first_name, last_name, handle, linkedin_url, email, initData } = req.body;

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

      try {
        let user;

        if (existingUser.length > 0) {
          // Update existing user
          console.log('Updating existing user:', existingUser[0]);
          [user] = await db.update(users)
            .set({
              first_name,
              last_name,
              handle,
              linkedin_url,
              email
            })
            .where(eq(users.telegram_id, telegram_id))
            .returning();

          console.log('Updated user:', user);
          return res.json({ 
            success: true,
            user,
            message: 'User updated successfully'
          });
        }

        // Create new user
        console.log('Creating new user with data:', {
          telegram_id,
          first_name,
          last_name,
          handle,
          linkedin_url,
          email
        });

        [user] = await db
          .insert(users)
          .values({
            telegram_id,
            first_name,
            last_name,
            handle,
            linkedin_url,
            email
          })
          .returning();

        console.log('Created user:', user);

        res.json({ 
          success: true,
          user,
          message: 'User created successfully'
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save user: ${dbError.message}`);
      }

    } catch (error) {
      console.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      res.status(500).json({ error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return httpServer;
}