import TelegramBot from 'node-telegram-bot-api';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Get the webapp URL from environment or use the first Replit domain
const WEBAPP_URL = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}/onboarding`;

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

export async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;

  try {
    console.log('Handling /start command for chat:', chatId);

    const welcomeMessage = 
      `👋 Welcome to CollabRoom! I'm your Web3 collaboration assistant.\n\n` +
      `Let's get you set up with a profile that will help you find the perfect collaborations.`;

    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "Complete Profile",
            web_app: { url: WEBAPP_URL }
          }
        ]]
      }
    });
  } catch (error) {
    console.error('Error in handleStart:', error);
    await bot.sendMessage(
      chatId, 
      'Sorry, there was an error. Please try the /start command again in a few moments.'
    );
  }
}

// Initialize bot commands
bot.setMyCommands([
  { command: 'start', description: 'Start the bot' }
]);

// Set up command handlers
bot.onText(/\/start/, handleStart);