import { config } from '../../shared/config';

/**
 * Log levels following standard severity levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
}

/**
 * Determines if the current log level should be output
 * based on environment configuration
 */
function shouldLog(level: LogLevel): boolean {
  // Default log levels by environment
  let logLevel: LogLevel;
  
  // Extra safeguard to ensure the LOG_LEVEL from .env takes precedence
  // This directly reads from process.env first instead of using config
  const envLogLevel = process.env.LOG_LEVEL !== undefined ? parseInt(process.env.LOG_LEVEL, 10) : undefined;
  
  // First check if we have a direct environment variable
  if (typeof envLogLevel === 'number' && !isNaN(envLogLevel) && envLogLevel >= 0 && envLogLevel <= 4) {
    logLevel = envLogLevel;
    // Force a console output to show what's being used (will only show once during startup)
    if (!global.hasShownLogLevel) {
      console.log(`[LOGGER] Using LOG_LEVEL=${logLevel} from direct environment variable`);
      global.hasShownLogLevel = true;
    }
  }
  // Then check config (which also reads from process.env but might have transformations)
  else if (typeof config.LOG_LEVEL === 'number') {
    logLevel = config.LOG_LEVEL;
    if (!global.hasShownLogLevel) {
      console.log(`[LOGGER] Using LOG_LEVEL=${logLevel} from config`);
      global.hasShownLogLevel = true;
    }
  }
  // Otherwise use sensible defaults by environment
  else if (config.NODE_ENV === 'production') {
    logLevel = LogLevel.WARN; // Only errors and warnings in production
  } else if (config.NODE_ENV === 'test') {
    logLevel = LogLevel.ERROR; // Only errors in test
  } else {
    logLevel = LogLevel.DEBUG; // All logs in development
  }
  
  return level <= logLevel;
}

// Add type definition to make TypeScript happy
declare global {
  var hasShownLogLevel: boolean;
}

/**
 * Format the current timestamp for logging
 */
function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Format a log message with metadata
 */
function formatLog(level: string, message: string, meta?: any): string {
  const ts = timestamp();
  
  // Basic log with timestamp and level
  let log = `[${ts}] [${level}] ${message}`;
  
  // Add metadata if provided
  if (meta) {
    // Format meta differently based on environment
    if (config.NODE_ENV === 'production') {
      // Simple one-line format for production (easier to parse)
      try {
        log += ` ${JSON.stringify(redactSensitive(meta))}`;
      } catch (err) {
        log += ` [Error serializing metadata]`;
      }
    } else {
      // More readable format for development
      try {
        log += `\n${JSON.stringify(redactSensitive(meta), null, 2)}`;
      } catch (err) {
        log += `\n[Error serializing metadata]`;
      }
    }
  }
  
  return log;
}

/**
 * Redact sensitive information from objects before logging
 */
function redactSensitive(data: any): any {
  if (!data) return data;
  
  // Handle different data types
  if (typeof data !== 'object') {
    return data;
  }
  
  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => redactSensitive(item));
  }
  
  // Clone the object to avoid mutating the original
  const result = { ...data };
  
  // List of sensitive fields to redact
  const sensitiveFields = [
    'password', 'token', 'secret', 'auth', 'key', 'credential', 'api_key',
    'apiKey', 'access_token', 'authorization', 'session_id', 'sessionId',
    'cookie', 'auth_token'
  ];
  
  // Redact sensitive fields (case-insensitive matching)
  for (const key in result) {
    // Check if this is a sensitive field
    const isMatch = sensitiveFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    );
    
    if (isMatch && result[key]) {
      // Redact the value but preserve its type and length
      const val = String(result[key]);
      result[key] = '[REDACTED]' + (val.length > 10 ? ` (${val.length} chars)` : '');
    } 
    // Recursively process nested objects
    else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = redactSensitive(result[key]);
    }
  }
  
  return result;
}

/**
 * The logger object with methods for each log level
 */
export const logger = {
  /**
   * Log an error message
   */
  error: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(formatLog('ERROR', message, meta));
    }
  },
  
  /**
   * Log a warning message
   */
  warn: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatLog('WARN', message, meta));
    }
  },
  
  /**
   * Log an informational message
   */
  info: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.INFO)) {
      console.info(formatLog('INFO', message, meta));
    }
  },
  
  /**
   * Log HTTP request details
   */
  http: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.HTTP)) {
      console.log(formatLog('HTTP', message, meta));
    }
  },
  
  /**
   * Log debug information (only output in development)
   */
  debug: (message: string, meta?: any) => {
    if (shouldLog(LogLevel.DEBUG)) {
      console.log(formatLog('DEBUG', message, meta));
    }
  }
};