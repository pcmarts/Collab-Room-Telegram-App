import TelegramBot from 'node-telegram-bot-api';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

// Middleware token
const token = process.env.TELEGRAM_BOT_TOKEN || 'development_token';

// Create a mock bot for development
const createMockBot = () => {
  return {
    getMe: () => Promise.resolve({ username: 'dev_bot' }),
    sendMessage: (chatId: any, message: string) => {
      console.log(`[MOCK BOT] Would send to ${chatId}: ${message}`);
      return Promise.resolve();
    },
    setMyCommands: (commands: any) => Promise.resolve(),
    on: (event: string, callback: any) => {
      console.log(`[MOCK BOT] Event listener added for: ${event}`);
    },
    onText: (regex: any, callback: any) => {
      console.log(`[MOCK BOT] onText listener added for regex: ${regex}`);
    }
  };
};

// Initialize the bot
export const bot = process.env.NODE_ENV === 'development' 
  ? createMockBot() as any 
  : token ? new TelegramBot(token, { polling: false }) : null;

// Get the webapp URL from environment
const domain = process.env.REPLIT_DOMAINS.split(',')[0];
const WEBAPP_URL = `https://${domain}`;

console.log('=== Telegram Bot Initialization ===');
console.log('WebApp URL:', WEBAPP_URL);
console.log('Domain:', domain);


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

// Basic error handling
bot.on('polling_error', (error) => {
  console.error('=== Telegram Bot Polling Error ===');
  console.error(error);
});

bot.on('error', (error) => {
  console.error('=== Telegram Bot General Error ===');
  console.error(error);
});

// Handle /start command
async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  console.log('=== Handling /start command ===');
  console.log('Chat ID:', chatId);
  console.log('Message:', JSON.stringify(msg, null, 2));

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
      // New user - show Apply button and send confirmation message
      keyboard = {
        inline_keyboard: [[{
          text: "Apply to Join",
          web_app: { url: `${WEBAPP_URL}/apply` } 
        }]]
      };
      welcomeMessage = '👋 Welcome to CollabRoom!\n\nWe\'re excited that you\'re interested in joining our community of innovative collaborators. Click below to start your application.';
      await sendApplicationConfirmation(chatId); // Added confirmation message
    } else if (existingUser.is_approved) {
      // Approved user - show Dashboard button and Announcement Channel
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
      // Pending user - show application status button and Announcement Channel
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
    console.log('Message sent successfully');

  } catch (error) {
    console.error('=== Error in handleStart ===');
    console.error(error);

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

// Handle /status command
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
          web_app: { url: `${WEBAPP_URL}/onboarding` }
        }]]
      };
      await bot.sendMessage(
        chatId,
        'No application found. Click below to start your application.',
        { reply_markup: keyboard }
      );
      return;
    }

    const applicationDate = format(new Date(user.applied_at), 'MMMM d, yyyy');

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

// Set up commands
console.log('Setting up bot commands...');
bot.setMyCommands([
  { command: 'start', description: 'Start the application process' },
  { command: 'status', description: 'Check your application status' }
]).then(() => {
  console.log('Bot commands registered successfully');
}).catch((error) => {
  console.error('Failed to register commands:', error);
});

// Register command handlers
bot.onText(/\/start/, handleStart);
bot.onText(/\/status/, handleStatus);

console.log('Telegram bot initialization completed');