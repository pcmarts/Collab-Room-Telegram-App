import TelegramBot from "node-telegram-bot-api";
import { db } from "./db";
import {
  users,
  collaborations,
  companies,
  notification_preferences,
  swipes,
  matches,
  user_referrals,
  referral_events,
} from "@shared/schema";
import { eq, sql, inArray, and } from "drizzle-orm";
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

// Helper function to check if a chat ID is valid (bot has interacted with user)
async function isValidChatId(chatId: number): Promise<boolean> {
  try {
    // Try to get chat info - this will fail with "chat not found" if 
    // the bot hasn't interacted with this user yet
    await bot.getChat(chatId);
    return true;
  } catch (error) {
    console.log(`Chat ID ${chatId} appears to be invalid or hasn't interacted with bot`);
    return false;
  }
}

/**
 * Sets up bot commands based on user roles
 * Regular users only see basic commands
 * Admin users see additional commands including broadcast
 */
export async function setupBotCommands() {
  try {
    // Regular commands for all users
    const regularCommands = [
      { command: "start", description: "Start using Collab Room" },
      { command: "status", description: "Check your application status" },
    ];
    
    // Admin commands include broadcast functionality
    const adminCommands = [
      ...regularCommands,
      { command: "broadcast", description: "Send message to all users" }
    ];
    
    // Set regular commands as the default for all users
    await bot.setMyCommands(regularCommands);
    console.log("[BOT_SETUP] Set regular commands as default for all users");
    
    try {
      // Get all admin users from the database
      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.is_admin, true));
      
      console.log(`[BOT_SETUP] Found ${adminUsers.length} admin users`);
      
      // Set admin commands for each admin user instead of using chat_administrators scope
      for (const admin of adminUsers) {
        if (!admin.telegram_id) {
          console.warn(`[BOT_SETUP] Admin ${admin.id} has no Telegram ID, skipping`);
          continue;
        }
        
        try {
          // Check if this is a valid chat_id - can't set commands for users the bot hasn't interacted with
          const chatExists = await isValidChatId(parseInt(admin.telegram_id));
          
          if (chatExists) {
            // Create a chat scope for this specific admin user
            const adminScope = {
              type: 'chat',
              chat_id: parseInt(admin.telegram_id)
            };
            
            // Set admin-specific commands
            await bot.setMyCommands(adminCommands, { scope: adminScope });
            console.log(`[BOT_SETUP] Set admin commands for ${admin.first_name} (${admin.telegram_id})`);
          } else {
            console.log(`[BOT_SETUP] Admin ${admin.first_name} (${admin.telegram_id}) hasn't interacted with the bot yet, skipping command setup`);
          }
        } catch (error) {
          console.error(`[BOT_SETUP] Failed to set commands for admin ${admin.telegram_id}:`, error);
        }
      }
    } catch (dbError) {
      // If there's a DB error, we can continue with just the regular commands
      console.error("[BOT_SETUP] Database error when fetching admin users:", dbError);
      console.log("[BOT_SETUP] Continuing with just regular commands setup");
    }
    
    return true;
  } catch (error) {
    console.error("[BOT_SETUP] Error setting up bot commands:", error);
    return false;
  }
}

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
      
      // Store the original message with HTML tags intact
      adminBroadcastState.set(telegramId, {
        state: "awaiting_confirmation",
        message: msg.text,
        timestamp: Date.now()
      });
      
      // For the preview, we use the raw message text (HTML tags will display as plain text in preview)
      // This is intentional so the admin can see the HTML tags they entered
      const confirmationMessage = 
        "📣 <b>Broadcast Preview</b>\n\n" +
        "This is how your message will appear (with HTML formatting applied and <b>link previews disabled</b>):\n\n" +
        "----- <b>Preview</b> -----\n" +
        `📣 <b>Admin Announcement</b>\n\n${msg.text}\n` +
        "---------------------\n\n" +
        "<i>Note: All HTML formatting such as &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, and " +
        "&lt;a href=\"https://example.com\"&gt;links&lt;/a&gt; will render correctly, but link previews will be disabled.</i>\n\n" +
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

// Register command handlers - capture the referral code if present
bot.onText(/\/start(?:\s+(.+))?/, handleStart);

