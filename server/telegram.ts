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
  company_name: string;
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

    const message =
      `🆕 New User Application!\n\n` +
      `Name: ${userData.first_name} ${userData.last_name || ""}\n` +
      `Company: ${userData.company_name}\n` +
      `Role: ${userData.job_title}\n\n` +
      `Click below to review the application:`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "Review Application",
            web_app: { url: `${WEBAPP_URL}/admin/users` },
          },
        ],
      ],
    };

    // Send notification to each admin
    for (const admin of adminUsers) {
      try {
        await bot.sendMessage(parseInt(admin.telegram_id), message, {
          reply_markup: keyboard,
        });
        console.log(`Notification sent to admin ${admin.telegram_id}`);
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

// Handle callback queries for match info
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  
  if (!chatId) {
    console.error('No chat ID found in callback query');
    return;
  }
  
  try {
    // Check if this is a match info request
    if (callbackQuery.data?.startsWith('match_info_')) {
      await handleMatchInfoCallback(callbackQuery);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
  }
});

// Handler for match info callbacks
async function handleMatchInfoCallback(callbackQuery: TelegramBot.CallbackQuery) {
  const chatId = callbackQuery.message?.chat.id;
  if (!chatId || !callbackQuery.data) return;
  
  try {
    // Extract data from callback
    // Format: match_info_userId_collaborationId
    const parts = callbackQuery.data.split('_');
    if (parts.length !== 4) {
      console.error('Invalid callback data format:', callbackQuery.data);
      return;
    }
    
    const userId = parts[2];
    const collaborationId = parts[3];
    
    // Get user details
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
      
    if (!user) {
      console.error('User not found for match info:', userId);
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'User information not found.' });
      return;
    }
    
    // Get company details
    const [company] = await db.select()
      .from(companies)
      .where(eq(companies.user_id, userId));
      
    // Get collaboration details
    const [collaboration] = await db.select()
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId));
      
    if (!collaboration) {
      console.error('Collaboration not found for match info:', collaborationId);
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Collaboration information not found.' });
      return;
    }
    
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
    
    // User info section with tag linking
    infoMessage += `<b>👤 User:</b> ${userFullName} ${userHandle ? `(<a href="https://t.me/${userHandle.substring(1)}">${userHandle}</a>)` : ''}\n`;
    if (company) {
      infoMessage += `<b>🏢 Company:</b> ${companyName}\n`;
      infoMessage += `<b>💼 Role:</b> ${company.job_title}\n`;
      if (company.funding_stage) {
        infoMessage += `<b>💰 Funding Stage:</b> ${company.funding_stage}\n`;
      }
    }
    
    // Social links section with proper hyperlinks
    if (twitterHandle || linkedinUrl) {
      infoMessage += `\n<b>🔗 Social Links:</b>\n`;
      if (twitterHandle) {
        const formattedTwitterHandle = twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`;
        infoMessage += `- <a href="${twitterUrl}">Twitter: ${formattedTwitterHandle}</a> (${twitterFollowers} followers)\n`;
      }
      if (linkedinUrl) {
        infoMessage += `- <a href="${linkedinUrl}">LinkedIn Profile</a>\n`;
      }
    }
    
    // Collaboration details section with enhanced formatting
    infoMessage += `\n<b>🤝 Collaboration:</b>\n`;
    infoMessage += `<b>Type:</b> ${collaboration.collab_type}\n`;
    if (collaboration.description) {
      infoMessage += `<b>Description:</b> ${collaboration.description}\n`;
    }
    if (collaboration.topics && collaboration.topics.length > 0) {
      infoMessage += `<b>Topics:</b> ${collaboration.topics.join(', ')}\n`;
    }
    
    // Add collaboration details from JSON if available
    if (collaboration.details) {
      const details = typeof collaboration.details === 'string' 
        ? JSON.parse(collaboration.details) 
        : collaboration.details;
        
      if (details.short_description) {
        infoMessage += `<b>Summary:</b> ${details.short_description}\n`;
      }
      if (details.expectations) {
        infoMessage += `<b>Expectations:</b> ${details.expectations}\n`;
      }
    }
    
    // Create keyboard with enhanced action buttons
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "💬 Chat with User",
            url: `https://t.me/${user.handle || user.telegram_id}`,
          }
        ],
        [
          {
            text: "🔎 View Full Profile",
            web_app: { url: `${WEBAPP_URL}/profile/${userId}` },
          }
        ],
        [
          {
            text: "🚀 Find More Opportunities",
            web_app: { url: `${WEBAPP_URL}/discover` },
          }
        ]
      ]
    };
    
    // Send the detailed info
    await bot.sendMessage(chatId, infoMessage, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      disable_web_page_preview: false
    });
    
    // Answer the callback query to remove the loading indicator
    await bot.answerCallbackQuery(callbackQuery.id);
    
  } catch (error) {
    console.error('Error handling match info callback:', error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Sorry, an error occurred while retrieving the information.'
    });
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

    // Create keyboards with improved options
    const hostKeyboard = {
      inline_keyboard: [
        [
          {
            text: "💬 Chat with Collaborator",
            url: `https://t.me/${requesterUser.handle || requesterUser.telegram_id}`,
          }
        ],
        [
          {
            text: "🔍 View Full Details",
            callback_data: `match_info_${requesterUserId}_${collaborationId}`,
          }
        ],
        [
          {
            text: "🚀 Discover More Collabs",
            web_app: { url: `${WEBAPP_URL}/discover` },
          }
        ],
      ],
    };

    const requesterKeyboard = {
      inline_keyboard: [
        [
          {
            text: "💬 Chat with Host",
            url: `https://t.me/${hostUser.handle || hostUser.telegram_id}`,
          }
        ],
        [
          {
            text: "🔍 View Full Details",
            callback_data: `match_info_${hostUserId}_${collaborationId}`,
          }
        ],
        [
          {
            text: "🚀 Discover More Collabs",
            web_app: { url: `${WEBAPP_URL}/discover` },
          }
        ],
      ],
    };

    // Send enhanced notification to host (collaboration creator)
    const hostChatId = parseInt(hostUser.telegram_id);
    const hostMessage = `🎉 <b>New Match!</b> ${requesterUser.first_name} ${requesterUser.last_name || ''} ${requesterUser.handle ? `(@${requesterUser.handle})` : ''}, the <b>${requesterCompany?.job_title || 'professional'}</b> from ${requesterCompanyName} is a match for your <b>${collaboration.collab_type}</b> collaboration!

They've shown interest in collaborating with you - you can now chat directly using the buttons below.`;
    
    console.log('[Telegram Bot] Sending notification to host:', {
      chatId: hostChatId,
      name: `${hostUser.first_name} ${hostUser.last_name || ''}`,
      message: hostMessage,
      keyboard: JSON.stringify(hostKeyboard),
      parseMode: 'HTML'
    });
    
    try {
      const result = await bot.sendMessage(hostChatId, hostMessage, { 
        reply_markup: hostKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
      console.log('[Telegram Bot] Host notification sent successfully:', {
        messageId: result.message_id,
        chatId: result.chat.id
      });
    } catch (error) {
      console.error('[Telegram Bot] Error sending host notification:', error);
    }

    // Send enhanced notification to requester (user who swiped right)
    const requesterChatId = parseInt(requesterUser.telegram_id);
    const requesterMessage = `🎉 <b>New Match!</b> ${hostUser.first_name} ${hostUser.last_name || ''} ${hostUser.handle ? `(@${hostUser.handle})` : ''} from ${hostCompanyName} just approved your collab request for <b>${collaboration.collab_type}</b>!

You can now chat directly with ${hostUser.first_name} using the buttons below.`;
    
    console.log('[Telegram Bot] Sending notification to requester:', {
      chatId: requesterChatId,
      name: `${requesterUser.first_name} ${requesterUser.last_name || ''}`,
      message: requesterMessage,
      keyboard: JSON.stringify(requesterKeyboard),
      parseMode: 'HTML'
    });
    
    try {
      const result = await bot.sendMessage(requesterChatId, requesterMessage, { 
        reply_markup: requesterKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
      console.log('[Telegram Bot] Requester notification sent successfully:', {
        messageId: result.message_id,
        chatId: result.chat.id
      });
    } catch (error) {
      console.error('[Telegram Bot] Error sending requester notification:', error);
    }
    
    console.log('[Telegram Bot] Successfully sent match notifications to both users');
    
  } catch (error) {
    console.error('[Telegram Bot] Error sending match notifications:', error);
  }
}
