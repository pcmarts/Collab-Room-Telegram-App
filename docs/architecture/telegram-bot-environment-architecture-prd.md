# Telegram Bot Environment Architecture - Analysis & Proposed Solution

## Executive Summary

The current Telegram bot architecture faces critical issues with environment isolation, causing test environment actions to interfere with production behavior. This PRD analyzes the root causes and proposes a clean architectural solution to properly isolate test and production environments while maintaining a shared database.

## Current State Analysis

### 1. Architecture Overview

The system currently uses two Telegram bots:
- **Production Bot**: `TELEGRAM_BOT_TOKEN` - for production users
- **Test Bot**: `TELEGRAM_TEST_BOT_TOKEN` - for test environment users

Both bots share:
- Same PostgreSQL database
- Same codebase
- Same server instance when running

### 2. Bot Selection Logic

Current bot selection is based on a complex, problematic logic:

```typescript
// From server/telegram.ts
const forceProductionBot = process.env.FORCE_PRODUCTION_BOT === "true";
const isProduction = forceProductionBot || process.env.NODE_ENV === "production";
const BOT_TOKEN = isProduction 
  ? process.env.TELEGRAM_BOT_TOKEN 
  : (process.env.TELEGRAM_TEST_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
```

### 3. Key Problem Areas

#### 3.1 Environment Entanglement
- **Root Cause**: Bot selection is based on `NODE_ENV` rather than which bot the user actually interacted with
- **Impact**: Users who start with test bot may receive notifications from production bot and vice versa
- **Symptom**: "Chat not found" errors when bot tries to send messages to users who never interacted with it

#### 3.2 The `/start` Command Delays
- **Root Cause**: Complex referral processing and multiple database queries without proper caching strategy
- **Contributing Factors**:
  - Multiple sequential database queries
  - No connection pooling optimization
  - Heavy logging in development mode
  - Cache implementation exists but may not be properly warmed

#### 3.3 `FORCE_PRODUCTION_BOT` Confusion
- **Purpose**: Band-aid solution to force production bot usage regardless of environment
- **Problems**:
  - Adds complexity to already confusing logic
  - Doesn't solve root issue of tracking which bot users registered with
  - Creates hidden state dependencies
  - Makes debugging harder

#### 3.4 WebApp URL Confusion
- **Issue**: Production bot can point to development URLs
- **Root Cause**: `WEBAPP_URL` falls back to `REPLIT_DOMAINS` which may contain development URLs
- **Impact**: Users clicking "Launch Collab Room" from production bot end up in development environment

### 4. Architectural Flaws

1. **No Bot Association Tracking**: Database doesn't track which bot a user registered with
2. **Single Bot Instance**: Only one bot runs at a time, determined by environment
3. **Environment Variable Overloading**: Too many conditional checks and fallbacks
4. **Shared State**: Both environments trying to use same notification system

### 5. Notification System Issues

Based on code analysis, the notification system has several critical problems:

#### 5.1 The `sendDirectFormattedMessage` Function
- Core function for sending all notifications
- Logs extensive debugging information but still fails with "chat not found" errors
- No fallback mechanism when primary bot fails
- Assumes user registered with the current environment's bot

#### 5.2 Notification Flow Problems
1. **User Registration**: User registers with test bot (creates chat association)
2. **Environment Switch**: Server runs in production mode
3. **Notification Attempt**: Production bot tries to send message to user
4. **Failure**: "Chat not found" because production bot never interacted with user

#### 5.3 Current Workarounds
- `FORCE_PRODUCTION_BOT` environment variable - band-aid solution
- Extensive logging to debug issues
- Manual intervention required when notifications fail

## Proposed Solution

### 1. Core Principle: Bot-User Association

Track which bot each user registered with and ensure all communications go through the same bot.

### 2. Database Schema Changes

Add bot association to users table:

```sql
ALTER TABLE users ADD COLUMN registered_bot_type VARCHAR(20) DEFAULT 'production';
-- Values: 'production', 'test'

CREATE INDEX idx_users_registered_bot_type ON users(registered_bot_type);
```

### 3. Dual Bot Architecture

Run both bots simultaneously in separate processes:

```
server/
  bots/
    production-bot.ts  -- Production bot process
    test-bot.ts        -- Test bot process
    shared/
      handlers.ts      -- Shared command handlers
      notifications.ts -- Notification logic
```

### 4. Environment Configuration

Simplify environment variables:

```bash
# Production bot config
TELEGRAM_PRODUCTION_BOT_TOKEN=xxx
TELEGRAM_PRODUCTION_WEBAPP_URL=https://production.domain.com

# Test bot config  
TELEGRAM_TEST_BOT_TOKEN=xxx
TELEGRAM_TEST_WEBAPP_URL=https://test.domain.com

# Shared
DATABASE_URL=xxx
```