// Register command handlers first
async function handleStart(msg: TelegramBot.Message, match: RegExpExecArray | null) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  // Extract referral code from the message if present
  const referralParam = match && match[1] ? match[1].trim() : null;
  let referralCode = null;
  let referrerDetails = null;

  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }

    console.log(`[START] User ${telegramId} started bot with param: ${referralParam || 'none'}`);
    
    // Check if the parameter is a referral code
    // Handle both formats: with 'r_' prefix and without prefix (direct telegram_id_randomstring format)
    if (referralParam) {
      if (referralParam.startsWith('r_')) {
        referralCode = referralParam.substring(2); // Remove 'r_' prefix
      } else if (referralParam.includes('_')) {
        // If it has an underscore but no prefix, it's likely a direct referral code
        referralCode = referralParam;
      }
      console.log(`[REFERRAL] Found referral code: ${referralCode}`);
      
      // Look up the referrer by referral code
      // Parse the telegram_id from the referral code (format: telegram_id_random_string)
      // Ensure referralCode contains at least one underscore
      if (referralCode && referralCode.includes('_')) {
        // Extract the Telegram ID from the code
        // For code format: telegramId_randomString, use index 0
        // For code format: r_telegramId_randomString, we already removed the r_ prefix
        const telegramIdFromCode = referralCode.split('_')[0];
        console.log(`[REFERRAL] Extracted Telegram ID from code: ${telegramIdFromCode}`);
      
        // First try to look up user by the embedded telegram_id in the code
        const [referrerUser] = await db
          .select({
            id: users.id,
            first_name: users.first_name,
            last_name: users.last_name
          })
          .from(users)
          .where(eq(users.telegram_id, telegramIdFromCode));
        
        if (referrerUser) {
          // If found, get company info
          let companyName = null;
          
          // Look up company by user_id since the relationship is user -> company
          const companyResults = await db
            .select({
              name: companies.name
            })
            .from(companies)
            .where(eq(companies.user_id, referrerUser.id));
              
          if (companyResults && companyResults.length > 0) {
            companyName = companyResults[0].name;
          }
              
          referrerDetails = {
            id: referrerUser.id,
            first_name: referrerUser.first_name,
            last_name: referrerUser.last_name || '',
            company_name: companyName
          };
          
          console.log(`[REFERRAL] Found referrer: ${referrerDetails.first_name} ${referrerDetails.last_name}`);
        } else {
          console.log(`[REFERRAL] Invalid referral code: ${referralCode}`);
        }
      } else {
        console.log(`[REFERRAL] Referral code doesn't match expected format with underscore: ${referralCode}`);
      }
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    let keyboard;
    let welcomeMessage;

    if (!existingUser) {
      // Build URL with referral code if available
      let applicationUrl = `${WEBAPP_URL}/welcome`;
      if (referralCode) {
        applicationUrl += `?referral=${referralCode}`;
      }
      
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "Apply to Join",
              web_app: { url: applicationUrl },
            },
          ],
        ],
      };
      
      // Customize welcome message for referred users
      if (referrerDetails !== null) {
        // Type assertion to ensure TypeScript knows referrerDetails is not null here
        const details = referrerDetails as {
          id: string;
          first_name: string;
          last_name: string;
          company_name: string | null;
        };
        
        const referrerName = `${details.first_name} ${details.last_name}`.trim();
        const companyPart = details.company_name ? ` from ${details.company_name}` : '';
        
        welcomeMessage =
          `🎉 Congratulations! You've been referred by ${referrerName}${companyPart}.\n\n` +
          "Welcome to Collab Room - the fastest way to find and share marketing collabs with other Web3 brands—guest blogs, Twitter Collabs, AMAs, and more.\n\n" +
          "You'll get filtered, relevant opportunities straight to your Telegram, and can push your own out to a verified network.\n\n" +
          "Click below to start your application with your referral already applied.";
      } else {
        welcomeMessage =
          "👋 Welcome to Collab Room!\n\n" +
          "This is the fastest way to find and share marketing collabs with other Web3 brands—guest blogs, Twitter Collabs, AMAs, and more.\n\n" +
          "You'll get filtered, relevant opportunities straight to your Telegram, and can push your own out to a verified network.\n\n" +
          "Click below to start your application.";
      }
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
export async function sendApplicationConfirmation(chatId: number, telegramHandle?: string) {
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
    // Include the telegram handle in the message if available
    const handleText = telegramHandle ? ` @${telegramHandle}` : '';
    
    await bot.sendMessage(
      chatId,
      `🎉 Application Submitted Successfully!${handleText}\n\nThank you for applying to join Collab Room. Click below to check your application status anytime.`,
      { reply_markup: keyboard },
    );
    console.log(`Application confirmation message sent successfully to user${handleText}`);

    // Log application confirmation message
    logAdminMessage(
      "SYSTEM",
      "APPLICATION_CONFIRMATION",
      `Sent application confirmation to user with chat ID ${chatId}${handleText ? ' ' + handleText : ''}`,
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
  twitter_url?: string;
  company_twitter_handle?: string;
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
    
    // Format Twitter URLs
    const userTwitterFormatted = userData.twitter_url 
      ? `<a href="${userData.twitter_url}">${userData.first_name} ${userData.last_name || ""}</a>` 
      : `${userData.first_name} ${userData.last_name || ""}`;
      
    // Format company Twitter
    const companyTwitterUrl = userData.company_twitter_handle 
      ? `https://twitter.com/${userData.company_twitter_handle.replace(/^@/, '')}`
      : null;
    
    const companyTwitterLink = companyTwitterUrl 
      ? ` (<a href="${companyTwitterUrl}">Twitter</a>)` 
      : "";

    // Build the message with HTML formatting
    const message =
      `🆕 <b>New User Application!</b>\n\n` +
      `<b>Name:</b> ${userTwitterFormatted} ${telegramHandle ? `(${telegramHandle})` : ""}\n` +
      `<b>Company:</b> ${companyNameFormatted}${companyTwitterLink}\n` +
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
        // Make sure we have a valid numeric Telegram ID
        let telegramId: number;
        
        // Try multiple ways to convert the ID to a proper number
        if (typeof admin.telegram_id === 'number') {
          telegramId = admin.telegram_id;
        } else if (typeof admin.telegram_id === 'string') {
          // Remove any non-numeric characters and parse as integer
          const cleanId = admin.telegram_id.replace(/[^0-9]/g, '');
          telegramId = parseInt(cleanId, 10);
        } else {
          console.error(`[ADMIN_NOTIFICATION] Invalid admin Telegram ID format: ${admin.telegram_id}`);
          continue; // Skip this admin
        }
        
        // Double-check that we have a valid number
        if (isNaN(telegramId) || telegramId <= 0) {
          console.error(`[ADMIN_NOTIFICATION] Invalid admin Telegram ID after conversion: ${telegramId}`);
          continue; // Skip this admin
        }
        
        console.log(`[ADMIN_NOTIFICATION] Sending notification to admin Telegram ID: ${telegramId}`);
        
        const result = await bot.sendMessage(
          telegramId,
          message,
          {
            parse_mode: "HTML",
            disable_web_page_preview: false, // Keep website previews for admin notifications
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

/**
 * Notify referrer when a user they referred is approved
 * @param referrerId The database ID of the referrer
 * @param referredUserFirstName First name of the referred user who was approved
 */
export async function notifyReferrerAboutApproval(referrerId: string, referredUserFirstName: string) {
  try {
    // Validate input parameters
    if (!referrerId) {
      console.error(`[REFERRAL NOTIFICATION] Invalid referrer ID: ${referrerId}`);
      return false;
    }
    
    if (!referredUserFirstName) {
      console.warn(`[REFERRAL NOTIFICATION] Missing user first name, using "New user" instead`);
      referredUserFirstName = "New user";
    }
    
    console.log(`[REFERRAL NOTIFICATION] Starting notification process for referrer ${referrerId} about ${referredUserFirstName}`);
    console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Referrer ID type: ${typeof referrerId}`);
    console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Referrer ID value: '${referrerId}'`);
    
    // Attempt multiple ways to find the referrer
    let referrerUser = null;
    
    // Check if the referrer ID is a valid UUID (the ID format in our database)
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(referrerId);
    console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Is valid UUID? ${isValidUuid}`);
    
    // Method 1: Try by user.id if it's a valid UUID
    if (isValidUuid) {
      console.log(`[REFERRAL NOTIFICATION] Looking up by UUID: ${referrerId}`);
      const [userById] = await db
        .select()
        .from(users)
        .where(eq(users.id, referrerId));
        
      if (userById) {
        console.log(`[REFERRAL NOTIFICATION] Found user by ID: ${userById.id}, Name: ${userById.first_name}, Telegram ID: ${userById.telegram_id}`);
        referrerUser = userById;
      } else {
        console.warn(`[REFERRAL NOTIFICATION] Could not find user with ID: ${referrerId}, trying alternate lookup methods`);
      }
    }
    
    // Method 2: Try by Telegram ID
    if (!referrerUser) {
      console.warn(`[REFERRAL NOTIFICATION] Looking up by Telegram ID: ${referrerId}`);
      const [userByTelegramId] = await db
        .select()
        .from(users)
        .where(eq(users.telegram_id, referrerId));
      
      console.log(`[REFERRAL NOTIFICATION] DEBUGGING - User lookup by Telegram ID result: ${userByTelegramId ? JSON.stringify({
        id: userByTelegramId.id,
        name: userByTelegramId.first_name,
        telegram_id: userByTelegramId.telegram_id
      }) : 'Not found'}`);
      
      if (userByTelegramId) {
        console.log(`[REFERRAL NOTIFICATION] Found user by Telegram ID: ${userByTelegramId.id}`);
        referrerUser = userByTelegramId;
      } else {
        console.warn(`[REFERRAL NOTIFICATION] Could not find user with Telegram ID: ${referrerId}, trying alternate lookup methods`);
      }
    }
    
    // Method 3: Try by database lookup with a pattern like '%referrerId%'
    if (!referrerUser) {
      console.warn(`[REFERRAL NOTIFICATION] Attempting partial matching for user ID or Telegram ID: ${referrerId}`);
      // This could be risky, but as a last resort for debugging
      const usersWithSimilarIds = await db
        .select()
        .from(users)
        .where(sql`${users.id}::text LIKE ${'%' + referrerId + '%'} OR ${users.telegram_id} LIKE ${'%' + referrerId + '%'}`);
        
      if (usersWithSimilarIds.length > 0) {
        console.log(`[REFERRAL NOTIFICATION] Found ${usersWithSimilarIds.length} users with similar IDs`);
        for (const user of usersWithSimilarIds) {
          console.log(`[REFERRAL NOTIFICATION] Possible match: ID=${user.id}, TelegramID=${user.telegram_id}, Name=${user.first_name}`);
        }
        // Use the first match
        if (usersWithSimilarIds.length === 1) {
          referrerUser = usersWithSimilarIds[0];
          console.log(`[REFERRAL NOTIFICATION] Using user with ID: ${referrerUser.id} (Telegram ID: ${referrerUser.telegram_id})`);
        }
      } else {
        console.error(`[REFERRAL NOTIFICATION] Could not find any users with IDs similar to: ${referrerId}`);
      }
    }
    
    // If we still haven't found a user, fail the notification
    if (!referrerUser) {
      console.error(`[REFERRAL NOTIFICATION] Failed to find referrer after multiple lookup attempts. Aborting notification.`);
      return false;
    }
    
    // Use the found user's ID as the referrer ID for the remaining operations
    referrerId = referrerUser.id;
    
    // Get referrer details again to ensure we have the most up-to-date record
    console.log(`[REFERRAL NOTIFICATION] Getting fresh referrer details using ID: ${referrerId}`);
    const [referrer] = await db
      .select()
      .from(users)
      .where(eq(users.id, referrerId));

    if (!referrer || !referrer.telegram_id) {
      console.warn(`[REFERRAL NOTIFICATION] Cannot notify referrer ${referrerId}: User or Telegram ID not found`);
      return false;
    }
    
    console.log(`[REFERRAL NOTIFICATION] Found referrer: ${referrer.first_name} (ID: ${referrer.id}, Telegram ID: ${referrer.telegram_id})`);

    // Get referrer's referral stats
    console.log(`[REFERRAL NOTIFICATION] Querying referral record for user ${referrerId}`);
    const [referralRecord] = await db
      .select()
      .from(user_referrals)
      .where(eq(user_referrals.user_id, referrerId));

    if (!referralRecord) {
      console.log(`[REFERRAL NOTIFICATION] No referral record found for referrer ${referrerId}, creating one...`);
      
      // Create a referral record if it doesn't exist
      const randomSuffix = Math.random().toString(16).substring(2, 10);
      const referralCode = `${referrer.telegram_id}_${randomSuffix}`;
      
      // Insert the new referral record
      const [newReferralRecord] = await db
        .insert(user_referrals)
        .values({
          user_id: referrerId,
          referral_code: referralCode,
          total_available: 3,
          total_used: 1, // Already used 1 for the current referral
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
        
      console.log(`[REFERRAL NOTIFICATION] Created new referral record with code ${referralCode}`);
      
      // Use the newly created record
      return await notifyReferrerWithRecord(referrer, newReferralRecord, referredUserFirstName);
    }
    
    console.log(`[REFERRAL NOTIFICATION] Found referral record: ${JSON.stringify({
      id: referralRecord.id,
      user_id: referralRecord.user_id,
      code: referralRecord.referral_code,
      used: referralRecord.total_used,
      available: referralRecord.total_available
    })}`);
    
    // Update the total_used count as we're approving a referred user
    await db
      .update(user_referrals)
      .set({
        total_used: referralRecord.total_used + 1,
        updated_at: new Date()
      })
      .where(eq(user_referrals.id, referralRecord.id));
    
    console.log(`[REFERRAL NOTIFICATION] Updated referral record in database, increasing used count`);
    
    // Re-fetch the updated record
    const [updatedReferralRecord] = await db
      .select()
      .from(user_referrals)
      .where(eq(user_referrals.id, referralRecord.id));
    
    console.log(`[REFERRAL NOTIFICATION] Retrieved updated referral record: ${JSON.stringify({
      id: updatedReferralRecord.id,
      user_id: updatedReferralRecord.user_id,
      used: updatedReferralRecord.total_used,
      available: updatedReferralRecord.total_available
    })}`);
    
    console.log(`[REFERRAL NOTIFICATION] Updated referral record, now used ${updatedReferralRecord.total_used} of ${updatedReferralRecord.total_available}`);

    // Call the function to actually send the notification
    console.log(`[REFERRAL NOTIFICATION] Calling notifyReferrerWithRecord to send Telegram message`);
    return await notifyReferrerWithRecord(referrer, updatedReferralRecord || referralRecord, referredUserFirstName);
  } catch (error) {
    console.error(`[REFERRAL NOTIFICATION] Error in notifyReferrerAboutApproval:`, error);
    // Don't throw the error - we don't want to block the approval process if notification fails
    return false;
  }
}

// Helper function to send the actual notification
async function notifyReferrerWithRecord(referrer: any, referralRecord: any, referredUserFirstName: string) {
  try {
    console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Inside notifyReferrerWithRecord`);
    
    // Safely log referrer details without risking large object dumps
    try {
      console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Referrer details: {
        id: ${referrer?.id || 'undefined'}, 
        telegram_id: ${referrer?.telegram_id || 'undefined'}, 
        first_name: ${referrer?.first_name || 'undefined'},
        type: ${typeof referrer?.telegram_id || 'undefined'}
      }`);
    } catch (logError) {
      console.log(`[REFERRAL NOTIFICATION] Error logging referrer details: ${logError.message}`);
    }
    
    // Safely log referral record details 
    try {
      console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Referral Record details: {
        id: ${referralRecord?.id || 'undefined'}, 
        user_id: ${referralRecord?.user_id || 'undefined'}, 
        code: ${referralRecord?.referral_code || 'undefined'},
        used: ${referralRecord?.total_used || 'undefined'},
        available: ${referralRecord?.total_available || 'undefined'}
      }`);
    } catch (logError) {
      console.log(`[REFERRAL NOTIFICATION] Error logging referral record details: ${logError.message}`);
    }
    
    console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Referred User First Name: ${referredUserFirstName}`);

    // Validate all required fields are present
    if (!referrer || !referrer.telegram_id) {
      console.error(`[REFERRAL NOTIFICATION] Missing referrer data - ID: ${referrer?.id || 'null'}, TelegramID: ${referrer?.telegram_id || 'null'}`);
      return false;
    }

    if (!referralRecord || !referralRecord.referral_code) {
      console.error(`[REFERRAL NOTIFICATION] Missing referral record data - ID: ${referralRecord?.id || 'null'}, Code: ${referralRecord?.referral_code || 'null'}`);
      return false;
    }

    // Calculate remaining referrals
    const usedReferrals = referralRecord.total_used || 0;
    const totalReferrals = referralRecord.total_available || 3;
    const remainingReferrals = Math.max(0, totalReferrals - usedReferrals);

    console.log(`[REFERRAL NOTIFICATION] DEBUGGING - About to send message to Telegram ID: ${referrer.telegram_id} (type: ${typeof referrer.telegram_id})`);

    try {
      // Create share button with referral code
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "🚀 Invite More Friends",
              web_app: { url: `${WEBAPP_URL}/referrals` },
            },
          ],
          [
            {
              text: "📋 Copy Referral Code",
              callback_data: `copy_referral_code_${referralRecord.referral_code}`,
            },
          ],
        ],
      };

      // Make sure we have a valid numeric Telegram ID
      let telegramId: number;
      
      // Try multiple ways to convert the ID to a proper number
      if (typeof referrer.telegram_id === 'number') {
        telegramId = referrer.telegram_id;
        console.log(`[REFERRAL NOTIFICATION] Telegram ID is already a number: ${telegramId}`);
      } else if (typeof referrer.telegram_id === 'string') {
        // Remove any non-numeric characters and parse as integer
        const cleanId = referrer.telegram_id.replace(/[^0-9]/g, '');
        telegramId = parseInt(cleanId, 10);
        console.log(`[REFERRAL NOTIFICATION] Converted Telegram ID from string "${referrer.telegram_id}" to number ${telegramId}`);
      } else {
        console.error(`[REFERRAL NOTIFICATION] Invalid Telegram ID format: ${referrer.telegram_id}, type: ${typeof referrer.telegram_id}`);
        return false;
      }
      
      // Double-check that we have a valid number
      if (isNaN(telegramId) || telegramId <= 0) {
        console.error(`[REFERRAL NOTIFICATION] Invalid Telegram ID after conversion: ${telegramId}`);
        return false;
      }
      
      console.log(`[REFERRAL NOTIFICATION] Sending notification to Telegram ID: ${telegramId} (original: ${referrer.telegram_id})`);
      
      // Construct the message with @ mentions to trigger Telegram notifications
      // Get Telegram usernames or use first names if unavailable
      const referrerMention = referrer.handle ? `@${referrer.handle}` : referrer.first_name;
      const referredMention = referrer.referred_handle ? `@${referrer.referred_handle}` : referredUserFirstName;
      
      const message = `🎉 ${referrerMention} <b>Referral Success!</b>\n\n` +
          `Great news! ${referredMention} who you referred has been approved and now has full access to Collab Room.\n\n` +
          `<b>Your Referral Stats:</b>\n` +
          `• ${usedReferrals}/${totalReferrals} referrals used\n` +
          `• ${remainingReferrals} referral${remainingReferrals !== 1 ? 's' : ''} remaining\n\n` +
          `Share your unique code to invite more people:`;
      
      console.log(`[REFERRAL NOTIFICATION] About to send message: "${message.substring(0, 50)}..."`);
      
      // Direct message using Telegram API
      try {
        const sendResult = await bot.sendMessage(
          telegramId,
          message,
          { 
            parse_mode: "HTML",
            reply_markup: keyboard 
          },
        );
        
        console.log(`[REFERRAL NOTIFICATION] First message sent successfully. Message ID: ${sendResult?.message_id || 'unknown'}`);

        // Send the referral code as a separate message for easy copying
        try {
          const codeResult = await bot.sendMessage(
            telegramId,
            `<code>${referralRecord.referral_code}</code>`,
            { parse_mode: "HTML" }
          );
          
          console.log(`[REFERRAL NOTIFICATION] Code message sent successfully. Message ID: ${codeResult?.message_id || 'unknown'}`);
        } catch (codeError) {
          console.error(`[REFERRAL NOTIFICATION] Error sending code message:`, codeError);
          // Continue anyway since the main message was sent
        }
      } catch (sendError) {
        console.error(`[REFERRAL NOTIFICATION] Error sending Telegram message:`, sendError);
        
        // Try a fallback approach with simpler message
        try {
          console.log(`[REFERRAL NOTIFICATION] Attempting fallback message without formatting`);
          await bot.sendMessage(
            telegramId,
            `Referral Success! ${referredMention} who you referred has been approved and now has full access to Collab Room.`
          );
          console.log(`[REFERRAL NOTIFICATION] Fallback message sent successfully`);
        } catch (fallbackError) {
          console.error(`[REFERRAL NOTIFICATION] Fallback message also failed:`, fallbackError);
          return false;
        }
      }

      console.log(`[REFERRAL NOTIFICATION] Success! Notification sent to referrer ${referrer.id} (${referrer.first_name})`);

      // Log the notification
      logAdminMessage(
        "SYSTEM",
        "REFERRAL_SUCCESS_NOTIFICATION",
        `Sent referral success notification to ${referrer.first_name} for referring ${referredUserFirstName}`,
        `Referral notification sent`,
      );
      
      return true;
    } catch (telegramError) {
      console.error(`[REFERRAL NOTIFICATION] Telegram API error sending notification:`, telegramError);
      // Instead of throwing, we return false to indicate failure
      return false;
    }
  } catch (error) {
    console.error("[REFERRAL NOTIFICATION] Failed to send referral success notification:", error);
    // Don't throw the error - we don't want to block the approval process
    return false;
  }
}

/**
 * Notify all admins when a new collaboration is created
 * @param collaborationId The ID of the newly created collaboration
 * @param creatorId The ID of the user who created the collaboration
 */
/**
 * Notifies a user when their collaboration is successfully created
 * @param userId The ID of the user who created the collaboration
 * @param collaborationId The ID of the newly created collaboration
 */
export async function notifyUserCollabCreated(userId: string, collaborationId: string) {
  try {
    // Get user details with company information
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
      
    if (!user || !user.telegram_id) {
      console.error(`User ${userId} not found or has no Telegram ID`);
      return false;
    }

    // Get collaboration details
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));
      
    if (!collaboration) {
      console.error(`Collaboration with ID ${collaborationId} not found`);
      return false;
    }
    
    // Get user's company details for logging
    let companyName = "Unknown";
    
    try {
      // First try to get company by company_id (if available)
      if (user.company_id) {
        const companies_result = await db
          .select()
          .from(companies)
          .where(eq(companies.id, user.company_id));
        
        if (companies_result.length > 0) {
          companyName = companies_result[0].name;
        }
      }
      
      // If company not found by company_id, try to get by user_id
      if (companyName === "Unknown") {
        const companies_by_user = await db
          .select()
          .from(companies)
          .where(eq(companies.user_id, user.id));
        
        if (companies_by_user.length > 0) {
          companyName = companies_by_user[0].name;
        }
      }
      
      // As a last resort, check if the user has a company_name directly
      if (companyName === "Unknown" && user.company_name) {
        companyName = user.company_name;
      }
      
      // Log the company name we found for debugging
      console.log(`Found company name for user ${user.first_name} (ID: ${user.id}): ${companyName}`);
    } catch (error) {
      console.error(`Error retrieving company details for user ${user.id}:`, error);
    }
    
    // Check if user has notifications enabled
    const [preferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, userId));
      
    // Skip notification if user has explicitly disabled notifications
    if (preferences && preferences.notifications_enabled === false) {
      console.log(`User ${userId} has notifications disabled, skipping collaboration creation notification`);
      return false;
    }

    // Format topics as a string if present
    const topicsText = collaboration.topics && collaboration.topics.length > 0 
      ? `\n🏷️ <b>Topics:</b> ${collaboration.topics.join(", ")}` 
      : "";

    // Format funding stages as a string if present
    const fundingStagesText = collaboration.required_funding_stages && collaboration.required_funding_stages.length > 0
      ? `\n💰 <b>Required Funding Stages:</b> ${collaboration.required_funding_stages.join(", ")}`
      : "";
    
    // Format blockchain networks as a string if present
    const blockchainNetworksText = collaboration.required_blockchain_networks && collaboration.required_blockchain_networks.length > 0
      ? `\n⛓️ <b>Required Blockchain Networks:</b> ${collaboration.required_blockchain_networks.join(", ")}`
      : "";
    
    // Format company sectors as a string if present
    const companySectorsText = collaboration.required_company_sectors && collaboration.required_company_sectors.length > 0
      ? `\n🏢 <b>Required Company Sectors:</b> ${collaboration.required_company_sectors.join(", ")}`
      : "";

    // Build the message with HTML formatting
    const message =
      `🎉 <b>Your Collaboration is Live!</b>\n\n` +
      `Your ${collaboration.collab_type} collaboration has been successfully created and is now visible to other users.\n\n` +
      `<b>Title:</b> ${collaboration.title || "No title"}\n` +
      `<b>Description:</b> ${collaboration.description || "No description"}\n` +
      `<b>Company:</b> ${companyName}\n` +
      `${topicsText}` +
      `${fundingStagesText}` +
      `${blockchainNetworksText}` +
      `${companySectorsText}\n\n` +
      `Your collaboration will be shown to users who match your criteria. You'll receive a notification when someone requests to collaborate with you.`;

    // Create inline keyboard with a button to view their collaborations
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "View My Collaborations",
            web_app: { url: `${WEBAPP_URL}/marketing-collabs-new?tab=my` },
          },
        ],
      ],
    };

    // Make sure we have a valid numeric Telegram ID
    let telegramId: number;
    
    // Try multiple ways to convert the ID to a proper number
    if (typeof user.telegram_id === 'number') {
      telegramId = user.telegram_id;
    } else if (typeof user.telegram_id === 'string') {
      // Remove any non-numeric characters and parse as integer
      const cleanId = user.telegram_id.replace(/[^0-9]/g, '');
      telegramId = parseInt(cleanId, 10);
    } else {
      console.error(`[COLLAB_NOTIFICATION] Invalid user Telegram ID format: ${user.telegram_id}`);
      return false;
    }
    
    // Double-check that we have a valid number
    if (isNaN(telegramId) || telegramId <= 0) {
      console.error(`[COLLAB_NOTIFICATION] Invalid user Telegram ID after conversion: ${telegramId}`);
      return false;
    }
    
    console.log(`[COLLAB_NOTIFICATION] Sending creation notification to user Telegram ID: ${telegramId}`);
    
    try {
      await bot.sendMessage(
        telegramId,
        message,
        {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: keyboard,
        },
      );
      console.log(`Collaboration creation notification sent to user ${user.telegram_id} (${user.first_name}, Company: ${companyName})`);
      return true;
    } catch (error) {
      // Check specifically for "chat not found" errors which indicate the user hasn't interacted with the bot
      if (error?.response?.body?.description === "Bad Request: chat not found") {
        console.log(`[COLLAB_NOTIFICATION] User ${user.first_name} ${user.last_name || ""} (ID: ${telegramId}) hasn't interacted with the bot yet`);
        
        // Log this user for tracking (just use console log for now)
        console.log(`[COLLAB_NOTIFICATION_TRACKING] User ${user.id} needs to interact with the bot to receive notifications`);
        
        // In a future update, we could store this in a special table for tracking
      } else {
        // For other errors, log the full error
        console.error("Failed to notify user about collaboration creation:", error);
      }
      return false;
    }
    
  } catch (error) {
    console.error("Failed to notify user about collaboration creation:", error);
    return false;
  }
}

