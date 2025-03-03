import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '../shared/supabase';
import type { User, Collaboration } from '../shared/schema';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

export async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  if (!user) return;

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select()
    .eq('telegram_id', user.id.toString())
    .single();

  if (!existingUser) {
    // Create new user
    await supabase.from('users').insert({
      telegram_id: user.id.toString(),
      name: user.first_name,
      handle: user.username
    });
  }

  const welcomeMessage = `Welcome to CollabRoom! 🚀\n\n` +
    `I'm here to help you discover and manage Web3 collaborations.\n\n` +
    `Commands:\n` +
    `/my_collabs - View your collaborations\n` +
    `/host_collab - Create a new collaboration\n`;

  await bot.sendMessage(chatId, welcomeMessage);
}

export async function handleMyCollabs(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!user) return;

  const { data: collabs } = await supabase
    .from('collaborations')
    .select('*')
    .or(`host_id.eq.${user.id},applicant_id.eq.${user.id}`);

  if (!collabs || collabs.length === 0) {
    await bot.sendMessage(chatId, "You don't have any active collaborations.");
    return;
  }

  const collabsList = collabs.map((collab: Collaboration) => 
    `${collab.title}\nStatus: ${collab.status}\n${collab.description}\n\n`
  ).join('');

  await bot.sendMessage(chatId, `Your Collaborations:\n\n${collabsList}`);
}

// Initialize bot commands
bot.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'my_collabs', description: 'View your collaborations' },
  { command: 'host_collab', description: 'Create a new collaboration' }
]);

// Set up command handlers
bot.onText(/\/start/, handleStart);
bot.onText(/\/my_collabs/, handleMyCollabs);
