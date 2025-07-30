import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import collaboration types from the new registry system
import { COLLABORATION_TYPE_DEFINITIONS } from './collaboration-types/definitions';

// Constants for form options - now powered by the collaboration types registry
// This maintains backward compatibility while using the new centralized system
const activeCollabTypeNames = COLLABORATION_TYPE_DEFINITIONS
  .filter(type => type.isActive)
  .map(type => type.name);

export const COLLAB_TYPES = [
  "Twitter Spaces Guest",
  "Co-Marketing on Twitter", 
  "Podcast Guest Appearance",
  "Live Stream Guest Appearance",
  "Report & Research Feature",
  "Newsletter Feature",
  "Blog Post Feature",
] as const;

// Verify that our registry contains all the expected types
if (process.env.NODE_ENV === 'development') {
  const registryNames = new Set(activeCollabTypeNames);
  const hardcodedNames = new Set([...COLLAB_TYPES]);
  
  // Check if all hardcoded types exist in registry
  hardcodedNames.forEach(name => {
    if (!registryNames.has(name)) {
      console.warn(`⚠️ Collaboration type "${name}" missing from registry`);
    }
  });
}

// Standardized topic list used throughout the app
export const COLLAB_TOPICS = [
  "AI",
  "Airdrops",
  "Bitcoin",
  "Creator Economy",
  "Crypto",
  "DeFi",
  "Ethereum",
  "Fundraising",
  "Infrastructure",
  "Memes & Culture",
  "NFT",
  "Real-World Assets",
  "SocialFi",
  "Solana",
  "Stablecoins",
  "Web3 Gaming",
  "Web3 Marketing",
  "ZK Tech",
] as const;

export const NOTIFICATION_FREQUENCIES = ["Instant", "Daily", "Weekly"] as const;

export const FUNDING_STAGES = [
  "Not Applicable",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B+",
] as const;

export const BLOCKCHAIN_NETWORKS = [
  "Bitcoin",
  "Ethereum",
  "Binance Smart Chain (BSC)",
  "Solana",
  "Ripple",
  "Sui",
  "Polygon",
  "Avalanche",
  "Cardano",
  "Cosmos",
  "Polkadot",
  "Tron",
  "Near Protocol",
  "Fantom",
  "Tezos",
  "Stellar",
  "Algorand",
  "Hedera",
  "Internet Computer (ICP)",
  "Elrond (MultiversX)",
  "Kava",
  "EOS",
  "Arbitrum",
  "Optimism",
  "Base",
  "Linea",
  "Scroll",
  "Lightning Network",
  "Starknet",
  "zkSync",
  "Injective",
  "Mantle",
  "Metis",
  "Other",
] as const;

export const BLOCKCHAIN_NETWORK_CATEGORIES = {
  "Layer 1 Blockchains": [
    "Bitcoin",
    "Ethereum",
    "Binance Smart Chain (BSC)",
    "Solana",
    "Ripple",
    "Sui",
    "Avalanche",
    "Cardano",
    "Cosmos",
    "Polkadot",
    "Tron",
    "Near Protocol",
    "Fantom",
    "Tezos",
    "Stellar",
    "Algorand",
    "Hedera",
    "Internet Computer (ICP)",
    "Elrond (MultiversX)",
    "EOS",
  ],
  "Layer 2 & Sidechains": [
    "Arbitrum",
    "Optimism",
    "Base",
    "Polygon",
    "Linea",
    "Scroll",
    "Lightning Network",
    "Starknet",
    "zkSync",
    "Injective",
    "Mantle",
    "Metis",
  ],
  "Other Networks": ["Other"],
} as const;

export const TWITTER_FOLLOWER_COUNTS = [
  "0-1K",
  "1K-10K",
  "10K-100K",
  "100K-500K",
  "500K+",
] as const;

export const TWITTER_COLLAB_TYPES = [
  "Thread Collab",
  "Joint Campaign",
  "Giveaway",
  "Retweet & Boost",
  "Sponsored Tweet",
  "Poll/Q&A",
  "Shoutout",
  "Tweet Swap",
  "Meme/Viral Collab",
  "Twitter List Collab",
  "Exclusive Announcement",
] as const;

export const AUDIENCE_SIZE_RANGES = [
  "Under 100",
  "100-500",
  "500-1,000",
  "1,000-5,000",
  "5,000-10,000",
  "10,000+",
] as const;