export async function notifyAdminsNewCollaboration(collaborationId: string, creatorId: string) {
  try {
    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.is_admin, true));

    if (!adminUsers.length) {
      console.warn("No admin users found to notify about new collaboration");
      return;
    }
    
    // Get collaboration details
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));
      
    if (!collaboration) {
      console.error(`Collaboration with ID ${collaborationId} not found`);
      return;
    }
    
    // Get creator details
    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, creatorId));
      
    if (!creator) {
      console.error(`Creator with ID ${creatorId} not found`);
      return;
    }
    
    // Get creator's company details
    let company = null;
    let companyName = 'Unknown';
    
    try {
      // First try to get company by company_id (if available)
      if (creator.company_id) {
        const companies_result = await db
          .select()
          .from(companies)
          .where(eq(companies.id, creator.company_id));
        
        if (companies_result.length > 0) {
          company = companies_result[0];
          companyName = company.name;
        }
      }
      
      // If company not found by company_id, try to get by user_id
      if (!company) {
        const companies_by_user = await db
          .select()
          .from(companies)
          .where(eq(companies.user_id, creator.id));
        
        if (companies_by_user.length > 0) {
          company = companies_by_user[0];
          companyName = company.name;
        }
      }
      
      // As a last resort, check if the user has a company_name directly
      if (!company && creator.company_name) {
        companyName = creator.company_name;
      }
    } catch (error) {
      console.error(`Error retrieving company details for user ${creator.id}:`, error);
    }
      
    // Format topics as a string if present
    const topicsText = collaboration.topics && collaboration.topics.length > 0 
      ? `\n🏷️ <b>Topics:</b> ${collaboration.topics.join(", ")}` 
      : "";
      
    // Format funding stages as a string if present
    const fundingStagesText = collaboration.required_funding_stages && collaboration.required_funding_stages.length > 0
      ? `\n💰 <b>Required Funding Stages:</b> ${collaboration.required_funding_stages.join(", ")}`
      : "";
    
    // Format blockchain networks as a string if present
    const blockchainNetworksText = collaboration.required_blockchain_networks && collaboration.required_blockchain_networks.length > 0
      ? `\n⛓️ <b>Required Blockchain Networks:</b> ${collaboration.required_blockchain_networks.join(", ")}`
      : "";
    
    // Format company sectors as a string if present
    const companySectorsText = collaboration.required_company_sectors && collaboration.required_company_sectors.length > 0
      ? `\n🏢 <b>Required Company Sectors:</b> ${collaboration.required_company_sectors.join(", ")}`
      : "";
      
    // Build the message with HTML formatting
    // Enhanced with more details about the collaboration
    const message =
      `🆕 <b>New Collaboration Created!</b>\n\n` +
      `<b>Title:</b> ${collaboration.title || "No title"}\n` +
      `<b>Type:</b> ${collaboration.collab_type}\n` +
      `<b>Description:</b> ${collaboration.description || 'Not provided'}\n` +
      `${topicsText}` +
      `${fundingStagesText}` +
      `${blockchainNetworksText}` +
      `${companySectorsText}\n\n` +
      `<b>Created by:</b> ${creator.first_name} ${creator.last_name || ''} ${creator.handle ? `(@${creator.handle})` : ''}\n` +
      `<b>Company:</b> ${companyName}\n\n` +
      `Use the button below to view the collaboration:`;

    // Create inline keyboard with a button to view the collaboration
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "👁️ View Collaboration",
            web_app: { url: `${WEBAPP_URL}/admin/collaborations/${collaborationId}` },
          },
        ],
      ],
    };

    // Send notification to each admin
    for (const admin of adminUsers) {
      try {
        // Make sure we have a valid numeric Telegram ID
        let telegramId: number;
        
        // Try multiple ways to convert the ID to a proper number
        if (typeof admin.telegram_id === 'number') {
          telegramId = admin.telegram_id;
        } else if (typeof admin.telegram_id === 'string') {
          // Remove any non-numeric characters and parse as integer
          const cleanId = admin.telegram_id.replace(/[^0-9]/g, '');
          telegramId = parseInt(cleanId, 10);
        } else {
          console.error(`[COLLAB_NOTIFICATION] Invalid admin Telegram ID format: ${admin.telegram_id}`);
          continue; // Skip this admin
        }
        
        // Double-check that we have a valid number
        if (isNaN(telegramId) || telegramId <= 0) {
          console.error(`[COLLAB_NOTIFICATION] Invalid admin Telegram ID after conversion: ${telegramId}`);
          continue; // Skip this admin
        }
        
        console.log(`[COLLAB_NOTIFICATION] Sending notification to admin Telegram ID: ${telegramId}`);
        
        try {
          await bot.sendMessage(
            telegramId,
            message,
            {
              parse_mode: "HTML",
              disable_web_page_preview: true,
              reply_markup: keyboard,
            },
          );
          
          console.log(`New collaboration notification sent to admin ${admin.telegram_id} (${admin.first_name}, Collaboration: ${collaboration.collab_type}, Company: ${companyName})`);
  
          // Log the admin notification
          logAdminMessage(
            admin.telegram_id,
            "NEW_COLLABORATION",
            `New collaboration created by ${creator.first_name} ${creator.last_name || ""} (ID: ${collaborationId}, Company: ${companyName})`,
            `${creator.first_name} ${creator.last_name || ""} (${creator.telegram_id || 'No Telegram ID'}) - ${collaboration.collab_type}`
          );
        } catch (sendError) {
          // Check specifically for "chat not found" errors which indicate the admin hasn't interacted with the bot
          if (sendError?.response?.body?.description === "Bad Request: chat not found") {
            console.log(`[COLLAB_NOTIFICATION] Admin ${admin.first_name} ${admin.last_name || ""} (ID: ${telegramId}) hasn't interacted with the bot yet`);
          } else {
            // For other errors, log the full error
            console.error(`Failed to send notification to admin ${admin.telegram_id}:`, sendError);
          }
        }
      } catch (error) {
        console.error(
          `Failed to send collaboration notification to admin ${admin.telegram_id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("Failed to notify admins about new collaboration:", error);
  }
}

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
      "• <b>Bold text</b> using &lt;b&gt;text&lt;/b&gt;\n" +
      "• <i>Italic text</i> using &lt;i&gt;text&lt;/i&gt;\n" +
      "• <u>Underlined text</u> using &lt;u&gt;text&lt;/u&gt;\n" +
      "• Links like &lt;a href=\"https://example.com\"&gt;this&lt;/a&gt;\n\n" +
      "<i>IMPORTANT: For HTML tags to work, use the exact format shown above (including quotes around URLs).</i>\n\n" +
      "<i>You can also use these personalization placeholders:</i>\n" +
      "• {first_name} - User's first name\n" + 
      "• {last_name} - User's last name\n" +
      "• {full_name} - User's full name\n" +
      "• {handle} - User's Telegram handle with @ symbol\n" +
      "• {company} - User's company name\n\n" +
      "Example: \"GM {handle}! How's everything at {company}?\"\n\n" +
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
    
    // Use a more efficient batch approach to avoid connection timeouts
    // Instead of using JOIN queries which can timeout, we'll fetch all users
    // and all companies in two separate batched queries, then join them in memory
    console.log("[BROADCAST] Fetching user details with a batched query approach");
    
    // Get all user handles in a single query
    console.log("[BROADCAST] Fetching all user handles in a batch query");
    const userHandlesQuery = await db
      .select({
        id: users.id,
        handle: users.handle
      })
      .from(users);
      
    // Get all company names in a single query  
    console.log("[BROADCAST] Fetching all company names in a batch query");
    const companyNamesQuery = await db
      .select({
        user_id: companies.user_id,
        company_name: companies.name
      })
      .from(companies);
    
    console.log(`[BROADCAST] Successfully fetched ${userHandlesQuery.length} user handles and ${companyNamesQuery.length} company names`);
    
    // Create maps for efficient lookups
    const userHandlesMap = {};
    userHandlesQuery.forEach(user => {
      userHandlesMap[user.id] = user.handle || "";
    });
    
    const companyNamesMap = {};
    companyNamesQuery.forEach(company => {
      companyNamesMap[company.user_id] = company.company_name || "";
    });
      
    // Merge user details with eligible users
    const usersWithDetails = eligibleUsers.map(user => {
      return {
        ...user,
        handle: userHandlesMap[user.id] || "",
        company_name: companyNamesMap[user.id] || ""
      };
    });
    
    console.log(`[BROADCAST] Successfully merged details for ${usersWithDetails.length} users`);
    
    // Send message to each eligible user
    for (const user of usersWithDetails) {
      try {
        if (!user.telegram_id) {
          console.error(`[BROADCAST] User ${user.id} has no Telegram ID`);
          failCount++;
          continue;
        }
        
        // Parse Telegram ID as integer (Telegram API expects numeric IDs)
        const userChatId = parseInt(user.telegram_id);
        
        // Replace placeholders with user-specific data
        let personalizedMessage = message;
        
        // Replace first_name placeholder
        personalizedMessage = personalizedMessage.replace(/\{first_name\}/g, user.first_name || "");
        
        // Replace last_name placeholder
        personalizedMessage = personalizedMessage.replace(/\{last_name\}/g, user.last_name || "");
        
        // Replace full_name placeholder
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        personalizedMessage = personalizedMessage.replace(/\{full_name\}/g, fullName);
        
        // Replace handle placeholder with @ symbol
        const formattedHandle = user.handle ? `@${user.handle.replace(/^@/, '')}` : "";
        personalizedMessage = personalizedMessage.replace(/\{handle\}/g, formattedHandle);
        
        // Replace company placeholder
        personalizedMessage = personalizedMessage.replace(/\{company\}/g, user.company_name || "");
        
        // Format the final message with the header
        const finalPersonalizedMessage = 
          `📣 <b>Admin Announcement</b>\n\n${personalizedMessage}`;
        
        // Log the actual message being sent for debugging purposes
        console.log(`[BROADCAST] Sending message to user ${user.id} with parse_mode HTML: 
Message content: ${finalPersonalizedMessage}`);
        
        // Create inline keyboard with "Launch Collab Room" button
        const launchKeyboard = {
          inline_keyboard: [
            [
              {
                text: "🚀 Launch Collab Room",
                web_app: { url: `${WEBAPP_URL}/discover` }
              }
            ]
          ]
        };
        
        // Send message with HTML formatting and inline keyboard
        await bot.sendMessage(userChatId, finalPersonalizedMessage, {
          parse_mode: "HTML",
          disable_web_page_preview: true, // Disable link previews as requested
          reply_markup: launchKeyboard
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

    if (!user) {
      // User not found in database
      await bot.sendMessage(
        chatId,
        "You haven't submitted an application yet. Please start the bot with /start and apply to join Collab Room."
      );
      return;
    }

    let statusText;
    let keyboard;

    if (user.is_approved) {
      statusText = "✅ Your application has been approved! You have full access to Collab Room.";
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "🚀 Launch Collab Room",
              web_app: { url: `${WEBAPP_URL}/discover` },
            },
          ],
        ],
      };
    } else {
      statusText = "⏳ Your application is currently under review. We will notify you once it's approved.";
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "View Application Status",
              web_app: { url: `${WEBAPP_URL}/application-status` },
            },
          ],
        ],
      };
    }

    await bot.sendMessage(
      chatId,
      statusText,
      keyboard ? { reply_markup: keyboard } : undefined
    );
  } catch (error) {
    console.error("Error in handleStatus:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong. Please try again in a few moments."
    );
  }
}

// Register status command handler
bot.onText(/\/status/, handleStatus);

// Handle callback queries (button clicks)
bot.on("callback_query", async (callbackQuery) => {
  try {
    const action = callbackQuery.data;
    
    if (!action) {
      console.log("Received callback query with no data");
      return;
    }
    
    console.log(`Received callback query with action: ${action}`);
    
    // Handle broadcast confirmation
    if (action === "broadcast_confirm") {
      await handleBroadcastConfirm(callbackQuery);
    }
    // Handle broadcast cancellation
    else if (action === "broadcast_cancel") {
      await handleBroadcastCancel(callbackQuery);
    }
    // Handle user approval
    else if (action.startsWith("approve_user_")) {
      await handleApproveUserCallback(callbackQuery);
    }
    // Handle swipe actions (supports both old format "swipe_" and new shortened format "sr_"/"sl_")
    else if (action.startsWith("swipe_") || action.startsWith("sr_") || action.startsWith("sl_")) {
      await handleSwipeCallback(callbackQuery);
    }
    // Handle match actions
    else if (action.startsWith("match_info_")) {
      await handleMatchInfoCallback(callbackQuery);
    }
    // Handle copy referral code actions
    else if (action.startsWith("copy_referral_code_")) {
      // Extract the referral code from the callback data
      const referralCode = action.substring("copy_referral_code_".length);
      
      // Answer the callback query with the code in a way that the user can easily copy it
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `Your code: ${referralCode}\n\nIt has been copied to the clipboard!`,
        show_alert: true
      });
      
      // Log the copy event
      console.log(`User ${callbackQuery.from.id} copied referral code ${referralCode}`);
    }
    // Unknown action
    else {
      console.log(`Unknown callback action: ${action}`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Unknown action",
      });
    }
  } catch (error) {
    console.error("Error handling callback query:", error);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Sorry, something went wrong. Please try again.",
      });
    } catch (err) {
      console.error("Error sending callback answer:", err);
    }
  }
});

async function handleBroadcastConfirm(callbackQuery: TelegramBot.CallbackQuery) {
  if (!callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    console.log("Missing required callback data for broadcast");
    return;
  }
  
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  
  // Check broadcast state
  const state = adminBroadcastState.get(telegramId);
  
  if (!state || state.state !== "awaiting_confirmation" || !state.message) {
    console.log(`Invalid broadcast state for user ${telegramId}`);
    await bot.sendMessage(
      chatId,
      "❌ <b>Error</b>\n\nBroadcast session expired or invalid. Please start again with /broadcast.",
      { parse_mode: "HTML" }
    );
    adminBroadcastState.delete(telegramId);
    return;
  }
  
  try {
    // Answer the callback to show processing
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Your broadcast is being processed...",
    });
    
    // Update original message to show confirmation
    await bot.editMessageText(
      "📤 <b>Broadcast confirmed</b>\n\nYour message is being sent to all users with notifications enabled. Please wait...",
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      }
    );
    
    // Process the broadcast
    await broadcastMessageToUsers(state.message, telegramId, chatId);
    
  } catch (error) {
    console.error("Error processing broadcast confirmation:", error);
    adminBroadcastState.delete(telegramId);
    
    await bot.sendMessage(
      chatId,
      "❌ <b>Error</b>\n\nThere was an error processing your broadcast. Please try again with /broadcast.",
      { parse_mode: "HTML" }
    );
  }
}

async function handleBroadcastCancel(callbackQuery: TelegramBot.CallbackQuery) {
  if (!callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    console.log("Missing required callback data for broadcast cancel");
    return;
  }
  
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  
  try {
    // Answer the callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Broadcast cancelled",
    });
    
    // Remove from broadcast state
    adminBroadcastState.delete(telegramId);
    
    // Update the message
    await bot.editMessageText(
      "✅ <b>Broadcast cancelled</b>\n\nYour message will not be sent. Use /broadcast to start again if needed.",
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      }
    );
    
    // Log the cancellation
    logAdminMessage(
      telegramId,
      "BROADCAST_CANCELLED",
      "Admin cancelled broadcast at confirmation step"
    );
  } catch (error) {
    console.error("Error cancelling broadcast:", error);
    
    await bot.sendMessage(
      chatId,
      "❌ <b>Error</b>\n\nThere was an error cancelling your broadcast, but the broadcast has been stopped.",
      { parse_mode: "HTML" }
    );
  }
}

async function handleApproveUserCallback(
  callbackQuery: TelegramBot.CallbackQuery
) {
  try {
    if (!callbackQuery.data) {
      return;
    }

    // Extract the Telegram ID to approve from the callback data
    // Format: approve_user_<telegram_id>
    const telegramIdToApprove = callbackQuery.data.split("_")[2];
    const adminTelegramId = callbackQuery.from.id.toString();
    const chatId = callbackQuery.message?.chat.id;

    if (!telegramIdToApprove || !chatId) {
      console.error("Missing required data for user approval");
      return;
    }

    console.log(
      `[APPROVAL] Admin ${adminTelegramId} is approving user ${telegramIdToApprove}`
    );

    // Find the user to approve by Telegram ID
    const [userToApprove] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, telegramIdToApprove));

    if (!userToApprove) {
      console.error(`[APPROVAL] User with Telegram ID ${telegramIdToApprove} not found`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "User not found in database.",
        show_alert: true,
      });
      return;
    }

    // Check if user is already approved
    if (userToApprove.is_approved) {
      console.log(`[APPROVAL] User ${telegramIdToApprove} is already approved`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "This user is already approved.",
        show_alert: true,
      });

      // Update the button text to show it's already approved
      if (callbackQuery.message) {
        // Get the current inline keyboard
        const currentKeyboard = callbackQuery.message.reply_markup?.inline_keyboard;

        if (currentKeyboard) {
          // Update the first button (the approval button)
          currentKeyboard[0][0] = {
            text: "✅ Already Approved",
            callback_data: "already_approved", // Dummy callback, won't do anything
          };

          // Update the message with the new keyboard
          await bot.editMessageReplyMarkup(
            { inline_keyboard: currentKeyboard },
            {
              chat_id: chatId,
              message_id: callbackQuery.message.message_id,
            }
          );
        }
      }
      return;
    }

    // Confirm the approval
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Approving user...",
    });

    // Update the user in the database
    await db
      .update(users)
      .set({
        is_approved: true,
        approved_at: new Date(),
        approved_by: adminTelegramId,
      })
      .where(eq(users.telegram_id, telegramIdToApprove));

    console.log(`[APPROVAL] User ${telegramIdToApprove} has been approved`);
    
    // Log the approval action
    logAdminMessage(
      adminTelegramId,
      "USER_APPROVAL",
      `Admin approved user ${userToApprove.first_name} ${userToApprove.last_name || ""} (${telegramIdToApprove})`,
      `${userToApprove.first_name} ${userToApprove.last_name || ""} (${telegramIdToApprove})`
    );

    // Send notification to the approved user
    await notifyUserApproved(parseInt(telegramIdToApprove));

    // Check if this user was referred by someone and notify the referrer
    if (userToApprove.referred_by) {
      try {
        console.log(`[REFERRAL] User ${telegramIdToApprove} was referred by ${userToApprove.referred_by}, sending notification`);
        console.log(`[REFERRAL] User's referred_by field: ${userToApprove.referred_by}, typeof=${typeof userToApprove.referred_by}`);
        console.log(`[REFERRAL] User's ID field: ${userToApprove.id}, typeof=${typeof userToApprove.id}`);
        
        // Log more information about the referrer to help debug the notification issues
        try {
          const [referrerUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, userToApprove.referred_by));
            
          if (referrerUser) {
            console.log(`[REFERRAL] Found referrer user: ID=${referrerUser.id}, Name=${referrerUser.first_name}, TelegramID=${referrerUser.telegram_id}`);
          } else {
            console.log(`[REFERRAL] Could not find referrer with user ID ${userToApprove.referred_by}`);
            
            // Try to find referrer by Telegram ID if the ID lookup fails
            const [referrerByTelegramId] = await db
              .select()
              .from(users)
              .where(eq(users.telegram_id, userToApprove.referred_by));
              
            if (referrerByTelegramId) {
              console.log(`[REFERRAL] Found referrer by Telegram ID: ${referrerByTelegramId.id}`);
            } else {
              console.log(`[REFERRAL] Could not find referrer by Telegram ID either: ${userToApprove.referred_by}`);
            }
          }
        } catch (lookupError) {
          console.error(`[REFERRAL] Error looking up referrer details: ${lookupError}`);
        }
        
        // Create or update a referral event record
        try {
          // Check if a referral event already exists
          const [existingEvent] = await db
            .select()
            .from(referral_events)
            .where(and(
              eq(referral_events.referrer_id, userToApprove.referred_by),
              eq(referral_events.referred_user_id, userToApprove.id)
            ));
            
          if (existingEvent) {
            // Update existing referral event
            await db
              .update(referral_events)
              .set({
                status: 'completed',
                completed_at: new Date()
              })
              .where(eq(referral_events.id, existingEvent.id));
            
            console.log(`[REFERRAL] Updated existing referral event ${existingEvent.id} to completed status`);
          } else {
            // Create new referral event
            const [newEvent] = await db
              .insert(referral_events)
              .values({
                referrer_id: userToApprove.referred_by,
                referred_user_id: userToApprove.id,
                status: 'completed',
                created_at: new Date(),
                completed_at: new Date()
              })
              .returning();
              
            console.log(`[REFERRAL] Created new referral event ${newEvent.id} with completed status`);
          }
        } catch (eventError) {
          console.error(`[REFERRAL] Error updating referral event: ${eventError}`);
          // Continue with notification process even if event creation fails
        }
        
        // Send notification to referrer
        await notifyReferrerAboutApproval(userToApprove.referred_by, userToApprove.first_name);
      } catch (referralError) {
        console.error(`Error notifying referrer: ${referralError}`);
        // Continue with approval process even if referrer notification fails
      }
    }

    // Update the original message to show the user has been approved
    if (callbackQuery.message) {
      // Get the current inline keyboard
      const currentKeyboard = callbackQuery.message.reply_markup?.inline_keyboard;

      if (currentKeyboard) {
        // Update the first button (the approval button)
        currentKeyboard[0][0] = {
          text: "✅ User Approved",
          callback_data: "already_approved", // Dummy callback, won't do anything
        };

        // Update the message with the new keyboard
        await bot.editMessageReplyMarkup(
          { inline_keyboard: currentKeyboard },
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
          }
        );
      }
    }
  } catch (error) {
    console.error("Error handling user approval:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "An error occurred while approving the user. Please try again.",
      show_alert: true,
    });
  }
}

