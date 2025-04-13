import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { bot } from "./telegram";
import session from 'express-session';
import MemoryStore from 'memorystore';
import { config } from "../shared/config";
import { pool } from "./db";
import connectPgSimple from 'connect-pg-simple';
import { apiLimiter } from './middleware/rate-limiter';
import { logger } from './utils/logger';
import { requestLogger, errorLogger } from './middleware/logger-middleware';
import { createServer } from "http";
import { authenticateMiddleware } from "./middleware/authenticate";

// Import new routers
import statsRouter from './routes/stats.routes';
import profileRouter from './routes/profile.routes';
import preferencesRouter from './routes/preferences.routes';
import collaborationRouter from './routes/collaboration.routes';
import swipeMatchRouter from './routes/swipe_match.routes';
import adminRouter from './routes/admin.routes';
import sseRouter from './routes/sse.routes';

// Use PostgreSQL for session storage in production, memory store in development
const MemoryStoreSession = MemoryStore(session);
const PgSession = connectPgSimple(session);

// Create Express application
const app = express();

// Disable etag generation completely to prevent 304 responses
app.set('etag', false);

// Set security headers manually since we can't use helmet directly
app.use((req, res, next) => {
  // Skip if security headers are disabled (not recommended)
  if (!config.ENABLE_SECURITY_HEADERS) {
    return next();
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://telegram.org https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https://telegram.org https://*.telegram.org; " +
    "connect-src 'self' https://api.telegram.org; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'self' https://telegram.org https://*.telegram.org; " +
    "upgrade-insecure-requests;"
  );
  
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=()');
  
  // Set strict transport security for HTTPS
  if (config.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  
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
  // Only log if LOG_LEVEL >= 2 (INFO level or higher)
  if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
    logger.info('Using PostgreSQL for session storage');
  }
} else {
  // Use memory store in development
  sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  });
  // Only log if LOG_LEVEL >= 1 (WARN level or higher)
  if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 1) {
    logger.warn('Using in-memory session storage (not suitable for production)');
  }
}

// Initialize session middleware early to ensure it's available for all routes
app.use(session({
  store: sessionStore,
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // Set to false for GDPR compliance
  cookie: {
    secure: config.NODE_ENV === 'production', // Only enforce in production
    httpOnly: true, // Prevent JavaScript access to cookies
    sameSite: 'strict', // Stronger CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/', // Explicitly set path
    domain: undefined // Let browser set the cookie domain automatically
  }
}));

// Initialize Telegram bot first
// Only log startup info if LOG_LEVEL >= 2 (INFO level or higher)
if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
  logger.info('=== Initializing Server ===');
}

// Verify bot is working
try {
  if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
    logger.info('Checking Telegram bot status...');
  }

  if (!bot) {
    throw new Error('Telegram bot not initialized');
  }

  // Try to get bot info to verify token works
  bot.getMe().then((botInfo) => {
    if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
      logger.info(`Telegram bot verified: ${botInfo.username}`);
    }
  }).catch((error) => {
    logger.error('Failed to verify bot', { error });
    process.exit(1);
  });

} catch (error) {
  logger.error('Critical error initializing Telegram bot', { error });
  process.exit(1);
}

// Apply request logging middleware
app.use(requestLogger);

// --- Public API Routes (No Auth Required) ---
// Apply general rate limiting
app.use('/api', apiLimiter); 
// Mount public routers BEFORE authentication middleware
app.use('/api', statsRouter); 
// Add any other public routes here

// --- Authenticated API Routes --- 
// Apply authentication middleware AFTER public routes
app.use('/api', authenticateMiddleware); 

// Mount remaining domain-specific routers (now expect req.userId)
app.use('/api', profileRouter);
app.use('/api', preferencesRouter);
app.use('/api', collaborationRouter);
app.use('/api', swipeMatchRouter);
app.use('/api/admin', adminRouter); // Admin router already applies admin check
app.use('/api', sseRouter);

// Apply cache control headers to all API routes
app.use('/api', (req, res, next) => {
  // Disable caching for all API endpoints
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Force a unique response by setting a dynamic Last-Modified header
  res.setHeader('Last-Modified', new Date().toUTCString());
  
  next();
});

(async () => {
  // Only log startup info if LOG_LEVEL >= 2 (INFO level or higher)
  if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
    logger.info('Starting server initialization...');
  }

  try {
    // Create the HTTP server directly here
    const server = createServer(app);
    logger.info('HTTP Server created in index.ts.');

    // Add our error logger middleware first
    app.use(errorLogger);
    
    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      
      // In production, hide detailed error messages to prevent information leakage
      const message = config.NODE_ENV === 'production' && status === 500
        ? "Internal Server Error" 
        : err.message || "Internal Server Error";
      
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
      // Setup Vite Dev Server
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
      // Only log server startup info if LOG_LEVEL >= 2 (INFO level or higher)
      if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
        logger.info(`Server running on port ${port}`);
        logger.info('Server initialization completed');
      }
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
})();