// Company Tags by Category
export const COMPANY_TAG_CATEGORIES = {
  "Core Blockchain Infrastructure": [
    "L1 (Layer 1 Blockchains)",
    "L2 & Scaling Solutions",
    "Interoperability & Bridges",
  ],
  "Finance & Tokenization": [
    "Stablecoins & Payments",
    "Finance",
    "Trading",
    "Fundraising",
    "RWA",
    "Lending & Borrowing",
    "Market Making / Liquidity",
    "Yield Farming & Staking",
  ],
  "Web3 Sectors & Use Cases": [
    "Gaming",
    "NFTs & Digital Collectibles",
    "Metaverse",
    "SocialFi",
    "Music & Entertainment",
    "Gambling & Betting",
    "MEMES & Culture Tokens",
  ],
  "Emerging & Niche Web3 Technologies": [
    "AI",
    "AI Agents",
    "DeFAI",
    "DePIN",
    "Decentralized Compute & Storage",
    "Data & Oracles",
  ],
  "Governance, Security & Identity": [
    "DAO",
    "Identity & Privacy",
    "Security & Auditing",
  ],
  "Marketing, Growth & Creators": [
    "Marketing & Growth Platforms",
    "Creator",
    "Marketing Agency",
  ],
  "Infrastructure & Developer Tools": [
    "Smart Contract Development Platforms",
    "No-Code/Low-Code Web3 Tools",
    "Blockchain Analytics & Insights",
    "Indexing & Querying",
  ],
} as const;

// Create a flat array of all tags for validation
export const ALL_COMPANY_TAGS = Object.values(COMPANY_TAG_CATEGORIES).flat();

export const COMPANY_CATEGORIES = [
  "Crypto",
  "NFT",
  "DeFi",
  "Web3 Gaming",
  "Memes & Culture",
  "Bitcoin",
  "Solana",
  "Ethereum",
  "Creator Economy",
  "Fundraising",
  "AI & Web3",
] as const;

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"] as const;

// Core user table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: text("telegram_id").unique().notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name"),
  handle: text("handle").notNull(),
  linkedin_url: text("linkedin_url"),
  email: text("email"),
  referral_code: text("referral_code"),
  twitter_url: text("twitter_url"),
  twitter_followers: text("twitter_followers"),
  is_approved: boolean("is_approved").default(false),
  is_admin: boolean("is_admin").default(false),
  applied_at: timestamp("applied_at", { withTimezone: true }).defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // New referral-related fields
  referred_by: uuid("referred_by").references(() => users.id, { onDelete: "set null" }),
  approved_at: timestamp("approved_at", { withTimezone: true }),
}, (table) => {
  return {
    // Index for users.id since it's frequently used in joins with other tables
    userIdIdx: index("user_id_idx").on(table.id),
    // Index for telegram_id since it's the primary lookup field for Telegram bot interactions
    telegramIdIdx: index("telegram_id_idx").on(table.telegram_id),
  };
});

// Company information
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  short_description: text("short_description"),
  long_description: text("long_description"),
  website: text("website").notNull(),
  job_title: text("job_title").notNull(),
  twitter_handle: text("twitter_handle"),
  twitter_followers: text("twitter_followers"),
  linkedin_url: text("linkedin_url"),
  funding_stage: text("funding_stage").notNull(),
  has_token: boolean("has_token").default(false),
  token_ticker: text("token_ticker"),
  blockchain_networks: text("blockchain_networks").array(),
  tags: text("tags").array(),
  logo_url: text("logo_url"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    // Index for companies.user_id for joins with users table
    companyUserIdIdx: index("company_user_id_idx").on(table.user_id),
  };
});





// Notification preferences
export const notification_preferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notifications_enabled: boolean("notifications_enabled").default(true),
  notification_frequency: text("notification_frequency", {
    enum: NOTIFICATION_FREQUENCIES,
  })
    .notNull()
    .default("Daily"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  last_notified_at: timestamp("last_notified_at", { withTimezone: true }),
});

