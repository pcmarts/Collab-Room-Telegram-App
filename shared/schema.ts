import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Constants for form options
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

export const FUNDING_STAGES = ["Pre-seed", "Seed", "Series A", "Series B+"] as const;

export const BLOCKCHAIN_NETWORKS = [
  "Ethereum",
  "Binance Smart Chain (BSC)",
  "Solana",
  "Polygon",
  "Cardano",
  "Tron",
  "Tezos",
  "Stellar",
  "Avalanche",
  "Fantom",
  "Other"
] as const;

// Initial events data
export const INITIAL_EVENTS = [
  {
    name: "European Blockchain Convention",
    start_date: "2025-02-15",
    end_date: "2025-02-17",
    city: "Barcelona"
  },
  {
    name: "Blockchain Economy London Summit",
    start_date: "2025-02-27",
    end_date: "2025-02-28",
    city: "London"
  },
  // Add all other events...
  {
    name: "Web Summit",
    start_date: "2025-11-11",
    end_date: "2025-11-14",
    city: "Lisbon"
  }
] as const;

// Company Tags by Category
export const COMPANY_TAG_CATEGORIES = {
  "Core Blockchain Infrastructure": [
    "L1 (Layer 1 Blockchains)",
    "L2 & Scaling Solutions",
    "Interoperability & Bridges"
  ],
  "Finance & Tokenization": [
    "Stablecoins & Payments",
    "Finance",
    "Trading",
    "Fundraising",
    "RWA",
    "Lending & Borrowing",
    "Yield Farming & Staking"
  ],
  "Web3 Sectors & Use Cases": [
    "Gaming",
    "NFTs & Digital Collectibles",
    "Metaverse",
    "SocialFi",
    "Music & Entertainment",
    "Gambling & Betting",
    "MEMES & Culture Tokens"
  ],
  "Emerging & Niche Web3 Technologies": [
    "AI",
    "AI Agents",
    "DeFAI",
    "DePIN",
    "Decentralized Compute & Storage",
    "Data & Oracles"
  ],
  "Governance, Security & Identity": [
    "DAO",
    "Identity & Privacy",
    "Security & Auditing"
  ],
  "Marketing & Growth": [
    "Marketing & Growth Platforms"
  ],
  "Infrastructure & Developer Tools": [
    "Smart Contract Development Platforms",
    "No-Code/Low-Code Web3 Tools",
    "Blockchain Analytics & Insights",
    "Indexing & Querying"
  ]
} as const;

// Create a flat array of all tags for validation
export const ALL_COMPANY_TAGS = Object.values(COMPANY_TAG_CATEGORIES).flat();

export const COMPANY_CATEGORIES = [
  "Crypto", "NFT", "DeFi", "Web3 Gaming", "Memes & Culture", "Bitcoin",
  "Solana", "Ethereum", "Creator Economy", "Fundraising", "AI & Web3"
] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"] as const;

// Core user table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegram_id: text('telegram_id').unique().notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name'),
  handle: text('handle').notNull(),
  linkedin_url: text('linkedin_url'),
  email: text('email'),
  is_approved: boolean('is_approved').default(false),
  applied_at: timestamp('applied_at', { withTimezone: true }).defaultNow(),
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
  funding_stage: text('funding_stage').notNull(),
  has_token: boolean('has_token').default(false),
  token_ticker: text('token_ticker'),
  blockchain_networks: text('blockchain_networks').array(),
  tags: text('tags').array(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Events table
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  start_date: timestamp('start_date', { withTimezone: true }).notNull(),
  end_date: timestamp('end_date', { withTimezone: true }).notNull(),
  city: text('city').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// User events (for tracking which events users are attending)
export const user_events = pgTable('user_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event_id: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Collaboration preferences
export const preferences = pgTable('preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  collabs_to_discover: text('collabs_to_discover').array(),
  collabs_to_host: text('collabs_to_host').array(),
  notification_frequency: text('notification_frequency').notNull(),
  excluded_tags: text('excluded_tags').array(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Schema validation
export const insertUserSchema = createInsertSchema(users);
export const insertCompanySchema = createInsertSchema(companies);
export const insertPreferencesSchema = createInsertSchema(preferences);
export const insertEventSchema = createInsertSchema(events);
export const insertUserEventSchema = createInsertSchema(user_events);

// Types
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Preferences = typeof preferences.$inferSelect;
export type Event = typeof events.$inferSelect;
export type UserEvent = typeof user_events.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;

// Onboarding schema with validation
export const onboardingSchema = z.object({
  // User Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
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