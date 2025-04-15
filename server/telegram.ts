import TelegramBot from "node-telegram-bot-api";
import { db } from "./db";
import {
  users,
  collaborations,
  companies,
  notification_preferences,
  swipes,
  matches,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { format } from "date-fns";
import fs from "fs";
import path from "path";

// Choose bot token based on environment
const BOT_TOKEN =
  process.env.NODE_ENV === "production"
    ? process.env.TELEGRAM_BOT_TOKEN
    : process.env.TELEGRAM_TEST_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("Telegram bot token is required");
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("REPLIT_DOMAINS is required");
}

// Setup admin message logging
const LOG_DIR = path.join(process.cwd(), "logs");
const ADMIN_MESSAGE_LOG = path.join(LOG_DIR, "admin_messages.log");

// Create logs directory if it doesn't exist
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    console.log("Created logs directory:", LOG_DIR);
  }
} catch (err) {
  console.error("Failed to create logs directory:", err);
}

// Function to log admin messages
function logAdminMessage(
  adminId: string,
  messageType: string,
  messageContent: string,
  recipientInfo?: string,
) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ADMIN[${adminId}] TYPE[${messageType}] ${recipientInfo ? `RECIPIENT[${recipientInfo}] ` : ""}MESSAGE: ${messageContent}\n`;

    fs.appendFileSync(ADMIN_MESSAGE_LOG, logEntry);
  } catch (err) {
    console.error("Failed to log admin message:", err);
  }
}

// Get the webapp URL from environment
const domain = process.env.REPLIT_DOMAINS.split(",")[0];
const WEBAPP_URL = `https://${domain}`;

// Import config to respect LOG_LEVEL setting
import { config } from "../shared/config";

// Only log if LOG_LEVEL permits INFO logs or higher
if (config.LOG_LEVEL === undefined || config.LOG_LEVEL >= 2) {
  console.log("=== Telegram Bot Configuration ===");
  console.log("Environment:", process.env.NODE_ENV);
  console.log(
    "Using token type:",
    process.env.NODE_ENV === "production" ? "Production" : "Development",
  );
  console.log("Telegram Bot configured successfully");
  console.log("WebApp URL:", WEBAPP_URL);
}

// Initialize bot with polling and minimal logging
export const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
  webHook: false,
});

// Add message handler for processing all incoming messages
bot.on("message", async (msg) => {
  // Skip command messages as they're handled by onText handlers
  if (msg.text?.startsWith("/")) return;
  
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  
  if (!telegramId) return;
  
  // Check if this is an admin in broadcast flow
  const broadcastState = adminBroadcastState.get(telegramId);
  if (broadcastState && broadcastState.state === "awaiting_message" && msg.text) {
    try {
      console.log("[BROADCAST] Received message from admin for broadcast:", msg.text);
      
      // Update state with the message
      adminBroadcastState.set(telegramId, {
        state: "awaiting_confirmation",
        message: msg.text,
        timestamp: Date.now()
      });
      
      // Create confirmation message with preview
      const confirmationMessage = 
        "📣 <b>Broadcast Preview</b>\n\n" +
        "This is how your message will look to users:\n\n" +
        "----- <b>Preview</b> -----\n" +
        `📣 <b>Admin Announcement</b>\n\n${msg.text}\n` +
        "---------------------\n\n" +
        "Do you want to send this message to all approved users with notifications enabled?";
      
      // Create keyboard with confirm/cancel buttons
      const keyboard = {
        inline_keyboard: [
          [
            { text: "✅ Send Message", callback_data: "broadcast_confirm" },
            { text: "❌ Cancel", callback_data: "broadcast_cancel" }
          ]
        ]
      };
      
      // Send confirmation message with buttons
      await bot.sendMessage(chatId, confirmationMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard
      });
      
      logAdminMessage(
        telegramId,
        "BROADCAST_PREVIEW",
        "Admin provided message for broadcast and is awaiting confirmation",
        msg.text.substring(0, 50) + (msg.text.length > 50 ? "..." : "")
      );
    } catch (error) {
      console.error("[BROADCAST] Error processing admin broadcast message:", error);
      
      // Reset state
      adminBroadcastState.delete(telegramId);
      
      await bot.sendMessage(
        chatId,
        "❌ <b>Error</b>\n\nThere was an error processing your broadcast message. Please try again with /broadcast.",
        { parse_mode: "HTML" }
      );
    }
  }
});

// Register command handlers first
async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    let keyboard;
    let welcomeMessage;

    if (!existingUser) {
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "Apply to Join",
              web_app: { url: `${WEBAPP_URL}/welcome` },
            },
          ],
        ],
      };
      welcomeMessage =
        "👋 Welcome to Collab Room!\n\nThis is the fastest way to find and share marketing collabs with other Web3 brands—guest blogs, Twitter Collabs, AMAs, and more.\n\nYou’ll get filtered, relevant opportunities straight to your Telegram, and can push your own out to a verified network.\n\nClick below to start your application.";
    } else if (existingUser.is_approved) {
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "🚀 Launch Collab Room",
              web_app: { url: `${WEBAPP_URL}/discover` },
            },
          ],
          [
            {
              text: "📣 Announcements",
              url: "https://t.me/TheMarketingDAO",
            },
          ],
        ],
      };
      welcomeMessage = `👋 Welcome back to Collab Room!\n\nYou're all set! Click below to access your matches and discover new collaborations.`;
    } else {
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "View Application Status",
              web_app: { url: `${WEBAPP_URL}/application-status` },
            },
          ],
          [
            {
              text: "📣 Join Announcement Channel",
              url: "https://t.me/TheMarketingDAO",
            },
          ],
        ],
      };
      welcomeMessage = `👋 Welcome back to Collab Room!\n\nYour application is currently under review. Click below to check your application status or use /status command anytime.`;
    }

    await bot.sendMessage(
      chatId,
      welcomeMessage,
      keyboard ? { reply_markup: keyboard } : undefined,
    );
  } catch (error) {
    console.error("Error in handleStart:", error);
    try {
      await bot.sendMessage(
        chatId,
        "Sorry, something went wrong. Please try again in a few moments.",
      );
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }
}

// Send application confirmation message
export async function sendApplicationConfirmation(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "Check Application Status",
          web_app: { url: `${WEBAPP_URL}/application-status` },
        },
      ],
    ],
  };

  try {
    await bot.sendMessage(
      chatId,
      "🎉 Application Submitted Successfully!\n\nThank you for applying to join Collab Room. Click below to check your application status anytime.",
      { reply_markup: keyboard },
    );
    console.log("Application confirmation message sent successfully");

    // Log application confirmation message
    logAdminMessage(
      "SYSTEM",
      "APPLICATION_CONFIRMATION",
      `Sent application confirmation to user with chat ID ${chatId}`,
      `New user application received`,
    );
  } catch (error) {
    console.error("Failed to send application confirmation:", error);
  }
}

// Notify admins about new user applications
interface NewUserNotification {
  telegram_id: string;
  first_name: string;
  last_name?: string;
  handle?: string;
  company_name: string;
  company_website?: string;
  job_title: string;
}

