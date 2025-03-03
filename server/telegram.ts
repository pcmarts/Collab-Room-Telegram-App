import TelegramBot from 'node-telegram-bot-api';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { User, Collaboration } from '../shared/schema';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Get the webapp URL from environment or use the first Replit domain
const WEBAPP_URL = `${process.env.REPLIT_DOMAINS?.split(',')[0]}/onboarding`;

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

export async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!user) return;

  try {
    // Check if user exists using Drizzle
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, user.id.toString()));

    if (!existingUser) {
      // Create new user using Drizzle
      await db.insert(users).values({
        telegram_id: user.id.toString(),
        name: user.first_name,
        handle: user.username || undefined,
        profile_info: {
          onboarding_complete: false,
          interests: [],
          bio: '',
          preferred_collaboration_types: []
        }
      });

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
    } else {
      // Welcome back message for existing users
      const welcomeBackMessage = `Welcome back to CollabRoom! 🚀\n\n` +
        `I'm here to help you discover and manage Web3 collaborations.\n\n` +
        `Commands:\n` +
        `/my_collabs - View your collaborations\n` +
        `/host_collab - Create a new collaboration\n` +
        `/update_profile - Update your profile\n`;

      await bot.sendMessage(chatId, welcomeBackMessage);
    }
  } catch (error) {
    console.error('Error in handleStart:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your request. Please try again later.');
  }
}

export async function handleMyCollabs(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!user) return;

  try {
    // Get user's collaborations using Drizzle
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, user.id.toString()));

    if (!dbUser) {
      await bot.sendMessage(chatId, "Please start the bot first with /start");
      return;
    }

    const collabs = await db.query.collaborations.findMany({
      where: (collab, { or, eq }) => 
        or(eq(collab.host_id, dbUser.id), eq(collab.applicant_id, dbUser.id))
    });

    if (!collabs || collabs.length === 0) {
      await bot.sendMessage(chatId, "You don't have any active collaborations.");
      return;
    }

    const collabsList = collabs.map((collab: Collaboration) => 
      `${collab.title}\nStatus: ${collab.status}\n${collab.description}\n\n`
    ).join('');

    await bot.sendMessage(chatId, `Your Collaborations:\n\n${collabsList}`);
  } catch (error) {
    console.error('Error in handleMyCollabs:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error fetching your collaborations. Please try again later.');
  }
}

// Initialize bot commands
bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'my_collabs', description: 'View your collaborations' },
  { command: 'host_collab', description: 'Create a new collaboration' },
  { command: 'update_profile', description: 'Update your profile' }
]);

// Set up command handlers
bot.onText(/\/start/, handleStart);
bot.onText(/\/my_collabs/, handleMyCollabs);