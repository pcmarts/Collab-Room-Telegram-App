import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
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
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Company information
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  website: text('website').notNull(),
  category: text('category').notNull(),
  size: text('size').notNull(),
  twitter_handle: text('twitter_handle'),
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

// Onboarding schema
export const onboardingSchema = z.object({
  // User Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  handle: z.string().min(1, "Telegram handle is required"),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional(),

  // Company Information
  company_name: z.string().min(2, "Company name is required"),
  company_website: z.string().url("Please enter a valid website URL"),
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  company_category: z.enum([
    "Crypto", "NFT", "DeFi", "Web3 Gaming", "Memes & Culture", "Bitcoin",
    "Solana", "Ethereum", "Creator Economy", "Fundraising", "AI & Web3"
  ]),
  company_size: z.enum(["1-10", "11-50", "51-200", "200+"]),

  // Collaboration Preferences
  collabs_to_discover: z.array(z.string()).min(1, "Select at least one collaboration type to discover"),
  collabs_to_host: z.array(z.string()).min(1, "Select at least one collaboration type to host"),
  notification_frequency: z.enum(["Instant", "Daily", "Weekly"]),

  // Telegram data
  initData: z.string()
});

export type OnboardingData = z.infer<typeof onboardingSchema>;