export async function notifyAdminsNewUser(userData: NewUserNotification) {
  try {
    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_admin, true));

    if (!adminUsers.length) {
      console.warn("No admin users found to notify");
      return;
    }

    // Format company website link if available
    const companyWebsite = userData.company_website
      ? userData.company_website.startsWith("http")
        ? userData.company_website
        : `https://${userData.company_website}`
      : null;

    // Format the company name with a hyperlink if website is available
    const companyNameFormatted = companyWebsite
      ? `<a href="${companyWebsite}">${userData.company_name}</a>`
      : userData.company_name;

    // Format the Telegram handle
    const telegramHandle = userData.handle ? `@${userData.handle}` : "";

    // Build the message with HTML formatting
    const message =
      `🆕 <b>New User Application!</b>\n\n` +
      `<b>Name:</b> ${userData.first_name} ${userData.last_name || ""} ${telegramHandle ? `(${telegramHandle})` : ""}\n` +
      `<b>Company:</b> ${companyNameFormatted}\n` +
      `<b>Role:</b> ${userData.job_title}\n\n` +
      `Use the buttons below to take action:`;

    // Create inline keyboard with two buttons:
    // 1. Approve Application - callback query with approve_user_{telegram_id} format
    // 2. View Application - web app link to pending applications page
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Approve Application",
            callback_data: `approve_user_${userData.telegram_id}`,
          },
        ],
        [
          {
            text: "👁️ View Application",
            web_app: { url: `${WEBAPP_URL}/admin/applications` },
          },
        ],
      ],
    };

    // Send notification to each admin
    for (const admin of adminUsers) {
      try {
        const result = await bot.sendMessage(
          parseInt(admin.telegram_id),
          message,
          {
            parse_mode: "HTML",
            disable_web_page_preview: false, // Allow website previews
            reply_markup: keyboard,
          },
        );
        console.log(`Enhanced notification sent to admin ${admin.telegram_id}`);

        // Log the admin notification
        logAdminMessage(
          admin.telegram_id,
          "NEW_USER_APPLICATION",
          `New user application from ${userData.first_name} ${userData.last_name || ""} (${userData.telegram_id})`,
          `${userData.first_name} ${userData.last_name || ""} (${userData.telegram_id})`,
        );
      } catch (error) {
        console.error(
          `Failed to send notification to admin ${admin.telegram_id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}

// Notify user when their application is approved
export async function notifyUserApproved(chatId: number) {
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "🚀 Launch Collab Room",
          web_app: { url: `${WEBAPP_URL}/discover` },
        },
      ],
      [
        {
          text: "📣 Join Announcement Channel",
          url: "https://t.me/TheMarketingDAO",
        },
      ],
    ],
  };

  try {
    await bot.sendMessage(
      chatId,
      "🎉 Congratulations! Your application has been approved!\n\n" +
        "Welcome to Collab Room! You now have full access to the platform.\n\n" +
        "Click below to discover new collaborations and join our announcement channel for updates.",
      { reply_markup: keyboard },
    );
    console.log("Approval notification sent successfully");

    // Log the approval notification
    logAdminMessage(
      "SYSTEM",
      "USER_APPROVAL_NOTIFICATION",
      `Sent approval notification to user with chat ID ${chatId}`,
      `User approved and notified`,
    );
  } catch (error) {
    console.error("Failed to send approval notification:", error);
  }
}

// Set up commands silently
bot
  .setMyCommands([
    { command: "start", description: "Start the application process" },
    { command: "status", description: "Check your application status" },
    { command: "broadcast", description: "Admin only: Send message to all users" },
  ])
  .catch((error) => {
    console.error("Failed to register commands:", error);
  });

// Register command handlers
bot.onText(/\/start/, handleStart);

// Admin command to broadcast a message to all users
async function handleBroadcast(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  console.log("=== Handling /broadcast command ===");
  console.log("Chat ID:", chatId);
  console.log("Telegram ID:", telegramId);

  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }

    // Check if user is an admin
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    if (!user || !user.is_admin) {
      console.log("[BROADCAST] Rejected: User not an admin:", telegramId);
      await bot.sendMessage(
        chatId,
        "Sorry, this command is only available to administrators."
      );
      return;
    }

    // Set the state to "awaiting message" for this admin
    adminBroadcastState.set(telegramId, { 
      state: "awaiting_message", 
      timestamp: Date.now() 
    });

    // Send instructions
    await bot.sendMessage(
      chatId,
      "📣 <b>Broadcast Message</b>\n\n" +
      "Please send the message you want to broadcast to all active, approved users with notifications enabled.\n\n" +
      "<i>Your message can include:</i>\n" +
      "• <b>Bold text</b> using *bold* or <b>bold</b>\n" +
      "• <i>Italic text</i> using _italic_ or <i>italic</i>\n" +
      "• <u>Underlined text</u> using <u>underlined</u>\n" +
      "• Links like <a href=\"https://example.com\">this</a>\n\n" +
      "Send your message now, or type /cancel to abort.",
      { parse_mode: "HTML" }
    );

    logAdminMessage(
      telegramId,
      "BROADCAST_INITIATED",
      "Admin initiated broadcast message flow",
      "All users with notifications enabled"
    );
  } catch (error) {
    console.error("Error handling broadcast command:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong. Please try again later."
    );
  }
}

// Register broadcast command handler
bot.onText(/\/broadcast/, handleBroadcast);

// Cancel command handler
bot.onText(/\/cancel/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  
  if (!telegramId) return;
  
  // Check if this user has an active broadcast state
  if (adminBroadcastState.has(telegramId)) {
    adminBroadcastState.delete(telegramId);
    await bot.sendMessage(chatId, "✅ Broadcast cancelled.");
    
    logAdminMessage(
      telegramId,
      "BROADCAST_CANCELLED",
      "Admin cancelled broadcast message flow"
    );
  }
});

// Initialize broadcast state storage
// Maps telegramId to broadcast state
const adminBroadcastState = new Map<string, {
  state: "awaiting_message" | "awaiting_confirmation" | "sending"; 
  message?: string;
  timestamp: number;
}>();

// Function to broadcast a message to all active users with notifications enabled
export async function broadcastMessageToUsers(
  message: string,
  senderTelegramId: string,
  chatId: number
) {
  try {
    console.log("[BROADCAST] Starting message broadcast process");
    
    // Update admin state to sending
    adminBroadcastState.set(senderTelegramId, {
      state: "sending",
      message,
      timestamp: Date.now()
    });
    
    // Let admin know the process has started
    await bot.sendMessage(
      chatId,
      "📤 <b>Broadcast process started</b>\n\nSending your message to all eligible users...",
      { parse_mode: "HTML" }
    );
    
    // Get all users that are:
    // 1. Approved
    // 2. Have notifications enabled in their preferences
    const usersWithJoinedPreferences = await db
      .select({
        id: users.id,
        telegram_id: users.telegram_id,
        first_name: users.first_name,
        last_name: users.last_name,
        notifications_enabled: notification_preferences.notifications_enabled
      })
      .from(users)
      .leftJoin(
        notification_preferences,
        eq(users.id, notification_preferences.user_id)
      )
      .where(eq(users.is_approved, true));
    
    // Filter users with notifications enabled
    const eligibleUsers = usersWithJoinedPreferences.filter(user => 
      user.notifications_enabled === true
    );
    
    console.log(`[BROADCAST] Found ${eligibleUsers.length} eligible users out of ${usersWithJoinedPreferences.length} total approved users`);
    
    let successCount = 0;
    let failCount = 0;
    const failedIds: string[] = [];
    
    // Add broadcast header to the message
    const formattedMessage = 
      `📣 <b>Admin Announcement</b>\n\n${message}`;
    
    // Send message to each eligible user
    for (const user of eligibleUsers) {
      try {
        if (!user.telegram_id) {
          console.error(`[BROADCAST] User ${user.id} has no Telegram ID`);
          failCount++;
          continue;
        }
        
        // Parse Telegram ID as integer (Telegram API expects numeric IDs)
        const userChatId = parseInt(user.telegram_id);
        
        // Send message with HTML formatting
        await bot.sendMessage(userChatId, formattedMessage, {
          parse_mode: "HTML",
          disable_web_page_preview: false // Allow links to show previews
        });
        
        console.log(`[BROADCAST] Message sent to user ${user.first_name} ${user.last_name || ""} (${user.telegram_id})`);
        successCount++;
        
        // Add a small delay between messages to avoid hitting Telegram API limits
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`[BROADCAST] Failed to send to user ${user.telegram_id}:`, error);
        failCount++;
        failedIds.push(user.telegram_id);
      }
    }
    
    // Remove admin from broadcast state
    adminBroadcastState.delete(senderTelegramId);
    
    // Send summary back to admin
    const summaryMessage = 
      `✅ <b>Broadcast completed</b>\n\n` +
      `Message sent to ${successCount} user${successCount !== 1 ? 's' : ''}\n` +
      `Failed: ${failCount} user${failCount !== 1 ? 's' : ''}` +
      (failCount > 0 ? `\n\nSome users may have blocked the bot or have invalid Telegram IDs.` : '');
    
    await bot.sendMessage(chatId, summaryMessage, { parse_mode: "HTML" });
    
    // Log the broadcast action
    logAdminMessage(
      senderTelegramId,
      "BROADCAST_COMPLETED",
      `Message sent to ${successCount} users, failed for ${failCount} users`,
      `${successCount} users with notifications enabled`
    );
    
    return { successCount, failCount, failedIds };
  } catch (error) {
    console.error("[BROADCAST] Error in broadcast process:", error);
    
    // Remove admin from broadcast state
    adminBroadcastState.delete(senderTelegramId);
    
    // Notify admin of the error
    await bot.sendMessage(
      chatId,
      "❌ <b>Broadcast Error</b>\n\nThere was an error while sending your broadcast message. Please try again later.",
      { parse_mode: "HTML" }
    );
    
    throw error;
  }
}

async function handleStatus(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  console.log("=== Handling /status command ===");
  console.log("Chat ID:", chatId);
  console.log("Telegram ID:", telegramId);

  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    console.log("User found:", user);

    if (!user) {
      // For users without applications, show the Apply button
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "Apply to Join",
              web_app: { url: `${WEBAPP_URL}/welcome` },
            },
          ],
        ],
      };
      await bot.sendMessage(
        chatId,
        "No application found. Click below to start your application.",
        { reply_markup: keyboard },
      );
      return;
    }

    const applicationDate = user.applied_at
      ? format(new Date(user.applied_at), "MMMM d, yyyy")
      : "Not available";

    let statusMessage;
    let keyboard;

    if (user.is_approved) {
      statusMessage = `✅ Your application has been approved!\n\nYou can now access Collab Room and discover new collaborations.`;
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "🚀 Launch Collab Room",
              web_app: { url: `${WEBAPP_URL}/discover` },
            },
          ],
          [
            {
              text: "📣 Join Announcement Channel",
              url: "https://t.me/TheMarketingDAO",
            },
          ],
        ],
      };
    } else {
      statusMessage = `📝 Application Status: Under Review\n\nApplication Details:\n• Name: ${user.first_name} ${user.last_name}\n• Submitted: ${applicationDate}\n\nWe'll notify you here once your application has been reviewed.`;
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "View Application Status",
              web_app: { url: `${WEBAPP_URL}/application-status` },
            },
          ],
          [
            {
              text: "📣 Join Announcement Channel",
              url: "https://t.me/TheMarketingDAO",
            },
          ],
        ],
      };
    }

    await bot.sendMessage(chatId, statusMessage, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error("Error handling status check:", error);
    console.error("Full error details:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong while checking your status. Please try again later.",
    );
  }
}

