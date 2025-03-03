import TelegramBot from 'node-telegram-bot-api';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error('REPLIT_DOMAINS is required');
}

// Get the webapp URL from environment
const domain = process.env.REPLIT_DOMAINS.split(',')[0];
const WEBAPP_URL = `https://${domain}/onboarding`;

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

  console.log('=== Handling /start command ===');
  console.log('Chat ID:', chatId);
  console.log('Message:', JSON.stringify(msg, null, 2));

  try {
    const keyboard = {
      inline_keyboard: [[
        {
          text: "Complete Profile",
          web_app: { url: WEBAPP_URL }
        }
      ]]
    };

    console.log('Sending message with keyboard:', JSON.stringify(keyboard, null, 2));

    await bot.sendMessage(
      chatId,
      '👋 Welcome to CollabRoom!\n\nClick the button below to complete your profile.',
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

// Set up commands
console.log('Setting up bot commands...');
bot.setMyCommands([
  { command: 'start', description: 'Start the bot' }
]).then(() => {
  console.log('Bot commands registered successfully');
}).catch((error) => {
  console.error('Failed to register commands:', error);
});

// Register command handler
bot.onText(/\/start/, handleStart);

console.log('Telegram bot initialization completed');