async function handleMatchInfoCallback(
  callbackQuery: TelegramBot.CallbackQuery
) {
  try {
    if (!callbackQuery.data) {
      return;
    }

    // Extract match ID from the callback data
    // Format: match_info_<match_id>
    const matchId = callbackQuery.data.split("_")[2];
    const chatId = callbackQuery.message?.chat.id;

    if (!matchId || !chatId) {
      console.error("Missing required data for match info");
      return;
    }

    console.log(`[MATCH_INFO] Fetching info for match ${matchId}`);

    // Find the match by ID
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));

    if (!match) {
      console.error(`[MATCH_INFO] Match with ID ${matchId} not found`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Match not found in database.",
        show_alert: true,
      });
      return;
    }

    // Get collaboration details
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, match.collaboration_id));

    if (!collaboration) {
      console.error(`[MATCH_INFO] Collaboration with ID ${match.collaboration_id} not found`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Collaboration details not found.",
        show_alert: true,
      });
      return;
    }

    // Get requester user details
    const [requester] = await db
      .select()
      .from(users)
      .where(eq(users.id, match.requester_id));

    // Get host user details
    const [host] = await db
      .select()
      .from(users)
      .where(eq(users.id, match.host_id));

    if (!requester || !host) {
      console.error(`[MATCH_INFO] User details not found for match ${matchId}`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "User details not found.",
        show_alert: true,
      });
      return;
    }

    // Build a detailed message with match information
    const matchInfo = 
      `<b>📋 Match Details</b>\n\n` +
      `<b>Match Type:</b> ${collaboration.collab_type}\n` +
      `<b>Created:</b> ${format(match.created_at || new Date(), "MMM d, yyyy")}\n\n` +
      `<b>👤 Host:</b> ${host.first_name} ${host.last_name || ''} ${host.handle ? `(@${host.handle})` : ''}\n` +
      `<b>👤 Requester:</b> ${requester.first_name} ${requester.last_name || ''} ${requester.handle ? `(@${requester.handle})` : ''}\n\n` +
      `<b>Status:</b> ${match.status.charAt(0).toUpperCase() + match.status.slice(1)}\n\n` +
      `Click below to view full details:`;

    // Create inline keyboard with button to view match
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🔍 View Full Details",
            web_app: { url: `${WEBAPP_URL}/matches/${matchId}` },
          },
        ],
      ],
    };

    // Answer the callback query first
    await bot.answerCallbackQuery(callbackQuery.id);

    // Send match information as a new message
    await bot.sendMessage(chatId, matchInfo, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error("Error handling match info:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "An error occurred while retrieving match information.",
      show_alert: true,
    });
  }
}