bot.onText(/\/status/, handleStatus);

// Handle callback queries for match info and user approvals
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;

  if (!chatId) {
    console.error("No chat ID found in callback query");
    return;
  }

  try {
    // Check callback data type and route to appropriate handler
    if (callbackQuery.data?.startsWith("match_info_")) {
      await handleMatchInfoCallback(callbackQuery);
    }
    // Handle user approval callback
    else if (callbackQuery.data?.startsWith("approve_user_")) {
      await handleApproveUserCallback(callbackQuery);
    }
    // Handle swipe actions from notifications
    else if (callbackQuery.data?.startsWith("swipe_")) {
      await handleSwipeCallback(callbackQuery);
    }
    // Handle broadcast confirmation
    else if (callbackQuery.data === "broadcast_confirm") {
      await handleBroadcastConfirm(callbackQuery);
    }
    // Handle broadcast cancellation
    else if (callbackQuery.data === "broadcast_cancel") {
      await handleBroadcastCancel(callbackQuery);
    }
  } catch (error) {
    console.error("Error handling callback query:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, there was an error processing your request.",
    );
  }
});

// Handle broadcast confirmation
async function handleBroadcastConfirm(callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id;
  const telegramId = callbackQuery.from?.id.toString();
  
  if (!chatId || !telegramId) {
    console.error("[BROADCAST] Missing chat ID or telegram ID in confirmation callback");
    return;
  }
  
  try {
    // Acknowledge the callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Processing your broadcast request...",
      show_alert: false
    });
    
    // Check if the user has a broadcast state and a message
    const broadcastState = adminBroadcastState.get(telegramId);
    if (!broadcastState || broadcastState.state !== "awaiting_confirmation" || !broadcastState.message) {
      console.error("[BROADCAST] Invalid state in confirmation callback:", broadcastState);
      await bot.sendMessage(chatId, "❌ Error: No broadcast message found. Please start over with /broadcast");
      adminBroadcastState.delete(telegramId);
      return;
    }
    
    // Get the message from the state
    const message = broadcastState.message;
    
    // Update the message to show that broadcast is confirmed and starting
    if (callbackQuery.message?.message_id) {
      try {
        await bot.editMessageText(
          "✅ <b>Broadcast Confirmed</b>\n\nYour message is being sent to users now. Please wait for the broadcast to complete...",
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            parse_mode: "HTML"
          }
        );
      } catch (editError) {
        console.error("[BROADCAST] Error updating confirmation message:", editError);
        // Continue with the broadcast even if the UI update fails
      }
    }
    
    // Start the broadcast process
    await broadcastMessageToUsers(message, telegramId, chatId);
  } catch (error) {
    console.error("[BROADCAST] Error in broadcast confirmation:", error);
    
    // Clean up state
    adminBroadcastState.delete(telegramId);
    
    await bot.sendMessage(
      chatId,
      "❌ <b>Broadcast Error</b>\n\nThere was an error processing your broadcast. Please try again with /broadcast.",
      { parse_mode: "HTML" }
    );
  }
}

// Handle broadcast cancellation
async function handleBroadcastCancel(callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id;
  const telegramId = callbackQuery.from?.id.toString();
  
  if (!chatId || !telegramId) return;
  
  try {
    // Acknowledge the callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Broadcast cancelled",
      show_alert: false
    });
    
    // Clean up state
    adminBroadcastState.delete(telegramId);
    
    // Update the message to show cancellation
    if (callbackQuery.message?.message_id) {
      try {
        await bot.editMessageText(
          "❌ <b>Broadcast Cancelled</b>\n\nYour broadcast message was not sent. Use /broadcast to start again if needed.",
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            parse_mode: "HTML"
          }
        );
      } catch (editError) {
        console.error("[BROADCAST] Error updating cancellation message:", editError);
        // Send new message if edit fails
        await bot.sendMessage(
          chatId,
          "❌ <b>Broadcast Cancelled</b>\n\nYour broadcast message was not sent. Use /broadcast to start again if needed.",
          { parse_mode: "HTML" }
        );
      }
    }
    
    logAdminMessage(
      telegramId,
      "BROADCAST_CANCELLED",
      "Admin cancelled broadcast at confirmation step"
    );
  } catch (error) {
    console.error("[BROADCAST] Error handling broadcast cancellation:", error);
    // Try to send a fallback message
    await bot.sendMessage(
      chatId,
      "❌ Broadcast cancelled.",
      { parse_mode: "HTML" }
    );
  }
}

// Handler for match info callbacks
// Handle user approval callbacks from admin notifications
async function handleApproveUserCallback(
  callbackQuery: TelegramBot.CallbackQuery,
) {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId || !callbackQuery.data) return;

  console.log(
    "[CALLBACK_DEBUG] Processing user approval callback:",
    callbackQuery.data,
  );

  try {
    // First, acknowledge the callback to show progress to admin
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Processing approval...",
      show_alert: false,
    });

    // Extract Telegram ID from callback data
    // Format: approve_user_{telegram_id}
    const telegramId = callbackQuery.data.replace("approve_user_", "");
    if (!telegramId) {
      console.error(
        "[CALLBACK_DEBUG] Invalid user approval callback format:",
        callbackQuery.data,
      );
      await bot.sendMessage(chatId, "Error: Invalid approval data format");
      return;
    }

    console.log(
      "[CALLBACK_DEBUG] Approving user with Telegram ID:",
      telegramId,
    );

    // Get user by Telegram ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    if (!user) {
      console.error(
        "[CALLBACK_DEBUG] User not found for approval:",
        telegramId,
      );
      await bot.sendMessage(chatId, "Error: User not found");
      return;
    }

    // Check if user is already approved
    if (user.is_approved) {
      console.log("[CALLBACK_DEBUG] User is already approved:", telegramId);
      await bot.sendMessage(
        chatId,
        `User ${user.first_name} ${user.last_name || ""} is already approved.`,
      );
      return;
    }

    // Update user approval status
    const [updatedUser] = await db
      .update(users)
      .set({ is_approved: true })
      .where(eq(users.id, user.id))
      .returning();

    console.log("[CALLBACK_DEBUG] User approval successful:", updatedUser);

    // Log the approval action
    const adminTelegramId = callbackQuery.from?.id?.toString() || "unknown";
    logAdminMessage(
      adminTelegramId,
      "USER_APPROVAL",
      `Approved user: ${user.first_name} ${user.last_name || ""} (${telegramId})`,
      `${user.first_name} ${user.last_name || ""} (${telegramId})`,
    );

    // Send notification to the approved user
    try {
      await notifyUserApproved(parseInt(telegramId));
      console.log("[CALLBACK_DEBUG] Approval notification sent to user");
    } catch (notifyError) {
      console.error(
        "[CALLBACK_DEBUG] Failed to send approval notification:",
        notifyError,
      );
      // Continue execution even if notification fails
    }

    // Update the admin's message to show approval status
    try {
      // Only edit the message if it exists
      if (callbackQuery.message?.message_id) {
        // Simplified keyboard for approval confirmation - no "Approved" button
        const updatedKeyboard = {
          inline_keyboard: [
            [
              {
                text: "👁️ View Applications",
                web_app: { url: `${WEBAPP_URL}/admin/applications` },
              },
            ],
          ],
        };

        await bot.editMessageText(
          `✅ <b>Application Approved!</b>\n\n` +
            `You have approved <b>${user.first_name} ${user.last_name || ""}</b>'s application.\n` +
            `They have been notified and now have full access to the platform.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            parse_mode: "HTML",
            reply_markup: updatedKeyboard,
          },
        );
      }
    } catch (editError) {
      console.error(
        "[CALLBACK_DEBUG] Failed to update approval message:",
        editError,
      );
      // If editing fails, send a new message instead
      await bot.sendMessage(
        chatId,
        `✅ <b>Application Approved!</b>\n\n` +
          `You have approved <b>${user.first_name} ${user.last_name || ""}</b>'s application.\n` +
          `They have been notified and now have full access to the platform.`,
        { parse_mode: "HTML" },
      );
    }
  } catch (error) {
    console.error("[CALLBACK_DEBUG] Error in user approval process:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, there was an error processing the approval. Please try again or check the admin dashboard.",
    );
  }
}

