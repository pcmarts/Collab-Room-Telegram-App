import TelegramBot from 'node-telegram-bot-api';
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error('REPLIT_DOMAINS is required');
}

// Get the webapp URL from environment
const domain = process.env.REPLIT_DOMAINS.split(',')[0];
const WEBAPP_URL = `https://${domain}`;

console.log('=== Telegram Bot Initialization ===');
console.log('WebApp URL:', WEBAPP_URL);
console.log('Domain:', domain);

// Initialize bot with polling
export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
  polling: true,
  webHook: false // Explicitly disable webhook
});

// Send application confirmation message
export async function sendApplicationConfirmation(chatId: number) {
  const keyboard = {
    inline_keyboard: [[{
      text: "Check Application Status",
      web_app: { url: `${WEBAPP_URL}/application-status` }
    }]]
  };

  try {
    await bot.sendMessage(
      chatId,
      "🎉 Application Submitted Successfully!\n\nThank you for applying to join CollabRoom. Click below to check your application status anytime.",
      { reply_markup: keyboard }
    );
    console.log('Application confirmation message sent successfully');
  } catch (error) {
    console.error('Failed to send application confirmation:', error);
  }
}

// Send notification to collab creator about new application
export async function sendCollabApplicationNotification(
  creatorTelegramId: string,
  applicationData: {
    applicantName: string,
    applicantTwitter?: string,
    applicantLinkedin?: string,
    applicantPosition?: string,
    companyName: string,
    companyTwitter?: string,
    collaborationTitle: string,
    applicationId: string
  }
) {
  try {
    // Build the message with hyperlinks
    let message = `🔔 *New Collaboration Application*\n\n`;
    message += `Someone has applied for your collaboration "*${applicationData.collaborationTitle}*"!\n\n`;
    
    // Applicant info with hyperlinks where available
    message += `👤 *Applicant:* `;
    if (applicationData.applicantTwitter) {
      message += `[${applicationData.applicantName}](https://twitter.com/${applicationData.applicantTwitter.replace('@', '')})`;
    } else {
      message += applicationData.applicantName;
    }
    message += '\n';
    
    // Position with LinkedIn hyperlink if available
    if (applicationData.applicantPosition) {
      message += `📋 *Position:* `;
      if (applicationData.applicantLinkedin) {
        message += `[${applicationData.applicantPosition}](${applicationData.applicantLinkedin})`;
      } else {
        message += applicationData.applicantPosition;
      }
      message += '\n';
    }
    
    // Company with Twitter hyperlink if available
    message += `🏢 *Company:* `;
    if (applicationData.companyTwitter) {
      message += `[${applicationData.companyName}](https://twitter.com/${applicationData.companyTwitter.replace('@', '')})`;
    } else {
      message += applicationData.companyName;
    }
    message += '\n\n';
    
    // Create inline keyboard for quick approve/review actions
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Approve",
            callback_data: `approve_application:${applicationData.applicationId}`
          },
          {
            text: "👁️ Review Details",
            web_app: { url: `${WEBAPP_URL}/my-collaborations?applicationId=${applicationData.applicationId}` }
          }
        ]
      ]
    };

    // Send the message to the collaboration creator
    await bot.sendMessage(
      parseInt(creatorTelegramId),
      message,
      { 
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }
    );
    
    console.log('Collab application notification sent to creator:', creatorTelegramId);
    return true;
  } catch (error) {
    console.error('Failed to send collab application notification:', error);
    return false;
  }
}

// Basic error handling
bot.on('polling_error', (error) => {
  console.error('=== Telegram Bot Polling Error ===');
  console.error(error);
});

bot.on('error', (error) => {
  console.error('=== Telegram Bot General Error ===');
  console.error(error);
});

