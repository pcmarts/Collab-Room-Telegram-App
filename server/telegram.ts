import TelegramBot from "node-telegram-bot-api";
import { db } from "./db";
import { users, collaborations, companies } from "@shared/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

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

// Get the webapp URL from environment
const domain = process.env.REPLIT_DOMAINS.split(",")[0];
const WEBAPP_URL = `https://${domain}`;

console.log("=== Telegram Bot Configuration ===");
console.log("Environment:", process.env.NODE_ENV);
console.log(
  "Using token type:",
  process.env.NODE_ENV === "production" ? "Production" : "Development",
);
console.log("Token prefix:", BOT_TOKEN.substring(0, 10) + "...");
console.log("WebApp URL:", WEBAPP_URL);

// Initialize bot with polling and minimal logging
export const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
  webHook: false,
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
        "👋 Welcome to Collab Room!\n\nWe're excited that you're interested in joining our community of innovative collaborators. Click below to start your application.";
    } else if (existingUser.is_approved) {
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "Launch Collab Room",
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
      ? (userData.company_website.startsWith('http') ? userData.company_website : `https://${userData.company_website}`) 
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
    // 2. View Application - web app link to admin/users page
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
            web_app: { url: `${WEBAPP_URL}/admin/users` },
          },
        ],
      ],
    };

    // Send notification to each admin
    for (const admin of adminUsers) {
      try {
        await bot.sendMessage(parseInt(admin.telegram_id), message, {
          parse_mode: "HTML",
          disable_web_page_preview: false, // Allow website previews
          reply_markup: keyboard,
        });
        console.log(`Enhanced notification sent to admin ${admin.telegram_id}`);
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
          text: "Launch Collab Room",
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
  } catch (error) {
    console.error("Failed to send approval notification:", error);
  }
}

// Set up commands silently
bot
  .setMyCommands([
    { command: "start", description: "Start the application process" },
    { command: "status", description: "Check your application status" },
  ])
  .catch((error) => {
    console.error("Failed to register commands:", error);
  });

// Register command handlers
bot.onText(/\/start/, handleStart);

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
              text: "Launch Collab Room",
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
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  
  if (!chatId) {
    console.error('No chat ID found in callback query');
    return;
  }
  
  try {
    // Check callback data type and route to appropriate handler
    if (callbackQuery.data?.startsWith('match_info_')) {
      await handleMatchInfoCallback(callbackQuery);
    }
    // Handle user approval callback
    else if (callbackQuery.data?.startsWith('approve_user_')) {
      await handleApproveUserCallback(callbackQuery);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
  }
});

