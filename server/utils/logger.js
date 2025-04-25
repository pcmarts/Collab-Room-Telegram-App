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

// Get log level from environment or default to ERROR (0) - Silent Mode
const LOG_LEVEL = 0; // FORCED TO SILENT MODE

// Create logger object
const logger = {
  error: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.ERROR) console.error(`[${new Date().toISOString()}] [ERROR]`, ...args);
  },
  warn: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.WARN) console.warn(`[${new Date().toISOString()}] [WARN]`, ...args);
  },
  info: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.INFO) console.info(`[${new Date().toISOString()}] [INFO]`, ...args);
  },
  http: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.HTTP) console.info(`[${new Date().toISOString()}] [HTTP]`, ...args);
  },
  debug: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.DEBUG) console.debug(`[${new Date().toISOString()}] [DEBUG]`, ...args);
  }
};

// Export the logger
export { logger };