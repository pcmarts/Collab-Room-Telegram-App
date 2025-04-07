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

export async function notifyMatchCreated(hostUserId: string, requesterUserId: string, collaborationId: string) {
  try {
    // Get user and collaboration details from database
    const [hostUser] = await db.select().from(users).where(eq(users.id, hostUserId));
    const [requesterUser] = await db.select().from(users).where(eq(users.id, requesterUserId)); 
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    
    // Get company details
    const [hostCompany] = await db.select().from(companies).where(eq(companies.user_id, hostUserId));
    const [requesterCompany] = await db.select().from(companies).where(eq(companies.user_id, requesterUserId));
    
    // Convert telegram_id to integers for chat ID
    const hostChatId = parseInt(hostUser.telegram_id);
    const requesterChatId = parseInt(requesterUser.telegram_id);
    
    // Format HTML messages with rich formatting
    const hostMessage = `🎉 <b>New Match!</b>\n\n${requesterUser.first_name} ${requesterUser.last_name || ''} from ${requesterCompany?.name || 'a company'} is a match for your <b>${collaboration.collab_type}</b> collaboration!`;
    const requesterMessage = `🎉 <b>New Match!</b>\n\n${hostUser.first_name} ${hostUser.last_name || ''} from ${hostCompany?.name || 'a company'} just approved your collab request for <b>${collaboration.collab_type}</b>!`;
    
    // Create interactive keyboards for both users
    const hostKeyboard = {
      inline_keyboard: [
        [{ text: "💬 Chat with Collaborator", url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}` }],
        [{ text: "🚀 Discover More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }],
        [{ text: "👥 View Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
      ]
    };
    
    // Send notifications with fallback options if HTML formatting fails
    await sendDirectFormattedMessage(hostChatId, hostMessage, hostKeyboard);
    await sendDirectFormattedMessage(requesterChatId, requesterMessage, requesterKeyboard);
  } catch (error) {
    console.error('[Telegram Bot] Error preparing match notifications:', error);
  }
}
```

### Admin Notifications

The bot sends enhanced notifications to administrators about new user applications with interactive buttons for immediate actions:

```typescript
interface NewUserNotification {
  telegram_id: string;
  first_name: string;
  last_name?: string;
  handle?: string;
  company_name: string;
  company_website?: string;
  job_title: string;
}

export async function notifyAdminsNewUser(userData: NewUserNotification) {
  try {
    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_admin, true));

    if (!adminUsers.length) {
      console.warn("No admin users found to notify");
      return;
    }
    
    // Format company website link if available
    const companyWebsite = userData.company_website 
      ? (userData.company_website.startsWith('http') ? userData.company_website : `https://${userData.company_website}`) 
      : null;
    
    // Format the company name with a hyperlink if website is available
    const companyNameFormatted = companyWebsite 
      ? `<a href="${companyWebsite}">${userData.company_name}</a>`
      : userData.company_name;
    
    // Format the Telegram handle
    const telegramHandle = userData.handle ? `@${userData.handle}` : "";
    
    // Build the message with HTML formatting
    const message =
      `🆕 <b>New User Application!</b>\n\n` +
      `<b>Name:</b> ${userData.first_name} ${userData.last_name || ""} ${telegramHandle ? `(${telegramHandle})` : ""}\n` +
      `<b>Company:</b> ${companyNameFormatted}\n` +
      `<b>Role:</b> ${userData.job_title}\n\n` +
      `Use the buttons below to take action:`;

    // Create inline keyboard with two buttons:
    // 1. Approve Application - callback query with approve_user_{telegram_id} format
    // 2. View Application - web app link to pending applications page
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Approve Application",
            callback_data: `approve_user_${userData.telegram_id}`,
          },
        ],
        [
          {
            text: "👁️ View Application",
            web_app: { url: `${WEBAPP_URL}/admin/applications` },
          },
        ],
      ],
    };

    // Send notification to each admin
    for (const admin of adminUsers) {
      try {
        const result = await bot.sendMessage(parseInt(admin.telegram_id), message, {
          parse_mode: "HTML",
          disable_web_page_preview: false, // Allow website previews
          reply_markup: keyboard,
        });
        console.log(`Enhanced notification sent to admin ${admin.telegram_id}`);
        
        // Log the admin notification
        logAdminMessage(
          admin.telegram_id, 
          "NEW_USER_APPLICATION", 
          `New user application from ${userData.first_name} ${userData.last_name || ""} (${userData.telegram_id})`,
          `${userData.first_name} ${userData.last_name || ""} (${userData.telegram_id})`
        );
      } catch (error) {
        console.error(
          `Failed to send notification to admin ${admin.telegram_id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}
```

### Admin Message Logging

A comprehensive logging system tracks all administrative actions and notifications:

```typescript
// Setup admin message logging
const LOG_DIR = path.join(process.cwd(), 'logs');
const ADMIN_MESSAGE_LOG = path.join(LOG_DIR, 'admin_messages.log');

// Create logs directory if it doesn't exist
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    console.log('Created logs directory:', LOG_DIR);
  }
} catch (err) {
  console.error('Failed to create logs directory:', err);
}

// Function to log admin messages
function logAdminMessage(adminId: string, messageType: string, messageContent: string, recipientInfo?: string) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ADMIN[${adminId}] TYPE[${messageType}] ${recipientInfo ? `RECIPIENT[${recipientInfo}] ` : ''}MESSAGE: ${messageContent}\n`;
    
    fs.appendFileSync(ADMIN_MESSAGE_LOG, logEntry);
  } catch (err) {
    console.error('Failed to log admin message:', err);
  }
}
```

### Inline Button Callbacks

The system implements callback handlers for admin actions like approving users directly from Telegram notifications:

```typescript
// Handle callback queries for user approvals
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId) {
    console.error('No chat ID found in callback query');
    return;
  }
  
  try {
    // Check callback data type and route to appropriate handler
    if (callbackQuery.data?.startsWith('approve_user_')) {
      await handleApproveUserCallback(callbackQuery);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
  }
});

