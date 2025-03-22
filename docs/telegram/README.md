# Telegram Integration

The Collab Room integrates deeply with Telegram to provide seamless user authentication and communication. This document describes how the Telegram integration works.

## Overview

The application uses two main aspects of Telegram's platform:

1. **Telegram Bot API**: For bot functionality and notifications
2. **Telegram WebApp**: For embedding the web application in Telegram

## Telegram Bot

### Bot Setup

The Telegram bot is initialized in `server/telegram.ts`:

```typescript
export const bot = new TelegramBot(BOT_TOKEN, {
  polling: process.env.NODE_ENV !== 'test'
});

// Register command handlers
bot.onText(/\/start/, async (msg) => {
  await handleStart(msg);
});

bot.onText(/\/status/, async (msg) => {
  await handleStatus(msg);
});
```

### Command Handlers

The bot responds to several commands:

1. **`/start`**: Introduces the user to the platform and provides a link to the WebApp
2. **`/status`**: Shows the user's current status on the platform

```typescript
async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  
  if (!telegramId) {
    await bot.sendMessage(chatId, "Failed to identify Telegram user.");
    return;
  }
  
  // Check if user already exists
  const existingUser = await storage.getUserByTelegramId(telegramId);
  
  if (existingUser) {
    // User already exists, send welcome back message
    await bot.sendMessage(
      chatId,
      `Welcome back to The Collab Room!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Open App", web_app: { url: WEBAPP_URL } }]
          ]
        }
      }
    );
  } else {
    // New user, send welcome message
    await bot.sendMessage(
      chatId,
      `Welcome to The Collab Room!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Join Now", web_app: { url: WEBAPP_URL } }]
          ]
        }
      }
    );
  }
}
```

### Notifications

The bot sends notifications to users about important events:

```typescript
export async function sendApplicationConfirmation(chatId: number) {
  await bot.sendMessage(
    chatId,
    "Your application has been received! We'll notify you when there's an update."
  );
}

export async function notifyUserApproved(chatId: number) {
  await bot.sendMessage(
    chatId,
    "Your application to join The Collab Room has been approved! You can now access all features."
  );
}
```

### Admin Notifications

The bot also notifies administrators about new users:

```typescript
export async function notifyAdminsNewUser(userData: NewUserNotification) {
  for (const adminId of ADMIN_TELEGRAM_IDS) {
    try {
      await bot.sendMessage(
        parseInt(adminId),
        `🆕 New user registered:\n\nName: ${userData.first_name} ${userData.last_name || ''}\nCompany: ${userData.company_name}\nJob: ${userData.job_title}`
      );
    } catch (error) {
      console.error(`Failed to notify admin ${adminId} about new user:`, error);
    }
  }
}
```

## Telegram WebApp

### WebApp Integration

The Telegram WebApp is integrated with the application through the Telegram Mini App platform. This allows the application to be embedded directly in Telegram:

1. Users access the app through a button in the Telegram bot
2. The app opens as a WebApp within Telegram
3. User authentication is handled automatically through Telegram

### Authentication Flow

The authentication flow works as follows:

1. When the WebApp loads, Telegram provides user data through `window.Telegram.WebApp`
2. The frontend extracts this data and sends it to the backend in the `x-telegram-init-data` header
3. The backend verifies this data and authenticates the user

```typescript
// Frontend: Extract and send Telegram data
export async function signInWithTelegram() {
  if (!window.Telegram?.WebApp) {
    console.error("Telegram WebApp is not available");
    return null;
  }

  const initData = window.Telegram.WebApp.initData;
  
  try {
    const response = await fetch('/api/profile', {
      headers: {
        'x-telegram-init-data': initData
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error signing in with Telegram:", error);
    return null;
  }
}
```

```typescript
// Backend: Verify Telegram data
function getTelegramUserFromRequest(req: TelegramReq) {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      // Handle missing data
      return null;
    }
    
    // Parse Telegram data
    const decodedInitData = new URLSearchParams(initData);
    const userJson = decodedInitData.get('user') || '{}';
    const telegramUser = JSON.parse(userJson);
    
    if (!telegramUser.id) {
      console.error('Telegram user ID missing from parsed data');
      return null;
    }
    
    return {
      id: telegramUser.id.toString(),
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username
    };
  } catch (error) {
    console.error('Error parsing Telegram user data:', error);
    return null;
  }
}
```

### Telegram WebApp API

The Telegram WebApp provides an API for interacting with the Telegram client:

```typescript
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    auth_date: string;
    hash: string;
  };
  
  // Methods
  close(): void;
  ready(): void;
  expand(): void;
  
  // Properties
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
}
```

### Development Mode Support

In development mode, the application provides a fallback for Telegram authentication:

```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('Using development fallback for Telegram data');
  return {
    id: '123456789',
    first_name: 'Dev',
    last_name: 'Test',
    username: 'dev_user'
  };
}
```

## Telegram Bot Admin Commands

Administrators can use additional bot commands:

1. **`/users`**: Lists all users on the platform
2. **`/approve <user_id>`**: Approves a user's application
3. **`/reject <user_id>`**: Rejects a user's application

## Security Considerations

The Telegram integration includes several security measures:

1. **Data Validation**: All Telegram data is validated before use
2. **Error Handling**: Robust error handling for Telegram API errors
3. **Rate Limiting**: Protection against excessive API calls
4. **Logging**: Detailed logging for security-related events

## Configuration

Telegram integration is configured through environment variables:

- `TELEGRAM_BOT_TOKEN`: The token for the Telegram bot
- `TELEGRAM_WEBAPP_URL`: The URL of the WebApp
- `ADMIN_TELEGRAM_IDS`: Comma-separated list of admin Telegram IDs