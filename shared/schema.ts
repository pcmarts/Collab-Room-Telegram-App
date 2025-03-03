import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegram_id: text('telegram_id').unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  handle: text('handle'),
  linkedin_url: text('linkedin_url'),
  email: text('email'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  website: text('website').notNull(),
  logo_url: text('logo_url'),
  category: text('category').notNull(),
  size: text('size').notNull(),
  funding_stage: text('funding_stage'),
  geographic_focus: text('geographic_focus'),
  twitter_handle: text('twitter_handle'),
  linkedin_url: text('linkedin_url'),
  telegram_group: text('telegram_group'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  collabs_to_discover: text('collabs_to_discover').array(),
  collabs_to_host: text('collabs_to_host').array(),
  notification_frequency: text('notification_frequency').notNull(),
  additional_opportunities: text('additional_opportunities'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const userCompanyRelations = pgTable('user_company_relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const collaborations = pgTable('collaborations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  host_id: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  applicant_id: uuid('applicant_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('active'),
  tags: text('tags').array(),
  is_featured: boolean('is_featured').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const insertUserSchema = createInsertSchema(users);
export const insertCompanySchema = createInsertSchema(companies);
export const insertCollaborationSchema = createInsertSchema(collaborations);
export const insertUserCompanyRelationSchema = createInsertSchema(userCompanyRelations);
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Collaboration = typeof collaborations.$inferSelect;
export type UserCompanyRelation = typeof userCompanyRelations.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
export type InsertUserCompanyRelation = z.infer<typeof insertUserCompanyRelationSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export const onboardingSchema = z.object({
  // User Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  telegram_handle: z.string().min(1, "Telegram handle is required"),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL"),
  email: z.string().email("Invalid email").optional(),

  // Company Information
  company_name: z.string().min(2, "Company name is required"),
  job_title: z.string().min(2, "Job title is required"),
  company_website: z.string().url("Please enter a valid website URL"),
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  company_linkedin: z.string().url("Please enter a valid LinkedIn URL"),
  company_telegram: z.string().url("Please enter a valid Telegram group link").optional(),
  company_category: z.enum([
    "Crypto", "NFT", "DeFi", "Web3 Gaming", "Memes & Culture", "Bitcoin", 
    "Solana", "Ethereum", "Creator Economy", "Fundraising", "AI & Web3", 
    "Infrastructure", "DAOs", "Metaverse", "DEXs & Trading", 
    "Stablecoins & Payments", "Real World Assets (RWA)", "SocialFi", 
    "Identity & Privacy", "Security & Auditing", "Interoperability & Bridges", 
    "Data & Oracles", "ReFi (Regenerative Finance)", "Decentralized Compute & Storage"
  ]),
  company_size: z.enum(["1-10", "11-50", "51-200", "200+"]),
  funding_stage: z.enum(["Pre-seed", "Seed", "Series A", "Series B+"]),
  geographic_focus: z.enum([
    "Global", "North America", "Europe", "Asia", "Latin America", 
    "Africa", "Middle East", "Australia"
  ]),

  // Collaboration Preferences
  collabs_to_discover: z.array(z.string()).min(1, "Select at least one collaboration type to discover"),
  collabs_to_host: z.array(z.string()).min(1, "Select at least one collaboration type to host"),
  notification_frequency: z.enum(["Instant", "Daily", "Weekly"]),
  additional_opportunities: z.string().optional()
});

export type OnboardingData = z.infer<typeof onboardingSchema>;