/**
 * Send a match notification to both users when a match occurs
 * @param hostUserId ID of the host user (collaboration creator)
 * @param requesterUserId ID of the user who swiped right
 * @param collaborationId ID of the collaboration that was matched
 */
/**
 * DIRECT MESSAGE - Send a notification directly to a Telegram chat
 * This function is used to bypass any caching issues with the standard notification system
 */
async function sendDirectFormattedMessage(
  chatId: number,
  text: string,
  options?: TelegramBot.SendMessageOptions
) {
  try {
    console.log(`[TELEGRAM] Attempting to send message to chat ID: ${chatId}`);
    console.log(`[TELEGRAM] Message preview: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    console.log(`[TELEGRAM] Message options:`, JSON.stringify(options || {}));
    
    const result = await bot.sendMessage(chatId, text, options);
    console.log(`[TELEGRAM] Successfully sent formatted message to ${chatId}, message ID: ${result.message_id}`);
    return true;
  } catch (error) {
    console.error(`[TELEGRAM] Failed to send message to ${chatId}:`, error);
    // More detailed error logging for troubleshooting
    if (error instanceof Error) {
      console.error(`[TELEGRAM] Error name: ${error.name}, message: ${error.message}`);
      console.error(`[TELEGRAM] Error stack: ${error.stack}`);
    }
    return false;
  }
}

/**
 * Callback handler for swipe actions from Telegram notifications
 */
async function handleSwipeCallback(callbackQuery: TelegramBot.CallbackQuery) {
  try {
    if (!callbackQuery.data) {
      return;
    }

    // Extract the action and data from the callback
    // Two possible formats:
    // 1. Legacy format: swipe_<direction>_<collabID>_<userID>
    // 2. New shortened format: s<direction-initial>_<short-collabID>_<short-userID>
    const parts = callbackQuery.data.split("_");
    
    let direction: string;
    let collaborationId: string;
    let requesterId: string;
    
    // Handle shortened format (sr_ or sl_)
    if (callbackQuery.data.startsWith("sr_") || callbackQuery.data.startsWith("sl_")) {
      direction = callbackQuery.data.startsWith("sr_") ? "right" : "left";
      const shortCollabId = parts[1];
      const shortRequesterId = parts[2];
      
      console.log(`[SWIPE_CALLBACK] Processing shortened callback: direction=${direction}, shortCollabId=${shortCollabId}, shortRequesterId=${shortRequesterId}`);
      
      // Find the full collaboration ID using the shortened version
      const [collaboration] = await db
        .select()
        .from(collaborations)
        .where(sql`SUBSTRING(CAST(${collaborations.id} as TEXT), 1, 8) = ${shortCollabId}`);
      
      if (!collaboration) {
        console.error(`[SWIPE_CALLBACK] Collaboration with short ID ${shortCollabId} not found`);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Collaboration not found.",
          show_alert: true
        });
        return;
      }
      
      // Find the full requester ID using the shortened version
      const [requester] = await db
        .select()
        .from(users)
        .where(sql`SUBSTRING(CAST(${users.id} as TEXT), 1, 8) = ${shortRequesterId}`);
        
      if (!requester) {
        console.error(`[SWIPE_CALLBACK] Requester with short ID ${shortRequesterId} not found`);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Requester not found.",
          show_alert: true
        });
        return;
      }
      
      // Use the full IDs
      collaborationId = collaboration.id;
      requesterId = requester.id;
      
      console.log(`[SWIPE_CALLBACK] Resolved to full IDs: collaborationId=${collaborationId}, requesterId=${requesterId}`);
    } 
    // Handle legacy format
    else {
      direction = parts[1]; // "right" or "left"
      collaborationId = parts[2];
      requesterId = parts[3];
    }
    const chatId = callbackQuery.message?.chat.id;
    const fromTelegramId = callbackQuery.from.id.toString();

    if (!direction || !collaborationId || !requesterId || !chatId) {
      console.error("Missing required data for swipe action");
      return;
    }

    console.log(
      `[SWIPE_ACTION] User ${fromTelegramId} swiped ${direction} on collab ${collaborationId} for user ${requesterId}`
    );

    // Get the user from the Telegram ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, fromTelegramId));

    if (!user) {
      console.error(`[SWIPE_ACTION] User with Telegram ID ${fromTelegramId} not found`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "User not found. Please try again.",
        show_alert: true,
      });
      return;
    }

    // Get the collaboration
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));

    if (!collaboration) {
      console.error(`[SWIPE_ACTION] Collaboration with ID ${collaborationId} not found`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Collaboration not found. It may have been deleted.",
        show_alert: true,
      });
      return;
    }

    // Get the requester user
    const [requester] = await db
      .select()
      .from(users)
      .where(eq(users.id, requesterId));

    if (!requester) {
      console.error(`[SWIPE_ACTION] Requester with ID ${requesterId} not found`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Requester not found. They may have been removed.",
        show_alert: true,
      });
      return;
    }

    // Check if this is a valid swipe (user owns the collaboration)
    // Note: Collaboration creator is in creator_id field, not user_id
    if (collaboration.creator_id !== user.id) {
      console.error(
        `[SWIPE_ACTION] User ${user.id} does not own collaboration ${collaborationId}, creator is ${collaboration.creator_id}`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "You can only respond to requests for your own collaborations.",
        show_alert: true,
      });
      return;
    }

    // Check if swipe already exists (to prevent duplicates)
    const existingSwipes = await db
      .select()
      .from(swipes)
      .where(
        sql`${swipes.collaboration_id} = ${collaborationId} AND ${swipes.user_id} = ${requesterId}`
      );

    if (!existingSwipes || existingSwipes.length === 0) {
      console.error(
        `[SWIPE_ACTION] No existing swipe found for collab ${collaborationId} and user ${requesterId}`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Original request not found. It may have been removed.",
        show_alert: true,
      });
      return;
    }

    // Check if there's already a match
    const existingMatches = await db
      .select()
      .from(matches)
      .where(
        sql`${matches.collaboration_id} = ${collaborationId} AND ${matches.requester_id} = ${requesterId}`
      );

    if (existingMatches && existingMatches.length > 0) {
      console.log(
        `[SWIPE_ACTION] Match already exists for collab ${collaborationId} and user ${requesterId}`
      );
      
      // Update the original message to show match already exists with enhanced format
      if (callbackQuery.message) {
        await bot.editMessageText(
          `✅ You've already matched with ${requester.first_name} ${requester.last_name || ''}${requester.handle ? ` (@${requester.handle})` : ''} on this collaboration.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎉 View Matches",
                    web_app: { url: `${WEBAPP_URL}/matches` },
                  },
                ],
              ],
            },
            parse_mode: "HTML",
            disable_web_page_preview: true
          }
        );
      }
      
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "You've already matched with this user.",
      });
      
      return;
    }

    // If swiping right, create a match
    if (direction === "right") {
      // Create a match record
      const [match] = await db
        .insert(matches)
        .values({
          id: crypto.randomUUID(),
          collaboration_id: collaborationId,
          host_id: user.id,
          requester_id: requesterId,
          created_at: new Date(),
          status: "active",
        })
        .returning();

      console.log(
        `[SWIPE_ACTION] Created match ${match.id} for collab ${collaborationId} and user ${requesterId}`
      );

      // Send notification to the requester about the match
      if (requester.telegram_id) {
        const requesterChatId = parseInt(requester.telegram_id);
        
        // Get company details for the host user
        const [hostCompany] = await db
          .select()
          .from(companies)
          .where(eq(companies.user_id, user.id))
          .limit(1);
          
        // Create company URL with preference for Twitter
        const hostCompanyUrl = hostCompany?.twitter_handle 
          ? `https://twitter.com/${hostCompany.twitter_handle}` 
          : (hostCompany?.website || '#');
          
        // Create custom keyboard for the matched user to view their matches
        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "🎉 View Matches",
                web_app: { url: `${WEBAPP_URL}/matches` },
              },
            ],
          ],
        };

        await sendDirectFormattedMessage(
          requesterChatId,
          `🎉 <b>New Match!</b>\n\n` +
          `<b>${user.first_name} ${user.last_name || ""}</b>${user.handle ? ` (@${user.handle})` : ''} from ` +
          `<a href="${hostCompanyUrl}">${hostCompany?.name || "their company"}</a> ` +
          `has matched with you on a <b>${collaboration.collab_type}</b> collaboration!\n\n` +
          `Click below to view your matches and start chatting:`,
          {
            parse_mode: "HTML",
            reply_markup: keyboard,
            disable_web_page_preview: true
          }
        );
      }

      // Get requester's company details to include in match notification
      const [requesterCompany] = await db
        .select()
        .from(companies)
        .where(eq(companies.user_id, requesterId))
        .limit(1);

      // Update the original message with more details about the match
      if (callbackQuery.message) {
        await bot.editMessageText(
          `✅ You matched with ${requester.first_name} ${requester.last_name || ''}${requester.handle ? ` (@${requester.handle})` : ''} from ${requesterCompany?.name || "their company"}!`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎉 View Matches",
                    web_app: { url: `${WEBAPP_URL}/matches` },
                  },
                ],
              ],
            },
            parse_mode: "HTML",
            disable_web_page_preview: true
          }
        );
      }

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `You matched with ${requester.first_name}! They've been notified.`,
      });
    } 
    // If swiping left, just update the UI
    else if (direction === "left") {
      console.log(
        `[SWIPE_ACTION] User ${user.id} swiped left on request from ${requesterId} for collab ${collaborationId}`
      );

      // Update the original message
      if (callbackQuery.message) {
        await bot.editMessageText(
          `❌ You declined the collaboration request from ${requester.first_name} ${requester.last_name || ''}.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
          }
        );
      }

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `You declined the request from ${requester.first_name}.`,
      });
    }
  } catch (error) {
    console.error("Error handling swipe action:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "An error occurred while processing your response. Please try again.",
      show_alert: true,
    });
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
  collaborationId: string
) {
  try {
    // Get host user details
    const [host] = await db
      .select()
      .from(users)
      .where(eq(users.id, hostUserId));

    if (!host || !host.telegram_id) {
      console.error(`Host user ${hostUserId} not found or has no Telegram ID`);
      return false;
    }

    // Get requester user details
    const [requester] = await db
      .select()
      .from(users)
      .where(eq(users.id, requesterUserId));

    if (!requester) {
      console.error(`Requester user ${requesterUserId} not found`);
      return false;
    }

    // Get collaboration details
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));

    if (!collaboration) {
      console.error(`Collaboration ${collaborationId} not found`);
      return false;
    }

    // Check if the host's notifications are enabled
    const [preferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, hostUserId));

    if (preferences && preferences.notifications_enabled === false) {
      console.log(`Host ${hostUserId} has notifications disabled`);
      return false;
    }

    // Create inline keyboard with swipe options
    // Use shortened versions of UUIDs to respect Telegram's callback_data length limit (64 bytes)
    const shortCollabId = collaborationId.substring(0, 8);
    const shortRequesterId = requesterUserId.substring(0, 8);
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "❌ Pass",
            callback_data: `sl_${shortCollabId}_${shortRequesterId}`,
          },
          {
            text: "✅ Match",
            callback_data: `sr_${shortCollabId}_${shortRequesterId}`,
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

    // Get the requester's company data for the notification
    const [requesterCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, requesterUserId));
      
    // Get swipe details (if user added a note)
    const [swipe] = await db
      .select()
      .from(swipes)
      .where(
        and(
          eq(swipes.user_id, requesterUserId),
          eq(swipes.collaboration_id, collaborationId),
          eq(swipes.direction, 'right')
        )
      )
      .orderBy(sql`${swipes.created_at} DESC`)
      .limit(1);

    // Format the message with user and collaboration details in the enhanced format
    
    // Handle note if present
    let noteSection = "";
    if (swipe && swipe.note) {
      noteSection = `\n📝 <b>Note:</b> ${swipe.note}\n`;
    }
    
    // Handle Twitter, LinkedIn, and Website links
    // For Twitter, get from company's twitter_handle if available, fallback to user's handle
    const companyTwitterHandle = requesterCompany?.twitter_handle ? requesterCompany.twitter_handle.replace('@', '') : '';
    const userTwitterHandle = requester.twitter_handle ? requester.twitter_handle.replace('@', '') : '';
    const twitterHandle = companyTwitterHandle || userTwitterHandle;
    
    const twitterLink = twitterHandle ? 
      `<a href="https://twitter.com/${twitterHandle}">Twitter</a>` : 
      "Twitter";
    
    const linkedinLink = requesterCompany?.linkedin_url ? 
      `<a href="${requesterCompany.linkedin_url}">LinkedIn</a>` : 
      "LinkedIn";
    
    const websiteLink = requesterCompany?.website ? 
      `<a href="${requesterCompany.website}">Website</a>` : 
      "Website";
    
    // Host handle (if available) - make sure to display properly
    const hostHandle = host.handle || host.first_name;
    
    const message = 
      `🔥 ${host.handle ? `@${host.handle}` : host.first_name} - <b>New Collab Request from ${requesterCompany?.name || requester.first_name + "'s company"}</b>` +
      
      // Include note if available
      `${noteSection}` +
      
      // Company information section
      `\n\n💼 <a href="${requesterCompany?.website || requester.website || "#"}">${requesterCompany?.name || requester.first_name + "'s company"}</a>` +
      `\n❓ <i>${requesterCompany?.short_description || "Web3 company focusing on blockchain solutions"}</i>` +
      `\n🔗 ${twitterLink} | ${linkedinLink} | ${websiteLink}` +
      `\n👤 ${requesterCompany?.role_title || requester.job_title || "Unknown Role"}` +
      
      // Collaboration details
      `\n\n🤝 <b>Your Collab:</b> ${collaboration.collab_type}` +
      `\n✏️ ${collaboration.description ? collaboration.description : "diving deep into other projects"}` +
      `\n${collaboration.topics?.length ? "🏷️ " + collaboration.topics.join(", ") : ""}`;

    // Send notification to host with link preview disabled
    await sendDirectFormattedMessage(parseInt(host.telegram_id), message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
      disable_web_page_preview: true
    });

    console.log(`Sent collaboration request notification to host ${hostUserId}`);
    return true;
  } catch (error) {
    console.error("Error sending collaboration request notification:", error);
    return false;
  }
}

