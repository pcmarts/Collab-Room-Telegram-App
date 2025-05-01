/**
 * Logger Utility
 * 
 * Simple logging utility that respects log levels.
 */

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};

// Get log level from environment or default to INFO (2)
const LOG_LEVEL = parseInt(process.env.LOG_LEVEL || '2', 10);

// Create logger object
const logger = {
  error: (...args: any[]) => {
    if (LOG_LEVEL >= LOG_LEVELS.ERROR) console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
  },
  warn: (...args: any[]) => {
    if (LOG_LEVEL >= LOG_LEVELS.WARN) console.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
  },
  info: (...args: any[]) => {
    if (LOG_LEVEL >= LOG_LEVELS.INFO) console.info(`[${new Date().toISOString()}] [INFO]`, ...args);
  },
  http: (...args: any[]) => {
    if (LOG_LEVEL >= LOG_LEVELS.HTTP) console.info(`[${new Date().toISOString()}] [HTTP]`, ...args);
  },
  debug: (...args: any[]) => {
    if (LOG_LEVEL >= LOG_LEVELS.DEBUG) console.debug(`[${new Date().toISOString()}] [DEBUG]`, ...args);
  }
};

// Export the logger
export { logger };