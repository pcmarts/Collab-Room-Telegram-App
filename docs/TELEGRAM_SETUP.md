# Telegram Bot Setup Guide

This guide walks you through creating a Telegram bot and configuring it for The Collab Room.

## Prerequisites

- A Telegram account
- Your app deployed to a public HTTPS URL (required for WebApps)

## Step 1: Create Your Bot

1. Open Telegram and search for **@BotFather**
2. Start a chat and send `/newbot`
3. Follow the prompts:
   - Enter a **display name** for your bot (e.g., "The Collab Room")
   - Enter a **username** ending in `bot` (e.g., `TheCollabRoomBot`)
4. BotFather will respond with your **bot token**:
   ```
   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. **Save this token** - you'll need it for the `TELEGRAM_BOT_TOKEN` environment variable

## Step 2: Configure the WebApp

1. In your chat with BotFather, send `/mybots`
2. Select your bot
3. Click **Bot Settings** → **Menu Button**
4. Click **Configure menu button**
5. Enter your WebApp URL (must be HTTPS):
   ```
   https://your-app-url.replit.app
   ```
6. Enter a title for the button (e.g., "Open App")

## Step 3: Set Bot Commands (Optional)

1. Send `/setcommands` to BotFather
2. Select your bot
3. Send the commands in this format:
   ```
   start - Open the app
   help - Get help
   ```

## Step 4: Configure Environment Variables

Add these to your `.env` file:

```bash
# Required
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Your public app URL (no trailing slash)
WEBAPP_URL=https://your-app-url.replit.app
```

## Step 5: Verify the Setup

1. Restart your app to load the new environment variables
2. Open your bot in Telegram
3. Send `/start` - you should receive a welcome message
4. Click the menu button - the WebApp should open

## Troubleshooting

### Bot not responding to commands
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check server logs for connection errors
- Ensure your server is running

### WebApp not opening
- Confirm the URL is HTTPS (required by Telegram)
- Verify `WEBAPP_URL` matches your deployed URL exactly
- Check that the menu button is configured in BotFather

### Authentication errors in browser
- This is **expected behavior** when opening the app directly in a browser
- The app must be opened from within Telegram to authenticate
- Telegram injects `initData` that the backend uses for verification

### WebApp shows blank or errors
- Open browser dev tools to check for JavaScript errors
- Verify the app builds and runs correctly locally
- Check that all environment variables are set

## Security Notes

1. **Never commit your bot token** - keep it in `.env` only
2. **Rotate your token** if it's ever exposed:
   - Send `/revoke` to BotFather
   - Select your bot to generate a new token
3. **Validate initData** - the backend already does this, don't bypass it

## Additional Configuration

### Bot Profile Picture
1. Send `/setuserpic` to BotFather
2. Select your bot
3. Send an image (recommended: 512x512 pixels)

### Bot Description
1. Send `/setdescription` to BotFather
2. Select your bot
3. Enter a description shown when users first open the bot

### Bot About Text
1. Send `/setabouttext` to BotFather
2. Select your bot
3. Enter text shown on the bot's profile page

## Testing Locally

For local development, you can use a tunnel service to expose your local server:

```bash
# Using ngrok (install separately)
ngrok http 5000
```

Then update `WEBAPP_URL` in `.env` to the ngrok HTTPS URL and reconfigure the menu button in BotFather.

Note: Free ngrok URLs change on restart, so this is only suitable for testing.
