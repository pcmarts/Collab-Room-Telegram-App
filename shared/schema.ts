import { pgTable, uuid, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Constants for form options
export const COLLAB_TYPES = [
  "Co-Marketing on Twitter",
  "Podcast Guest Appearance",
  "Twitter Spaces Guest",
  "Live Stream Guest Appearance",
  "Report & Research Feature",
  "Newsletter Feature",
  "Blog Post Feature"
] as const;

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
  "Real-World Assets (RWA)",
  "SocialFi",
  "Solana",
  "Stablecoins",
  "Web3 Gaming",
  "Web3 Marketing",
  "ZK Tech"
] as const;

export const NOTIFICATION_FREQUENCIES = ["Instant", "Daily", "Weekly"] as const;

export const FUNDING_STAGES = ["Not Applicable", "Pre-seed", "Seed", "Series A", "Series B+"] as const;

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

export const TWITTER_FOLLOWER_COUNTS = [
  "0-1K",
  "1K-10K",
  "10K-100K",
  "100K-500K",
  "500K+"
] as const;

export const TWITTER_COLLAB_TYPES = [
  "Thread Collab",
  "Joint Campaign",
  "Giveaway",
  "Twitter Space Co-Host",
  "Retweet & Boost",
  "Sponsored Tweet",
  "Poll/Q&A",
  "AMA",
  "Shoutout",
  "Tweet Swap",
  "Meme/Viral Collab",
  "Twitter List Collab",
  "Exclusive Announcement"
] as const;

