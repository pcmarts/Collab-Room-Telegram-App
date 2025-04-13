import { Router, type Request, type Response } from "express";
import { registerSseConnection, removeSseConnection } from "../services/sse.service";
import { db } from "../db"; // For user lookup
import { users } from "../../shared/schema"; // For user lookup
import { eq } from 'drizzle-orm'; // For user lookup
import { logger } from '../utils/logger';

// TODO: Import getTelegramUserFromRequest from its final location
import { getTelegramUserFromRequest } from "../utils/auth.utils"; // Use new location

const sseRouter = Router();

// Middleware applied globally in index.ts

/**
 * GET /api/application-status/updates
 * Establishes an SSE connection for application status updates.
 */
sseRouter.get("/application-status/updates", async (req: Request, res: Response) => {
    // userId is attached by global authenticateMiddleware
    const userId = req.userId;
    if (!userId) {
        // This should ideally not happen if middleware ran correctly
        logger.error('SSE route reached without userId after auth middleware');
        return res.status(401).json({ error: "Unauthorized" }); 
    }
     
    try {
        // REMOVE user lookup by telegramId here

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        registerSseConnection(userId, res);

        req.on('close', () => {
            removeSseConnection(userId);
            res.end();
        });

    } catch (error) {
        logger.error('Error establishing SSE connection:', { userId, error });
        removeSseConnection(userId); // Ensure removal on error
        if (!res.writableEnded) {
             res.end(); 
        }
    }
});

export default sseRouter; 