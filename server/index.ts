// Force silent mode by overriding console logging methods
import './utils/override-logger.js';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { bot } from "./telegram";
import session from 'express-session';
import MemoryStore from 'memorystore';
import { config } from "../shared/config";
import { apiLimiter } from './middleware/rate-limiter';
import { logger } from './utils/logger';
import { requestLogger, errorLogger } from './middleware/logger-middleware';

// Use in-memory session storage
const MemoryStoreSession = MemoryStore(session);

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

// Set up session store - using MemoryStore for all environments
// Note: In a production environment, you'd typically use a persistent store
const sessionStore = new MemoryStoreSession({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Only log if LOG_LEVEL >= 1 (WARN level or higher)
if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 1) {
  logger.warn('Using in-memory session storage (not suitable for production)');
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

//Apply rate limiting to all API routes
app.use('/api', apiLimiter);

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
    const server = await registerRoutes(app);

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
      // In silent mode (LOG_LEVEL=0), we need to suppress Vite's output
      // This is a workaround since Vite's logger isn't directly configurable from here
      const originalConsoleLog = console.log;
      const originalConsoleInfo = console.info;
      
      // Apply console output filtering in silent mode
      if (config.LOG_LEVEL === 0) {
        // Only filter INFO and lower logs that often come from Vite
        console.log = function(...args) {
          // Only allow through error logs in silent mode
          if (args.length > 0 && typeof args[0] === 'string') {
            const msg = args[0];
            // Let through specific error messages
            if (msg.includes('ERROR') || msg.includes('failed') || msg.includes('error')) {
              originalConsoleLog.apply(console, args);
            }
          }
        };
        
        console.info = function(...args) {
          // Completely suppress INFO logs in silent mode
        };
        
        // Log once that we're in silent mode to help with debugging
        originalConsoleLog("[SILENT MODE] Most Vite logs suppressed due to LOG_LEVEL=0");
      }
      
      await setupVite(app, server);
      
      // Restore console functions
      if (config.LOG_LEVEL === 0) {
        console.log = originalConsoleLog;
        console.info = originalConsoleInfo;
      }
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