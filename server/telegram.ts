import TelegramBot from 'node-telegram-bot-api';
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

// Choose bot token based on environment
const BOT_TOKEN = process.env.NODE_ENV === 'production' 
  ? process.env.TELEGRAM_BOT_TOKEN 
  : process.env.TELEGRAM_TEST_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('Telegram bot token is required');
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error('REPLIT_DOMAINS is required');
}

// Get the webapp URL from environment
const domain = process.env.REPLIT_DOMAINS.split(',')[0];
const WEBAPP_URL = `https://${domain}`;

console.log('=== Telegram Bot Configuration ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Using token type:', process.env.NODE_ENV === 'production' ? 'Production' : 'Development');
console.log('Token prefix:', BOT_TOKEN.substring(0, 10) + '...');
console.log('WebApp URL:', WEBAPP_URL);

// Initialize bot with polling and minimal logging
export const bot = new TelegramBot(BOT_TOKEN, { 
  polling: true,
  webHook: false 
});

// Register command handlers first
async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  try {
    if (!telegramId) {
      throw new Error('No Telegram ID found in message');
    }

    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    let keyboard;
    let welcomeMessage;

    if (!existingUser) {
      keyboard = {
        inline_keyboard: [[{
          text: "Apply to Join",
          web_app: { url: `${WEBAPP_URL}/welcome` } 
        }]]
      };
      welcomeMessage = '👋 Welcome to CollabRoom!\n\nWe\'re excited that you\'re interested in joining our community of innovative collaborators. Click below to start your application.';
    } else if (existingUser.is_approved) {
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Dashboard",
            web_app: { url: `${WEBAPP_URL}/dashboard` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
      welcomeMessage = `👋 Welcome back to CollabRoom!\n\nYou're all set! Click below to access your dashboard and start collaborating.`;
    } else {
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Application Status",
            web_app: { url: `${WEBAPP_URL}/application-status` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
      welcomeMessage = `👋 Welcome back to CollabRoom!\n\nYour application is currently under review. Click below to check your application status or use /status command anytime.`;
    }

    await bot.sendMessage(chatId, welcomeMessage, keyboard ? { reply_markup: keyboard } : undefined);

  } catch (error) {
    console.error('Error in handleStart:', error);
    try {
      await bot.sendMessage(
        chatId,
        'Sorry, something went wrong. Please try again in a few moments.'
      );
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

// Send application confirmation message
export async function sendApplicationConfirmation(chatId: number) {
  const keyboard = {
    inline_keyboard: [[{
      text: "Check Application Status",
      web_app: { url: `${WEBAPP_URL}/application-status` }
    }]]
  };

  try {
    await bot.sendMessage(
      chatId,
      "🎉 Application Submitted Successfully!\n\nThank you for applying to join CollabRoom. Click below to check your application status anytime.",
      { reply_markup: keyboard }
    );
    console.log('Application confirmation message sent successfully');
  } catch (error) {
    console.error('Failed to send application confirmation:', error);
  }
}

// Notify admins about new user applications
interface NewUserNotification {
  telegram_id: string;
  first_name: string;
  last_name?: string;
  company_name: string;
  job_title: string;
}

export async function notifyAdminsNewUser(userData: NewUserNotification) {
  try {
    // Get all admin users
    const adminUsers = await db.select()
      .from(users)
      .where(eq(users.is_admin, true));

    if (!adminUsers.length) {
      console.warn('No admin users found to notify');
      return;
    }

    const message = `🆕 New User Application!\n\n`
      + `Name: ${userData.first_name} ${userData.last_name || ''}\n`
      + `Company: ${userData.company_name}\n`
      + `Role: ${userData.job_title}\n\n`
      + `Click below to review the application:`;

    const keyboard = {
      inline_keyboard: [[{
        text: "Review Application",
        web_app: { url: `${WEBAPP_URL}/admin/users` }
      }]]
    };

    // Send notification to each admin
    for (const admin of adminUsers) {
      try {
        await bot.sendMessage(
          parseInt(admin.telegram_id),
          message,
          { reply_markup: keyboard }
        );
        console.log(`Notification sent to admin ${admin.telegram_id}`);
      } catch (error) {
        console.error(`Failed to send notification to admin ${admin.telegram_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
}

// Notify user when their application is approved
export async function notifyUserApproved(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [{
        text: "Access Dashboard",
        web_app: { url: `${WEBAPP_URL}/dashboard` }
      }],
      [{
        text: "📣 Join Announcement Channel",
        url: "https://t.me/TheMarketingDAO"
      }]
    ]
  };

  try {
    await bot.sendMessage(
      chatId,
      "🎉 Congratulations! Your application has been approved!\n\n"
      + "Welcome to CollabRoom! You now have full access to the platform.\n\n"
      + "Click below to access your dashboard and join our announcement channel for updates.",
      { reply_markup: keyboard }
    );
    console.log('Approval notification sent successfully');
  } catch (error) {
    console.error('Failed to send approval notification:', error);
  }
}

// Set up commands silently
bot.setMyCommands([
  { command: 'start', description: 'Start the application process' },
  { command: 'status', description: 'Check your application status' }
]).catch((error) => {
  console.error('Failed to register commands:', error);
});

// Register command handlers
bot.onText(/\/start/, handleStart);

async function handleStatus(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  console.log('=== Handling /status command ===');
  console.log('Chat ID:', chatId);
  console.log('Telegram ID:', telegramId);

  try {
    if (!telegramId) {
      throw new Error('No Telegram ID found in message');
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    console.log('User found:', user);

    if (!user) {
      // For users without applications, show the Apply button
      const keyboard = {
        inline_keyboard: [[{
          text: "Apply to Join",
          web_app: { url: `${WEBAPP_URL}/welcome` }
        }]]
      };
      await bot.sendMessage(
        chatId,
        'No application found. Click below to start your application.',
        { reply_markup: keyboard }
      );
      return;
    }

    const applicationDate = user.applied_at ? format(new Date(user.applied_at), 'MMMM d, yyyy') : 'Not available';

    let statusMessage;
    let keyboard;

    if (user.is_approved) {
      statusMessage = `✅ Your application has been approved!\n\nYou can now access your dashboard and start collaborating.`;
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Dashboard",
            web_app: { url: `${WEBAPP_URL}/dashboard` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
    } else {
      statusMessage = `📝 Application Status: Under Review\n\nApplication Details:\n• Name: ${user.first_name} ${user.last_name}\n• Submitted: ${applicationDate}\n\nWe'll notify you here once your application has been reviewed.`;
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Application Status",
            web_app: { url: `${WEBAPP_URL}/application-status` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
    }

    await bot.sendMessage(chatId, statusMessage, { 
      parse_mode: 'HTML',
      reply_markup: keyboard
    });

  } catch (error) {
    console.error('Error handling status check:', error);
    console.error('Full error details:', error);
    await bot.sendMessage(
      chatId,
      'Sorry, something went wrong while checking your status. Please try again later.'
    );
  }
}

bot.onText(/\/status/, handleStatus);

// Basic error handling
bot.on('polling_error', (error) => {
  console.error('=== Telegram Bot Polling Error ===');
  console.error(error);
});

bot.on('error', (error) => {
  console.error('=== Telegram Bot General Error ===');
  console.error(error);
});


console.log('Telegram bot initialization completed');