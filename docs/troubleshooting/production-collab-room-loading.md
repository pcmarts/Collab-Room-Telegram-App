# Production Collab Room Loading Issues

## Issue: Slow "Launch Collab Room" Loading in Production

### Symptoms
- Users click "Launch Collab Room" button in production Telegram bot
- Application takes a very long time to load or times out
- Users may see connection errors or blank screens

### Root Cause
The issue is **NOT** that the system is looking for a separate collaboration room server that doesn't exist. The "Launch Collab Room" button simply opens the main web application at the `/discover` route.

The real problem is **missing or incorrect `WEBAPP_URL` environment variable configuration** in production deployments.

### How It Works
1. Telegram bot determines the WebApp URL using this priority order:
   - `WEBAPP_URL` environment variable (highest priority)
   - `REPLIT_DOMAINS` environment variable
   - Fallback to `https://localhost:5000`

2. When `WEBAPP_URL` is not set in production:
   - Bot falls back to using `REPLIT_DOMAINS`
   - `REPLIT_DOMAINS` typically contains development URLs (e.g., `*.replit.dev`)
   - Production bot tries to open development environment
   - This causes slow loading, timeouts, or connection errors

### Solution

#### For Production Deployment

Set the `WEBAPP_URL` environment variable to your production domain:

```bash
WEBAPP_URL=https://your-production-domain.com
```

#### Environment Variable Configuration

**Required for Production:**
```bash
NODE_ENV=production
WEBAPP_URL=https://your-production-domain.com
TELEGRAM_BOT_TOKEN=<your_production_bot_token>
DATABASE_URL=<your_production_database_url>
```

**Optional (if using cross-environment notifications):**
```bash
FORCE_PRODUCTION_BOT=true  # Note: should be 'true', not '=true'
```

### Verification

After deployment, check the application logs for these indicators:

**Correct Configuration:**
```
🔧 WEBAPP_URL CONFIGURATION:
🔧 WEBAPP_URL env var: "https://your-production-domain.com"
🔧 Final WEBAPP_URL: "https://your-production-domain.com"
🔧 Environment: PRODUCTION
```

**Incorrect Configuration (Warning):**
```
🔧 ⚠️  WARNING: Production bot using development URL!
🔧 ⚠️  This means "Launch Collab Room" button will point to development environment
🔧 ⚠️  Set WEBAPP_URL environment variable to the production domain for deployment
```

### Common Mistakes

1. **Not setting `WEBAPP_URL`** - Most common cause of slow loading
2. **Wrong domain in `WEBAPP_URL`** - Using development URL in production
3. **Malformed environment variables** - E.g., `FORCE_PRODUCTION_BOT==true` instead of `FORCE_PRODUCTION_BOT=true`
4. **Missing protocol** - Using `your-domain.com` instead of `https://your-domain.com`

### Testing

1. **Development Environment**: Bot should use development URL (expected behavior)
2. **Production Environment**: Bot should use production domain URL
3. **Telegram Bot Test**: Click "Launch Collab Room" button and verify it opens the correct environment

### Related Documentation

- [Production WebApp URL Fix](../deployment/production-webapp-url-fix.md)
- [Deployment README](../deployment/README.md)
- [Telegram Bot Documentation](../telegram/README.md)

### Implementation Date

July 24, 2025 - Issue identified and documented

### Technical Notes

- No code changes are required to fix this issue
- The system already has proper URL configuration logic in place
- Issue is purely related to environment variable configuration
- The Telegram bot includes automatic warning detection for this specific problem