### 5. Bot Selection Logic

Replace complex conditionals with simple, explicit logic:

```typescript
// When user interacts with bot
async function handleStart(msg: TelegramBot.Message, botType: 'production' | 'test') {
  const user = await createOrUpdateUser({
    telegram_id: msg.from.id,
    registered_bot_type: botType,
    // ... other fields
  });
}

// When sending notifications
async function sendNotification(userId: number, message: string) {
  const user = await getUser(userId);
  const bot = user.registered_bot_type === 'test' ? testBot : productionBot;
  await bot.sendMessage(user.telegram_chat_id, message);
}
```

### 6. Process Management

Use PM2 or similar to run both bots:

```json
{
  "apps": [
    {
      "name": "collab-room-prod-bot",
      "script": "./server/bots/production-bot.ts",
      "env": {
        "BOT_TYPE": "production"
      }
    },
    {
      "name": "collab-room-test-bot", 
      "script": "./server/bots/test-bot.ts",
      "env": {
        "BOT_TYPE": "test"
      }
    }
  ]
}
```

### 7. Migration Strategy

1. **Phase 1**: Add `registered_bot_type` column with default 'production'
2. **Phase 2**: Deploy dual bot architecture in parallel with existing
3. **Phase 3**: Migrate existing users based on their interaction history
4. **Phase 4**: Remove old bot logic and `FORCE_PRODUCTION_BOT`

## Benefits of Proposed Solution

1. **Clear Separation**: Each bot operates independently
2. **No Environment Confusion**: Users always interact with the same bot
3. **Simplified Logic**: No complex conditionals or environment detection
4. **Better Performance**: Each bot has its own process and resources
5. **Easier Debugging**: Clear association between users and bots
6. **Scalability**: Can add more bots (staging, etc.) easily

## Implementation Roadmap

### Phase 1: Database Preparation (1 day)
- Add `registered_bot_type` column
- Create migration script
- Update schema types

### Phase 2: Dual Bot Architecture (2-3 days)
- Refactor bot code into separate processes
- Extract shared handlers
- Implement bot-specific configurations

### Phase 3: Notification System Update (1 day)
- Update notification logic to use registered bot type
- Remove `FORCE_PRODUCTION_BOT` logic
- Test notification routing

### Phase 4: Deployment & Migration (1 day)
- Deploy both bots
- Run user migration based on logs
- Monitor for issues

### Phase 5: Cleanup (1 day)
- Remove old environment logic
- Update documentation
- Remove deprecated environment variables

## Risk Mitigation

1. **Backward Compatibility**: Keep old logic during migration
2. **Gradual Rollout**: Test with small user group first
3. **Rollback Plan**: Can revert to single bot if issues arise
4. **Monitoring**: Add metrics for bot response times and errors

## Success Metrics

1. **Zero "chat not found" errors**
2. **Consistent sub-second `/start` command response**
3. **100% correct bot-user associations**
4. **Simplified codebase (remove 50+ lines of environment logic)**
5. **Clear separation of test/production data flows**

## Additional Technical Considerations

### Performance Optimization for /start Command

The analysis revealed several performance bottlenecks in the `/start` command:

1. **Sequential Database Queries**: Multiple separate queries for user, company, and referral data
2. **Inefficient Caching**: Cache exists but may not be properly warmed or utilized
3. **Heavy Logging**: Extensive console logging in development mode adds overhead

**Recommendations**:
- Implement database query optimization with JOINs
- Pre-warm cache on bot startup
- Use log levels to reduce overhead in production
- Consider connection pooling optimization

### Database Connection Management

Current implementation creates new database connections for each query. This could be optimized with:
- Connection pooling configuration
- Query batching where appropriate
- Prepared statements for frequently used queries

## Conclusion

The current architecture's attempt to handle multiple environments with a single bot instance and complex conditional logic has created more problems than it solves. The proposed dual-bot architecture with explicit user-bot association provides a cleaner, more maintainable solution that properly isolates environments while maintaining the shared database requirement.

## Immediate Action Items

While the full architectural refactor is being planned, these immediate steps can help mitigate current issues:

1. **Document Current Bot Tokens**: Create clear documentation of which bot token is used in which environment
2. **Add Bot Type Logging**: Add logging to track which bot users are registering with
3. **Create Bot Migration Script**: Prepare a script to identify which users belong to which bot based on logs
4. **Set WEBAPP_URL Explicitly**: Always set `WEBAPP_URL` environment variable explicitly for each environment
5. **Monitor "Chat Not Found" Errors**: Set up alerting for these errors to track impact