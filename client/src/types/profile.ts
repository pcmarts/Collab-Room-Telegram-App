import type { User, Company, Preferences, MarketingPreferences, ConferencePreferences } from '@shared/schema';

export interface ProfileData {
  user: User;
  company: Company;
  preferences: Preferences;
  marketingPreferences: MarketingPreferences;
  conferencePreferences: ConferencePreferences;
}
