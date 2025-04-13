import type { Response } from "express";
import { logger } from '../utils/logger';

// Store active SSE connections for application status updates
const activeStatusConnections = new Map<string, Response>();

/**
 * Registers an SSE connection for a user.
 * @param userId - The ID of the user.
 * @param res - The Express Response object for the SSE connection.
 */
export function registerSseConnection(userId: string, res: Response): void {
  activeStatusConnections.set(userId, res);
  logger.info(`SSE connection registered for user ${userId}`);
  // DISCONNECT HANDLING MOVED TO ROUTE HANDLER
}

/**
 * Removes an SSE connection for a user.
 * Called explicitly on disconnect or error.
 * @param userId - The ID of the user.
 */
export function removeSseConnection(userId: string): void {
    if (activeStatusConnections.has(userId)) {
        activeStatusConnections.delete(userId);
        logger.info(`SSE connection removed for user ${userId}`);
    } else {
        logger.debug(`Attempted to remove non-existent SSE connection for user ${userId}`);
    }
}

/**
 * Sends an Server-Sent Event update to a specific user if connected.
 * @param userId - The ID of the user to send the update to.
 * @param status - The status string.
 * @param message - Optional message accompanying the status.
 */
export function sendApplicationStatusUpdate(userId: string, status: string, message?: string): void {
  const res = activeStatusConnections.get(userId);
  if (res) {
    try {
        logger.info(`Sending SSE update to user ${userId}: status=${status}`);
        res.write(`data: ${JSON.stringify({ status, message })}\n\n`);
    } catch (error) {
        logger.error(`Error writing to SSE stream for user ${userId}:`, error);
        // Remove potentially broken connection
        removeSseConnection(userId);
    }
  } else {
    logger.debug(`No active SSE connection found for user ${userId} to send status update.`);
  }
} 