async function handleMatchInfoCallback(
  callbackQuery: TelegramBot.CallbackQuery,
) {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId || !callbackQuery.data) return;

  console.log(
    "[CALLBACK_DEBUG] Processing match info callback:",
    callbackQuery.data,
  );

  try {
    // First, acknowledge the callback to show progress to user
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Loading match details...",
      show_alert: false,
    });

    // Extract data from callback
    // Format: match_info_userId_collaborationId
    const parts = callbackQuery.data.split("_");
    if (parts.length !== 4) {
      console.error(
        "[CALLBACK_DEBUG] Invalid callback data format:",
        callbackQuery.data,
      );
      return;
    }

    const userId = parts[2];
    const collaborationId = parts[3];

    console.log("[CALLBACK_DEBUG] Extracted IDs:", { userId, collaborationId });

    // Get user details with full query logging
    console.log("[CALLBACK_DEBUG] Fetching user data for ID:", userId);
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      console.error("[CALLBACK_DEBUG] User not found for match info:", userId);
      await bot.sendMessage(
        chatId,
        "Sorry, the user information could not be found.",
      );
      return;
    }

    console.log("[CALLBACK_DEBUG] User data retrieved:", JSON.stringify(user));

    // Get company details with full query logging
    console.log("[CALLBACK_DEBUG] Fetching company data for user ID:", userId);
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, userId));

    console.log(
      "[CALLBACK_DEBUG] Company data retrieved:",
      company ? JSON.stringify(company) : "None",
    );

    // Get collaboration details with full query logging
    console.log(
      "[CALLBACK_DEBUG] Fetching collaboration data for ID:",
      collaborationId,
    );
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));

    if (!collaboration) {
      console.error(
        "[CALLBACK_DEBUG] Collaboration not found for ID:",
        collaborationId,
      );
      await bot.sendMessage(
        chatId,
        "Sorry, the collaboration information could not be found.",
      );
      return;
    }

    console.log(
      "[CALLBACK_DEBUG] Collaboration data retrieved:",
      JSON.stringify(collaboration),
    );

    // Format user and company info
    const userFullName = `${user.first_name} ${user.last_name || ""}`.trim();
    const userHandle = user.handle ? `@${user.handle}` : "";

    // Format company website and social links
    const companyWebsite = company?.website
      ? company.website.startsWith("http")
        ? company.website
        : `https://${company.website}`
      : "";
    const companyName = companyWebsite
      ? `<a href="${companyWebsite}">${company?.name || "Unknown Company"}</a>`
      : company?.name || "Unknown Company";

    const twitterHandle = company?.twitter_handle || "";
    const twitterUrl = twitterHandle
      ? `https://twitter.com/${twitterHandle.replace("@", "")}`
      : "";
    const twitterFollowers = company?.twitter_followers || "Unknown";
    const linkedinUrl = company?.linkedin_url || "";

    // Build a detailed information message with rich formatting
    let infoMessage = `<b>🔍 Match Details</b>\n\n`;

    // User info section with tag linking and Telegram tag
    infoMessage += `<b>👤 User:</b> ${userFullName}`;
    if (userHandle) {
      infoMessage += ` (<a href="https://t.me/${user.handle}">@${user.handle}</a>)`;
    }
    infoMessage += `\n`;

    if (company) {
      infoMessage += `<b>🏢 Company:</b> ${companyName}\n`;
      infoMessage += `<b>💼 Role:</b> ${company.job_title || "Not specified"}\n`;
      if (company.funding_stage) {
        infoMessage += `<b>💰 Funding Stage:</b> ${company.funding_stage}\n`;
      }

      // Add blockchain networks if available
      if (
        company.blockchain_networks &&
        company.blockchain_networks.length > 0
      ) {
        infoMessage += `<b>⛓️ Blockchain Networks:</b> ${company.blockchain_networks.join(", ")}\n`;
      }

      // Add company tags if available
      if (company.tags && company.tags.length > 0) {
        infoMessage += `<b>🏷️ Company Tags:</b> ${company.tags.join(", ")}\n`;
      }
    }

    // Social links section with proper hyperlinks
    let socialLinksSection = "";
    if (twitterHandle) {
      const formattedTwitterHandle = twitterHandle.startsWith("@")
        ? twitterHandle
        : `@${twitterHandle}`;
      socialLinksSection += `• <a href="${twitterUrl}">Twitter: ${formattedTwitterHandle}</a> (${twitterFollowers} followers)\n`;
    }
    if (linkedinUrl) {
      socialLinksSection += `• <a href="${linkedinUrl}">LinkedIn Profile</a>\n`;
    }

    if (socialLinksSection) {
      infoMessage += `\n<b>🔗 Social Links:</b>\n${socialLinksSection}`;
    }

    // Collaboration details section with enhanced formatting
    infoMessage += `\n<b>🤝 Collaboration Type:</b> ${collaboration.collab_type}\n`;

    if (collaboration.description) {
      infoMessage += `\n<b>📝 Description:</b>\n${collaboration.description}\n`;
    }

    if (collaboration.topics && collaboration.topics.length > 0) {
      infoMessage += `\n<b>🏷️ Topics:</b> ${collaboration.topics.join(", ")}\n`;
    }

    // Add collaboration details from JSON if available
    if (collaboration.details) {
      const details =
        typeof collaboration.details === "string"
          ? JSON.parse(collaboration.details)
          : collaboration.details;

      if (details.short_description) {
        infoMessage += `\n<b>💡 Summary:</b>\n${details.short_description}\n`;
      }
      if (details.expectations) {
        infoMessage += `\n<b>✅ Expectations:</b>\n${details.expectations}\n`;
      }
      if (details.goals) {
        infoMessage += `\n<b>🎯 Goals:</b>\n${details.goals}\n`;
      }
    }

    // Create keyboard with enhanced action buttons - one button per row for better Telegram display
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "💬 Chat Now",
            url: `https://t.me/${user.handle || user.telegram_id}`,
          },
        ],
        [
          {
            text: "🔎 View Full Profile",
            web_app: { url: `${WEBAPP_URL}/discover` },
          },
        ],
        [
          {
            text: "🚀 Find More Matches",
            web_app: { url: `${WEBAPP_URL}/discover` },
          },
        ],
      ],
    };

    console.log("[CALLBACK_DEBUG] Sending formatted message:", infoMessage);
    console.log("[CALLBACK_DEBUG] With keyboard:", JSON.stringify(keyboard));

    // Send the detailed info using direct message approach to ensure proper formatting
    try {
      await sendDirectFormattedMessage(chatId, infoMessage, keyboard);
      console.log(
        "[CALLBACK_DEBUG] Successfully sent formatted message to chat:",
        chatId,
      );
    } catch (error) {
      console.error("[CALLBACK_DEBUG] Error in direct message send:", error);
      // Fallback to standard message if direct send fails
      await bot.sendMessage(chatId, infoMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard,
        disable_web_page_preview: false,
      });
    }
  } catch (error) {
    console.error(
      "[CALLBACK_DEBUG] Error handling match info callback:",
      error,
    );
    try {
      await bot.sendMessage(
        chatId,
        "Sorry, an error occurred while retrieving the match information. Please try again later.",
      );
    } catch (innerError) {
      console.error(
        "[CALLBACK_DEBUG] Failed to send error message:",
        innerError,
      );
    }
  }
}

// Basic error handling
bot.on("polling_error", (error) => {
  console.error("=== Telegram Bot Polling Error ===");
  console.error(error);
});

bot.on("error", (error) => {
  console.error("=== Telegram Bot General Error ===");
  console.error(error);
});

console.log("Telegram bot initialization completed");

