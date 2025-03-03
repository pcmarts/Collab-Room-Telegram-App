import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Core user table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegram_id: text('telegram_id').unique().notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  handle: text('handle').notNull(),
  linkedin_url: text('linkedin_url'),
  email: text('email'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Company information
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  website: text('website').notNull(),
  job_title: text('job_title').notNull(),
  twitter_handle: text('twitter_handle'),
  linkedin_url: text('linkedin_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Collaboration preferences
export const preferences = pgTable('preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  collabs_to_discover: text('collabs_to_discover').array(),
  collabs_to_host: text('collabs_to_host').array(),
  notification_frequency: text('notification_frequency').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Schema validation
export const insertUserSchema = createInsertSchema(users);
export const insertCompanySchema = createInsertSchema(companies);
export const insertPreferencesSchema = createInsertSchema(preferences);

// Types
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Preferences = typeof preferences.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;

// Constants for form options
export const COMPANY_CATEGORIES = [
  "Crypto", "NFT", "DeFi", "Web3 Gaming", "Memes & Culture", "Bitcoin",
  "Solana", "Ethereum", "Creator Economy", "Fundraising", "AI & Web3"
] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"] as const;

export const COLLAB_TYPES = [
  "Podcast Guest Appearances",
  "Twitter Spaces Guest",
  "Webinar Guest Appearance",
  "Keynote Speaking at Virtual Events",
  "Keynote Speaking at Real Events",
  "Medium Guest Posts",
  "Newsletter Features or Guest Posts",
  "Report and Research Features",
  "Co-Marketing on Twitter"
] as const;

export const NOTIFICATION_FREQUENCIES = ["Instant", "Daily", "Weekly"] as const;

// Onboarding schema with validation
export const onboardingSchema = z.object({
  // User Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  handle: z.string().min(1, "Telegram handle is required"),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().nullable(),

  // Company Information
  company_name: z.string().min(2, "Company name is required"),
  company_website: z.string().url("Please enter a valid website URL"),
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  company_category: z.enum(COMPANY_CATEGORIES),
  company_size: z.enum(COMPANY_SIZES),

  // Collaboration Preferences
  collabs_to_discover: z.array(z.enum(COLLAB_TYPES)).min(1, "Select at least one collaboration type to discover"),
  collabs_to_host: z.array(z.enum(COLLAB_TYPES)).min(1, "Select at least one collaboration type to host"),
  notification_frequency: z.enum(NOTIFICATION_FREQUENCIES),

  // Telegram data
  initData: z.string()
});

export type OnboardingData = z.infer<typeof onboardingSchema>;