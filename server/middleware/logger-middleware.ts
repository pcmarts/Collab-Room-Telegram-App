import { Request, Response, NextFunction } from 'express';
import { logger, LogLevel } from '../utils/logger';
import { config } from '../../shared/config';

/**
 * Express middleware to log HTTP requests
 * 
 * Features:
 * - Logs request method, URL, status, response time
 * - Uses appropriate log levels based on status code
 * - Automatically redacts sensitive information
 * - Production-optimized with minimal output
 * - Respects LOG_LEVEL setting for silent mode
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip logging for health check routes in production
  if (config.NODE_ENV === 'production' && req.path === '/health') {
    return next();
  }
  
  // Skip ALL logging in silent mode (LOG_LEVEL=0) except for actual errors
  // This creates a truly silent mode when LOG_LEVEL=0
  if (config.LOG_LEVEL === 0) {
    // Record start time for error tracking only
    const errorTrackingStart = Date.now();
    
    // Add response interceptor only to catch errors
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any, callback?: any): any {
      res.end = originalEnd;
      const result = res.end(chunk, encoding, callback);
      
      // Only log server errors (500+)
      if (res.statusCode >= 500) {
        const responseTime = Date.now() - errorTrackingStart;
        logger.error(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip || req.socket.remoteAddress
        });
      }
      
      return result;
    };
    return next();
  }
  
  // Skip static file request logging in non-debug mode
  // For LOG_LEVEL=0 or LOG_LEVEL=1, completely disable all static file and development resource logging
  // For LOG_LEVEL=2 and LOG_LEVEL=3, filter out most development resources
  // For LOG_LEVEL=4, log everything (debug mode)
  if (config.LOG_LEVEL !== 4) {
    // Base set of static files to filter
    const staticFileExts = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    const isStaticFile = staticFileExts.some(ext => req.path.endsWith(ext));
    const isSourceMapFile = req.path.endsWith('.map');
    const isHotUpdate = req.path.includes('hot-update');
    const isViteInternal = req.path.startsWith('/@');
    
    // Add additional filters for Vite development and source files in silent mode
    const isViteDevResource = req.path.includes('node_modules') || 
                             req.path.includes('__vite') || 
                             req.path.includes('src/') || 
                             req.path.includes('client/') || 
                             req.path.includes('@fs');
    
    // Apply comprehensive filters in silent mode
    if (config.LOG_LEVEL <= 1) {
      // Skip almost all logs in silent mode except API logs
      const isAPIRequest = req.path.startsWith('/api/');
      if (!isAPIRequest) {
        return next();
      }
    }
    // In other non-debug modes, at least filter dev resources
    else if (isStaticFile || isSourceMapFile || isHotUpdate || isViteInternal || isViteDevResource) {
      return next();
    }
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
    
    // Log based on status code - respecting log level setting
    if (res.statusCode >= 500) {
      // Server errors - use error level - always logged
      logger.error(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else if (res.statusCode >= 400) {
      // Client errors - use warning level - only logged if LOG_LEVEL >= 1
      logger.warn(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else if (res.statusCode >= 300) {
      // Redirects - use info level - only logged if LOG_LEVEL >= 2
      logger.info(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else {
      // Normal requests - use http level - only logged if LOG_LEVEL >= 3
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