// Marketing collaboration preferences
export const marketing_preferences = pgTable("marketing_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Marketing specific preferences
  collabs_to_discover: text("collabs_to_discover").array(),
  collabs_to_host: text("collabs_to_host").array(),
  twitter_collabs: text("twitter_collabs").array(),
  filtered_marketing_topics: text("filtered_marketing_topics").array(), // Renamed from excluded_tags

  // Matching user and company fields for consistent filtering - same structure as user and company tables
  twitter_followers: text("twitter_followers"), // Match user.twitter_followers field
  company_twitter_followers: text("company_twitter_followers"), // Match companies.twitter_followers field
  funding_stage: text("funding_stage"), // Match companies.funding_stage field
  company_has_token: boolean("company_has_token").default(false), // Match companies.has_token field
  company_token_ticker: text("company_token_ticker"), // Match companies.token_ticker field
  company_blockchain_networks: text("company_blockchain_networks").array(), // Match companies.blockchain_networks field
  company_tags: text("company_tags").array(), // Match companies.tags field

  // Discovery feed filter toggle states
  discovery_filter_enabled: boolean("discovery_filter_enabled").default(false),
  discovery_filter_collab_types_enabled: boolean(
    "discovery_filter_collab_types_enabled",
  ).default(false),
  discovery_filter_topics_enabled: boolean(
    "discovery_filter_topics_enabled",
  ).default(false),
  discovery_filter_company_followers_enabled: boolean(
    "discovery_filter_company_followers_enabled",
  ).default(false),
  discovery_filter_user_followers_enabled: boolean(
    "discovery_filter_user_followers_enabled",
  ).default(false),
  discovery_filter_funding_stages_enabled: boolean(
    "discovery_filter_funding_stages_enabled",
  ).default(false),
  discovery_filter_token_status_enabled: boolean(
    "discovery_filter_token_status_enabled",
  ).default(false),
  discovery_filter_company_sectors_enabled: boolean(
    "discovery_filter_company_sectors_enabled",
  ).default(false),
  discovery_filter_blockchain_networks_enabled: boolean(
    "discovery_filter_blockchain_networks_enabled",
  ).default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    // Index for marketing_preferences.user_id for joining with users
    marketingPrefUserIdIdx: index("marketing_pref_user_id_idx").on(table.user_id),
    // Composite index for common filter combinations
    marketingFilterIdx: index("marketing_filter_idx").on(
      table.discovery_filter_enabled, 
      table.discovery_filter_collab_types_enabled
    )
  };
});



// Collaborations table
export const collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  collab_type: text("collab_type").notNull(),
  status: text("status").notNull().default("active"),
  description: text("description"), // Common description field for all collaboration types
  // Common filtering criteria
  topics: text("topics").array(), // Standardized topics for the collaboration

  // Matching user and company fields for consistent filtering - same structure as user and company tables
  twitter_followers: text("twitter_followers"), // Match user.twitter_followers field
  company_twitter_followers: text("company_twitter_followers"), // Match companies.twitter_followers field
  funding_stage: text("funding_stage"), // Match companies.funding_stage field
  company_has_token: boolean("company_has_token").default(false), // Match companies.has_token field
  company_token_ticker: text("company_token_ticker"), // Match companies.token_ticker field
  company_blockchain_networks: text("company_blockchain_networks").array(), // Match companies.blockchain_networks field
  company_tags: text("company_tags").array(), // Match companies.tags field

  // Filter toggle states - tracking whether each filter is enabled
  filter_company_sectors_enabled: boolean(
    "filter_company_sectors_enabled",
  ).default(false),
  filter_company_followers_enabled: boolean(
    "filter_company_followers_enabled",
  ).default(false),
  filter_user_followers_enabled: boolean(
    "filter_user_followers_enabled",
  ).default(false),
  filter_funding_stages_enabled: boolean(
    "filter_funding_stages_enabled",
  ).default(false),
  filter_token_status_enabled: boolean("filter_token_status_enabled").default(
    false,
  ),
  filter_blockchain_networks_enabled: boolean(
    "filter_blockchain_networks_enabled",
  ).default(false),

  // Legacy filter criteria values - keep for backward compatibility but use new fields above
  required_company_sectors: text("required_company_sectors").array(),
  required_funding_stages: text("required_funding_stages").array(),
  required_token_status: boolean("required_token_status"),
  required_blockchain_networks: text("required_blockchain_networks").array(),
  min_company_followers: text("min_company_followers"),
  min_user_followers: text("min_user_followers"),

  // Free collaboration confirmation
  is_free_collab: boolean("is_free_collab").notNull().default(true),
  // Type-specific details stored as JSON
  details: jsonb("details").notNull(),
  // Dates
  date_type: text("date_type").notNull(), // 'any_future_date' or 'specific_date'
  specific_date: text("specific_date"), // Store as simple text in YYYY-MM-DD format
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    // Index for collaborations.creator_id for joins with users table
    creatorIdIdx: index("collab_creator_id_idx").on(table.creator_id),
    // Index for collaborations.created_at used in sorting and pagination
    createdAtIdx: index("collab_created_at_idx").on(table.created_at),
    // Index for status field which is used in filtering
    statusIdx: index("collab_status_idx").on(table.status),
    // Composite index for creator_id + status (common filter combination)
    creatorStatusIdx: index("collab_creator_status_idx").on(table.creator_id, table.status)
  };
});