export const AUDIENCE_SIZE_RANGES = [
  "Under 100",
  "100-500",
  "500-1,000",
  "1,000-5,000",
  "5,000-10,000",
  "10,000+"
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
    "Marketing & Growth Platforms",
    "Marketing Agency"
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
  referral_code: text('referral_code'),
  twitter_url: text('twitter_url'),
  twitter_followers: text('twitter_followers'),
  is_approved: boolean('is_approved').default(false),
  is_admin: boolean('is_admin').default(false),
  applied_at: timestamp('applied_at', { withTimezone: true }).defaultNow(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Company information
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  short_description: text('short_description'),
  long_description: text('long_description'),
  website: text('website').notNull(),
  job_title: text('job_title').notNull(),
  twitter_handle: text('twitter_handle'),
  twitter_followers: text('twitter_followers'),
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
  // General preferences
  collabs_to_discover: text('collabs_to_discover').array(),
  collabs_to_host: text('collabs_to_host').array(),
  twitter_collabs: text('twitter_collabs').array(),
  notification_frequency: text('notification_frequency').notNull(),
  excluded_tags: text('excluded_tags').array(),
  // Coffee match preferences
  coffee_match_enabled: boolean('coffee_match_enabled').default(false),
  coffee_match_company_sectors: text('coffee_match_company_sectors').array(),
  coffee_match_company_followers: text('coffee_match_company_followers'),
  coffee_match_user_followers: text('coffee_match_user_followers'),
  coffee_match_funding_stages: text('coffee_match_funding_stages').array(),
  coffee_match_token_status: boolean('coffee_match_token_status').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Collaborations table
export const collaborations = pgTable('collaborations', {
  id: uuid('id').primaryKey().defaultRandom(),
  creator_id: uuid('creator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  collab_type: text('collab_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'),
  // Common filtering criteria
  topics: text('topics').array(), // Standardized topics for the collaboration
  
  // Filter toggle states - tracking whether each filter is enabled
  filter_company_sectors_enabled: boolean('filter_company_sectors_enabled').default(false),
  filter_company_followers_enabled: boolean('filter_company_followers_enabled').default(false),
  filter_user_followers_enabled: boolean('filter_user_followers_enabled').default(false),
  filter_funding_stages_enabled: boolean('filter_funding_stages_enabled').default(false),
  filter_token_status_enabled: boolean('filter_token_status_enabled').default(false),
  
  // Filter criteria values
  required_company_sectors: text('required_company_sectors').array(),
  required_funding_stages: text('required_funding_stages').array(),
  required_token_status: boolean('required_token_status'),
  min_company_followers: text('min_company_followers'),
  min_user_followers: text('min_user_followers'),
  // Free collaboration confirmation
  is_free_collab: boolean('is_free_collab').notNull().default(true),
  // Type-specific details stored as JSON
  details: jsonb('details').notNull(),
  // Dates
  date_type: text('date_type').notNull(), // 'any_future_date' or 'specific_date'
  specific_date: text('specific_date'), // Store as simple text in YYYY-MM-DD format
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Collaboration applications
export const collab_applications = pgTable('collab_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  collaboration_id: uuid('collaboration_id').notNull().references(() => collaborations.id, { onDelete: 'cascade' }),
  applicant_id: uuid('applicant_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'), // pending, accepted, rejected
  message: text('message'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Collaboration matching notifications
export const collab_notifications = pgTable('collab_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  collaboration_id: uuid('collaboration_id').notNull().references(() => collaborations.id, { onDelete: 'cascade' }),
  application_id: uuid('application_id').references(() => collab_applications.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  content: text('content').notNull(),
  is_read: boolean('is_read').default(false),
  is_sent: boolean('is_sent').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Schema validation
export const insertUserSchema = createInsertSchema(users);
export const insertCompanySchema = createInsertSchema(companies);
export const insertPreferencesSchema = createInsertSchema(preferences);
export const insertEventSchema = createInsertSchema(events);
export const insertUserEventSchema = createInsertSchema(user_events);
export const insertCollaborationSchema = createInsertSchema(collaborations);
export const insertCollabApplicationSchema = createInsertSchema(collab_applications);
export const insertCollabNotificationSchema = createInsertSchema(collab_notifications);

// Types
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Preferences = typeof preferences.$inferSelect;
export type Event = typeof events.$inferSelect;
export type UserEvent = typeof user_events.$inferSelect;
export type Collaboration = typeof collaborations.$inferSelect;
export type CollabApplication = typeof collab_applications.$inferSelect;
export type CollabNotification = typeof collab_notifications.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
export type InsertCollabApplication = z.infer<typeof insertCollabApplicationSchema>;
export type InsertCollabNotification = z.infer<typeof insertCollabNotificationSchema>;

// Onboarding schema with validation
// Rename to applicationSchema for clarity
export const applicationSchema = z.object({
  // User Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  handle: z.string().min(1, "Telegram handle is required"),
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().nullable(),
  email: z.string().email("Please enter a valid email").optional().nullable(),
  referral_code: z.string().optional(),
  twitter_url: z.string().url("Please enter a valid Twitter URL").optional().nullable(),
  twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),

  // Company Information
  company_name: z.string().min(2, "Company name is required"),
  company_website: z.string().url("Please enter a valid website URL"),
  short_description: z.string().max(150, "Short description must be less than 150 characters").optional(),
  long_description: z.string().max(1000, "Long description must be less than 1000 characters").optional(),
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  job_title: z.string().min(1, "Job title is required"),
  funding_stage: z.enum(FUNDING_STAGES),
  has_token: z.boolean(),
  token_ticker: z.string().optional(),
  blockchain_networks: z.array(z.enum(BLOCKCHAIN_NETWORKS)).optional(),
  company_tags: z.array(z.string()).optional(),
  company_twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional(),

  // Telegram data
  initData: z.string()
});

export type ApplicationData = z.infer<typeof applicationSchema>;

// Collaboration application schema for the form
export const collabApplicationSchema = z.object({
  reason: z.string().min(1, "Please explain why you're interested in this collaboration"),
  experience: z.string().min(1, "Please describe your relevant experience"),
  portfolioLinks: z.string().optional(),
  twitterHandle: z.string().min(1, "Your Twitter handle is required"),
  githubHandle: z.string().optional(),
  notes: z.string().optional(),
});

export type CollabApplicationData = z.infer<typeof collabApplicationSchema>;

// Collaboration type schemas
// Podcast Guest Appearance
export const podcastDetailsSchema = z.object({
  podcast_name: z.string().min(2, "Podcast name is required"),
  short_description: z.string().max(200, "Short description must be less than 200 characters"),
  podcast_link: z.string().url("Please enter a valid podcast link")
});

// Twitter Spaces Guest
export const twitterSpacesDetailsSchema = z.object({
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  space_topic: z.array(z.string()).min(1, "At least one topic is required"),
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS)
});

// Live Stream Guest Appearance
export const liveStreamDetailsSchema = z.object({
  title: z.string().min(2, "Title is required"),
  short_description: z.string().max(200, "Short description must be less than 200 characters"),
  date_selection: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  previous_stream_link: z.string().url("Please enter a valid stream link").optional(),
  expected_audience_size: z.enum(AUDIENCE_SIZE_RANGES),
  topics: z.array(z.string()).min(1, "At least one topic is required")
});

// Report & Research Feature
export const researchReportDetailsSchema = z.object({
  research_topic: z.array(z.string()).min(1, "At least one topic is required"),
  target_audience: z.string().min(2, "Target audience is required"),
  estimated_release_date: z.string()
});

// Newsletter Feature
export const newsletterDetailsSchema = z.object({
  newsletter_name: z.string().min(2, "Newsletter name is required"),
  topics: z.array(z.enum(COLLAB_TOPICS)).min(1, "At least one topic is required"),
  audience_reach: z.enum(AUDIENCE_SIZE_RANGES),
  short_description: z.string().max(200, "Short description must be less than 200 characters")
});

// Blog Post Feature
export const blogPostDetailsSchema = z.object({
  blog_topic: z.string().min(2, "Blog topic is required"),
  blog_link: z.string().url("Please enter a valid blog link"),
  estimated_release_date: z.string()
});

// Co-Marketing on Twitter
export const twitterCoMarketingDetailsSchema = z.object({
  collaboration_types: z.array(z.enum(TWITTER_COLLAB_TYPES)).min(1, "At least one Twitter collaboration type is required"),
  host_twitter_handle: z.string().min(1, "Host Twitter handle is required"),
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS)
});

// Create a Collaboration schema that combines all the types
export const createCollaborationSchema = z.object({
  collab_type: z.enum(COLLAB_TYPES),
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Description is required"),
  date_type: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  
  // Topics for the collaboration
  topics: z.array(z.enum(COLLAB_TOPICS)).min(1, "At least one topic is required"),
  
  // Free collaboration confirmation
  is_free_collab: z.boolean().refine(val => val === true, {
    message: "You must confirm this is a free collaboration with no payments involved"
  }),
  
  // Filter toggle states
  filter_company_sectors_enabled: z.boolean().optional().default(false),
  filter_company_followers_enabled: z.boolean().optional().default(false),
  filter_user_followers_enabled: z.boolean().optional().default(false),
  filter_funding_stages_enabled: z.boolean().optional().default(false),
  filter_token_status_enabled: z.boolean().optional().default(false),
  
  // Filtering criteria
  required_company_sectors: z.array(z.string()).optional(),
  required_funding_stages: z.array(z.enum(FUNDING_STAGES)).optional(),
  required_token_status: z.boolean().optional(),
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
    twitterCoMarketingDetailsSchema
  ])
});

export type CreateCollaboration = z.infer<typeof createCollaborationSchema>;