// Handle user approval callbacks from admin notifications
async function handleApproveUserCallback(callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId || !callbackQuery.data) return;
  
  try {
    // First, acknowledge the callback to show progress to admin
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Processing approval...',
      show_alert: false
    });
    
    // Extract Telegram ID from callback data
    // Format: approve_user_{telegram_id}
    const telegramId = callbackQuery.data.replace('approve_user_', '');
    
    // Get user by Telegram ID
    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));
    
    // Check if user is already approved
    if (user.is_approved) {
      await bot.sendMessage(chatId, `User ${user.first_name} ${user.last_name || ''} is already approved.`);
      return;
    }
    
    // Update user approval status
    const [updatedUser] = await db.update(users)
      .set({ is_approved: true })
      .where(eq(users.id, user.id))
      .returning();
    
    // Log the approval action
    const adminTelegramId = callbackQuery.from?.id?.toString() || 'unknown';
    logAdminMessage(
      adminTelegramId,
      "USER_APPROVAL",
      `Approved user: ${user.first_name} ${user.last_name || ""} (${telegramId})`,
      `${user.first_name} ${user.last_name || ""} (${telegramId})`
    );
    
    // Send notification to the approved user
    await notifyUserApproved(parseInt(telegramId));
    
    // Update the admin's message to show approval status
    if (callbackQuery.message?.message_id) {
      // Simplified keyboard for approval confirmation - no "Approved" button
      const updatedKeyboard = {
        inline_keyboard: [
          [
            {
              text: "👁️ View Applications",
              web_app: { url: `${WEBAPP_URL}/admin/applications` }
            }
          ]
        ]
      };
      
      await bot.editMessageText(
        `✅ <b>Application Approved!</b>\n\n` +
        `You have approved <b>${user.first_name} ${user.last_name || ''}</b>'s application.\n` +
        `They have been notified and now have full access to the platform.`,
        {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'HTML',
          reply_markup: updatedKeyboard
        }
      );
    }
  } catch (error) {
    console.error('Error in user approval process:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing the approval. Please try again or check the admin dashboard.');
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

## Enhanced Notification System

The application includes an enhanced notification system for both collaboration requests and successful matches:

### Collaboration Request Notifications

When a user swipes right on a collaboration, a notification is sent to the collaboration host:

```typescript
export async function notifyNewCollabRequest(
  hostUserId: string,
  requestingUserId: string, 
  collaborationId: string,
  swipeId: string
) {
  try {
    // Get all necessary data from database
    const [hostUser] = await db.select().from(users).where(eq(users.id, hostUserId));
    const [requestingUser] = await db.select().from(users).where(eq(users.id, requestingUserId));
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    const [requestingCompany] = await db.select().from(companies).where(eq(companies.user_id, requestingUserId));
    
    // Get notification preferences
    const [preferences] = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.user_id, hostUserId));
    
    // Check if user has disabled these notifications
    if (preferences?.collab_requests_enabled === false) {
      console.log(`Collaboration request notifications disabled for user ${hostUserId}`);
      return;
    }

    // Create formatted HTML message with company hyperlink to Twitter
    let companyLink = requestingCompany?.name || 'Unknown Company';
    if (requestingCompany?.twitter_url) {
      companyLink = `<a href="${requestingCompany.twitter_url}">${requestingCompany.name}</a>`;
    }
    
    // Create shortened IDs for callback data (Telegram has 64-byte limit)
    const shortCollabId = collaborationId.substring(0, 8);
    const shortSwipeId = swipeId.substring(0, 8);
    const shortRequesterId = requestingUserId.substring(0, 8);
    
    // Format message with all relevant information
    const message = 
      `👋 <b>New Collaboration Request!</b>\n\n` +
      `${requestingUser.first_name} ${requestingUser.last_name || ''} from ${companyLink} ` +
      `is interested in your <b>${collaboration.collab_type}</b> collaboration.\n\n` +
      `<b>Role:</b> ${requestingCompany?.role_title || 'Not specified'}\n` +
      `<b>Company:</b> ${requestingCompany?.name || 'Not specified'}` +
      // If the swipe has a personalized note, include it in the notification
      `${swipe.note ? `\n\n<b>Personal Note:</b> "${swipe.note}"` : ''}`;
    
    // Create inline keyboard with View, Match, and Pass buttons
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "👁️ View",
            web_app: { url: `${WEBAPP_URL}/discover` }
          }
        ],
        [
          {
            text: "✅ Match",
            callback_data: `match_${shortCollabId}_${shortSwipeId}_${shortRequesterId}`
          },
          {
            text: "❌ Pass",
            callback_data: `pass_${shortCollabId}_${shortSwipeId}_${shortRequesterId}`
          }
        ]
      ]
    };
    
    // Send notification to host
    const chatId = parseInt(hostUser.telegram_id);
    await sendDirectFormattedMessage(chatId, message, keyboard);
    console.log(`Sent collaboration request notification to ${hostUser.first_name} for ${collaboration.collab_type}`);
    
  } catch (error) {
    console.error('[Telegram Bot] Error sending collaboration request notification:', error);
  }
}
```

When users act on these notifications, their responses create appropriate database entries:

```typescript
// Handle callback queries for match and pass actions
async function handleSwipeCallback(callbackQuery: TelegramBot.CallbackQuery) {
  if (!callbackQuery.data || !callbackQuery.from?.id) return;
  
  try {
    // Extract data from callback
    const [action, shortCollabId, shortSwipeId, shortRequesterId] = callbackQuery.data.split('_');
    const adminTelegramId = callbackQuery.from.id.toString();
    
    // Get all required database records
    const [hostUser] = await db.select().from(users).where(eq(users.telegram_id, adminTelegramId));
    
    // Find the full records based on shortened IDs
    const [collaboration] = await db.select()
      .from(collaborations)
      .where(sql`LEFT(${collaborations.id}::text, 8) = ${shortCollabId}`);
      
    const [swipe] = await db.select()
      .from(swipes)
      .where(sql`LEFT(${swipes.id}::text, 8) = ${shortSwipeId}`);
      
    const [requester] = await db.select()
      .from(users)
      .where(sql`LEFT(${users.id}::text, 8) = ${shortRequesterId}`);

    // Create response swipe in the database
    const swipeDirection = action === 'match' ? 'right' : 'left';
    await db.insert(swipes).values({
      user_id: hostUser.id,
      collaboration_id: collaboration.id,
      direction: swipeDirection,
      details: { source: 'telegram_notification' }
    });

    // If it's a match, notify the requester but not the host (who already knows)
    if (action === 'match') {
      await notifyMatchCreated(hostUser.id, requester.id, collaboration.id, true);
    }
    
    // Update the original message to show the action taken
    const actionText = action === 'match' ? 'Matched' : 'Passed';
    const newMessage = `✅ <b>Action taken: ${actionText}</b>\n\nYou have ${actionText.toLowerCase()} with ${requester.first_name} ${requester.last_name || ''} on your ${collaboration.collab_type} collaboration.`;
    
    await bot.editMessageText(newMessage, {
      chat_id: callbackQuery.message?.chat.id,
      message_id: callbackQuery.message?.message_id,
      parse_mode: 'HTML'
    });
    
    // Send confirmation to the user
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `You ${actionText.toLowerCase()} with ${requester.first_name}!`,
      show_alert: false
    });
    
  } catch (error) {
    console.error('Error handling swipe callback:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Error processing your action. Please try again.',
      show_alert: true
    });
  }
}
```

### Match Notifications

When a match is created, formatted messages are sent to both users:

```typescript
export async function notifyMatchCreated(
  hostUserId: string, 
  requesterUserId: string, 
  collaborationId: string,
  skipHostNotification = false 
) {
  try {
    // Get user and collaboration details
    const [hostUser] = await db.select().from(users).where(eq(users.id, hostUserId));
    const [requesterUser] = await db.select().from(users).where(eq(users.id, requesterUserId)); 
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    
    // Get company details
    const [hostCompany] = await db.select().from(companies).where(eq(companies.user_id, hostUserId));
    const [requesterCompany] = await db.select().from(companies).where(eq(companies.user_id, requesterUserId));
    
    // Convert telegram_id to integers for chat ID
    const hostChatId = parseInt(hostUser.telegram_id);
    const requesterChatId = parseInt(requesterUser.telegram_id);
    
    // Format the company names with hyperlinks to their Twitter profiles when available
    let hostCompanyLink = hostCompany?.name || 'Unknown Company';
    if (hostCompany?.twitter_url) {
      hostCompanyLink = `<a href="${hostCompany.twitter_url}">${hostCompany.name}</a>`;
    }
    
    let requesterCompanyLink = requesterCompany?.name || 'Unknown Company';
    if (requesterCompany?.twitter_url) {
      requesterCompanyLink = `<a href="${requesterCompany.twitter_url}">${requesterCompany.name}</a>`;
    }
    
    // Simplified and enhanced messages with role titles and company hyperlinks
    const hostMessage = `🎉 <b>New Match!</b>\n\n${requesterUser.first_name} ${requesterUser.last_name || ''} from ${requesterCompanyLink} (${requesterCompany?.role_title || 'Unknown Role'}) is a match for your <b>${collaboration.collab_type}</b> collaboration!`;
    
    const requesterMessage = `🎉 <b>New Match!</b>\n\n${hostUser.first_name} ${hostUser.last_name || ''} from ${hostCompanyLink} just matched with you for their <b>${collaboration.collab_type}</b> collaboration!`;
    
    // Create dynamic "Chat with [First Name]" buttons
    const hostKeyboard = {
      inline_keyboard: [
        [{ text: `💬 Chat with ${requesterUser.first_name}`, url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}` }],
        [{ text: "👥 My Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
      ]
    };
    
    const requesterKeyboard = {
      inline_keyboard: [
        [{ text: `💬 Chat with ${hostUser.first_name}`, url: `https://t.me/${hostUser.handle || hostUser.telegram_id}` }],
        [{ text: "👥 My Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
      ]
    };
    
    // Send notifications with proper HTML formatting
    if (!skipHostNotification) {
      await sendDirectFormattedMessage(hostChatId, hostMessage, hostKeyboard);
    }
    await sendDirectFormattedMessage(requesterChatId, requesterMessage, requesterKeyboard);
  } catch (error) {
    console.error('[Telegram Bot] Error preparing match notifications:', error);
  }
}
```

### HTML Formatting

Messages sent via Telegram can include HTML formatting for better readability:

```typescript
// Example of HTML-formatted message
const formattedMessage = `🎉 <b>New Match!</b>\n\n${userName} from <a href="${companyWebsite}">${companyName}</a> is a match!`;
```

The system supports:
- Bold text using `<b>` tags
- Links using `<a href="...">` tags
- Line breaks with `\n`

### Interactive Buttons

Notifications include interactive buttons that allow users to:

1. Chat directly with their match
2. View more collaborations in the app
3. View their current matches

```typescript
// Example of interactive keyboard with buttons
const keyboard = {
  inline_keyboard: [
    [{ text: "💬 Chat with Collaborator", url: `https://t.me/${username}` }],
    [{ text: "🚀 Discover More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }],
    [{ text: "👥 View Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
  ]
};
```

### Error Handling & Fallbacks

The notification system includes robust error handling and fallbacks:

1. If HTML formatting fails, the system falls back to plain text
2. If inline buttons fail, the system provides simplified alternatives
3. Detailed error logging helps diagnose and fix issues

```typescript
try {
  // First try enhanced HTML-formatted message
  await sendDirectFormattedMessage(chatId, htmlMessage, keyboard);
} catch (error) {
  // Fall back to plain text message
  const plainMessage = `New Match! ${userName} from ${companyName} matched with you!`;
  await bot.sendMessage(chatId, plainMessage);
}
```

### Enhanced Message Sending

The application uses a special utility function for sending formatted messages with enhanced debugging and error handling:

```typescript
async function sendDirectFormattedMessage(chatId: number, message: string, keyboard: any) {
  try {
    // Validate inputs
    if (!chatId || isNaN(chatId)) {
      throw new Error(`Invalid chat ID: ${chatId}`);
    }
    
    // Detect HTML tags to ensure proper formatting
    const hasHtmlTags = message.includes('<b>') || message.includes('<i>') || message.includes('<a href');
    
    // Prepare message options
    const messageOptions = {
      parse_mode: hasHtmlTags ? 'HTML' : undefined, // Only set HTML mode when tags are present
      reply_markup: keyboard,
      disable_web_page_preview: false
    };
    
    // Send and return the message
    return await bot.sendMessage(chatId, message, messageOptions);
  } catch (error) {
    // Detailed error analysis and logging
    if (error instanceof Error) {
      if (error.message.includes('chat not found')) {
        console.error(`Chat ID ${chatId} not found. Verify the Telegram ID is correct.`);
      } else if (error.message.includes('bot was blocked')) {
        console.error(`User has blocked the bot.`);
      } else if (error.message.includes('can\'t parse entities')) {
        console.error(`HTML parsing error. Check your HTML formatting.`);
      }
    }
    throw error;
  }
}
```

Key features of this utility:
1. Automatic HTML tag detection to only use HTML mode when needed
2. Detailed error diagnosis for common Telegram API errors
3. Comprehensive input validation to prevent invalid API calls

### Telegram API Limitations

When working with Telegram notifications, note these important limitations:

1. **Callback Data Size**: The `callback_data` parameter for inline buttons has a 64-byte limit
   - Solution: Keep callback data short or use web_app buttons instead
   
2. **HTML Parsing**: Not all HTML tags are supported
   - Supported tags: `<b>`, `<i>`, `<u>`, `<s>`, `<a>`, `<code>`, `<pre>`
   
3. **Message Length**: Messages have a 4096 character limit
   - Solution: Keep notifications concise and focused

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