// Collaboration applications
export const collab_applications = pgTable("collab_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaboration_id: uuid("collaboration_id")
    .notNull()
    .references(() => collaborations.id, { onDelete: "cascade" }),
  applicant_id: uuid("applicant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  details: jsonb("details").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    // Index for collab_applications.collaboration_id for joins
    appCollabIdIdx: index("collab_app_collab_id_idx").on(table.collaboration_id),
    // Index for collab_applications.applicant_id for filtering by user
    appApplicantIdIdx: index("collab_app_applicant_id_idx").on(table.applicant_id),
    // Index for status field for filtering
    appStatusIdx: index("collab_app_status_idx").on(table.status)
  };
});

// Collaboration matching notifications table removed - notifications are sent directly via Telegram

// Unified requests table (replacing legacy swipes and matches tables)
export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaboration_id: uuid("collaboration_id")
    .notNull()
    .references(() => collaborations.id, { onDelete: "cascade" }),
  requester_id: uuid("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  host_id: uuid("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'hidden', 'skipped'
  note: text("note"), // Personalized message from requester
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    // Index for requests.collaboration_id for filtering
    requestCollabIdIdx: index("request_collab_id_idx").on(table.collaboration_id),
    // Index for requests.requester_id for filtering by requester
    requestRequesterIdIdx: index("request_requester_id_idx").on(table.requester_id),
    // Index for requests.host_id for filtering by host
    requestHostIdIdx: index("request_host_id_idx").on(table.host_id),
    // Index for requests.status for filtering by status
    requestStatusIdx: index("request_status_idx").on(table.status),
    // Composite index for host_id + status for common queries
    hostStatusIdx: index("request_host_status_idx").on(table.host_id, table.status),
    // Composite index for requester_id + status for common queries
    requesterStatusIdx: index("request_requester_status_idx").on(table.requester_id, table.status)
  };
});

