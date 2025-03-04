import { matchingService } from './matching';
import { db } from '../db';
import { users, preferences } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class MatchingScheduler {
  private interval: NodeJS.Timeout | null = null;
  private readonly INTERVAL_TIME = 5 * 60 * 1000; // Run every 5 minutes

  start() {
    if (this.interval) {
      console.log('Matching scheduler is already running');
      return;
    }

    console.log('Starting matching scheduler...');
    this.interval = setInterval(this.runMatchingCycle.bind(this), this.INTERVAL_TIME);
    // Run immediately on start
    this.runMatchingCycle();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('Matching scheduler stopped');
    }
  }

  private async runMatchingCycle() {
    try {
      console.log('=== Starting matching cycle ===');
      
      // Get all users with preferences
      const usersWithPrefs = await db
        .select()
        .from(users)
        .innerJoin(preferences, eq(users.id, preferences.user_id))
        .where(eq(users.is_approved, true));

      console.log(`Found ${usersWithPrefs.length} users to process`);

      // Process each user
      for (const { users: user } of usersWithPrefs) {
        console.log(`Processing user: ${user.first_name} ${user.last_name} (${user.telegram_id})`);
        
        try {
          // Find matches for this user
          const matches = await matchingService.findMatches(user.id);
          console.log(`Found ${matches.length} potential matches for user ${user.telegram_id}`);

          // Create matches and send notifications
          for (const opportunity of matches) {
            try {
              await matchingService.createMatch(opportunity.id, user.id);
              console.log(`Created match for opportunity ${opportunity.id} and user ${user.telegram_id}`);
            } catch (matchError) {
              console.error(`Failed to create match for opportunity ${opportunity.id}:`, matchError);
              // Continue with next match even if one fails
              continue;
            }
          }
        } catch (userError) {
          console.error(`Error processing user ${user.telegram_id}:`, userError);
          // Continue with next user even if one fails
          continue;
        }
      }

      console.log('=== Matching cycle completed ===');
    } catch (error) {
      console.error('Error in matching cycle:', error);
    }
  }
}

export const matchingScheduler = new MatchingScheduler();
