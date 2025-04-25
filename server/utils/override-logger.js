/**
 * Override Logger
 * 
 * This module forcibly overrides all console logging methods to implement
 * a true silent mode regardless of environment variables or other settings.
 * 
 * To enable silent mode, import this file at the top of your entry point:
 * import './utils/override-logger.js';
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Flag to enable silent mode
const SILENT_MODE = true;

// Print a single startup message
if (SILENT_MODE) {
  originalConsole.log('[OVERRIDE] Silent mode activated - all non-error logs suppressed');
}

// Override console methods to implement silent mode
console.log = function(...args) {
  if (!SILENT_MODE) {
    originalConsole.log(...args);
  }
};

console.info = function(...args) {
  if (!SILENT_MODE) {
    originalConsole.info(...args);
  }
};

console.warn = function(...args) {
  if (!SILENT_MODE) {
    originalConsole.warn(...args);
  }
};

// Still allow errors to be logged
console.error = function(...args) {
  originalConsole.error(...args);
};

console.debug = function(...args) {
  if (!SILENT_MODE) {
    originalConsole.debug(...args);
  }
};

// Export the original console for cases where logging is absolutely necessary
export const originalConsoleLogger = originalConsole;