// Combined table for referral tracking and limits
export const user_referrals = pgTable("user_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referral_code: text("referral_code").notNull().unique(),
  total_available: integer("total_available").notNull().default(3),
  total_used: integer("total_used").notNull().default(0),
  is_auto_approve: boolean("is_auto_approve").notNull().default(false), // Special codes that auto-approve users
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Table to track individual referrals
export const referral_events = pgTable("referral_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrer_id: uuid("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referred_user_id: uuid("referred_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, completed, expired
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users);
export const insertCompanySchema = createInsertSchema(companies);

export const insertNotificationPreferencesSchema = createInsertSchema(
  notification_preferences,
);
export const insertMarketingPreferencesSchema = createInsertSchema(
  marketing_preferences,
);
export const insertCollaborationSchema = createInsertSchema(collaborations);
export const insertCollabApplicationSchema = createInsertSchema(collab_applications);

// Collab notification schema removed - notifications are sent directly via Telegram
// Legacy schema exports removed - swipes and matches tables have been deleted
export const insertRequestSchema = createInsertSchema(requests);

// Referral-related schemas
export const referralCodeSchema = z.string().regex(/^[0-9]+_[a-f0-9]{8}$/, 
  "Invalid referral code format");
export const insertUserReferralSchema = createInsertSchema(user_referrals, {
  referral_code: referralCodeSchema,
});
export const insertReferralEventSchema = createInsertSchema(referral_events);

// Types
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;

export type NotificationPreferences =
  typeof notification_preferences.$inferSelect;
export type MarketingPreferences = typeof marketing_preferences.$inferSelect;
export type Collaboration = typeof collaborations.$inferSelect;

// CollabNotification type removed - notifications are sent directly via Telegram
// Legacy types removed - swipes and matches tables have been deleted
export type Request = typeof requests.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type InsertNotificationPreferences = z.infer<
  typeof insertNotificationPreferencesSchema
>;
export type InsertMarketingPreferences = z.infer<
  typeof insertMarketingPreferencesSchema
>;
// Event and conference preference types removed - features have been simplified
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
// InsertCollabNotification type removed - notifications are sent directly via Telegram
// Legacy insert types removed - swipes and matches tables have been deleted
export type InsertRequest = z.infer<typeof insertRequestSchema>;

// Referral system types
export type UserReferral = typeof user_referrals.$inferSelect;
export type InsertUserReferral = z.infer<typeof insertUserReferralSchema>;
export type ReferralEvent = typeof referral_events.$inferSelect;
export type InsertReferralEvent = z.infer<typeof insertReferralEventSchema>;

// Onboarding schema with validation
// Rename to applicationSchema for clarity
export const applicationSchema = z.object({
  // User Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  handle: z.string().optional(), // Made optional since not all Telegram users have usernames
  linkedin_url: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .nullable(),
  email: z.string().email("Please enter a valid email").optional().nullable(),
  referral_code: z.string().optional().nullable(), // Updated to match the database schema
  twitter_url: z
    .string()
    .url("Please enter a valid Twitter URL")
    .optional()
    .nullable(),
  twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),

  // Company Information
  company_name: z.string().min(2, "Company name is required"),
  company_website: z.string().url("Please enter a valid website URL"),
  company_linkedin_url: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .nullable(), // Added company LinkedIn URL
  short_description: z
    .string()
    .max(150, "Short description must be less than 150 characters")
    .optional(),
  long_description: z
    .string()
    .max(1000, "Long description must be less than 1000 characters")
    .optional(),
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  company_twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(), // Added company Twitter followers
  job_title: z.string().min(1, "Job title is required"),
  funding_stage: z.enum(FUNDING_STAGES),
  has_token: z.boolean(),
  token_ticker: z.string().optional(),
  blockchain_networks: z.array(z.enum(BLOCKCHAIN_NETWORKS)).optional(),
  company_tags: z.array(z.string()).optional(),

  // Telegram data
  initData: z.string(),
});

export type ApplicationData = z.infer<typeof applicationSchema>;

// Collaboration application schema for the form
export const collabApplicationSchema = z.object({
  reason: z
    .string()
    .min(1, "Please explain why you're interested in this collaboration"),
  experience: z.string().min(1, "Please describe your relevant experience"),
  portfolioLinks: z.string().optional(),
  twitterHandle: z.string().min(1, "Your Twitter handle is required"),
  githubHandle: z.string().optional(),
  notes: z.string().optional(),
});

export type CollabApplicationData = z.infer<typeof collabApplicationSchema>;

// Use the actual table type
export type CollabApplication = typeof collab_applications.$inferSelect;

// Collaboration type schemas
// Podcast Guest Appearance
export const podcastDetailsSchema = z.object({
  podcast_name: z.string().min(2, "Podcast name is required"),
  short_description: z
    .string()
    .max(200, "Short description must be less than 200 characters")
    .optional(),
  // Removed podcast_description field in favor of the short_description field
  podcast_link: z.string().url("Please enter a valid podcast link"),
  estimated_reach: z.enum(AUDIENCE_SIZE_RANGES).optional(),
});

// Twitter Spaces Guest
export const twitterSpacesDetailsSchema = z.object({
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  // Added short_description field needed for Twitter Spaces
  short_description: z
    .string()
    .max(180, "Short description must be less than 180 characters")
    .optional(),
  // Removed space_topic validation as topics are captured at the top level
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS),
});

// Live Stream Guest Appearance
export const liveStreamDetailsSchema = z.object({
  title: z.string().min(2, "Title is required"),
  short_description: z
    .string()
    .max(200, "Short description must be less than 200 characters")
    .optional(),
  date_selection: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  stream_platform: z
    .string()
    .min(2, "Streaming platform is required")
    .optional(),
  previous_stream_link: z
    .string()
    .url("Please enter a valid stream link")
    .optional(),
  audience_size: z.enum(AUDIENCE_SIZE_RANGES).optional(),
  expected_audience_size: z.enum(AUDIENCE_SIZE_RANGES),
  // Removed topics validation as topics are captured at the top level
});

