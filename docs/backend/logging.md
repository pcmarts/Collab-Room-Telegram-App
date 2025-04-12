# Structured Logging System

This document describes the structured logging system implemented in The Collab Room application.

## Overview

The application uses a comprehensive structured logging system that provides:

1. Environment-specific log levels
2. Automatic redaction of sensitive information
3. Consistent log formatting with timestamps
4. Request and error logging middleware
5. Fine-grained control through environment variables

## Log Levels

The system uses five standard log levels, following industry conventions:

| Level | Value | Description | Usage |
|-------|-------|-------------|-------|
| ERROR | 0 | Critical issues requiring immediate attention | Service unavailable, database connection failures |
| WARN | 1 | Issues that don't prevent operation but need attention | Rate limiting activated, authentication failures |
| INFO | 2 | Important operational events | Server startup, service initialization |
| HTTP | 3 | HTTP request details | Request method, path, status code, response time |
| DEBUG | 4 | Detailed diagnostic information | Variable values, flow control, detailed request data |

## Configuration

The logging level can be configured using the `LOG_LEVEL` environment variable:

```
# Silent mode (errors only)
LOG_LEVEL=0

# Only log errors and warnings (production recommended)
LOG_LEVEL=1

# Log everything (development)
LOG_LEVEL=4
```

If not explicitly set, the system uses sensible defaults based on the current environment:
- Production: WARN (1)
- Test: ERROR (0)
- Development: DEBUG (4)

### Quick Switching Between Log Levels

For convenience, you can use the toggle-logging.js script to quickly change log levels:

```bash
# Set to silent mode (ERROR only)
node toggle-logging.js 0

# Set to production mode (WARN + ERROR)
node toggle-logging.js 1

# Set to full verbose mode (all logs)
node toggle-logging.js 4
```

After changing the log level, you'll need to restart the server for the changes to take effect.

## Core Components

### 1. Logger Utility (server/utils/logger.ts)

The central logging utility that handles:
- Log level filtering
- Timestamp generation
- Sensitive data redaction
- Message formatting

```typescript
import { config } from '../../shared/config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
}

// Core logger functions
export const logger = {
  error: (message: string, meta?: any) => { /* ... */ },
  warn: (message: string, meta?: any) => { /* ... */ },
  info: (message: string, meta?: any) => { /* ... */ },
  http: (message: string, meta?: any) => { /* ... */ },
  debug: (message: string, meta?: any) => { /* ... */ }
};
```

### 2. Request Logging Middleware (server/middleware/logger-middleware.ts)

Middleware that logs HTTP requests:

```typescript
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Record start time
  const start = Date.now();
  
  // Intercept response end to calculate timing and log
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    // Restore original end function
    res.end = originalEnd;
    
    // Call original end function with arguments
    const result = res.end(chunk, encoding, callback);
    
    // Calculate response time and log with appropriate level
    const responseTime = Date.now() - start;
    
    // Log based on status code with appropriate level
    // ...
    
    return result;
  };
  
  next();
}
```

### 3. Error Logging Middleware

Middleware that logs errors with context:

```typescript
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
```

## Security Features

The logging system includes several security features:

### 1. Sensitive Data Redaction

The system automatically redacts sensitive information from logs:

```typescript
function redactSensitive(data: any): any {
  // List of sensitive fields to redact
  const sensitiveFields = [
    'password', 'token', 'secret', 'auth', 'key', 'credential', 'api_key',
    'apiKey', 'access_token', 'authorization', 'session_id', 'sessionId',
    'cookie', 'auth_token'
  ];
  
  // Redact sensitive fields (case-insensitive matching)
  // ...
}
```

This prevents accidental logging of sensitive information like:
- Passwords
- API keys 
- Access tokens
- Session IDs

### 2. Environment-Specific Formatting

- **Production**: One-line format for easier parsing by log management tools
- **Development**: Multi-line format with indentation for better readability

### 3. Strategic Log Level Defaults

- Production environments default to only logging warnings and errors
- Test environments default to only logging errors
- Development environments log everything by default

## Usage Examples

### Basic Logging

```typescript
import { logger } from '../utils/logger';

// Error logging with context
logger.error('Database connection failed', { 
  connectionString: 'postgres://user:***@host:5432/db',
  attemptCount: 3,
  error: err
});

// Info logging for important events
logger.info('Server started', { port: 5000, mode: 'production' });

// Debug logging for development
logger.debug('Processing request data', { payload: req.body });
```

### HTTP Request Logging

HTTP requests are automatically logged by the requestLogger middleware with appropriate levels:
- 5xx responses: ERROR level
- 4xx responses: WARN level
- 3xx responses: INFO level
- 2xx responses: HTTP level

### Error Logging

Errors are automatically logged by the errorLogger middleware, including:
- Error message
- Stack trace (in development only)
- Request context (method, URL, IP)

## Best Practices

1. **Use Appropriate Log Levels**: Choose the right log level for each message
2. **Include Context**: Pass relevant metadata as the second parameter
3. **Avoid Sensitive Data**: Never explicitly log sensitive information (passwords, tokens)
4. **Be Concise**: Keep log messages clear and to the point
5. **Use Structured Data**: Pass objects instead of concatenating strings