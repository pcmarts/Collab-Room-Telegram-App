# Production WebApp URL Configuration Fix

## Problem Summary

The production Telegram bot's "Launch Collab Room" button points to the development environment instead of the live production deployment.

## Root Cause

The issue stems from environment variable configuration during deployment:

1. **Development Environment**: Uses `REPLIT_DOMAINS` with development URL (`*.replit.dev`)
2. **Production Deployment**: Still uses development `REPLIT_DOMAINS` instead of production domain
3. **Telegram Bot Configuration**: Uses production bot token but development webapp URL

## Current Behavior

- Production bot: `TELEGRAM_BOT_TOKEN` (correct)
- WebApp URL: `https://4bc9c414-33f2-4fb8-8d65-1bc3e032276d-00-i4wrml6gmvd4.kirk.replit.dev` (incorrect - should be production domain)
- NODE_ENV: `undefined` (should be `production` in deployment)

## Solution

### 1. Environment Variable Configuration

When deploying to production, ensure these environment variables are set:

```bash
NODE_ENV=production
WEBAPP_URL=https://your-production-domain.com
TELEGRAM_BOT_TOKEN=<production_bot_token>
```

### 2. Deployment Configuration

The current `.replit` file has correct deployment settings:

```toml
[deployment]
deploymentTarget = "cloudrun"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

The `npm run start` command correctly sets `NODE_ENV=production`.

### 3. Updated Telegram Bot Configuration

The bot now uses this priority order for webapp URL:

1. `WEBAPP_URL` environment variable (highest priority)
2. `REPLIT_DOMAINS` environment variable 
3. Fallback to `https://localhost:5000`

### 4. Warning System

Added automatic detection and warnings when production bot uses development URL:

```
🔧 ⚠️  WARNING: Production bot using development URL!
🔧 ⚠️  This means "Launch Collab Room" button will point to development environment
🔧 ⚠️  Set WEBAPP_URL environment variable to the production domain for deployment
```

## Deployment Instructions

### For Google Cloud Run Deployment

1. **Set Environment Variables** in Cloud Run:
   ```bash
   NODE_ENV=production
   WEBAPP_URL=https://your-production-domain.com
   TELEGRAM_BOT_TOKEN=<your_production_bot_token>
   DATABASE_URL=<your_production_database_url>
   ```

2. **Deploy using Replit Deploy** or manually deploy with:
   ```bash
   npm run build
   npm run start
   ```

3. **Verify Configuration** by checking logs for:
   ```
   🔧 Environment: PRODUCTION
   🔧 Final WEBAPP_URL: https://your-production-domain.com
   ```

### For Other Deployment Platforms

Set the same environment variables in your deployment platform's configuration.

## Testing

1. **Development**: Bot uses development URL (expected)
2. **Production**: Bot should use production domain URL
3. **Telegram Bot**: "Launch Collab Room" button should open production app

## Monitoring

Watch for these log patterns:
- `🔧 WEBAPP_URL CONFIGURATION:` - Shows current URL configuration
- `🔧 ⚠️  WARNING: Production bot using development URL!` - Indicates misconfiguration
- `🔧 Environment: PRODUCTION` - Confirms production mode

## Related Files

- `server/telegram.ts` - Telegram bot configuration
- `package.json` - Start script with NODE_ENV
- `.replit` - Deployment configuration
- `replit.md` - Project documentation

## Implementation Date

July 14, 2025 - Fixed production WebApp URL configuration issue