// Handler for match info callbacks
// Handle user approval callbacks from admin notifications
async function handleApproveUserCallback(callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId || !callbackQuery.data) return;
  
  console.log('[CALLBACK_DEBUG] Processing user approval callback:', callbackQuery.data);
  
  try {
    // First, acknowledge the callback to show progress to admin
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Processing approval...',
      show_alert: false
    });
    
    // Extract Telegram ID from callback data
    // Format: approve_user_{telegram_id}
    const telegramId = callbackQuery.data.replace('approve_user_', '');
    if (!telegramId) {
      console.error('[CALLBACK_DEBUG] Invalid user approval callback format:', callbackQuery.data);
      await bot.sendMessage(chatId, 'Error: Invalid approval data format');
      return;
    }
    
    console.log('[CALLBACK_DEBUG] Approving user with Telegram ID:', telegramId);
    
    // Get user by Telegram ID
    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));
      
    if (!user) {
      console.error('[CALLBACK_DEBUG] User not found for approval:', telegramId);
      await bot.sendMessage(chatId, 'Error: User not found');
      return;
    }
    
    // Check if user is already approved
    if (user.is_approved) {
      console.log('[CALLBACK_DEBUG] User is already approved:', telegramId);
      await bot.sendMessage(chatId, `User ${user.first_name} ${user.last_name || ''} is already approved.`);
      return;
    }
    
    // Update user approval status
    const [updatedUser] = await db.update(users)
      .set({ is_approved: true })
      .where(eq(users.id, user.id))
      .returning();
      
    console.log('[CALLBACK_DEBUG] User approval successful:', updatedUser);
    
    // Send notification to the approved user
    try {
      await notifyUserApproved(parseInt(telegramId));
      console.log('[CALLBACK_DEBUG] Approval notification sent to user');
    } catch (notifyError) {
      console.error('[CALLBACK_DEBUG] Failed to send approval notification:', notifyError);
      // Continue execution even if notification fails
    }
    
    // Update the admin's message to show approval status
    try {
      // Only edit the message if it exists
      if (callbackQuery.message?.message_id) {
        const updatedKeyboard = {
          inline_keyboard: [
            [
              {
                text: "✅ Approved",
                callback_data: "user_already_approved"
              }
            ],
            [
              {
                text: "👁️ View Application",
                web_app: { url: `${WEBAPP_URL}/admin/users` }
              }
            ]
          ]
        };
        
        await bot.editMessageText(
          `✅ <b>Application Approved!</b>\n\n` +
          `You have approved <b>${user.first_name} ${user.last_name || ''}</b>'s application.\n` +
          `They have been notified and now have full access to the platform.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            parse_mode: 'HTML',
            reply_markup: updatedKeyboard
          }
        );
      }
    } catch (editError) {
      console.error('[CALLBACK_DEBUG] Failed to update approval message:', editError);
      // If editing fails, send a new message instead
      await bot.sendMessage(
        chatId,
        `✅ <b>Application Approved!</b>\n\n` +
        `You have approved <b>${user.first_name} ${user.last_name || ''}</b>'s application.\n` +
        `They have been notified and now have full access to the platform.`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('[CALLBACK_DEBUG] Error in user approval process:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing the approval. Please try again or check the admin dashboard.');
  }
}

async function handleMatchInfoCallback(callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId || !callbackQuery.data) return;
  
  console.log('[CALLBACK_DEBUG] Processing match info callback:', callbackQuery.data);
  
  try {
    // First, acknowledge the callback to show progress to user
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Loading match details...',
      show_alert: false
    });
    
    // Extract data from callback
    // Format: match_info_userId_collaborationId
    const parts = callbackQuery.data.split('_');
    if (parts.length !== 4) {
      console.error('[CALLBACK_DEBUG] Invalid callback data format:', callbackQuery.data);
      return;
    }
    
    const userId = parts[2];
    const collaborationId = parts[3];
    
    console.log('[CALLBACK_DEBUG] Extracted IDs:', { userId, collaborationId });
    
    // Get user details with full query logging
    console.log('[CALLBACK_DEBUG] Fetching user data for ID:', userId);
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
      
    if (!user) {
      console.error('[CALLBACK_DEBUG] User not found for match info:', userId);
      await bot.sendMessage(chatId, 'Sorry, the user information could not be found.');
      return;
    }
    
    console.log('[CALLBACK_DEBUG] User data retrieved:', JSON.stringify(user));
    
    // Get company details with full query logging
    console.log('[CALLBACK_DEBUG] Fetching company data for user ID:', userId);
    const [company] = await db.select()
      .from(companies)
      .where(eq(companies.user_id, userId));
    
    console.log('[CALLBACK_DEBUG] Company data retrieved:', company ? JSON.stringify(company) : 'None');
      
    // Get collaboration details with full query logging
    console.log('[CALLBACK_DEBUG] Fetching collaboration data for ID:', collaborationId);
    const [collaboration] = await db.select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));
      
    if (!collaboration) {
      console.error('[CALLBACK_DEBUG] Collaboration not found for ID:', collaborationId);
      await bot.sendMessage(chatId, 'Sorry, the collaboration information could not be found.');
      return;
    }
    
    console.log('[CALLBACK_DEBUG] Collaboration data retrieved:', JSON.stringify(collaboration));
    
    // Format user and company info
    const userFullName = `${user.first_name} ${user.last_name || ''}`.trim();
    const userHandle = user.handle ? `@${user.handle}` : '';
    
    // Format company website and social links
    const companyWebsite = company?.website ? (company.website.startsWith('http') ? company.website : `https://${company.website}`) : '';
    const companyName = companyWebsite 
      ? `<a href="${companyWebsite}">${company?.name || 'Unknown Company'}</a>` 
      : (company?.name || 'Unknown Company');
    
    const twitterHandle = company?.twitter_handle || '';
    const twitterUrl = twitterHandle ? `https://twitter.com/${twitterHandle.replace('@', '')}` : '';
    const twitterFollowers = company?.twitter_followers || 'Unknown';
    const linkedinUrl = company?.linkedin_url || '';

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
      infoMessage += `<b>💼 Role:</b> ${company.job_title || 'Not specified'}\n`;
      if (company.funding_stage) {
        infoMessage += `<b>💰 Funding Stage:</b> ${company.funding_stage}\n`;
      }
      
      // Add blockchain networks if available
      if (company.blockchain_networks && company.blockchain_networks.length > 0) {
        infoMessage += `<b>⛓️ Blockchain Networks:</b> ${company.blockchain_networks.join(', ')}\n`;
      }
      
      // Add company tags if available
      if (company.tags && company.tags.length > 0) {
        infoMessage += `<b>🏷️ Company Tags:</b> ${company.tags.join(', ')}\n`;
      }
    }
    
    // Social links section with proper hyperlinks
    let socialLinksSection = '';
    if (twitterHandle) {
      const formattedTwitterHandle = twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`;
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
      infoMessage += `\n<b>🏷️ Topics:</b> ${collaboration.topics.join(', ')}\n`;
    }
    
    // Add collaboration details from JSON if available
    if (collaboration.details) {
      const details = typeof collaboration.details === 'string' 
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
        [{ text: "💬 Chat Now", url: `https://t.me/${user.handle || user.telegram_id}` }],
        [{ text: "🔎 View Full Profile", web_app: { url: `${WEBAPP_URL}/discover` } }],
        [{ text: "🚀 Find More Matches", web_app: { url: `${WEBAPP_URL}/discover` } }]
      ]
    };
    
    console.log('[CALLBACK_DEBUG] Sending formatted message:', infoMessage);
    console.log('[CALLBACK_DEBUG] With keyboard:', JSON.stringify(keyboard));
    
    // Send the detailed info using direct message approach to ensure proper formatting
    try {
      await sendDirectFormattedMessage(chatId, infoMessage, keyboard);
      console.log('[CALLBACK_DEBUG] Successfully sent formatted message to chat:', chatId);
    } catch (error) {
      console.error('[CALLBACK_DEBUG] Error in direct message send:', error);
      // Fallback to standard message if direct send fails
      await bot.sendMessage(chatId, infoMessage, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
        disable_web_page_preview: false
      });
    }
    
  } catch (error) {
    console.error('[CALLBACK_DEBUG] Error handling match info callback:', error);
    try {
      await bot.sendMessage(chatId, 'Sorry, an error occurred while retrieving the match information. Please try again later.');
    } catch (innerError) {
      console.error('[CALLBACK_DEBUG] Failed to send error message:', innerError);
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
async function sendDirectFormattedMessage(chatId: number, message: string, keyboard: any) {
  try {
    // Validate inputs
    if (!chatId || isNaN(chatId)) {
      console.error(`[DIRECT_MSG_DEBUG] Invalid chat ID: ${chatId}`);
      throw new Error(`Invalid chat ID: ${chatId}`);
    }
    
    if (!message || typeof message !== 'string') {
      console.error(`[DIRECT_MSG_DEBUG] Invalid message format, must be a string`);
      throw new Error('Invalid message format');
    }
    
    // Detect HTML tags to ensure proper formatting
    const hasHtmlTags = message.includes('<b>') || message.includes('<i>') || message.includes('<a href');
    
    // Log exact message being sent for debugging
    console.log(`[DIRECT_MSG_DEBUG] Preparing message to ${chatId}:`);
    console.log(`[DIRECT_MSG_DEBUG] Contains HTML tags: ${hasHtmlTags}`);
    console.log(`[DIRECT_MSG_DEBUG] MESSAGE:\n${message}`);
    console.log(`[DIRECT_MSG_DEBUG] KEYBOARD:\n${JSON.stringify(keyboard, null, 2)}`);
    
    // Prepare message options
    const messageOptions: TelegramBot.SendMessageOptions = {
      parse_mode: hasHtmlTags ? 'HTML' : undefined, // Only set HTML mode when tags are present
      reply_markup: keyboard,
      disable_web_page_preview: false
    };
    
    console.log(`[DIRECT_MSG_DEBUG] Message options:\n${JSON.stringify(messageOptions, null, 2)}`);
    
    // Use lower-level sendMessage API for direct access
    console.log(`[DIRECT_MSG_DEBUG] Sending message to chat ID ${chatId}...`);
    const result = await bot.sendMessage(chatId, message, messageOptions);
    
    console.log(`[DIRECT_MSG_DEBUG] Success! Message ID: ${result.message_id}`);
    return result;
  } catch (error) {
    console.error(`[DIRECT_MSG_DEBUG] Failed to send message:`, error);
    
    // Attempt to determine error cause for better debugging
    if (error instanceof Error) {
      if (error.message.includes('ETELEGRAM')) {
        console.error(`[DIRECT_MSG_DEBUG] Telegram API error: ${error.message}`);
        
        // Check for specific error conditions
        if (error.message.includes('chat not found')) {
          console.error(`[DIRECT_MSG_DEBUG] Chat ID ${chatId} not found. Verify the Telegram ID is correct.`);
        } else if (error.message.includes('bot was blocked')) {
          console.error(`[DIRECT_MSG_DEBUG] User has blocked the bot.`);
        } else if (error.message.includes('can\'t parse entities')) {
          console.error(`[DIRECT_MSG_DEBUG] HTML parsing error. Check your HTML formatting.`);
          console.error(`[DIRECT_MSG_DEBUG] Message that failed: ${message}`);
        }
      }
    }
    
    throw error;
  }
}

export async function notifyMatchCreated(hostUserId: string, requesterUserId: string, collaborationId: string) {
  try {
    console.log('[Telegram Bot] Sending match notifications:', { hostUserId, requesterUserId, collaborationId });

    // Get user details from database
    const [hostUser] = await db.select()
      .from(users)
      .where(eq(users.id, hostUserId));
      
    const [requesterUser] = await db.select()
      .from(users)
      .where(eq(users.id, requesterUserId));
      
    if (!hostUser || !requesterUser) {
      console.error('[Telegram Bot] Could not find user data for match notification:', { 
        hostFound: !!hostUser, 
        requesterFound: !!requesterUser 
      });
      return;
    }

    console.log('[DEBUG] User records:', {
      hostId: hostUser.id,
      hostTelegramId: hostUser.telegram_id,
      requesterIds: requesterUser.id,
      requesterTelegramId: requesterUser.telegram_id
    });

    // Get collaboration details
    const [collaboration] = await db.select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));
    
    if (!collaboration) {
      console.error('[Telegram Bot] Could not find collaboration for match notification:', { collaborationId });
      return;
    }

    // Get company details for both users
    const [hostCompany] = await db.select()
      .from(companies)
      .where(eq(companies.user_id, hostUserId));
    
    const [requesterCompany] = await db.select()
      .from(companies)
      .where(eq(companies.user_id, requesterUserId));

    console.log('[DEBUG] Company records found:', {
      hostCompanyFound: !!hostCompany,
      requesterCompanyFound: !!requesterCompany
    });

    // Convert telegram_id to integers for chat ID
    const hostChatId = parseInt(hostUser.telegram_id);
    const requesterChatId = parseInt(requesterUser.telegram_id);
    
    if (isNaN(hostChatId) || isNaN(requesterChatId)) {
      console.error('[Telegram Bot] Invalid chat IDs:', { hostChatId, requesterChatId });
      return;
    }
    
    console.log('[DEBUG] Chat IDs for notifications:', { hostChatId, requesterChatId });

    // Format company website links
    const requesterCompanyWebsite = requesterCompany?.website ? requesterCompany.website.startsWith('http') ? requesterCompany.website : `https://${requesterCompany.website}` : '';
    const hostCompanyWebsite = hostCompany?.website ? hostCompany.website.startsWith('http') ? hostCompany.website : `https://${hostCompany.website}` : '';

    // Format company names with hyperlinks if website available
    const requesterCompanyName = requesterCompanyWebsite 
      ? `<a href="${requesterCompanyWebsite}">${requesterCompany?.name || 'a company'}</a>` 
      : (requesterCompany?.name || 'a company');
    
    const hostCompanyName = hostCompanyWebsite 
      ? `<a href="${hostCompanyWebsite}">${hostCompany?.name || 'a company'}</a>` 
      : (hostCompany?.name || 'a company');

    // IMPORTANT: Create the keyboard objects with specific formatting
    // Host keyboard (separate buttons to ensure proper layout)
    const hostKeyboard = {
      inline_keyboard: [
        [{ text: "💬 Chat with Collaborator", url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}` }],
        // Remove the callback button that's causing issues
        [{ text: "🚀 Discover More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }],
        [{ text: "👥 View Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
      ]
    };

    // Requester keyboard (separate buttons to ensure proper layout)
    const requesterKeyboard = {
      inline_keyboard: [
        [{ text: "💬 Chat with Host", url: `https://t.me/${hostUser.handle || hostUser.telegram_id}` }],
        // Remove the callback button that's causing issues
        [{ text: "🚀 Discover More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }],
        [{ text: "👥 View Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
      ]
    };

    // Prepare host notification with HTML formatting
    const hostMessage = `🎉 <b>New Match!</b>\n\n${requesterUser.first_name} ${requesterUser.last_name || ''} ${requesterUser.handle ? `(<a href="https://t.me/${requesterUser.handle}">@${requesterUser.handle}</a>)` : ''}, the <b>${requesterCompany?.job_title || 'professional'}</b> from ${requesterCompanyName} is a match for your <b>${collaboration.collab_type}</b> collaboration!\n\nThey've shown interest in collaborating with you - you can now chat directly using the buttons below.`;
    
    // Prepare requester notification with HTML formatting  
    const requesterMessage = `🎉 <b>New Match!</b>\n\n${hostUser.first_name} ${hostUser.last_name || ''} ${hostUser.handle ? `(<a href="https://t.me/${hostUser.handle}">@${hostUser.handle}</a>)` : ''} from ${hostCompanyName} just approved your collab request for <b>${collaboration.collab_type}</b>!\n\nYou can now chat directly with ${hostUser.first_name} using the buttons below.`;
    
    console.log('[DEBUG] Formatted messages to send:');
    console.log(`Host message (to ${hostChatId}):\n${hostMessage}`);
    console.log(`Requester message (to ${requesterChatId}):\n${requesterMessage}`);
    
    // Send both notifications with full error handling
    let hostSuccess = false;
    let requesterSuccess = false;
    
    try {
      // First try the enhanced direct formatted message approach
      await sendDirectFormattedMessage(hostChatId, hostMessage, hostKeyboard);
      hostSuccess = true;
      console.log(`[DEBUG] Successfully sent formatted message to host (${hostChatId})`);
      
      await sendDirectFormattedMessage(requesterChatId, requesterMessage, requesterKeyboard);
      requesterSuccess = true;
      console.log(`[DEBUG] Successfully sent formatted message to requester (${requesterChatId})`);
      
      console.log('[Telegram Bot] Successfully sent enhanced HTML notifications to both users');
    } catch (directError) {
      console.error('[Telegram Bot] Error in direct notification sending:', directError);
      
      // If direct formatting failed, try standard message as fallback
      try {
        if (!hostSuccess) {
          // Try sending plain message to host without HTML formatting
          console.log('[DEBUG] Trying fallback message to host...');
          const plainHostMessage = `🎉 New Match! ${requesterUser.first_name} ${requesterUser.last_name || ''} from ${requesterCompany?.name || 'a company'} matched with your ${collaboration.collab_type} collaboration!`;
          
          // Simplified fallback keyboard without callback data
          const fallbackHostKeyboard = {
            inline_keyboard: [
              [{ text: "Chat with Collaborator", url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}` }],
              [{ text: "View Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
            ]
          };
          
          await bot.sendMessage(hostChatId, plainHostMessage, { reply_markup: fallbackHostKeyboard });
          console.log(`[DEBUG] Successfully sent fallback message to host (${hostChatId})`);
        }
        
        if (!requesterSuccess) {
          // Try sending plain message to requester without HTML formatting
          console.log('[DEBUG] Trying fallback message to requester...');
          const plainRequesterMessage = `🎉 New Match! ${hostUser.first_name} ${hostUser.last_name || ''} from ${hostCompany?.name || 'a company'} just approved your collab request for ${collaboration.collab_type}!`;
          
          // Simplified fallback keyboard without callback data
          const fallbackRequesterKeyboard = {
            inline_keyboard: [
              [{ text: "Chat with Host", url: `https://t.me/${hostUser.handle || hostUser.telegram_id}` }],
              [{ text: "View Matches", web_app: { url: `${WEBAPP_URL}/matches` } }]
            ]
          };
          
          await bot.sendMessage(requesterChatId, plainRequesterMessage, { reply_markup: fallbackRequesterKeyboard });
          console.log(`[DEBUG] Successfully sent fallback message to requester (${requesterChatId})`);
        }
      } catch (fallbackError) {
        console.error('[Telegram Bot] Even fallback notification failed:', fallbackError);
      }
    }
    
  } catch (error) {
    console.error('[Telegram Bot] Error preparing match notifications:', error);
    console.error(error instanceof Error ? error.stack : 'No stack trace available');
  }
}
