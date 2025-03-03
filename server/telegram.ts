import TelegramBot from 'node-telegram-bot-api';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Get the webapp URL from environment or use the first Replit domain
const WEBAPP_URL = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/onboarding`;
console.log('Initializing Telegram bot with WebApp URL:', WEBAPP_URL);

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Log when the bot starts successfully
bot.on('polling_error', (error) => {
  console.error('Telegram bot polling error:', error);
});

bot.on('error', (error) => {
  console.error('Telegram bot error:', error);
});

export async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  console.log('Received /start command from chat ID:', chatId);
  console.log('Message details:', JSON.stringify(msg, null, 2));

  try {
    const welcomeMessage = 
      `👋 Welcome to CollabRoom! I'm your Web3 collaboration assistant.\n\n` +
      `Let's get you set up with a profile that will help you find the perfect collaborations.`;

    console.log('Sending welcome message to chat ID:', chatId);

    const messageOptions = {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "Complete Profile",
            web_app: { url: WEBAPP_URL }
          }
        ]]
      }
    };

    console.log('Message options:', JSON.stringify(messageOptions, null, 2));

    const sentMessage = await bot.sendMessage(chatId, welcomeMessage, messageOptions);
    console.log('Successfully sent message:', sentMessage);
  } catch (error) {
    console.error('Detailed error in handleStart:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    try {
      await bot.sendMessage(
        chatId, 
        'Sorry, there was an error. Please try the /start command again in a few moments.'
      );
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

// Initialize bot commands
console.log('Setting up bot commands...');
bot.setMyCommands([
  { command: 'start', description: 'Start the bot' }
]).then(() => {
  console.log('Bot commands set successfully');
}).catch((error) => {
  console.error('Failed to set bot commands:', error);
});

// Set up command handlers
console.log('Setting up command handlers...');
bot.onText(/\/start/, handleStart);
console.log('Telegram bot initialization completed');