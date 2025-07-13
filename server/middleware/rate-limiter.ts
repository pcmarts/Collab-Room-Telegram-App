import { Request, Response, NextFunction } from 'express';
import { config } from '../../shared/config';

// In-memory storage for rate limiting
// In a production environment, you would typically use Redis or another shared cache
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Store for rate limits
const rateLimitStore: RateLimitStore = {};

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Creates a rate limiter middleware
 * 
 * @param options Rate limiter options
 * @returns Express middleware function
 */
export function createRateLimiter(options: {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum number of requests in the time window
  message?: string;  // Optional custom message
  statusCode?: number; // Optional custom status code
  skipIfDevelopment?: boolean; // Skip rate limiting in development
}) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skipIfDevelopment = true
  } = options;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development if specified
    if (skipIfDevelopment && config.NODE_ENV !== 'production') {
      return next();
    }
    
    // Get client IP
    const ip = req.ip || 
               req.headers['x-forwarded-for'] as string || 
               req.socket.remoteAddress || 
               'unknown';
    
    // Create a unique key for this IP and path
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    
    // Initialize or update the rate limit record
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitStore[key].count += 1;
    }
    
    // Calculate time remaining until reset
    const timeRemaining = Math.ceil((rateLimitStore[key].resetTime - now) / 1000);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rateLimitStore[key].count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitStore[key].resetTime / 1000).toString());
    
    // If the client has exceeded the rate limit
    if (rateLimitStore[key].count > max) {
      res.setHeader('Retry-After', timeRemaining.toString());
      return res.status(statusCode).json({
        error: message,
        retryAfter: timeRemaining
      });
    }
    
    next();
  };
}

// Export specific rate limiters
export const apiLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // From config
  max: config.RATE_LIMIT_MAX_REQUESTS, // From config
  skipIfDevelopment: true
});

export const authLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: 10, // Stricter limit for authentication attempts
  message: 'Too many authentication attempts, please try again later',
  skipIfDevelopment: true
});

export const requestLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute (1 per second)
  skipIfDevelopment: true
});

export const applicationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Very strict limit for collaboration applications (5 per minute)
  message: 'Too many application attempts, please try again later',
  skipIfDevelopment: true
});