// Report & Research Feature
export const researchReportDetailsSchema = z.object({
  report_name: z.string().min(2, "Report name is required").optional(),
  // Removed research_topic validation as topics are captured at the top level
  research_topic: z.array(z.string()).optional(),
  target_audience: z.string().min(2, "Target audience is required"),
  short_description: z
    .string()
    .max(200, "Short description must be less than 200 characters")
    .optional(),
  audience_reach: z.enum(AUDIENCE_SIZE_RANGES).optional(),
  estimated_release_date: z.string(),
});

// Newsletter Feature
export const newsletterDetailsSchema = z.object({
  newsletter_name: z.string().min(2, "Newsletter name is required"),
  newsletter_url: z
    .string()
    .url("Please enter a valid newsletter URL")
    .optional(),
  // Removed topics validation as topics are captured at the top level of the form
  topics: z.array(z.enum(COLLAB_TOPICS)).optional(),
  audience_reach: z.enum(AUDIENCE_SIZE_RANGES),
  total_subscribers: z.enum(AUDIENCE_SIZE_RANGES).optional(),
  short_description: z
    .string()
    .max(200, "Short description must be less than 200 characters")
    .optional(),
  // Removed newsletter_description field in favor of the short_description field
});

// Blog Post Feature
export const blogPostDetailsSchema = z.object({
  blog_name: z.string().min(2, "Blog name is required").optional(),
  blog_topic: z.string().optional(), // Make blog topic optional since we capture topics at the top level
  blog_link: z.string().url("Please enter a valid blog link"),
  short_description: z
    .string()
    .max(200, "Short description must be less than 200 characters")
    .optional(),
  est_readers: z.enum(AUDIENCE_SIZE_RANGES),
  estimated_release_date: z.string(),
});

// Co-Marketing on Twitter
export const twitterCoMarketingDetailsSchema = z.object({
  twittercomarketing_type: z
    .array(z.enum(TWITTER_COLLAB_TYPES))
    .min(1, "At least one Twitter collaboration type is required"),
  host_twitter_handle: z.string().min(1, "Host Twitter handle is required"),
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS),
  short_description: z
    .string()
    .min(1, "Short description is required")
    .max(180, "Short description must be 180 characters or less")
    .optional(), // Updated validation rules
});

// Create a Collaboration schema that combines all the types
export const createCollaborationSchema = z.object({
  collab_type: z.enum(COLLAB_TYPES),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters"),
  date_type: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),

  // Topics for the collaboration
  topics: z
    .array(z.enum(COLLAB_TOPICS))
    .min(1, "At least one topic is required"),

  // Free collaboration confirmation
  is_free_collab: z.boolean().refine((val) => val === true, {
    message:
      "You must confirm this is a free collaboration with no payments involved",
  }),

  // Standardized filtering fields matching user and company tables
  twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),
  company_twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),
  funding_stage: z.enum(FUNDING_STAGES).optional(),
  company_has_token: z.boolean().optional(),
  company_token_ticker: z.string().optional(),
  company_blockchain_networks: z.array(z.enum(BLOCKCHAIN_NETWORKS)).optional(),
  company_tags: z.array(z.string()).optional(),

  // Filter toggle states
  filter_company_sectors_enabled: z.boolean().optional().default(false),
  filter_company_followers_enabled: z.boolean().optional().default(false),
  filter_user_followers_enabled: z.boolean().optional().default(false),
  filter_funding_stages_enabled: z.boolean().optional().default(false),
  filter_token_status_enabled: z.boolean().optional().default(false),
  filter_blockchain_networks_enabled: z.boolean().optional().default(false),

  // Legacy filtering criteria (for backward compatibility)
  required_company_sectors: z.array(z.string()).optional(),
  required_funding_stages: z.array(z.enum(FUNDING_STAGES)).optional(),
  required_token_status: z.boolean().optional(),
  required_blockchain_networks: z.array(z.enum(BLOCKCHAIN_NETWORKS)).optional(),
  min_company_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),
  min_user_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),

  // Type-specific details
  details: z.union([
    podcastDetailsSchema,
    twitterSpacesDetailsSchema,
    liveStreamDetailsSchema,
    researchReportDetailsSchema,
    newsletterDetailsSchema,
    blogPostDetailsSchema,
    twitterCoMarketingDetailsSchema,
  ]),
});

export type CreateCollaboration = z.infer<typeof createCollaborationSchema>;
