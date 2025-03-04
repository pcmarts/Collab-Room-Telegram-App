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
  console.log('=== Handling /status command ===');
  console.log('Chat ID:', ctx.chat.id);
  console.log('Telegram ID:', ctx.from.id);
  const status = await getApplicationStatus(ctx.from.id.toString());
  console.log('User found:', await storage.getUserByTelegramId(ctx.from.id.toString()));
  await ctx.reply(status);
});

// Handle callback queries
bot.callbackQuery("check_status", async (ctx) => {
  console.log('=== Handling check_status callback ===');
  console.log('Chat ID:', ctx.chat?.id);
  console.log('From ID:', ctx.from.id);

  try {
    const status = await getApplicationStatus(ctx.from.id.toString());
    await ctx.answerCallbackQuery(); // Acknowledge the callback query
    await ctx.reply(status); // Send the status message
  } catch (error) {
    console.error('Error handling check_status callback:', error);
    await ctx.answerCallbackQuery({
      text: "An error occurred while checking your application status.",
      show_alert: true
    });
  }
});

export { bot };