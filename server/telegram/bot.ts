import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "../config";
import { storage } from "../storage";
import { format } from "date-fns";

const bot = new Bot(TELEGRAM_BOT_TOKEN);

// Simple command handlers without any keyboard/button functionality
bot.command("start", (ctx) => {
  ctx.reply("👋 Welcome to CollabRoom!\n\nUse /status to check your application status.");
});

bot.command("status", async (ctx) => {
  const user = await storage.getUserByTelegramId(ctx.from.id.toString());

  if (!user) {
    await ctx.reply('No application found. Use /start to get started.');
    return;
  }

  const applicationDate = user.applied_at
    ? format(new Date(user.applied_at), "MMMM d, yyyy")
    : "Unknown";

  const message = `📝 Application Status: Under Review

Application Details:
• Name: ${user.first_name} ${user.last_name}
• Submitted: ${applicationDate}

We'll notify you here once your application has been reviewed`;

  await ctx.reply(message);
});

export { bot };