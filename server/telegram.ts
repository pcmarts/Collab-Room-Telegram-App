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
import { eq, sql, inArray } from "drizzle-orm";
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
        // Create a chat scope for this specific admin user
        const adminScope = {
          type: 'chat',
          chat_id: parseInt(admin.telegram_id)
        };
        
        // Set admin-specific commands
        await bot.setMyCommands(adminCommands, { scope: adminScope });
        console.log(`[BOT_SETUP] Set admin commands for ${admin.first_name} (${admin.telegram_id})`);
      } catch (error) {
        console.error(`[BOT_SETUP] Failed to set commands for admin ${admin.telegram_id}:`, error);
      }
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
    if (referralParam && referralParam.startsWith('r_')) {
      referralCode = referralParam.substring(2); // Remove 'r_' prefix
      console.log(`[REFERRAL] Found referral code: ${referralCode}`);
      
      // Look up the referrer by referral code
      // Parse the telegram_id from the referral code (format: telegram_id_random_string)
      // Ensure referralCode contains at least one underscore
      if (referralCode && referralCode.includes('_')) {
        const telegramIdFromCode = referralCode.split('_')[1];
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
        const result = await bot.sendMessage(
          parseInt(admin.telegram_id),
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
 * Notify all admins when a new collaboration is created
 * @param collaborationId The ID of the newly created collaboration
 * @param creatorId The ID of the user who created the collaboration
 */
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
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, creator.company_id || ''));
      
    // Build the message with HTML formatting
    // Make sure to include the collaboration type, description, and creator details
    const message =
      `🆕 <b>New Collaboration Created!</b>\n\n` +
      `<b>Type:</b> ${collaboration.collab_type}\n` +
      `<b>Description:</b> ${collaboration.description || 'Not provided'}\n\n` +
      `<b>Created by:</b> ${creator.first_name} ${creator.last_name || ''} ${creator.handle ? `(@${creator.handle})` : ''}\n` +
      `<b>Company:</b> ${company?.name || 'Unknown'}\n\n` +
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
        await bot.sendMessage(
          parseInt(admin.telegram_id),
          message,
          {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: keyboard,
          },
        );
        console.log(`New collaboration notification sent to admin ${admin.telegram_id}`);

        // Log the admin notification
        logAdminMessage(
          admin.telegram_id,
          "NEW_COLLABORATION",
          `New collaboration created by ${creator.first_name} ${creator.last_name || ""} (ID: ${collaborationId})`,
          `${creator.first_name} ${creator.last_name || ""} (${creator.telegram_id || 'No Telegram ID'})`
        );
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
    // Handle swipe actions
    else if (action.startsWith("swipe_")) {
      await handleSwipeCallback(callbackQuery);
    }
    // Handle match actions
    else if (action.startsWith("match_info_")) {
      await handleMatchInfoCallback(callbackQuery);
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
    await bot.sendMessage(chatId, text, options);
    console.log(`Successfully sent formatted message to ${chatId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send message to ${chatId}:`, error);
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
    // Format: swipe_<direction>_<collabID>_<userID>
    const parts = callbackQuery.data.split("_");
    const direction = parts[1]; // "right" or "left"
    const collaborationId = parts[2];
    const requesterId = parts[3];
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
    if (collaboration.user_id !== user.id) {
      console.error(
        `[SWIPE_ACTION] User ${user.id} does not own collaboration ${collaborationId}`
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
      
      // Update the original message to show match already exists
      if (callbackQuery.message) {
        await bot.editMessageText(
          `✅ You've already matched with ${requester.first_name} ${requester.last_name || ''} on this collaboration.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "View Match Details",
                    callback_data: `match_info_${existingMatches[0].id}`,
                  },
                ],
              ],
            },
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
        
        // Create custom keyboard for the matched user to view the match
        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "🎉 View Match Details",
                web_app: { url: `${WEBAPP_URL}/matches/${match.id}` },
              },
            ],
          ],
        };

        await sendDirectFormattedMessage(
          requesterChatId,
          `🎉 <b>Match Alert!</b>\n\n` +
          `${user.first_name} ${user.last_name || ''} just matched with you on a ${collaboration.collab_type} collaboration!\n\n` +
          `Click below to view the match details and start chatting:`,
          {
            parse_mode: "HTML",
            reply_markup: keyboard,
          }
        );
      }

      // Update the original message
      if (callbackQuery.message) {
        await bot.editMessageText(
          `✅ You matched with ${requester.first_name} ${requester.last_name || ''}!`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "View Match Details",
                    callback_data: `match_info_${match.id}`,
                  },
                ],
              ],
            },
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
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Yes, Let's Collab!",
            callback_data: `swipe_right_${collaborationId}_${requesterUserId}`,
          },
          {
            text: "❌ Not Interested",
            callback_data: `swipe_left_${collaborationId}_${requesterUserId}`,
          },
        ],
        [
          {
            text: "👀 View Profile",
            web_app: { url: `${WEBAPP_URL}/profile/${requesterUserId}` },
          },
        ],
      ],
    };

    // Format the message with user and collaboration details
    const message = 
      `🔔 <b>New Collaboration Request!</b>\n\n` +
      `<b>${requester.first_name} ${requester.last_name || ""}</b> is interested in your <b>${collaboration.collab_type}</b> collaboration.\n\n` +
      `Would you like to connect with them?`;

    // Send notification to host
    await sendDirectFormattedMessage(parseInt(host.telegram_id), message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
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

    // Create keyboard for viewing match details
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "🎉 View Match Details",
            web_app: { url: `${WEBAPP_URL}/matches/${matchId}` },
          },
        ],
      ],
    };

    // Format the message
    const matchMessage = 
      `🎉 <b>New Match!</b>\n\n` +
      `You've matched with <b>${requester.first_name} ${requester.last_name || ""}</b> on your <b>${collaboration.collab_type}</b> collaboration!\n\n` +
      `Click below to view the match details and start chatting:`;

    const requesterMessage = 
      `🎉 <b>New Match!</b>\n\n` +
      `<b>${host.first_name} ${host.last_name || ""}</b> has matched with you on a <b>${collaboration.collab_type}</b> collaboration!\n\n` +
      `Click below to view the match details and start chatting:`;

    // Send match notifications if enabled
    let hostNotified = false;
    let requesterNotified = false;

    // Notify host if their notifications are enabled
    if (!hostPreferences || hostPreferences.notifications_enabled !== false) {
      await sendDirectFormattedMessage(parseInt(host.telegram_id), matchMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
      hostNotified = true;
    }

    // Notify requester if their notifications are enabled
    if (!requesterPreferences || requesterPreferences.notifications_enabled !== false) {
      await sendDirectFormattedMessage(parseInt(requester.telegram_id), requesterMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard,
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
