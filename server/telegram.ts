import TelegramBot from 'node-telegram-bot-api';
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error('REPLIT_DOMAINS is required');
}

// Get the webapp URL from environment
const domain = process.env.REPLIT_DOMAINS.split(',')[0];
const WEBAPP_URL = `https://${domain}`;

console.log('=== Telegram Bot Initialization ===');
console.log('WebApp URL:', WEBAPP_URL);
console.log('Domain:', domain);

// Initialize bot with polling
export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  polling: true,
  webHook: false // Explicitly disable webhook
});

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
    // Check if user exists in database
    if (!telegramId) {
      throw new Error('No Telegram ID found in message');
    }

    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    const keyboard = {
      inline_keyboard: [[
        existingUser 
          ? {
              text: existingUser.is_approved 
                ? "Open Dashboard" 
                : "Check Application Status",
              ...(existingUser.is_approved 
                ? { web_app: { url: `${WEBAPP_URL}/dashboard` } }
                : { callback_data: 'check_status' })
            }
          : {
              text: "Apply to Join",
              web_app: { url: `${WEBAPP_URL}/onboarding` }
            }
      ]]
    };

    console.log('Sending message with keyboard:', JSON.stringify(keyboard, null, 2));

    const welcomeMessage = existingUser
      ? existingUser.is_approved
        ? `👋 Welcome back to CollabRoom!\n\nYour application has been approved. Click below to access your dashboard.`
        : `👋 Welcome back to CollabRoom!\n\nYour application is currently under review. Click below to check your application status or use /status command anytime.`
      : '👋 Welcome to CollabRoom!\n\nWe\'re excited that you\'re interested in joining our community of innovative collaborators. Click below to start your application.';

    await bot.sendMessage(
      chatId,
      welcomeMessage,
      { reply_markup: keyboard }
    );

    console.log('Message sent successfully');
  } catch (error) {
    console.error('=== Error in handleStart ===');
    console.error(error);

    // Try to send error message to user
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

// Handle /status command and status button
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

    // Query for user with exact telegram_id match
    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    console.log('User found:', user);

    if (!user) {
      await bot.sendMessage(
        chatId,
        'No application found. Click "Apply to Join" to start your application.',
        {
          reply_markup: {
            inline_keyboard: [[{
              text: "Apply to Join",
              web_app: { url: `${WEBAPP_URL}/onboarding` }
            }]]
          }
        }
      );
      return;
    }

    const applicationDate = format(new Date(user.applied_at), 'MMMM d, yyyy');

    const statusMessage = user.is_approved
      ? `✅ Your application has been approved!\n\nYou can now access the dashboard to start collaborating.`
      : `📝 Application Status: Under Review\n\nApplication Details:\n• Name: ${user.first_name} ${user.last_name}\n• Submitted: ${applicationDate}\n\nWe'll notify you here once your application has been reviewed.`;

    const keyboard = user.is_approved
      ? {
          inline_keyboard: [[{
            text: "Open Dashboard",
            web_app: { url: `${WEBAPP_URL}/dashboard` }
          }]]
        }
      : undefined;

    await bot.sendMessage(chatId, statusMessage, { 
      reply_markup: keyboard,
      parse_mode: 'HTML'
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

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
  if (!callbackQuery.message) return;

  if (callbackQuery.data === 'check_status') {
    await handleStatus(callbackQuery.message);
  }

  // Answer callback query to remove loading state
  await bot.answerCallbackQuery(callbackQuery.id);
});

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