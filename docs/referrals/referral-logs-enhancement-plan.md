# Referral System Logging Enhancement Plan

This document outlines the enhanced logging strategy for the referral system implementation. The goal is to ensure comprehensive visibility into each operation for thorough testing and troubleshooting.

## Logging Principles

1. **Consistent Format**: All logs follow a consistent format for easy parsing
2. **Appropriate Detail Level**: Logs contain sufficient detail without exposing sensitive data
3. **Context Inclusion**: Each log includes user IDs and operation context
4. **Performance Events**: Critical performance metrics are logged for optimization
5. **Error Details**: Errors include stack traces and recovery attempts
6. **Analytics Integration**: Key user actions are logged for analytics

## Enhanced Logging Implementation

### Database Operations Logging

Add the following logging to database operations:

```typescript
// In referral-service.ts

export async function getOrCreateReferralCode(userId: string, telegramId: string) {
  logger.info('Referral code requested', { userId, telegramId });
  const startTime = performance.now();
  
  try {
    // ... existing code ...
    
    const existingCode = await db.select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, userId))
      .limit(1);
      
    if (existingCode.length > 0) {
      logger.info('Returning existing referral code', { 
        userId,
        codeExists: true,
        totalAvailable: existingCode[0].total_available,
        totalUsed: existingCode[0].total_used
      });
      
      // ... rest of function ...
    } else {
      logger.info('Generating new referral code', { userId });
      
      // ... code generation logic ...
      
      logger.info('New referral code created', {
        userId,
        isNew: true,
        totalAvailable: 3, 
        totalUsed: 0
      });
    }
    
    const endTime = performance.now();
    logger.debug('Referral code operation performance', {
      userId,
      operationTimeMs: endTime - startTime
    });
    
    return result;
  } catch (error) {
    logger.error('Failed to generate referral code', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to generate referral code');
  }
}
```

### API Endpoint Logging

Enhance API endpoint logging with request/response details:

```typescript
// In referral-routes.ts

referralRoutes.post('/generate', referralLimiter, async (req, res) => {
  const userId = req.user.id;
  const telegramId = req.user.telegramId;
  
  logger.info('Referral code generation endpoint called', {
    userId,
    telegramId,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip
  });
  
  try {
    // ... existing code ...
    
    logger.info('Referral code generation successful', {
      userId,
      codeGenerated: true,
      totalAvailable: referralInfo.totalAvailable,
      totalUsed: referralInfo.totalUsed
    });
    
    return res.status(200).json({
      success: true,
      // ... rest of response ...
    });
  } catch (error) {
    logger.error('Error in referral code generation endpoint', {
      userId,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
});
```

### User Interface Event Logging

Add UI event logging to track user interactions:

```typescript
// In ReferralCard.tsx

const handleShareReferral = () => {
  logger.info('User initiated referral sharing', {
    userId: currentUser.id,
    shareMethod: 'telegram'
  });
  
  try {
    // Share logic...
    
    // Track analytics event
    analytics.track('referral_link_shared', {
      userId: currentUser.id,
      platform: 'telegram'
    });
    
    logger.info('Referral sharing completed', {
      userId: currentUser.id,
      success: true
    });
  } catch (error) {
    logger.error('Referral sharing failed', {
      userId: currentUser.id,
      error: error.message
    });
    
    // Show error to user...
  }
};
```

### Telegram Integration Logging

Enhance Telegram-specific operation logging:

```typescript
// In telegram.ts or referral-telegram.ts

export function handleReferralDeepLink(telegramUser, encodedReferral) {
  logger.info('Processing referral deep link', {
    telegramId: telegramUser.id,
    encodedReferral: encodedReferral
  });
  
  try {
    const decodedReferral = decodeReferralInfo(encodedReferral);
    
    logger.info('Decoded referral deep link', {
      telegramId: telegramUser.id,
      referralCode: decodedReferral
    });
    
    // Process referral...
    
    return {
      success: true,
      referralCode: decodedReferral
    };
  } catch (error) {
    logger.error('Failed to process referral deep link', {
      telegramId: telegramUser.id,
      encodedReferral,
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: 'Invalid referral link'
    };
  }
}
```

## Logging Configuration for Testing

To enable detailed logging during testing phases:

```typescript
// In logger.ts or config.ts

// Default production logging
let logLevel = 'info';

// During testing phases
if (process.env.ENABLE_REFERRAL_TESTING === 'true') {
  logLevel = 'debug';
}

export const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.json(),
    // Custom format to redact sensitive information
    format((info) => {
      if (info.referralCode) {
        info.referralCode = redactPart(info.referralCode);
      }
      return info;
    })()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'referral-system.log' })
  ]
});

// Helper function to redact part of sensitive information
function redactPart(text) {
  if (typeof text !== 'string' || text.length < 8) return text;
  return text.substring(0, 4) + '****' + text.substring(text.length - 4);
}
```

## Log Analysis Features

Add functionality to analyze logs during testing:

```typescript
// In server/utils/log-analyzer.ts

export async function analyzeReferralLogs(timeframe = '1h') {
  const logs = await readLogFile('referral-system.log');
  const recentLogs = filterLogsByTimeframe(logs, timeframe);
  
  const analysis = {
    totalOperations: recentLogs.length,
    successfulOperations: recentLogs.filter(log => !log.error).length,
    failedOperations: recentLogs.filter(log => log.error).length,
    averageResponseTime: calculateAverageTime(recentLogs),
    operationsByType: countOperationsByType(recentLogs),
    errorsByType: groupErrorsByType(recentLogs),
    userActions: {
      codeGenerations: countActionType(recentLogs, 'code generated'),
      codeShares: countActionType(recentLogs, 'referral sharing'),
      codeApplications: countActionType(recentLogs, 'referral applied')
    }
  };
  
  return analysis;
}
```

## Testing Verification via Logs

For each testing phase, create log analysis scripts:

```typescript
// phase1-log-verification.ts

export async function verifyPhase1Logs() {
  const logs = await readLogFile('referral-system.log');
  
  // Check for schema creation events
  const schemaLogs = logs.filter(log => 
    log.message.includes('table creation') || 
    log.message.includes('index creation')
  );
  
  // Check for service initialization
  const serviceLogs = logs.filter(log =>
    log.message.includes('service initialized')
  );
  
  // Check for test form submissions
  const formLogs = logs.filter(log =>
    log.message.includes('form submitted') &&
    log.referralCode?.includes('TEST_CODE')
  );
  
  return {
    schemaCreation: schemaLogs.length > 0,
    serviceInit: serviceLogs.length > 0,
    formSubmission: formLogs.length > 0,
    allChecksPass: schemaLogs.length > 0 && serviceLogs.length > 0 && formLogs.length > 0
  };
}
```

## Log Inspection Tooling

Add a simple log inspector for development:

```typescript
// In server/tools/log-inspector.ts

export async function inspectReferralLogs(userId) {
  // Read logs
  const logs = await readLogFile('referral-system.log');
  
  // Filter logs for specific user
  const userLogs = logs.filter(log => log.userId === userId);
  
  // Group by operation type
  const groupedLogs = {};
  
  userLogs.forEach(log => {
    const operation = determineOperationType(log);
    if (!groupedLogs[operation]) {
      groupedLogs[operation] = [];
    }
    groupedLogs[operation].push(log);
  });
  
  // Find any errors
  const errors = userLogs.filter(log => log.error);
  
  return {
    totalLogs: userLogs.length,
    operations: groupedLogs,
    errors: errors,
    timeline: createUserTimeline(userLogs)
  };
}
```

## Real-time Monitoring for Testing

For active testing, set up real-time monitoring:

```typescript
// In server/tools/referral-monitor.ts

export function startReferralMonitor() {
  // Set up log file watcher
  const watcher = fs.watch('referral-system.log');
  
  watcher.on('change', async () => {
    const newLogs = await readNewLogEntries();
    
    // Process new logs
    newLogs.forEach(log => {
      // Check for important events
      if (log.message.includes('error') || log.error) {
        notifyDeveloper('Error detected in referral system', log);
      }
      
      // Check for performance issues
      if (log.operationTimeMs && log.operationTimeMs > 500) {
        notifyDeveloper('Performance issue detected', log);
      }
      
      // Update real-time dashboard
      updateDashboard(log);
    });
  });
  
  return {
    stop: () => watcher.close()
  };
}
```

## Implementation Strategy

1. **Add Base Logging**: Implement the core logging format and configuration
2. **Enhance Services**: Add detailed logging to referral services
3. **Instrument API**: Add request/response logging to API endpoints
4. **Add UI Logging**: Implement client-side logging for user actions
5. **Create Analysis Tools**: Develop log analysis utilities for testing
6. **Setup Monitoring**: Configure real-time monitoring during testing phases

Each step should be completed before advancing to the next testing phase to ensure proper visibility into the system operations.