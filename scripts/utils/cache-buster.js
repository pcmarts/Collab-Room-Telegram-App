/**
 * This script inserts cache-busting headers in all responses across the application
 * 
 * To use:
 * 1. Import this file in server/index.ts before any routes are registered
 * 2. Add the middleware to the Express app
 * 
 * Example:
 * ```
 * import { cacheBusterMiddleware } from '../cache-buster';
 * app.use(cacheBusterMiddleware);
 * ```
 */

const cacheBusterMiddleware = (req, res, next) => {
  // Store the original send method
  const originalSend = res.send;

  // Override the send method to add cache-busting headers
  res.send = function() {
    // Set cache control headers to prevent caching on all responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Add a unique timestamp to the response headers
    res.setHeader('X-Response-Time', Date.now().toString());
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    // Disable ETag generation to prevent 304 Not Modified responses
    res.setHeader('ETag', Date.now().toString());
    
    // Call the original send method
    return originalSend.apply(this, arguments);
  };
  
  next();
};

module.exports = { cacheBusterMiddleware };