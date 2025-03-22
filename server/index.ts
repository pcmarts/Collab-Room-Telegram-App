import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { bot } from "./telegram";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize Telegram bot first
log('=== Initializing Server ===');

// Verify bot is working
try {
  log('Checking Telegram bot status...');

  if (!bot) {
    throw new Error('Telegram bot not initialized');
  }

  // Try to get bot info to verify token works
  bot.getMe().then((botInfo) => {
    log('Telegram bot verified:', botInfo.username);
  }).catch((error) => {
    console.error('Failed to verify bot:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('Critical error initializing Telegram bot:', error);
  process.exit(1);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  log('Starting server initialization...');

  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Server error:', err);
      res.status(status).json({ message });
      throw err;
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running on port ${port}`);
      log('Server initialization completed');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();