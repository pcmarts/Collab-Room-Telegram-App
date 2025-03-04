import { db } from "../db";
import { bot } from "../telegram";
import { 
  users, companies, preferences, collaboration_opportunities, matches,
  type User, type Company, type Preferences, type CollaborationOpportunity, type Match
} from "@shared/schema";
import { eq, and, not, inArray } from "drizzle-orm";

export class MatchingService {
  /**
   * Find potential matches for a user based on their preferences
   */
  async findMatches(userId: string): Promise<CollaborationOpportunity[]> {
    console.log(`Finding matches for user ${userId}`);

    // Get user's preferences and excluded tags
    const [userPrefs] = await db.select()
      .from(preferences)
      .where(eq(preferences.user_id, userId));

    if (!userPrefs) {
      console.log(`No preferences found for user ${userId}`);
      return [];
    }

    console.log(`User ${userId} preferences:`, {
      collabs_to_discover: userPrefs.collabs_to_discover,
      excluded_tags: userPrefs.excluded_tags
    });

    // Get active opportunities that match user's preferences
    const matches = await db.select()
      .from(collaboration_opportunities)
      .where(and(
        eq(collaboration_opportunities.status, 'active'),
        not(eq(collaboration_opportunities.user_id, userId)),
        inArray(collaboration_opportunities.collab_type, userPrefs.collabs_to_discover)
      ));

    console.log(`Found ${matches.length} potential matches for user ${userId}`);
    return matches;
  }

  /**
   * Create a new match between users
   */
  async createMatch(opportunityId: string, discovererId: string): Promise<Match> {
    console.log(`Creating match for opportunity ${opportunityId} and discoverer ${discovererId}`);

    const [opportunity] = await db.select()
      .from(collaboration_opportunities)
      .where(eq(collaboration_opportunities.id, opportunityId));

    if (!opportunity) throw new Error('Opportunity not found');

    // Create the match
    const [match] = await db.insert(matches)
      .values({
        opportunity_id: opportunityId,
        discoverer_id: discovererId,
        host_id: opportunity.user_id,
        status: 'pending'
      })
      .returning();

    console.log(`Match created: ${match.id}`);

    // Send Telegram notifications to both users
    await this.notifyMatchCreated(match);

    return match;
  }

  /**
   * Send Telegram notifications about a new match with complete company details
   */
  private async notifyMatchCreated(match: Match) {
    // Get user and company info for both parties
    const [discoverer] = await db.select()
      .from(users)
      .where(eq(users.id, match.discoverer_id));

    const [host] = await db.select()
      .from(users)
      .where(eq(users.id, match.host_id));

    const [discovererCompany] = await db.select()
      .from(companies)
      .where(eq(companies.user_id, match.discoverer_id));

    const [hostCompany] = await db.select()
      .from(companies)
      .where(eq(companies.user_id, match.host_id));

    const [opportunity] = await db.select()
      .from(collaboration_opportunities)
      .where(eq(collaboration_opportunities.id, match.opportunity_id));

    // Notify discoverer
    if (discoverer) {
      const hostMessage = `🤝 New Collaboration Match!\n\n` +
        `You've matched with ${host.first_name} ${host.last_name} from ${hostCompany.name}\n\n` +
        `Company Details:\n` +
        `• Website: ${hostCompany.website}\n` +
        `${hostCompany.twitter_handle ? `• Twitter: @${hostCompany.twitter_handle}\n` : ''}` +
        `${hostCompany.linkedin_url ? `• LinkedIn: ${hostCompany.linkedin_url}\n` : ''}\n` +
        `Opportunity: ${opportunity.title}\n\n` +
        `To connect, message @${host.handle} directly on Telegram.`;

      await bot.sendMessage(discoverer.telegram_id, hostMessage);
      console.log(`Sent match notification to discoverer ${discoverer.telegram_id}`);
    }

    // Notify host
    if (host) {
      const discovererMessage = `🤝 New Collaboration Match!\n\n` +
        `${discoverer.first_name} ${discoverer.last_name} from ${discovererCompany.name} wants to collaborate!\n\n` +
        `Company Details:\n` +
        `• Website: ${discovererCompany.website}\n` +
        `${discovererCompany.twitter_handle ? `• Twitter: @${discovererCompany.twitter_handle}\n` : ''}` +
        `${discovererCompany.linkedin_url ? `• LinkedIn: ${discovererCompany.linkedin_url}\n` : ''}\n` +
        `They're interested in: ${opportunity.title}\n\n` +
        `To connect, message @${discoverer.handle} directly on Telegram.`;

      await bot.sendMessage(host.telegram_id, discovererMessage);
      console.log(`Sent match notification to host ${host.telegram_id}`);
    }
  }
}

export const matchingService = new MatchingService();