export async function notifyMatchCreated(
  hostUserId: string,
  requesterUserId: string,
  collaborationId: string,
  matchId: string
) {
  try {
    // Get host user details
    const [host] = await db
      .select()
      .from(users)
      .where(eq(users.id, hostUserId));

    if (!host || !host.telegram_id) {
      console.error(`Host user ${hostUserId} not found or has no Telegram ID`);
      return false;
    }

    // Get requester user details
    const [requester] = await db
      .select()
      .from(users)
      .where(eq(users.id, requesterUserId));

    if (!requester || !requester.telegram_id) {
      console.error(`Requester user ${requesterUserId} not found or has no Telegram ID`);
      return false;
    }

    // Get collaboration details
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));

    if (!collaboration) {
      console.error(`Collaboration ${collaborationId} not found`);
      return false;
    }

    // Check notification preferences for both users
    const [hostPreferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, hostUserId));

    const [requesterPreferences] = await db
      .select()
      .from(notification_preferences)
      .where(eq(notification_preferences.user_id, requesterUserId));

    // Create keyboard for viewing all matches (redirects to matches page instead of individual match)
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🎉 View Matches",
            web_app: { url: `${WEBAPP_URL}/matches` },
          },
        ],
      ],
    };

    // Get company details for each user
    const [hostCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, hostUserId))
      .limit(1);

    const [requesterCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, requesterUserId))
      .limit(1);

    // Generate Twitter links if handles are available
    const hostTwitterLink = hostCompany?.twitter_handle 
      ? `<a href="https://twitter.com/${hostCompany.twitter_handle}">@${hostCompany.twitter_handle}</a>` 
      : "Twitter";
    
    const requesterTwitterLink = requesterCompany?.twitter_handle 
      ? `<a href="https://twitter.com/${requesterCompany.twitter_handle}">@${requesterCompany.twitter_handle}</a>` 
      : "Twitter";

    // Format the message with enhanced details
    // Company URLs with preference for Twitter if available (as requested)
    const requesterCompanyUrl = requesterCompany?.twitter_handle 
      ? `https://twitter.com/${requesterCompany.twitter_handle}` 
      : (requesterCompany?.website || '#');
    
    const hostCompanyUrl = hostCompany?.twitter_handle 
      ? `https://twitter.com/${hostCompany.twitter_handle}` 
      : (hostCompany?.website || '#');
      
    const matchMessage = 
      `🎉 <b>New Match!</b>\n\n` +
      `You've matched with <b>${requester.first_name} ${requester.last_name || ""}</b>${requester.handle ? ` (@${requester.handle})` : ''} from ` +
      `<a href="${requesterCompanyUrl}">${requesterCompany?.name || "their company"}</a> ` +
      `on your <b>${collaboration.collab_type}</b> collaboration!\n\n` +
      `Click below to view your matches and start chatting:`;

    const requesterMessage = 
      `🎉 <b>New Match!</b>\n\n` +
      `<b>${host.first_name} ${host.last_name || ""}</b>${host.handle ? ` (@${host.handle})` : ''} from ` +
      `<a href="${hostCompanyUrl}">${hostCompany?.name || "their company"}</a> ` +
      `has matched with you on a <b>${collaboration.collab_type}</b> collaboration!\n\n` +
      `Click below to view your matches and start chatting:`;

    // Send match notifications if enabled
    let hostNotified = false;
    let requesterNotified = false;

    // Notify host if their notifications are enabled
    if (!hostPreferences || hostPreferences.notifications_enabled !== false) {
      await sendDirectFormattedMessage(parseInt(host.telegram_id), matchMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard,
        disable_web_page_preview: true
      });
      hostNotified = true;
    }

    // Notify requester if their notifications are enabled
    if (!requesterPreferences || requesterPreferences.notifications_enabled !== false) {
      await sendDirectFormattedMessage(parseInt(requester.telegram_id), requesterMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard,
        disable_web_page_preview: true
      });
      requesterNotified = true;
    }

    console.log(`Match notifications sent - Host: ${hostNotified}, Requester: ${requesterNotified}`);
    return true;
  } catch (error) {
    console.error("Error sending match notifications:", error);
    return false;
  }
}

// Set up bot commands when module loads
setupBotCommands()
  .then(success => {
    if (success) {
      console.log("Bot commands set up successfully");
    } else {
      console.error("Failed to set up bot commands");
    }
  })
  .catch(error => {
    console.error("Error setting up bot commands:", error);
  });
