import TelegramBot from 'node-telegram-bot-api';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { User, Collaboration } from '../shared/schema';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

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
        `Let's get you set up with a profile that will help you find the perfect collaborations.\n\n` +
        `Here's what we'll do:\n` +
        `1️⃣ Set up your bio (/set_bio)\n` +
        `2️⃣ Add your interests (/add_interests)\n` +
        `3️⃣ Choose collaboration types (/collab_preferences)\n\n` +
        `Ready to start? Use /set_bio to begin!`;

      await bot.sendMessage(chatId, welcomeMessage);
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

export async function handleSetBio(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    "Please tell me a bit about yourself and your experience in Web3 (max 300 characters).\n" +
    "Reply with your bio starting with /bio [your text]"
  );
}

export async function handleBioSubmission(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!user) return;

  try {
    const bioText = msg.text?.replace(/^\/bio\s+/, '').trim();

    if (!bioText) {
      await bot.sendMessage(chatId, "Please provide your bio text after the /bio command.");
      return;
    }

    if (bioText.length > 300) {
      await bot.sendMessage(chatId, "Your bio is too long. Please keep it under 300 characters.");
      return;
    }

    // Update user profile with bio
    await db
      .update(users)
      .set({
        profile_info: {
          bio: bioText,
          onboarding_complete: false
        }
      })
      .where(eq(users.telegram_id, user.id.toString()));

    await bot.sendMessage(
      chatId,
      "Great! I've saved your bio. Now let's add your interests using /add_interests"
    );
  } catch (error) {
    console.error('Error in handleBioSubmission:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error saving your bio. Please try again later.');
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
  { command: 'set_bio', description: 'Set your professional bio' },
  { command: 'add_interests', description: 'Add your Web3 interests' },
  { command: 'collab_preferences', description: 'Set collaboration preferences' },
  { command: 'my_collabs', description: 'View your collaborations' },
  { command: 'host_collab', description: 'Create a new collaboration' },
  { command: 'update_profile', description: 'Update your profile' }
]);

// Set up command handlers
bot.onText(/\/start/, handleStart);
bot.onText(/\/set_bio/, handleSetBio);
bot.onText(/\/bio (.+)/, handleBioSubmission);
bot.onText(/\/my_collabs/, handleMyCollabs);