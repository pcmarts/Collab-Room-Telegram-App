import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "../config";
import { storage } from "../storage";
import { format } from "date-fns";

const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Helper function to get application status message
async function getApplicationStatus(telegramId: string) {
  const user = await storage.getUserByTelegramId(telegramId);

  if (!user) {
    return 'No application found. Click "Apply to Join" to start your application.';
  }

  const applicationDate = user.applied_at
    ? format(new Date(user.applied_at), "MMMM d, yyyy")
    : "Unknown";

  return `📝 Application Status: Under Review

Application Details:
• Name: ${user.first_name} ${user.last_name}
• Submitted: ${applicationDate}

We'll notify you here once your application has been reviewed`;
}

// Command handlers
bot.command("start", async (ctx) => {
  const user = await storage.getUserByTelegramId(ctx.from.id.toString());

  const message = user
    ? "👋 Welcome back to CollabRoom!\n\nYour application is currently under review. Use /status command anytime to check your application status."
    : "👋 Welcome to CollabRoom!\n\nUse /status command to check your application status.";

  await ctx.reply(message);
});

bot.command("status", async (ctx) => {
  console.log('=== Handling /status command ===');
  console.log('Chat ID:', ctx.chat.id);
  console.log('Telegram ID:', ctx.from.id);
  const status = await getApplicationStatus(ctx.from.id.toString());
  console.log('User found:', await storage.getUserByTelegramId(ctx.from.id.toString()));
  await ctx.reply(status);
});

export { bot };