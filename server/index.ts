// Force silent mode by overriding console logging methods
import "./utils/override-logger.js";

import { createApp } from "./app";
import { setupVite, serveStatic } from "./vite";
import { bot } from "./telegram";
import { config } from "../shared/config";
import { logger } from "./utils/logger";

/**
 * Local dev + non-Vercel production entry.
 * On Vercel, api/index.ts is used instead (no listen, webhook mode).
 */
(async () => {
  if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
    logger.info("Starting server initialization...");
  }

  try {
    const { app, httpServer } = await createApp();

    // Non-blocking bot verification — polling is started by the bot constructor
    // in server/telegram.ts when not running on Vercel.
    if (bot) {
      bot
        .getMe()
        .then((info) => {
          if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
            logger.info(`[BOT] Verified: ${info.username}`);
          }
        })
        .catch((err) => logger.error("[BOT] Verification failed but server continues:", err));
    }

    if (app.get("env") === "development") {
      // Silent-mode filter for Vite noise (LOG_LEVEL=0)
      if (config.LOG_LEVEL === 0) {
        const originalConsoleLog = console.log;
        console.log = function (...args) {
          if (args.length > 0 && typeof args[0] === "string") {
            const msg = args[0];
            if (msg.includes("ERROR") || msg.includes("failed") || msg.includes("error")) {
              originalConsoleLog.apply(console, args);
            }
          }
        };
        console.info = function () {};
        originalConsoleLog("[SILENT MODE] Most Vite logs suppressed due to LOG_LEVEL=0");
      }
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || "5000", 10);

    process.on("SIGINT", () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      httpServer.close(() => process.exit(0));
    });
    process.on("SIGTERM", () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      httpServer.close(() => process.exit(0));
    });
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      httpServer.close(() => process.exit(1));
    });
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      httpServer.close(() => process.exit(1));
    });

    httpServer.listen(port, "0.0.0.0", () => {
      if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
        logger.info(`Server running on port ${port}`);
      }
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
})();
