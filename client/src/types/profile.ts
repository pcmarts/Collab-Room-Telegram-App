import type { User, Company, Preferences } from '@shared/schema';

export interface ProfileData {
  user: User;
  company: Company;
  preferences: Preferences;
}