/**
 * Send a match notification to both users when a match occurs
 * @param hostUserId ID of the host user (collaboration creator)
 * @param requesterUserId ID of the requester user (user who swiped right)
 * @param collaborationId ID of the collaboration that was matched
 */
/**
 * DIRECT MESSAGE - Send a notification directly to a Telegram chat
 * This function is used to bypass any caching issues with the standard notification system
 */
async function sendDirectFormattedMessage(
  chatId: number,
  message: string,
  keyboard: any,
) {
  try {
    // Validate inputs
    if (!chatId || isNaN(chatId)) {
      console.error(`[DIRECT_MSG_DEBUG] Invalid chat ID: ${chatId}`);
      throw new Error(`Invalid chat ID: ${chatId}`);
    }

    if (!message || typeof message !== "string") {
      console.error(
        `[DIRECT_MSG_DEBUG] Invalid message format, must be a string`,
      );
      throw new Error("Invalid message format");
    }

    // Detect HTML tags to ensure proper formatting
    const hasHtmlTags =
      message.includes("<b>") ||
      message.includes("<i>") ||
      message.includes("<a href");

    // Log exact message being sent for debugging
    console.log(`[DIRECT_MSG_DEBUG] Preparing message to ${chatId}:`);
    console.log(`[DIRECT_MSG_DEBUG] Contains HTML tags: ${hasHtmlTags}`);
    console.log(`[DIRECT_MSG_DEBUG] MESSAGE:\n${message}`);
    console.log(
      `[DIRECT_MSG_DEBUG] KEYBOARD:\n${JSON.stringify(keyboard, null, 2)}`,
    );

    // Prepare message options
    const messageOptions: TelegramBot.SendMessageOptions = {
      parse_mode: hasHtmlTags ? "HTML" : undefined, // Only set HTML mode when tags are present
      reply_markup: keyboard,
      disable_web_page_preview: false,
    };

    console.log(
      `[DIRECT_MSG_DEBUG] Message options:\n${JSON.stringify(messageOptions, null, 2)}`,
    );

    // Use lower-level sendMessage API for direct access
    console.log(`[DIRECT_MSG_DEBUG] Sending message to chat ID ${chatId}...`);
    const result = await bot.sendMessage(chatId, message, messageOptions);

    console.log(`[DIRECT_MSG_DEBUG] Success! Message ID: ${result.message_id}`);
    return result;
  } catch (error) {
    console.error(`[DIRECT_MSG_DEBUG] Failed to send message:`, error);

    // Attempt to determine error cause for better debugging
    if (error instanceof Error) {
      if (error.message.includes("ETELEGRAM")) {
        console.error(
          `[DIRECT_MSG_DEBUG] Telegram API error: ${error.message}`,
        );

        // Check for specific error conditions
        if (error.message.includes("chat not found")) {
          console.error(
            `[DIRECT_MSG_DEBUG] Chat ID ${chatId} not found. Verify the Telegram ID is correct.`,
          );
        } else if (error.message.includes("bot was blocked")) {
          console.error(`[DIRECT_MSG_DEBUG] User has blocked the bot.`);
        } else if (error.message.includes("can't parse entities")) {
          console.error(
            `[DIRECT_MSG_DEBUG] HTML parsing error. Check your HTML formatting.`,
          );
          console.error(`[DIRECT_MSG_DEBUG] Message that failed: ${message}`);
        }
      }
    }

    throw error;
  }
}

/**
 * Callback handler for swipe actions from Telegram notifications
 */
