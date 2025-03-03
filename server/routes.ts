import type { Express } from "express";
import { createServer } from "http";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Simplified test endpoint
  app.post("/api/onboarding", (req, res) => {
    console.log('============ DEBUG: Test Endpoint ============');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
      // Just echo back the received data
      res.json({ 
        success: true,
        received: req.body 
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return httpServer;
}