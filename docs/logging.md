# Logging System Documentation

## Overview

The Collab Room uses a structured logging system with 5 levels of verbosity that can be configured through environment variables or command line flags. This allows for flexible control over how much information is logged during development, testing, and production.

## Log Levels

The system uses the following log levels, from least to most verbose:

| Level | Number | Description | Use Case |
|-------|--------|-------------|----------|
| ERROR | 0 | Critical errors only | Silent mode, production |
| WARN  | 1 | Warnings and errors | Production default |
| INFO  | 2 | General information | Development/Staging |
| HTTP  | 3 | API requests and responses | API debugging |
| DEBUG | 4 | Verbose development logs | Detailed debugging |

## Configuration Methods

There are multiple ways to set the logging level in order of precedence:

1. **Command Line Flags** - Highest priority
   ```
   npm run dev -- --silent   # Sets ERROR level (0)
   npm run dev -- --log-level=0
   ```

2. **Direct Environment Variables** - Medium priority
   ```
   LOG_LEVEL=0 npm run dev
   ```
   
3. **Environment File (.env)** - Lower priority
   ```
   # In .env file:
   LOG_LEVEL=0
   ```

4. **Default Configuration** - Lowest priority
   - Production: WARN (1)
   - Test: ERROR (0)
   - Development: DEBUG (4)

## Silent Mode

To run the application with minimal logging (ERROR level only), use one of these methods:

### Using the Silent Mode Script (Recommended)

The `run-silent.sh` script combines multiple approaches to guarantee silent mode operation:

```bash
./run-silent.sh
```

This script:
1. Updates the LOG_LEVEL in .env
2. Sets the environment variable directly
3. Passes the --silent flag to the application

### Manual Methods

```bash
# Option 1: Use environment variable directly
LOG_LEVEL=0 npm run dev

# Option 2: Use the toggle script to update .env permanently
node toggle-logging.js 0
npm run dev

# Option 3: Use command line flag
npm run dev -- --silent
```

## Logging Utility API

The logger interface provides methods corresponding to each log level:

```javascript
import { logger } from '@server/utils/logger';

// Log messages by severity
logger.error('Critical application error', { details: 'error details' });
logger.warn('Warning: resource running low');
logger.info('Application started successfully');
logger.http('GET /api/users - 200 OK');
logger.debug('Detailed debugging information');
```

Each method accepts an optional second parameter for structured data that will be included in the log output.

## Security Considerations

- Debug logging in production was identified as a Medium security issue in a previous security audit.
- Always use ERROR or WARN level in production environments.
- When storing potentially sensitive information, use the structured format as the logger automatically redacts sensitive fields.