async function handleSwipeCallback(callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId || !callbackQuery.data) return;

  console.log(
    "[CALLBACK_DEBUG] Processing swipe callback:",
    callbackQuery.data,
  );

  try {
    // First, acknowledge the callback to show progress
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Processing action...",
      show_alert: false,
    });

    // Extract data from callback
    // Format: swipe_action_shortCollabId_shortUserId
    // Where action is 'm' (match) or 'p' (pass)
    const parts = callbackQuery.data.split("_");
    if (parts.length !== 4) {
      console.error(
        "[CALLBACK_DEBUG] Invalid swipe callback format:",
        callbackQuery.data,
      );
      await bot.sendMessage(chatId, "Error: Invalid action format");
      return;
    }

    const actionCode = parts[1]; // 'm' or 'p'
    const shortCollabId = parts[2]; // First 8 chars of collaboration ID
    const shortUserId = parts[3]; // First 8 chars of user ID

    // Convert from shorthand action code to full action
    const action = actionCode === "m" ? "match" : "pass";

    console.log("[CALLBACK_DEBUG] Parsed short IDs:", {
      actionCode,
      shortCollabId,
      shortUserId,
      fullAction: action,
    });

    // Query the database to get the full IDs based on the shortened versions
    // Find collaboration ID that starts with the short ID
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(
        eq(
          collaborations.id,
          sql`(SELECT id FROM collaborations WHERE id::text LIKE ${shortCollabId + "%"} LIMIT 1)`,
        ),
      );

    if (!collaboration) {
      console.error(
        "[CALLBACK_DEBUG] Collaboration not found for short ID:",
        shortCollabId,
      );
      await bot.sendMessage(chatId, "Error: Collaboration not found");
      return;
    }

    // Find user ID that starts with the short ID
    const [matchedUser] = await db
      .select()
      .from(users)
      .where(
        eq(
          users.id,
          sql`(SELECT id FROM users WHERE id::text LIKE ${shortUserId + "%"} LIMIT 1)`,
        ),
      );

    if (!matchedUser) {
      console.error(
        "[CALLBACK_DEBUG] User not found for short ID:",
        shortUserId,
      );
      await bot.sendMessage(chatId, "Error: User not found");
      return;
    }

    // Now we have the full IDs
    const collaborationId = collaboration.id;
    const userId = matchedUser.id;

    console.log("[CALLBACK_DEBUG] Swipe action:", {
      action,
      collaborationId,
      userId,
    });

    // Get the current user (host) from the chatId
    const telegramId = callbackQuery.from?.id.toString();
    if (!telegramId) {
      console.error("[CALLBACK_DEBUG] No Telegram ID in callback");
      await bot.sendMessage(chatId, "Error: User identification failed");
      return;
    }

    // Get host user record from Telegram ID
    const [hostUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    if (!hostUser) {
      console.error("[CALLBACK_DEBUG] Host user not found:", telegramId);
      await bot.sendMessage(chatId, "Error: Your user account was not found");
      return;
    }

    // Check if the host owns the collaboration
    if (collaboration.creator_id !== hostUser.id) {
      console.error("[CALLBACK_DEBUG] User is not the collaboration creator:", {
        hostId: hostUser.id,
        creatorId: collaboration.creator_id,
      });
      await bot.sendMessage(
        chatId,
        "Error: You don't have permission to perform this action",
      );
      return;
    }

    // Get the requester user's details
    const [requesterUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!requesterUser) {
      console.error("[CALLBACK_DEBUG] Requester user not found:", userId);
      await bot.sendMessage(chatId, "Error: The other user was not found");
      return;
    }

    // Create the appropriate swipe based on the action
    const direction = action === "match" ? "right" : "left";

    // Create a swipe record
    // Use db directly since we don't have access to storage here
    const [swipe] = await db
      .insert(swipes)
      .values({
        user_id: hostUser.id,
        collaboration_id: collaborationId,
        direction,
        created_at: new Date(),
      })
      .returning();

    console.log("[CALLBACK_DEBUG] Created swipe record:", swipe);

    // Update message based on action taken
    let responseMessage;
    let updatedKeyboard;

    if (action === "match") {
      // If it's a match, create a match record and notify both users
      const [match] = await db
        .insert(matches)
        .values({
          collaboration_id: collaborationId,
          host_id: hostUser.id,
          requester_id: userId,
          status: "active",
          created_at: new Date(),
        })
        .returning();

      console.log("[CALLBACK_DEBUG] Created match record:", match);

      // Only notify the requester about the match, as the host will see the updated message
      try {
        // Modified to only notify the requester, not the host
        const [requesterUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        const requesterChatId = parseInt(requesterUser.telegram_id);

        // Get host company information
        const [hostCompany] = await db
          .select()
          .from(companies)
          .where(eq(companies.user_id, hostUser.id));

        const hostCompanyName = hostCompany?.name || "their company";

        // Format company website URL if available
        const hostCompanyWebsite = hostCompany?.website
          ? hostCompany.website.startsWith("http")
            ? hostCompany.website
            : `https://${hostCompany.website}`
          : "";

        // Create a safer HTML message with proper website handling
        let matchMessage = `🎉 <b>New Match!</b>\n\n${hostUser.first_name} ${hostUser.last_name || ""}`;

        // Add company info with website if available
        if (hostCompanyWebsite) {
          matchMessage += ` from <a href="${hostCompanyWebsite}">${hostCompany?.name || "a company"}</a>`;
        } else {
          matchMessage += ` from ${hostCompanyName}`;
        }

        // Finish the message
        matchMessage += ` just approved your collaboration request for <b>${collaboration.collab_type}</b>!\n\nYou can now chat directly to coordinate your collaboration.`;

        // Create a keyboard with relevant actions
        const matchKeyboard = {
          inline_keyboard: [
            [
              {
                text: `💬 Chat with ${hostUser.first_name}`,
                url: `https://t.me/${hostUser.handle || hostUser.telegram_id}`,
              },
            ],
            [
              {
                text: "🚀 Launch Collab Room",
                web_app: { url: `${WEBAPP_URL}/discover` },
              },
            ],
          ],
        };

        await bot.sendMessage(requesterChatId, matchMessage, {
          parse_mode: "HTML",
          reply_markup: matchKeyboard,
        });

        console.log("[CALLBACK_DEBUG] Match notification sent to requester");
      } catch (notifyError) {
        console.error(
          "[CALLBACK_DEBUG] Error sending match notification to requester:",
          notifyError,
        );
        // Continue execution even if notification fails
      }

      // Fetch the company information for the requester
      const [requesterCompany] = await db
        .select()
        .from(companies)
        .where(eq(companies.user_id, userId))
        .catch((error) => {
          console.error(
            "[CALLBACK_DEBUG] Error fetching requester company:",
            error,
          );
          return [null];
        });

      // Update the message to show match success with company and collab details
      // Extract collaboration details for potential title
      const collabDetails =
        typeof collaboration.details === "string"
          ? JSON.parse(collaboration.details || "{}")
          : collaboration.details || {};

      // Get title from details object if available
      const collabTitle = collabDetails.title || collabDetails.name || "";

      // Generate a safe company name with or without website link
      let safeCompanyDisplay = "";

      // Format company website if available
      let safeRequesterCompanyWebsite = "";
      if (requesterCompany?.website) {
        safeRequesterCompanyWebsite = requesterCompany.website.startsWith(
          "http",
        )
          ? requesterCompany.website
          : `https://${requesterCompany.website}`;
      }

      // Create company display format with conditional link
      if (
        safeRequesterCompanyWebsite &&
        safeRequesterCompanyWebsite.includes(".")
      ) {
        safeCompanyDisplay = `<a href="${safeRequesterCompanyWebsite}">${(requesterCompany?.name || "a company").replace(/[<>]/g, "")}</a>`;
      } else {
        safeCompanyDisplay = (requesterCompany?.name || "a company").replace(
          /[<>]/g,
          "",
        );
      }

      // Create the response message with safe HTML
      responseMessage = `✅ <b>Matched!</b>\n\nYou've successfully matched with ${requesterUser.first_name} ${requesterUser.last_name || ""} from ${safeCompanyDisplay} for the "${collaboration.collab_type}" collaboration${collabTitle ? ` "${collabTitle}"` : ""}.\n\nA notification has been sent to them about the match.`;

      updatedKeyboard = {
        inline_keyboard: [
          [
            {
              text: `💬 Chat with ${requesterUser.first_name}`,
              url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}`,
            },
          ],
          [
            {
              text: "My Matches",
              web_app: { url: `${WEBAPP_URL}/matches` },
            },
          ],
        ],
      };
    } else {
      // For pass, just show a simple confirmation
      responseMessage = `❌ <b>Passed</b>\n\nYou've passed on ${requesterUser.first_name} ${requesterUser.last_name || ""}'s request.`;

      updatedKeyboard = {
        inline_keyboard: [
          [
            {
              text: "🔎 View More Requests",
              web_app: { url: `${WEBAPP_URL}/discover` },
            },
          ],
        ],
      };
    }

    // Update the message with the new status
    try {
      if (callbackQuery.message?.message_id) {
        await bot.editMessageText(responseMessage, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: "HTML",
          reply_markup: updatedKeyboard,
        });
      } else {
        // Fallback if message_id is not available
        await bot.sendMessage(chatId, responseMessage, {
          parse_mode: "HTML",
          reply_markup: updatedKeyboard,
        });
      }
    } catch (editError) {
      console.error("[CALLBACK_DEBUG] Failed to update message:", editError);
      // Send a new message as fallback
      await bot.sendMessage(chatId, responseMessage, {
        parse_mode: "HTML",
        reply_markup: updatedKeyboard,
      });
    }
  } catch (error) {
    console.error("[CALLBACK_DEBUG] Error in swipe callback handler:", error);
    try {
      await bot.sendMessage(
        chatId,
        "Sorry, there was an error processing your action. Please try again using the app.",
      );
    } catch (sendError) {
      console.error(
        "[CALLBACK_DEBUG] Failed to send error message:",
        sendError,
      );
    }
  }
}

/**
 * Notify a host when someone swipes right on their collaboration
 * @param hostUserId ID of the host user (collaboration creator)
 * @param requesterUserId ID of the requester user (user who swiped right)
 * @param collaborationId ID of the collaboration that received the right swipe
 */
export async function notifyNewCollabRequest(
  hostUserId: string,
  requesterUserId: string,
  collaborationId: string,
  note?: string,
) {
  try {
    console.log("[Telegram Bot] Sending collab request notification:", {
      hostUserId,
      requesterUserId,
      collaborationId,
    });

    // Check if host has notifications enabled
    const [notificationPrefs] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, hostUserId));

    // Skip if notifications are disabled
    if (notificationPrefs && !notificationPrefs.notifications_enabled) {
      console.log(
        "[Telegram Bot] Host has notifications disabled:",
        hostUserId,
      );
      return;
    }

    // Get user details from database
    const [hostUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, hostUserId));

    const [requesterUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, requesterUserId));

    if (!hostUser || !requesterUser) {
      console.error(
        "[Telegram Bot] Could not find user data for collab request notification:",
        {
          hostFound: !!hostUser,
          requesterFound: !!requesterUser,
        },
      );
      return;
    }

    // Get collaboration details
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));

    if (!collaboration) {
      console.error(
        "[Telegram Bot] Could not find collaboration for request notification:",
        { collaborationId },
      );
      return;
    }

    // Get company details for both users
    const [requesterCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, requesterUserId));

    if (!requesterCompany) {
      console.error("[Telegram Bot] Could not find requester company data:", {
        requesterUserId,
      });
      return;
    }

    // Convert telegram_id to integers for chat ID
    const hostChatId = parseInt(hostUser.telegram_id);

    if (isNaN(hostChatId)) {
      console.error("[Telegram Bot] Invalid host chat ID:", {
        hostChatId,
      });
      return;
    }

    // Format company twitter URL if available
    const twitterHandle = requesterCompany.twitter_handle
      ? requesterCompany.twitter_handle.replace("@", "")
      : null;

    const twitterUrl = twitterHandle
      ? `https://twitter.com/${twitterHandle}`
      : null;

    // Format company name with Twitter hyperlink if available
    const companyNameFormatted = twitterUrl
      ? `<a href="${twitterUrl}">${requesterCompany.name}</a>`
      : requesterCompany.name;

    // Format the collaboration date if available
    let collabDate = "Any future date";
    if (
      collaboration.date_type === "specific_date" &&
      collaboration.specific_date
    ) {
      collabDate = collaboration.specific_date;
    }

    // Format topics as a comma-separated string
    const topicsText =
      collaboration.topics && collaboration.topics.length > 0
        ? collaboration.topics.join(", ")
        : "Not specified";

    // Extract short description from details if available
    let shortDescription = "";
    if (collaboration.details) {
      const details =
        typeof collaboration.details === "string"
          ? JSON.parse(collaboration.details)
          : collaboration.details;

      shortDescription =
        details.short_description ||
        details.description ||
        collaboration.description ||
        "";
    } else {
      shortDescription = collaboration.description || "";
    }

    // Build the message with HTML formatting
    let message =
      `<b>New Collab Request</b>\n` +
      `The <i>${requesterCompany.job_title}</i> from ${companyNameFormatted}\n` +
      `Would like to collaborate on your collab <i>${collaboration.collab_type}</i> - <i>${shortDescription}</i>\n` +
      `<b>Topic</b>:<i> ${topicsText}</i>\n` +
      `🗓️: ${collabDate}\n\n`;

    // Add the note if it exists
    if (note) {
      message += `📝 <b>Note from user:</b>\n<i>${note}</i>\n\n`;
    }

    // Create shortened IDs for callback data (Telegram has a 64-byte limit)
    // Generate shorter identifiers by taking first 8 chars of each UUID
    const shortCollabId = collaborationId.substring(0, 8);
    const shortUserId = requesterUserId.substring(0, 8);

    // Create inline keyboard with two buttons on separate rows
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "More Info",
            web_app: { url: `${WEBAPP_URL}/discover` },
          },
        ],
        [
          {
            text: "❌ Pass",
            callback_data: `swipe_p_${shortCollabId}_${shortUserId}`,
          },
          {
            text: "✅ Match",
            callback_data: `swipe_m_${shortCollabId}_${shortUserId}`,
          },
        ],
      ],
    };

    // Send notification to host
    try {
      await sendDirectFormattedMessage(hostChatId, message, keyboard);
      console.log(
        `[Telegram Bot] Successfully sent collab request notification to host (${hostChatId})`,
      );
    } catch (error) {
      console.error(
        `[Telegram Bot] Failed to send collab request notification to host (${hostChatId}):`,
        error,
      );
    }
  } catch (error) {
    console.error(
      "[Telegram Bot] Error sending collab request notification:",
      error,
    );
  }
}

