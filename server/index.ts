import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { bot } from "./telegram";
import session from 'express-session';
import MemoryStore from 'memorystore';
import { config } from "../shared/config";
import { pool } from "./db";
import connectPgSimple from 'connect-pg-simple';
import { apiLimiter } from './middleware/rate-limiter';

// Use PostgreSQL for session storage in production, memory store in development
const MemoryStoreSession = MemoryStore(session);
const PgSession = connectPgSimple(session);

// Create Express application
const app = express();

// Set security headers manually since we can't use helmet directly
app.use((req, res, next) => {
  // Skip if security headers are disabled (not recommended)
  if (!config.ENABLE_SECURITY_HEADERS) {
    return next();
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https://telegram.org; " +
    "connect-src 'self' https://api.telegram.org; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "object-src 'none'; " +
    "frame-ancestors 'self' https://telegram.org;"
  );
  
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove headers that might reveal too much information
  res.removeHeader('X-Powered-By');
  
  next();
});

// Body parsers with size limits for security
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Set up session store based on environment
let sessionStore;
if (config.NODE_ENV === 'production') {
  // Use PostgreSQL session store in production
  sessionStore = new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true,
  });
  log('Using PostgreSQL for session storage');
} else {
  // Use memory store in development
  sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
  log('Using in-memory session storage (not suitable for production)');
}

// Initialize session middleware early to ensure it's available for all routes
app.use(session({
  store: sessionStore,
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Set to false for GDPR compliance
  cookie: {
    secure: config.NODE_ENV === 'production', // Only send cookies over HTTPS in production
    httpOnly: true, // Prevent JavaScript access to cookies
    sameSite: 'lax', // Helps prevent CSRF attacks
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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

//Apply rate limiting to all API routes
app.use('/api', apiLimiter);

(async () => {
  log('Starting server initialization...');

  try {
    const server = await registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      
      // In production, hide detailed error messages to prevent information leakage
      const message = config.NODE_ENV === 'production' && status === 500
        ? "Internal Server Error" 
        : err.message || "Internal Server Error";
      
      // Log the full error in any environment
      console.error('Server error:', err);
      
      // Return a sanitized error response
      res.status(status).json({ 
        error: message,
        // Include stack trace only in development
        ...(config.NODE_ENV !== 'production' && { stack: err.stack })
      });
      
      // Do not rethrow the error as it can crash the server
      // Previously: throw err;
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