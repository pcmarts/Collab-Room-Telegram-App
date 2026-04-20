import type { User, Company, NotificationPreferences, MarketingPreferences } from '@shared/schema';

export interface ProfileData {
  user: User;
  company: Company;
  // Keep preferences for backward compatibility
  preferences: any;
  notificationPreferences: NotificationPreferences;
  marketingPreferences: MarketingPreferences;
  conferencePreferences: null;
}