export async function notifyMatchCreated(
  hostUserId: string,
  requesterUserId: string,
  collaborationId: string,
  note?: string,
) {
  try {
    console.log("[Telegram Bot] Sending match notifications:", {
      hostUserId,
      requesterUserId,
      collaborationId,
    });

    // Get user details from database
    const [hostUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, hostUserId));

    const [requesterUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, requesterUserId));

    if (!hostUser || !requesterUser) {
      console.error(
        "[Telegram Bot] Could not find user data for match notification:",
        {
          hostFound: !!hostUser,
          requesterFound: !!requesterUser,
        },
      );
      return;
    }

    console.log("[DEBUG] User records:", {
      hostId: hostUser.id,
      hostTelegramId: hostUser.telegram_id,
      requesterIds: requesterUser.id,
      requesterTelegramId: requesterUser.telegram_id,
    });

    // Get collaboration details
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));

    if (!collaboration) {
      console.error(
        "[Telegram Bot] Could not find collaboration for match notification:",
        { collaborationId },
      );
      return;
    }

    // Extract collaboration details for more comprehensive notification
    let collabDetails = collaboration.details;
    if (typeof collabDetails === "string") {
      try {
        collabDetails = JSON.parse(collabDetails);
      } catch (e) {
        console.error("[ERROR] Failed to parse collaboration details:", e);
        collabDetails = {};
      }
    }

    // Format date information if available
    let dateInfo = "Flexible timing";
    if (
      collaboration.date_type === "specific_date" &&
      collaboration.specific_date
    ) {
      dateInfo = collaboration.specific_date;
    }

    // Format topics as comma-separated list if available
    const topicsText =
      collaboration.topics && collaboration.topics.length > 0
        ? collaboration.topics.join(", ")
        : "Not specified";

    // Extract description if available with proper type safety
    let shortDescription = "";

    // Use a type-safe approach with a fallback chain
    if (collabDetails && typeof collabDetails === "object") {
      // Access using index notation to avoid TypeScript errors
      if (
        "short_description" in collabDetails &&
        typeof collabDetails["short_description"] === "string"
      ) {
        shortDescription = collabDetails["short_description"];
      } else if (
        "description" in collabDetails &&
        typeof collabDetails["description"] === "string"
      ) {
        shortDescription = collabDetails["description"];
      }
    }

    // Fallback to collaboration description if needed
    if (!shortDescription && collaboration.description) {
      shortDescription = collaboration.description;
    }

    // Get company details for both users
    const [hostCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, hostUserId));

    const [requesterCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, requesterUserId));

    console.log("[DEBUG] Company records found:", {
      hostCompanyFound: !!hostCompany,
      requesterCompanyFound: !!requesterCompany,
    });

    // Convert telegram_id to integers for chat ID
    const hostChatId = parseInt(hostUser.telegram_id);
    const requesterChatId = parseInt(requesterUser.telegram_id);

    if (isNaN(hostChatId) || isNaN(requesterChatId)) {
      console.error("[Telegram Bot] Invalid chat IDs:", {
        hostChatId,
        requesterChatId,
      });
      return;
    }

    console.log("[DEBUG] Chat IDs for notifications:", {
      hostChatId,
      requesterChatId,
    });

    // Format company website links with robust error handling
    let requesterCompanyWebsite = "";
    let hostCompanyWebsite = "";

    try {
      // Process requester company website (if exists)
      if (requesterCompany?.website && requesterCompany.website.trim()) {
        // Sanitize website URL: remove spaces, special characters, ensure proper format
        let websiteUrl = requesterCompany.website.trim();

        // Add protocol if missing
        requesterCompanyWebsite = websiteUrl.startsWith("http")
          ? websiteUrl
          : `https://${websiteUrl}`;

        // Basic URL validation
        if (!requesterCompanyWebsite.includes(".")) {
          console.log(
            "[WARNING] Invalid requester company website format:",
            websiteUrl,
          );
          requesterCompanyWebsite = ""; // Reset if invalid
        }
      }
    } catch (error) {
      console.error(
        "[ERROR] Failed to process requester company website:",
        error,
      );
      requesterCompanyWebsite = "";
    }

    try {
      // Process host company website (if exists)
      if (hostCompany?.website && hostCompany.website.trim()) {
        // Sanitize website URL: remove spaces, special characters, ensure proper format
        let websiteUrl = hostCompany.website.trim();

        // Add protocol if missing
        hostCompanyWebsite = websiteUrl.startsWith("http")
          ? websiteUrl
          : `https://${websiteUrl}`;

        // Basic URL validation
        if (!hostCompanyWebsite.includes(".")) {
          console.log(
            "[WARNING] Invalid host company website format:",
            websiteUrl,
          );
          hostCompanyWebsite = ""; // Reset if invalid
        }
      }
    } catch (error) {
      console.error("[ERROR] Failed to process host company website:", error);
      hostCompanyWebsite = "";
    }

    // Format company names - simplified to avoid errors with malformed HTML
    const requesterCompanyName = requesterCompanyWebsite
      ? `<a href="${requesterCompanyWebsite}">${(requesterCompany?.name || "a company").replace(/[<>]/g, "")}</a>`
      : (requesterCompany?.name || "a company").replace(/[<>]/g, "");

    const hostCompanyName = hostCompanyWebsite
      ? `<a href="${hostCompanyWebsite}">${(hostCompany?.name || "a company").replace(/[<>]/g, "")}</a>`
      : (hostCompany?.name || "a company").replace(/[<>]/g, "");

    // IMPORTANT: Create the keyboard objects with specific formatting
    // Host keyboard (separate buttons to ensure proper layout)
    const hostKeyboard = {
      inline_keyboard: [
        [
          {
            text: `💬 Chat with ${requesterUser.first_name}`,
            url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}`,
          },
        ],
        // Remove the callback button that's causing issues
        [
          {
            text: "🚀 Launch Collab Room",
            web_app: { url: `${WEBAPP_URL}/discover` },
          },
        ],
        [
          {
            text: "👥 View Matches",
            web_app: { url: `${WEBAPP_URL}/matches` },
          },
        ],
      ],
    };

    // Requester keyboard (separate buttons to ensure proper layout)
    const requesterKeyboard = {
      inline_keyboard: [
        [
          {
            text: `💬 Chat with ${hostUser.first_name}`,
            url: `https://t.me/${hostUser.handle || hostUser.telegram_id}`,
          },
        ],
        // Remove the callback button that's causing issues
        [
          {
            text: "🚀 Launch Collab Room",
            web_app: { url: `${WEBAPP_URL}/discover` },
          },
        ],
        [
          {
            text: "👥 View Matches",
            web_app: { url: `${WEBAPP_URL}/matches` },
          },
        ],
      ],
    };

    // Prepare host notification with carefully formatted HTML
    let hostMessage = `🎉 <b>New Match!</b>\n\n`;

    // Add user name with safe formatting
    hostMessage += `${requesterUser.first_name} ${requesterUser.last_name || ""}`;

    // Add Telegram handle as link if available
    if (requesterUser.handle) {
      hostMessage += ` (<a href="https://t.me/${requesterUser.handle.replace(/[<>]/g, "")}">@${requesterUser.handle.replace(/[<>]/g, "")}</a>)`;
    }

    // Add job title if available
    hostMessage += `, the <b>${(requesterCompany?.job_title || "professional").replace(/[<>]/g, "")}</b>`;

    // Add company info - use a consistent format whether or not there's a valid website
    if (requesterCompanyWebsite) {
      hostMessage += ` from ${requesterCompanyName}`;
    } else {
      hostMessage += ` from ${(requesterCompany?.name || "a company").replace(/[<>]/g, "")}`;
    }

    // Complete the match info
    hostMessage += ` is a match for your <b>${collaboration.collab_type}</b> collaboration!`;

    // Add the personalization note if provided
    if (note && note.trim()) {
      // Sanitize the note to prevent HTML injection
      const sanitizedNote = note.trim().replace(/[<>]/g, "");
      hostMessage += `\n\n<b>💬 Their note:</b>\n"${sanitizedNote}"`;
    }

    // Add collaboration details section
    hostMessage += `\n\n<b>🔍 Collaboration Details:</b>\n`;

    // Add description if available
    if (shortDescription) {
      hostMessage += `• <b>Description:</b> ${shortDescription.replace(/[<>]/g, "")}\n`;
    }

    // Add topics
    hostMessage += `• <b>Topics:</b> ${topicsText}\n`;

    // Add date/timing
    hostMessage += `• <b>Timing:</b> ${dateInfo}\n`;

    // Add closing message
    hostMessage += `\n\nDrop them a message and get started on your collab!`;

    // Prepare requester notification with carefully formatted HTML
    let requesterMessage = `🎉 <b>New Match!</b>\n\n`;

    // Add user name with safe formatting
    requesterMessage += `${hostUser.first_name} ${hostUser.last_name || ""}`;

    // Add Telegram handle as link if available
    if (hostUser.handle) {
      requesterMessage += ` (<a href="https://t.me/${hostUser.handle.replace(/[<>]/g, "")}">@${hostUser.handle.replace(/[<>]/g, "")}</a>)`;
    }

    // Add company info - use a consistent format whether or not there's a valid website
    if (hostCompanyWebsite) {
      requesterMessage += ` from ${hostCompanyName}`;
    } else {
      requesterMessage += ` from ${(hostCompany?.name || "a company").replace(/[<>]/g, "")}`;
    }

    // Add basic match notification
    requesterMessage += ` just approved your collab request for <b>${collaboration.collab_type}</b>!\n\n`;

    // Add collaboration details section
    requesterMessage += `<b>🔍 Collaboration Details:</b>\n`;

    // Add description if available
    if (shortDescription) {
      requesterMessage += `• <b>Description:</b> ${shortDescription.replace(/[<>]/g, "")}\n`;
    }

    // Add topics
    requesterMessage += `• <b>Topics:</b> ${topicsText}\n`;

    // Add date/timing
    requesterMessage += `• <b>Timing:</b> ${dateInfo}\n\n`;

    // Complete the message
    requesterMessage += `You can now chat directly with ${hostUser.first_name} to get started!`;

    console.log("[DEBUG] Formatted messages to send:");
    console.log(`Host message (to ${hostChatId}):\n${hostMessage}`);
    console.log(
      `Requester message (to ${requesterChatId}):\n${requesterMessage}`,
    );

    // Send both notifications with full error handling
    let hostSuccess = false;
    let requesterSuccess = false;

    try {
      // First try the enhanced direct formatted message approach
      await sendDirectFormattedMessage(hostChatId, hostMessage, hostKeyboard);
      hostSuccess = true;
      console.log(
        `[DEBUG] Successfully sent formatted message to host (${hostChatId})`,
      );

      await sendDirectFormattedMessage(
        requesterChatId,
        requesterMessage,
        requesterKeyboard,
      );
      requesterSuccess = true;
      console.log(
        `[DEBUG] Successfully sent formatted message to requester (${requesterChatId})`,
      );

      console.log(
        "[Telegram Bot] Successfully sent enhanced HTML notifications to both users",
      );

      // Log the match notifications
      logAdminMessage(
        "SYSTEM",
        "MATCH_NOTIFICATION_HOST",
        `Sent match notification to host ${hostUser.first_name} ${hostUser.last_name || ""} (${hostUser.telegram_id})`,
        `Match with ${requesterUser.first_name} ${requesterUser.last_name || ""} on ${collaboration.collab_type}`,
      );

      logAdminMessage(
        "SYSTEM",
        "MATCH_NOTIFICATION_REQUESTER",
        `Sent match notification to requester ${requesterUser.first_name} ${requesterUser.last_name || ""} (${requesterUser.telegram_id})`,
        `Match with ${hostUser.first_name} ${hostUser.last_name || ""} on ${collaboration.collab_type}`,
      );
    } catch (directError) {
      console.error(
        "[Telegram Bot] Error in direct notification sending:",
        directError,
      );

      // If direct formatting failed, try standard message as fallback
      try {
        if (!hostSuccess) {
          // Try sending plain message to host without HTML formatting
          console.log("[DEBUG] Trying fallback message to host...");
          let plainHostMessage = `🎉 New Match! ${requesterUser.first_name} ${requesterUser.last_name || ""} from ${requesterCompany?.name || "a company"} matched with your ${collaboration.collab_type} collaboration!`;

          // Add personalization note even to fallback message
          if (note && note.trim()) {
            plainHostMessage += `\n\n💬 Their note:\n"${note.trim()}"`;
          }

          // Add collaboration details section in plain text
          plainHostMessage += `\n\nCollaboration Details:\n`;

          // Add description if available
          if (shortDescription) {
            plainHostMessage += `• Description: ${shortDescription}\n`;
          }

          // Add topics
          plainHostMessage += `• Topics: ${topicsText}\n`;

          // Add date/timing
          plainHostMessage += `• Timing: ${dateInfo}\n\n`;

          // Complete with a closing message
          plainHostMessage += `Drop them a message and get started on your collab!`;

          // Simplified fallback keyboard without callback data
          const fallbackHostKeyboard = {
            inline_keyboard: [
              [
                {
                  text: `Chat with ${requesterUser.first_name}`,
                  url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}`,
                },
              ],
              [
                {
                  text: "View Matches",
                  web_app: { url: `${WEBAPP_URL}/matches` },
                },
              ],
            ],
          };

          await bot.sendMessage(hostChatId, plainHostMessage, {
            reply_markup: fallbackHostKeyboard,
          });
          console.log(
            `[DEBUG] Successfully sent fallback message to host (${hostChatId})`,
          );

          // Log the fallback notification
          logAdminMessage(
            "SYSTEM",
            "MATCH_NOTIFICATION_HOST_FALLBACK",
            `Sent fallback match notification to host ${hostUser.first_name} ${hostUser.last_name || ""} (${hostUser.telegram_id})`,
            `Match with ${requesterUser.first_name} ${requesterUser.last_name || ""} on ${collaboration.collab_type}`,
          );
        }

        if (!requesterSuccess) {
          // Try sending plain message to requester without HTML formatting
          console.log("[DEBUG] Trying fallback message to requester...");

          // Create a plain text message without HTML tags for fallback but include details
          let plainRequesterMessage = `🎉 New Match! ${hostUser.first_name} ${hostUser.last_name || ""} from ${hostCompany?.name || "a company"} just approved your collab request for ${collaboration.collab_type}!\n\n`;

          // Add collaboration details section in plain text
          plainRequesterMessage += `Collaboration Details:\n`;

          // Add description if available
          if (shortDescription) {
            plainRequesterMessage += `• Description: ${shortDescription}\n`;
          }

          // Add topics
          plainRequesterMessage += `• Topics: ${topicsText}\n`;

          // Add date/timing
          plainRequesterMessage += `• Timing: ${dateInfo}\n\n`;

          // Complete the message
          plainRequesterMessage += `You can now chat directly with ${hostUser.first_name} to get started!`;

          // Simplified fallback keyboard without callback data
          const fallbackRequesterKeyboard = {
            inline_keyboard: [
              [
                {
                  text: `Chat with ${hostUser.first_name}`,
                  url: `https://t.me/${hostUser.handle || hostUser.telegram_id}`,
                },
              ],
              [
                {
                  text: "View Matches",
                  web_app: { url: `${WEBAPP_URL}/matches` },
                },
              ],
            ],
          };

          await bot.sendMessage(requesterChatId, plainRequesterMessage, {
            reply_markup: fallbackRequesterKeyboard,
          });
          console.log(
            `[DEBUG] Successfully sent fallback message to requester (${requesterChatId})`,
          );

          // Log the fallback notification
          logAdminMessage(
            "SYSTEM",
            "MATCH_NOTIFICATION_REQUESTER_FALLBACK",
            `Sent fallback match notification to requester ${requesterUser.first_name} ${requesterUser.last_name || ""} (${requesterUser.telegram_id})`,
            `Match with ${hostUser.first_name} ${hostUser.last_name || ""} on ${collaboration.collab_type}`,
          );
        }
      } catch (fallbackError) {
        console.error(
          "[Telegram Bot] Even fallback notification failed:",
          fallbackError,
        );
      }
    }
  } catch (error) {
    console.error("[Telegram Bot] Error preparing match notifications:", error);
    console.error(
      error instanceof Error ? error.stack : "No stack trace available",
    );
  }
}
