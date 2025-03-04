import { Bot, InlineKeyboard } from "grammy";
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
    ? "👋 Welcome back to CollabRoom!\n\nYour application is currently under review. Click below to check your application status or use /status command anytime."
    : "👋 Welcome to CollabRoom!\n\nClick below to start your application or check its status.";

  const keyboard = new InlineKeyboard().text(
    "Check Application Status",
    "check_status"
  );

  await ctx.reply(message, {
    reply_markup: keyboard,
  });
});

bot.command("status", async (ctx) => {
  const status = await getApplicationStatus(ctx.from.id.toString());
  await ctx.reply(status);
});

// Handle callback queries
bot.callbackQuery("check_status", async (ctx) => {
  const status = await getApplicationStatus(ctx.from.id.toString());
  await ctx.answerCallbackQuery();
  await ctx.reply(status);
});

export { bot };