// Handle /start command
async function handleStart(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  console.log('=== Handling /start command ===');
  console.log('Chat ID:', chatId);
  console.log('Message:', JSON.stringify(msg, null, 2));

  try {
    if (!telegramId) {
      throw new Error('No Telegram ID found in message');
    }

    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    let keyboard;
    let welcomeMessage;

    if (!existingUser) {
      // New user - show Apply button
      keyboard = {
        inline_keyboard: [[{
          text: "Apply to Join",
          web_app: { url: `${WEBAPP_URL}/welcome` } 
        }]]
      };
      welcomeMessage = '👋 Welcome to CollabRoom!\n\nWe\'re excited that you\'re interested in joining our community of innovative collaborators. Click below to start your application.';
    } else if (existingUser.is_approved) {
      // Approved user - show Dashboard button and Announcement Channel
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Dashboard",
            web_app: { url: `${WEBAPP_URL}/dashboard` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
      welcomeMessage = `👋 Welcome back to CollabRoom!\n\nYou're all set! Click below to access your dashboard and start collaborating.`;
    } else {
      // Pending user - show application status button and Announcement Channel
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Application Status",
            web_app: { url: `${WEBAPP_URL}/application-status` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
      welcomeMessage = `👋 Welcome back to CollabRoom!\n\nYour application is currently under review. Click below to check your application status or use /status command anytime.`;
    }

    await bot.sendMessage(chatId, welcomeMessage, keyboard ? { reply_markup: keyboard } : undefined);
    console.log('Message sent successfully');

  } catch (error) {
    console.error('=== Error in handleStart ===');
    console.error(error);

    try {
      await bot.sendMessage(
        chatId,
        'Sorry, something went wrong. Please try again in a few moments.'
      );
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

// Handle /status command
async function handleStatus(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();

  console.log('=== Handling /status command ===');
  console.log('Chat ID:', chatId);
  console.log('Telegram ID:', telegramId);

  try {
    if (!telegramId) {
      throw new Error('No Telegram ID found in message');
    }

    const [user] = await db.select()
      .from(users)
      .where(eq(users.telegram_id, telegramId));

    console.log('User found:', user);

    if (!user) {
      // For users without applications, show the Apply button
      const keyboard = {
        inline_keyboard: [[{
          text: "Apply to Join",
          web_app: { url: `${WEBAPP_URL}/welcome` }
        }]]
      };
      await bot.sendMessage(
        chatId,
        'No application found. Click below to start your application.',
        { reply_markup: keyboard }
      );
      return;
    }

    const applicationDate = user.applied_at ? format(new Date(user.applied_at), 'MMMM d, yyyy') : 'Not available';

    let statusMessage;
    let keyboard;

    if (user.is_approved) {
      statusMessage = `✅ Your application has been approved!\n\nYou can now access your dashboard and start collaborating.`;
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Dashboard",
            web_app: { url: `${WEBAPP_URL}/dashboard` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
    } else {
      statusMessage = `📝 Application Status: Under Review\n\nApplication Details:\n• Name: ${user.first_name} ${user.last_name}\n• Submitted: ${applicationDate}\n\nWe'll notify you here once your application has been reviewed.`;
      keyboard = {
        inline_keyboard: [
          [{
            text: "View Application Status",
            web_app: { url: `${WEBAPP_URL}/application-status` }
          }],
          [{
            text: "📣 Join Announcement Channel",
            url: "https://t.me/TheMarketingDAO"
          }]
        ]
      };
    }

    await bot.sendMessage(chatId, statusMessage, { 
      parse_mode: 'HTML',
      reply_markup: keyboard
    });

  } catch (error) {
    console.error('Error handling status check:', error);
    console.error('Full error details:', error);
    await bot.sendMessage(
      chatId,
      'Sorry, something went wrong while checking your status. Please try again later.'
    );
  }
}

// Set up commands
console.log('Setting up bot commands...');
bot.setMyCommands([
  { command: 'start', description: 'Start the application process' },
  { command: 'status', description: 'Check your application status' }
]).then(() => {
  console.log('Bot commands registered successfully');
}).catch((error) => {
  console.error('Failed to register commands:', error);
});

// Register command handlers
bot.onText(/\/start/, handleStart);
bot.onText(/\/status/, handleStatus);

// Handle callback queries for actions like "approve application"
bot.on('callback_query', async (query) => {
  console.log('=== Handling callback query ===');
  console.log('Query data:', query.data);
  
  try {
    if (!query.data) {
      throw new Error('No data found in callback query');
    }
    
    // Handle application approval
    if (query.data.startsWith('approve_application:')) {
      const applicationId = query.data.split(':')[1];
      
      if (!applicationId) {
        throw new Error('Invalid application ID in callback data');
      }
      
      console.log(`Processing application approval for ID: ${applicationId}`);
      
      // Get the application from the database
      const [application] = await db.select()
        .from(collab_applications)
        .where(eq(collab_applications.id, applicationId));
      
      if (!application) {
        throw new Error('Application not found');
      }
      
      // Get the collaboration details
      const [collaboration] = await db.select()
        .from(collaborations)
        .where(eq(collaborations.id, application.collaboration_id));
      
      if (!collaboration) {
        throw new Error('Collaboration not found');
      }
      
      // Get the telegram user ID from message
      const telegramId = query.from.id.toString();
      
      // Get the user making the approval (should be the collaboration creator)
      const [user] = await db.select()
        .from(users)
        .where(eq(users.telegram_id, telegramId));
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify the user is the collaboration creator
      if (user.id !== collaboration.creator_id) {
        throw new Error('Unauthorized: Only the collaboration creator can approve applications');
      }
      
      // Update the application status
      const [updatedApplication] = await db.update(collab_applications)
        .set({ 
          status: 'approved', 
          updated_at: new Date()
        })
        .where(eq(collab_applications.id, applicationId))
        .returning();
      
      if (!updatedApplication) {
        throw new Error('Failed to update application status');
      }
      
      // Get the applicant details
      const [applicant] = await db.select()
        .from(users)
        .where(eq(users.id, application.applicant_id));
      
      if (applicant) {
        // Create notification for the applicant
        await db.insert(collab_notifications)
          .values({
            id: undefined, // Let Drizzle generate the ID
            user_id: applicant.id,
            type: 'application_approved',
            content: `Your application for "${collaboration.title}" has been approved`,
            collaboration_id: collaboration.id,
            application_id: application.id,
            is_read: false,
            is_sent: false,
            created_at: new Date()
          });
          
        // Send a notification to the applicant
        try {
          await bot.sendMessage(
            parseInt(applicant.telegram_id),
            `✅ Great news! Your application for "${collaboration.title}" has been approved. You can now start collaborating!`,
            {
              reply_markup: {
                inline_keyboard: [[{
                  text: "View Collaboration",
                  web_app: { url: `${WEBAPP_URL}/collaborations/${collaboration.id}` }
                }]]
              }
            }
          );
        } catch (messageError) {
          console.error('Error sending approval message to applicant:', messageError);
        }
      }
      
      // Respond to the callback query
      await bot.answerCallbackQuery(query.id, {
        text: `Application approved successfully!`,
        show_alert: true
      });
      
      // Update the original message to show that it's been approved
      if (query.message) {
        try {
          await bot.editMessageText(
            `✅ *Application Approved*\n\nYou've approved the application for "${collaboration.title}"!`,
            {
              chat_id: query.message.chat.id,
              message_id: query.message.message_id,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[{
                  text: "View Collaboration",
                  web_app: { url: `${WEBAPP_URL}/my-collaborations` }
                }]]
              }
            }
          );
        } catch (editError) {
          console.error('Error updating message:', editError);
        }
      }
      
    } else {
      // Unknown callback data
      await bot.answerCallbackQuery(query.id, {
        text: `Unknown action: ${query.data}`,
        show_alert: true
      });
    }
    
  } catch (error) {
    console.error('=== Error handling callback query ===', error);
    
    try {
      await bot.answerCallbackQuery(query.id, {
        text: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        show_alert: true
      });
    } catch (answerError) {
      console.error('Failed to answer callback query with error:', answerError);
    }
  }
});

console.log('Telegram bot initialization completed');