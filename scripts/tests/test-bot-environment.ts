import { bot } from "../../server/telegram";

console.log("=== Testing Bot Environment Configuration ===");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Bot token source: ${
  process.env.NODE_ENV === "production" ? 'TELEGRAM_BOT_TOKEN' : 
  process.env.TELEGRAM_TEST_BOT_TOKEN ? 'TELEGRAM_TEST_BOT_TOKEN' : 'TELEGRAM_BOT_TOKEN (fallback)'
}`);

// Test bot connection
bot.getMe()
  .then(botInfo => {
    console.log("\n✅ Bot connected successfully!");
    console.log(`Bot username: @${botInfo.username}`);
    console.log(`Bot name: ${botInfo.first_name}`);
    console.log(`Bot ID: ${botInfo.id}`);
    console.log(`Can join groups: ${botInfo.can_join_groups}`);
    console.log(`Can read all group messages: ${botInfo.can_read_all_group_messages}`);
    console.log(`Supports inline queries: ${botInfo.supports_inline_queries}`);
    
    console.log("\n=== Environment-specific behavior ===");
    if (process.env.NODE_ENV === "production") {
      console.log("✅ Production environment - using production bot");
      console.log("   Users will receive notifications from production bot");
    } else {
      console.log("✅ Development environment - using test bot");
      console.log("   Users will receive notifications from test bot");
    }
    
    console.log("\n✅ Bot environment configuration is working correctly!");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n❌ Failed to connect to bot:", error.message);
    console.error("Please check your bot token configuration");
    process.exit(1);
  });