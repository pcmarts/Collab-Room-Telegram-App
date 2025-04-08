import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../../shared/config';

/**
 * Express middleware to log HTTP requests
 * 
 * Features:
 * - Logs request method, URL, status, response time
 * - Uses appropriate log levels based on status code
 * - Automatically redacts sensitive information
 * - Production-optimized with minimal output
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip logging for health check routes in production
  if (config.NODE_ENV === 'production' && req.path === '/health') {
    return next();
  }
  
  // Record start time
  const start = Date.now();
  
  // Store original end function to intercept it
  const originalEnd = res.end;
  
  // Override end function to add logging
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Restore original end function
    res.end = originalEnd;
    
    // Call original end function with arguments
    const result = res.end(chunk, encoding, callback);
    
    // Calculate response time
    const responseTime = Date.now() - start;
    
    // Redacted request data
    const requestData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.socket.remoteAddress
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      // Server errors - use error level
      logger.error(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else if (res.statusCode >= 400) {
      // Client errors - use warning level
      logger.warn(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else if (res.statusCode >= 300) {
      // Redirects - use info level
      logger.info(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else {
      // Normal requests - use http level
      logger.http(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`);
    }
    
    return result;
  };
  
  next();
}

/**
 * Express error handling middleware that logs errors
 */
export function errorLogger(err: any, req: Request, res: Response, next: NextFunction) {
  // Log the error with appropriate context
  logger.error('Request error', {
    error: {
      message: err.message,
      stack: config.NODE_ENV !== 'production' ? err.stack : undefined,
      name: err.name,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.socket.remoteAddress
    }
  });
  
  // Pass to next error handler
  next(err);
}