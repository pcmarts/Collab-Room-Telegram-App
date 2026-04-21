var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/collaboration-types/constants.ts
var constants_exports = {};
__export(constants_exports, {
  COLLAB_TYPE_IDS: () => COLLAB_TYPE_IDS,
  DISPLAY_NAME_TO_ID_MAP: () => DISPLAY_NAME_TO_ID_MAP,
  ID_TO_DISPLAY_NAME_MAP: () => ID_TO_DISPLAY_NAME_MAP,
  getCollabTypeDisplayName: () => getCollabTypeDisplayName,
  getCollabTypeId: () => getCollabTypeId,
  normalizeCollabType: () => normalizeCollabType
});
function getCollabTypeId(displayName) {
  return DISPLAY_NAME_TO_ID_MAP[displayName] || null;
}
function getCollabTypeDisplayName(id) {
  return ID_TO_DISPLAY_NAME_MAP[id] || id;
}
function normalizeCollabType(type) {
  const id = getCollabTypeId(type);
  return id || type;
}
var COLLAB_TYPE_IDS, DISPLAY_NAME_TO_ID_MAP, ID_TO_DISPLAY_NAME_MAP;
var init_constants = __esm({
  "shared/collaboration-types/constants.ts"() {
    "use strict";
    COLLAB_TYPE_IDS = {
      TWITTER_SPACES: "twitter_spaces_guest",
      TWITTER_COMARKETING: "twitter_comarketing",
      PODCAST: "podcast_guest",
      LIVESTREAM: "livestream_guest",
      RESEARCH: "research_feature",
      NEWSLETTER: "newsletter_feature",
      BLOG_POST: "blog_post_feature"
    };
    DISPLAY_NAME_TO_ID_MAP = {
      // Current display names
      "Twitter Spaces Guest": COLLAB_TYPE_IDS.TWITTER_SPACES,
      "Co-Marketing on Twitter": COLLAB_TYPE_IDS.TWITTER_COMARKETING,
      "Podcast Guest Appearance": COLLAB_TYPE_IDS.PODCAST,
      "Live Stream Guest Appearance": COLLAB_TYPE_IDS.LIVESTREAM,
      "Report & Research Feature": COLLAB_TYPE_IDS.RESEARCH,
      "Newsletter Feature": COLLAB_TYPE_IDS.NEWSLETTER,
      "Blog Post Feature": COLLAB_TYPE_IDS.BLOG_POST,
      // Legacy names for backward compatibility
      "Twitter Spaces Guests": COLLAB_TYPE_IDS.TWITTER_SPACES,
      "Twitter Brand Collab": COLLAB_TYPE_IDS.TWITTER_COMARKETING,
      "Podcast Guests": COLLAB_TYPE_IDS.PODCAST,
      "Live Stream Guests": COLLAB_TYPE_IDS.LIVESTREAM
    };
    ID_TO_DISPLAY_NAME_MAP = {
      [COLLAB_TYPE_IDS.TWITTER_SPACES]: "Twitter Spaces Guest",
      [COLLAB_TYPE_IDS.TWITTER_COMARKETING]: "Co-Marketing on Twitter",
      [COLLAB_TYPE_IDS.PODCAST]: "Podcast Guest Appearance",
      [COLLAB_TYPE_IDS.LIVESTREAM]: "Live Stream Guest Appearance",
      [COLLAB_TYPE_IDS.RESEARCH]: "Report & Research Feature",
      [COLLAB_TYPE_IDS.NEWSLETTER]: "Newsletter Feature",
      [COLLAB_TYPE_IDS.BLOG_POST]: "Blog Post Feature"
    };
  }
});

// server/app.ts
import express2 from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  ALL_COMPANY_TAGS: () => ALL_COMPANY_TAGS,
  AUDIENCE_SIZE_RANGES: () => AUDIENCE_SIZE_RANGES,
  BLOCKCHAIN_NETWORKS: () => BLOCKCHAIN_NETWORKS,
  BLOCKCHAIN_NETWORK_CATEGORIES: () => BLOCKCHAIN_NETWORK_CATEGORIES,
  COLLAB_TOPICS: () => COLLAB_TOPICS,
  COLLAB_TYPES: () => COLLAB_TYPES,
  COMPANY_CATEGORIES: () => COMPANY_CATEGORIES,
  COMPANY_SIZES: () => COMPANY_SIZES,
  COMPANY_TAG_CATEGORIES: () => COMPANY_TAG_CATEGORIES,
  FUNDING_STAGES: () => FUNDING_STAGES,
  NOTIFICATION_FREQUENCIES: () => NOTIFICATION_FREQUENCIES,
  TWITTER_COLLAB_TYPES: () => TWITTER_COLLAB_TYPES,
  TWITTER_FOLLOWER_COUNTS: () => TWITTER_FOLLOWER_COUNTS,
  applicationSchema: () => applicationSchema,
  blogPostDetailsSchema: () => blogPostDetailsSchema,
  collabApplicationSchema: () => collabApplicationSchema,
  collab_applications: () => collab_applications,
  collaborations: () => collaborations,
  companies: () => companies,
  createCollaborationSchema: () => createCollaborationSchema,
  insertCollabApplicationSchema: () => insertCollabApplicationSchema,
  insertCollaborationSchema: () => insertCollaborationSchema,
  insertCompanySchema: () => insertCompanySchema,
  insertMarketingPreferencesSchema: () => insertMarketingPreferencesSchema,
  insertNotificationPreferencesSchema: () => insertNotificationPreferencesSchema,
  insertReferralEventSchema: () => insertReferralEventSchema,
  insertRequestSchema: () => insertRequestSchema,
  insertUserReferralSchema: () => insertUserReferralSchema,
  insertUserSchema: () => insertUserSchema,
  liveStreamDetailsSchema: () => liveStreamDetailsSchema,
  marketing_preferences: () => marketing_preferences,
  newsletterDetailsSchema: () => newsletterDetailsSchema,
  notification_preferences: () => notification_preferences,
  podcastDetailsSchema: () => podcastDetailsSchema,
  referralCodeSchema: () => referralCodeSchema,
  referral_events: () => referral_events,
  requests: () => requests,
  researchReportDetailsSchema: () => researchReportDetailsSchema,
  twitterCoMarketingDetailsSchema: () => twitterCoMarketingDetailsSchema,
  twitterSpacesDetailsSchema: () => twitterSpacesDetailsSchema,
  user_referrals: () => user_referrals,
  users: () => users
});
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// shared/collaboration-types/definitions.ts
import {
  Twitter,
  Mic,
  Video,
  FileText,
  Mail,
  BarChart,
  Coffee
} from "lucide-react";
var COLLABORATION_TYPE_DEFINITIONS = [
  {
    id: "twitter_spaces_guest",
    name: "Twitter Spaces Guest",
    shortName: "Spaces Guest",
    icon: Twitter,
    color: "blue",
    category: "social_media" /* SOCIAL_MEDIA */,
    isActive: true,
    metadata: {
      description: "Join as a guest speaker on Twitter Spaces",
      keywords: ["twitter", "spaces", "audio", "live", "social"],
      estimatedDuration: "30-60 minutes"
    }
  },
  {
    id: "twitter_comarketing",
    name: "Co-Marketing on Twitter",
    shortName: "Co-Marketing",
    icon: Twitter,
    color: "blue",
    category: "marketing" /* MARKETING */,
    isActive: true,
    metadata: {
      description: "Collaborative marketing campaigns on Twitter",
      keywords: ["twitter", "marketing", "campaign", "promotion", "social"],
      estimatedDuration: "Varies"
    }
  },
  {
    id: "podcast_guest",
    name: "Podcast Guest Appearance",
    shortName: "Podcast Guest",
    icon: Mic,
    color: "purple",
    category: "content" /* CONTENT */,
    isActive: true,
    metadata: {
      description: "Appear as a guest on podcasts",
      keywords: ["podcast", "guest", "audio", "interview", "content"],
      estimatedDuration: "30-90 minutes"
    }
  },
  {
    id: "livestream_guest",
    name: "Live Stream Guest Appearance",
    shortName: "Live Stream",
    icon: Video,
    color: "red",
    category: "content" /* CONTENT */,
    isActive: true,
    metadata: {
      description: "Join live streams as a guest",
      keywords: ["livestream", "stream", "video", "live", "guest"],
      estimatedDuration: "30-120 minutes"
    }
  },
  {
    id: "research_feature",
    name: "Report & Research Feature",
    shortName: "Research",
    icon: BarChart,
    color: "amber",
    category: "content" /* CONTENT */,
    isActive: true,
    metadata: {
      description: "Be featured in research reports and studies",
      keywords: ["research", "report", "data", "analysis", "feature"],
      estimatedDuration: "1-2 weeks"
    }
  },
  {
    id: "newsletter_feature",
    name: "Newsletter Feature",
    shortName: "Newsletter",
    icon: Mail,
    color: "indigo",
    category: "content" /* CONTENT */,
    isActive: true,
    metadata: {
      description: "Be featured in newsletters",
      keywords: ["newsletter", "feature", "email", "content", "marketing"],
      estimatedDuration: "1-2 weeks"
    }
  },
  {
    id: "blog_post_feature",
    name: "Blog Post Feature",
    shortName: "Blog Post",
    icon: FileText,
    color: "emerald",
    category: "content" /* CONTENT */,
    isActive: true,
    metadata: {
      description: "Be featured in blog posts",
      keywords: ["blog", "post", "feature", "content", "writing"],
      estimatedDuration: "1-3 weeks"
    }
  },
  {
    id: "conference_coffee",
    name: "Conference Coffee",
    shortName: "Coffee",
    icon: Coffee,
    color: "orange",
    category: "events" /* EVENTS */,
    isActive: true,
    metadata: {
      description: "Meet for coffee at conferences and events",
      keywords: ["conference", "coffee", "meeting", "networking", "event"],
      estimatedDuration: "30-60 minutes"
    }
  }
];

// shared/schema.ts
var activeCollabTypeNames = COLLABORATION_TYPE_DEFINITIONS.filter((type) => type.isActive).map((type) => type.name);
var COLLAB_TYPES = [
  "Twitter Spaces Guest",
  "Co-Marketing on Twitter",
  "Podcast Guest Appearance",
  "Live Stream Guest Appearance",
  "Report & Research Feature",
  "Newsletter Feature",
  "Blog Post Feature"
];
if (process.env.NODE_ENV === "development") {
  const registryNames = new Set(activeCollabTypeNames);
  const hardcodedNames = /* @__PURE__ */ new Set([...COLLAB_TYPES]);
  hardcodedNames.forEach((name) => {
    if (!registryNames.has(name)) {
      console.warn(`\u26A0\uFE0F Collaboration type "${name}" missing from registry`);
    }
  });
}
var COLLAB_TOPICS = [
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
  "ZK Tech"
];
var NOTIFICATION_FREQUENCIES = ["Instant", "Daily", "Weekly"];
var FUNDING_STAGES = [
  "Not Applicable",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B+"
];
var BLOCKCHAIN_NETWORKS = [
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
  "Other"
];
var BLOCKCHAIN_NETWORK_CATEGORIES = {
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
    "EOS"
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
    "Metis"
  ],
  "Other Networks": ["Other"]
};
var TWITTER_FOLLOWER_COUNTS = [
  "0-1K",
  "1K-10K",
  "10K-100K",
  "100K-500K",
  "500K+"
];
var TWITTER_COLLAB_TYPES = [
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
  "Exclusive Announcement"
];
var AUDIENCE_SIZE_RANGES = [
  "Under 100",
  "100-500",
  "500-1,000",
  "1,000-5,000",
  "5,000-10,000",
  "10,000+"
];
var COMPANY_TAG_CATEGORIES = {
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
    "Market Making / Liquidity",
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
  "Marketing, Growth & Creators": [
    "Marketing & Growth Platforms",
    "Creator",
    "Marketing Agency"
  ],
  "Infrastructure & Developer Tools": [
    "Smart Contract Development Platforms",
    "No-Code/Low-Code Web3 Tools",
    "Blockchain Analytics & Insights",
    "Indexing & Querying"
  ]
};
var ALL_COMPANY_TAGS = Object.values(COMPANY_TAG_CATEGORIES).flat();
var COMPANY_CATEGORIES = [
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
  "AI & Web3"
];
var COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"];
var users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: text("telegram_id").unique().notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name"),
  handle: text("handle"),
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
  approved_at: timestamp("approved_at", { withTimezone: true })
}, (table) => {
  return {
    // Index for users.id since it's frequently used in joins with other tables
    userIdIdx: index("user_id_idx").on(table.id),
    // Index for telegram_id since it's the primary lookup field for Telegram bot interactions
    telegramIdIdx: index("telegram_id_idx").on(table.telegram_id)
  };
});
var companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  short_description: text("short_description"),
  long_description: text("long_description"),
  website: text("website").notNull(),
  job_title: text("job_title").notNull(),
  twitter_handle: text("twitter_handle"),
  twitter_followers: text("twitter_followers"),
  linkedin_url: text("linkedin_url"),
  funding_stage: text("funding_stage"),
  has_token: boolean("has_token").default(false),
  token_ticker: text("token_ticker"),
  blockchain_networks: text("blockchain_networks").array(),
  tags: text("tags").array(),
  logo_url: text("logo_url"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow()
}, (table) => {
  return {
    // Index for companies.user_id for joins with users table
    companyUserIdIdx: index("company_user_id_idx").on(table.user_id)
  };
});
var notification_preferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notifications_enabled: boolean("notifications_enabled").default(true),
  notification_frequency: text("notification_frequency", {
    enum: NOTIFICATION_FREQUENCIES
  }).notNull().default("Daily"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  last_notified_at: timestamp("last_notified_at", { withTimezone: true })
});
var marketing_preferences = pgTable("marketing_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Marketing specific preferences
  collabs_to_discover: text("collabs_to_discover").array(),
  collabs_to_host: text("collabs_to_host").array(),
  twitter_collabs: text("twitter_collabs").array(),
  filtered_marketing_topics: text("filtered_marketing_topics").array(),
  // Renamed from excluded_tags
  // Matching user and company fields for consistent filtering - same structure as user and company tables
  twitter_followers: text("twitter_followers"),
  // Match user.twitter_followers field
  company_twitter_followers: text("company_twitter_followers"),
  // Match companies.twitter_followers field
  funding_stage: text("funding_stage"),
  // Match companies.funding_stage field
  company_has_token: boolean("company_has_token").default(false),
  // Match companies.has_token field
  company_token_ticker: text("company_token_ticker"),
  // Match companies.token_ticker field
  company_blockchain_networks: text("company_blockchain_networks").array(),
  // Match companies.blockchain_networks field
  company_tags: text("company_tags").array(),
  // Match companies.tags field
  // Discovery feed filter toggle states
  discovery_filter_enabled: boolean("discovery_filter_enabled").default(false),
  discovery_filter_collab_types_enabled: boolean(
    "discovery_filter_collab_types_enabled"
  ).default(false),
  discovery_filter_topics_enabled: boolean(
    "discovery_filter_topics_enabled"
  ).default(false),
  discovery_filter_company_followers_enabled: boolean(
    "discovery_filter_company_followers_enabled"
  ).default(false),
  discovery_filter_user_followers_enabled: boolean(
    "discovery_filter_user_followers_enabled"
  ).default(false),
  discovery_filter_funding_stages_enabled: boolean(
    "discovery_filter_funding_stages_enabled"
  ).default(false),
  discovery_filter_token_status_enabled: boolean(
    "discovery_filter_token_status_enabled"
  ).default(false),
  discovery_filter_company_sectors_enabled: boolean(
    "discovery_filter_company_sectors_enabled"
  ).default(false),
  discovery_filter_blockchain_networks_enabled: boolean(
    "discovery_filter_blockchain_networks_enabled"
  ).default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow()
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
var collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  collab_type: text("collab_type").notNull(),
  status: text("status").notNull().default("active"),
  title: text("title").notNull().default(""),
  description: text("description"),
  // Common description field for all collaboration types
  has_compensation: boolean("has_compensation").notNull().default(false),
  compensation_details: text("compensation_details"),
  additional_requirements: text("additional_requirements"),
  // Common filtering criteria
  topics: text("topics").array(),
  // Standardized topics for the collaboration
  // Matching user and company fields for consistent filtering - same structure as user and company tables
  twitter_followers: text("twitter_followers"),
  // Match user.twitter_followers field
  company_twitter_followers: text("company_twitter_followers"),
  // Match companies.twitter_followers field
  funding_stage: text("funding_stage"),
  // Match companies.funding_stage field
  company_has_token: boolean("company_has_token").default(false),
  // Match companies.has_token field
  company_token_ticker: text("company_token_ticker"),
  // Match companies.token_ticker field
  company_blockchain_networks: text("company_blockchain_networks").array(),
  // Match companies.blockchain_networks field
  company_tags: text("company_tags").array(),
  // Match companies.tags field
  // Filter toggle states - tracking whether each filter is enabled
  filter_company_sectors_enabled: boolean(
    "filter_company_sectors_enabled"
  ).default(false),
  filter_company_followers_enabled: boolean(
    "filter_company_followers_enabled"
  ).default(false),
  filter_user_followers_enabled: boolean(
    "filter_user_followers_enabled"
  ).default(false),
  filter_funding_stages_enabled: boolean(
    "filter_funding_stages_enabled"
  ).default(false),
  filter_token_status_enabled: boolean("filter_token_status_enabled").default(
    false
  ),
  filter_blockchain_networks_enabled: boolean(
    "filter_blockchain_networks_enabled"
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
  date_type: text("date_type").notNull(),
  // 'any_future_date' or 'specific_date'
  specific_date: text("specific_date"),
  // Store as simple text in YYYY-MM-DD format
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow()
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
var collab_applications = pgTable("collab_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaboration_id: uuid("collaboration_id").notNull().references(() => collaborations.id, { onDelete: "cascade" }),
  applicant_id: uuid("applicant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  details: jsonb("details").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow()
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
var requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaboration_id: uuid("collaboration_id").notNull().references(() => collaborations.id, { onDelete: "cascade" }),
  requester_id: uuid("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  host_id: uuid("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  // 'pending', 'accepted', 'hidden', 'skipped'
  note: text("note"),
  // Personalized message from requester
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow()
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
var user_referrals = pgTable("user_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referral_code: text("referral_code").notNull().unique(),
  total_available: integer("total_available").notNull().default(3),
  total_used: integer("total_used").notNull().default(0),
  is_auto_approve: boolean("is_auto_approve").notNull().default(false),
  // Special codes that auto-approve users
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
var referral_events = pgTable("referral_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrer_id: uuid("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referred_user_id: uuid("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  // pending, completed, expired
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completed_at: timestamp("completed_at", { withTimezone: true })
});
var insertUserSchema = createInsertSchema(users);
var insertCompanySchema = createInsertSchema(companies);
var insertNotificationPreferencesSchema = createInsertSchema(
  notification_preferences
);
var insertMarketingPreferencesSchema = createInsertSchema(
  marketing_preferences
);
var insertCollaborationSchema = createInsertSchema(collaborations);
var insertCollabApplicationSchema = createInsertSchema(collab_applications);
var insertRequestSchema = createInsertSchema(requests);
var referralCodeSchema = z.string().regex(
  /^[0-9]+_[a-f0-9]{8}$/,
  "Invalid referral code format"
);
var insertUserReferralSchema = createInsertSchema(user_referrals, {
  referral_code: referralCodeSchema
});
var insertReferralEventSchema = createInsertSchema(referral_events);
var applicationSchema = z.object({
  // User Information
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  handle: z.string().optional(),
  // Made optional since not all Telegram users have usernames
  linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().nullable(),
  email: z.string().email("Please enter a valid email").optional().nullable(),
  referral_code: z.string().optional().nullable(),
  // Updated to match the database schema
  twitter_url: z.string().url("Please enter a valid Twitter URL").optional().nullable(),
  twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional().nullable(),
  // Company Information
  company_name: z.string().min(2, "Company name is required"),
  company_website: z.string().url("Please enter a valid website URL"),
  company_linkedin_url: z.string().url("Please enter a valid LinkedIn URL").optional().nullable(),
  // Added company LinkedIn URL
  short_description: z.string().max(150, "Short description must be less than 150 characters").optional(),
  long_description: z.string().max(1e3, "Long description must be less than 1000 characters").optional(),
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  company_twitter_followers: z.enum(TWITTER_FOLLOWER_COUNTS).optional().nullable(),
  // Made optional for simplified signup
  job_title: z.string().min(1, "Job title is required"),
  funding_stage: z.enum(FUNDING_STAGES).optional().nullable(),
  // Made optional for simplified signup
  has_token: z.boolean().optional().default(false),
  // Made optional for simplified signup
  token_ticker: z.string().optional().nullable(),
  blockchain_networks: z.array(z.enum(BLOCKCHAIN_NETWORKS)).optional().default([]),
  company_tags: z.array(z.string()).optional().default([]),
  // Made optional for simplified signup
  // Telegram data
  initData: z.string()
});
var collabApplicationSchema = z.object({
  reason: z.string().min(1, "Please explain why you're interested in this collaboration"),
  experience: z.string().min(1, "Please describe your relevant experience"),
  portfolioLinks: z.string().optional(),
  twitterHandle: z.string().min(1, "Your Twitter handle is required"),
  githubHandle: z.string().optional(),
  notes: z.string().optional()
});
var podcastDetailsSchema = z.object({
  podcast_name: z.string().min(2, "Podcast name is required"),
  short_description: z.string().max(200, "Short description must be less than 200 characters").optional(),
  // Removed podcast_description field in favor of the short_description field
  podcast_link: z.string().url("Please enter a valid podcast link"),
  estimated_reach: z.enum(AUDIENCE_SIZE_RANGES).optional()
});
var twitterSpacesDetailsSchema = z.object({
  twitter_handle: z.string().min(1, "Twitter handle is required"),
  // Added short_description field needed for Twitter Spaces
  short_description: z.string().max(180, "Short description must be less than 180 characters").optional(),
  // Removed space_topic validation as topics are captured at the top level
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS)
});
var liveStreamDetailsSchema = z.object({
  title: z.string().min(2, "Title is required"),
  short_description: z.string().max(200, "Short description must be less than 200 characters").optional(),
  date_selection: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  stream_platform: z.string().min(2, "Streaming platform is required").optional(),
  previous_stream_link: z.string().url("Please enter a valid stream link").optional(),
  audience_size: z.enum(AUDIENCE_SIZE_RANGES).optional(),
  expected_audience_size: z.enum(AUDIENCE_SIZE_RANGES)
  // Removed topics validation as topics are captured at the top level
});
var researchReportDetailsSchema = z.object({
  report_name: z.string().min(2, "Report name is required").optional(),
  // Removed research_topic validation as topics are captured at the top level
  research_topic: z.array(z.string()).optional(),
  target_audience: z.string().min(2, "Target audience is required"),
  short_description: z.string().max(200, "Short description must be less than 200 characters").optional(),
  audience_reach: z.enum(AUDIENCE_SIZE_RANGES).optional(),
  estimated_release_date: z.string()
});
var newsletterDetailsSchema = z.object({
  newsletter_name: z.string().min(2, "Newsletter name is required"),
  newsletter_url: z.string().url("Please enter a valid newsletter URL").optional(),
  // Removed topics validation as topics are captured at the top level of the form
  topics: z.array(z.enum(COLLAB_TOPICS)).optional(),
  audience_reach: z.enum(AUDIENCE_SIZE_RANGES),
  total_subscribers: z.enum(AUDIENCE_SIZE_RANGES).optional(),
  short_description: z.string().max(200, "Short description must be less than 200 characters").optional()
  // Removed newsletter_description field in favor of the short_description field
});
var blogPostDetailsSchema = z.object({
  blog_name: z.string().min(2, "Blog name is required").optional(),
  blog_topic: z.string().optional(),
  // Make blog topic optional since we capture topics at the top level
  blog_link: z.string().url("Please enter a valid blog link"),
  short_description: z.string().max(200, "Short description must be less than 200 characters").optional(),
  est_readers: z.enum(AUDIENCE_SIZE_RANGES),
  estimated_release_date: z.string()
});
var twitterCoMarketingDetailsSchema = z.object({
  twittercomarketing_type: z.array(z.enum(TWITTER_COLLAB_TYPES)).min(1, "At least one Twitter collaboration type is required"),
  host_twitter_handle: z.string().min(1, "Host Twitter handle is required"),
  host_follower_count: z.enum(TWITTER_FOLLOWER_COUNTS),
  short_description: z.string().min(1, "Short description is required").max(180, "Short description must be 180 characters or less").optional()
  // Updated validation rules
});
var createCollaborationSchema = z.object({
  collab_type: z.enum(COLLAB_TYPES),
  title: z.string().max(120, "Title must be less than 120 characters").optional().default(""),
  description: z.string().max(280, "Description must be less than 280 characters"),
  has_compensation: z.boolean().optional().default(false),
  compensation_details: z.string().optional(),
  additional_requirements: z.string().optional(),
  date_type: z.enum(["any_future_date", "specific_date"]),
  specific_date: z.string().optional(),
  // Topics for the collaboration
  topics: z.array(z.enum(COLLAB_TOPICS)).min(1, "At least one topic is required"),
  // Free collaboration confirmation
  is_free_collab: z.boolean().refine((val) => val === true, {
    message: "You must confirm this is a free collaboration with no payments involved"
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
    twitterCoMarketingDetailsSchema
  ])
});

// shared/config.ts
import { z as z2 } from "zod";
import crypto from "crypto";
var configSchema = z2.object({
  // Application environment
  NODE_ENV: z2.enum(["development", "test", "production"]).default("development"),
  // Database connection
  DATABASE_URL: z2.string().min(1, "DATABASE_URL is required"),
  // Security settings
  SESSION_SECRET: z2.string().min(32, "SESSION_SECRET should be at least 32 characters for security").default(() => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be provided in production");
    }
    return crypto.randomBytes(32).toString("hex");
  }),
  // Rate limiting settings (optional, with defaults)
  RATE_LIMIT_WINDOW_MS: z2.coerce.number().positive().default(15 * 60 * 1e3),
  // 15 minutes by default
  RATE_LIMIT_MAX_REQUESTS: z2.coerce.number().positive().default(100),
  // 100 requests by default
  // Security headers (optional, with defaults)
  ENABLE_SECURITY_HEADERS: z2.coerce.boolean().default(true),
  // Logging settings (optional, with defaults)
  // Force coercion to ensure string "0" is properly converted to number 0
  LOG_LEVEL: z2.coerce.number().min(0).max(4).default(2).transform((val) => {
    if (process.env.LOG_LEVEL === "0") return 0;
    return val;
  }),
  // Authentication
  TELEGRAM_BOT_TOKEN: z2.string().min(1, "TELEGRAM_BOT_TOKEN is required"),
  TELEGRAM_TEST_BOT_TOKEN: z2.string().min(1, "TELEGRAM_TEST_BOT_TOKEN is required for development").optional(),
  // External APIs
  X_RAPIDAPI_KEY: z2.string().min(1, "X_RAPIDAPI_KEY is required for Twitter API").optional(),
  // Development fallbacks
  ALLOW_DEV_FALLBACKS: z2.coerce.boolean().default(false),
  // CORS settings
  CORS_ALLOWED_ORIGINS: z2.string().optional().transform((val) => val ? val.split(",") : ["https://telegram.org"]),
  // Webapp URLs (prod + dev)
  WEBAPP_URL: z2.string().optional(),
  WEBAPP_URL_DEV: z2.string().optional()
});
function loadConfig() {
  const config2 = {
    // Core settings
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    // Authentication
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_TEST_BOT_TOKEN: process.env.TELEGRAM_TEST_BOT_TOKEN,
    // External APIs
    X_RAPIDAPI_KEY: process.env.X_RAPIDAPI_KEY,
    // Security settings
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    ENABLE_SECURITY_HEADERS: process.env.ENABLE_SECURITY_HEADERS,
    ALLOW_DEV_FALLBACKS: process.env.ALLOW_DEV_FALLBACKS,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
    // Logging settings
    LOG_LEVEL: process.env.LOG_LEVEL,
    // Webapp URLs
    WEBAPP_URL: process.env.WEBAPP_URL,
    WEBAPP_URL_DEV: process.env.WEBAPP_URL_DEV
  };
  try {
    try {
      const args = process.argv.slice(2);
      const silentModeFlag = args.find(
        (arg) => arg === "--silent" || arg === "--quiet" || arg === "--log-level=0" || arg === "-s"
      );
      if (silentModeFlag) {
        console.log("=== SILENT MODE ACTIVATED VIA COMMAND LINE ===");
        process.env.LOG_LEVEL = "0";
      }
    } catch (err) {
    }
    if (process.env.NODE_ENV === "production") {
      if (!process.env.TELEGRAM_BOT_TOKEN) {
        throw new Error("TELEGRAM_BOT_TOKEN must be provided in production");
      }
      const prodConfig = {
        ...config2,
        ALLOW_DEV_FALLBACKS: "false"
        // Always disable development fallbacks in production
      };
      const validated = configSchema.parse(prodConfig);
      if (!process.env.SESSION_SECRET) {
        throw new Error("SESSION_SECRET must be explicitly set in production environment");
      }
      if (process.env.LOG_LEVEL === "0") {
        validated.LOG_LEVEL = 0;
        console.log("FORCED LOG_LEVEL to 0 in config");
      }
      return validated;
    } else {
      if (!process.env.TELEGRAM_TEST_BOT_TOKEN) {
        console.warn("==============================================================");
        console.warn("\u26A0\uFE0F WARNING: TELEGRAM_TEST_BOT_TOKEN is not set for development.");
        console.warn("    The application may not function correctly without it.");
        console.warn("==============================================================");
      }
      const validated = configSchema.parse(config2);
      if (!process.env.SESSION_SECRET) {
        console.warn("==============================================================");
        console.warn("\u26A0\uFE0F WARNING: Using auto-generated SESSION_SECRET for development.");
        console.warn("    For persistent sessions across server restarts,");
        console.warn("    consider setting a fixed SESSION_SECRET in .env");
        console.warn("==============================================================");
      }
      if (validated.ALLOW_DEV_FALLBACKS) {
        console.warn("==============================================================");
        console.warn("\u26A0\uFE0F WARNING: Development fallbacks are ENABLED.");
        console.warn("    This allows bypassing authentication and security measures");
        console.warn("    and should NEVER be used in production.");
        console.warn("==============================================================");
      }
      if (process.env.LOG_LEVEL === "0") {
        validated.LOG_LEVEL = 0;
        console.log("FORCED LOG_LEVEL to 0 in config");
      }
      return validated;
    }
  } catch (error) {
    if (error instanceof z2.ZodError) {
      console.error("Invalid configuration:");
      error.errors.forEach((err) => {
        console.error(` - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error("Configuration error:", error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
var config = loadConfig();

// server/db.ts
var { Pool } = pg;
var isProduction = config.NODE_ENV === "production";
var pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Small pool for serverless — pgBouncer on Supabase handles fan-out for us.
  // `connectionTimeoutMillis` is generous because cold-start TLS to Supabase's
  // pooler can stretch past the 10s default; 30s leaves headroom without
  // causing functions to hang forever.
  max: isProduction ? 3 : 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 3e4
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});
var db = drizzle(pool, { schema: schema_exports });

// server/routes.ts
import { eq as eq6, and as and4, desc as desc4, inArray as inArray4, or as or3 } from "drizzle-orm";
import { sql as sql4 } from "drizzle-orm";

// server/telegram.ts
import TelegramBot from "node-telegram-bot-api";
import { eq, sql, and } from "drizzle-orm";
import { format } from "date-fns";
import fs from "fs";
import path from "path";
var botToken = config.NODE_ENV === "production" ? config.TELEGRAM_BOT_TOKEN : config.TELEGRAM_TEST_BOT_TOKEN || config.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  const missingToken = config.NODE_ENV === "production" ? "TELEGRAM_BOT_TOKEN" : "TELEGRAM_TEST_BOT_TOKEN";
  console.error(
    `Telegram bot token (${missingToken}) is not defined. Please set it in your environment variables.`
  );
  console.error(`The application cannot start without the Telegram bot token.`);
  console.error(`Missing token: ${missingToken}`);
  console.error(`Environment: ${config.NODE_ENV}`);
  process.exit(1);
}
var currentEnvironment = config.NODE_ENV === "production" ? "PRODUCTION" : "DEVELOPMENT";
var isProduction2 = config.NODE_ENV === "production";
console.log(`\u{1F527} TELEGRAM BOT CONFIGURATION:`);
console.log(`\u{1F527} NODE_ENV: "${config.NODE_ENV || "undefined"}"`);
console.log(`\u{1F527} Environment: ${currentEnvironment}`);
console.log(
  `\u{1F527} Bot token source: ${config.NODE_ENV === "production" ? "TELEGRAM_BOT_TOKEN" : config.TELEGRAM_TEST_BOT_TOKEN ? "TELEGRAM_TEST_BOT_TOKEN" : "TELEGRAM_BOT_TOKEN (fallback)"}`
);
console.log(`\u{1F527} Bot token present: ${botToken ? "YES" : "NO"}`);
console.log(
  `\u{1F527} Bot token length: ${botToken ? botToken.length : 0} characters`
);
if (!botToken) {
  throw new Error("Telegram bot token is required");
}
var LOG_DIR = path.join(process.cwd(), "logs");
var ADMIN_MESSAGE_LOG = path.join(LOG_DIR, "admin_messages.log");
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    console.log("Created logs directory:", LOG_DIR);
  }
} catch (err) {
  console.error("Failed to create logs directory:", err);
}
function logAdminMessage(adminId, messageType, messageContent, recipientInfo) {
  try {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const logEntry = `[${timestamp2}] ADMIN[${adminId}] TYPE[${messageType}] ${recipientInfo ? `RECIPIENT[${recipientInfo}] ` : ""}MESSAGE: ${messageContent}
`;
    fs.appendFileSync(ADMIN_MESSAGE_LOG, logEntry);
  } catch (err) {
    console.error("Failed to log admin message:", err);
  }
}
var WEBAPP_URL = config.NODE_ENV === "production" ? config.WEBAPP_URL : config.WEBAPP_URL_DEV;
console.log(`\u{1F527} WEBAPP_URL CONFIGURATION:`);
if (config.NODE_ENV === "production") {
  console.log(`\u{1F527} WEBAPP_URL: "${config.WEBAPP_URL || "not set"}"`);
} else {
  console.log(
    `\u{1F527} WEBAPP_URL_DEV: "${config.WEBAPP_URL_DEV || "not set"}"`
  );
}
console.log(
  `\u{1F527} Final WEBAPP_URL: "${WEBAPP_URL || "ERROR: No webapp URL configured!"}"`
);
console.log(`\u{1F527} Environment: ${currentEnvironment}`);
if (!WEBAPP_URL) {
  console.error(
    `\u{1F527} \u274C ERROR: ${currentEnvironment} webapp URL not configured!`
  );
  console.error(
    `\u{1F527} \u274C Please set ${config.NODE_ENV === "production" ? "WEBAPP_URL" : "WEBAPP_URL_DEV"} environment variable`
  );
}
if (config.LOG_LEVEL === void 0 || config.LOG_LEVEL >= 2) {
  console.log("=== Telegram Bot Configuration ===");
  console.log("Environment:", config.NODE_ENV);
  console.log(
    "Using token type:",
    config.NODE_ENV === "production" ? "Production" : "Development"
  );
  console.log("Telegram Bot configured successfully");
  console.log("WebApp URL:", WEBAPP_URL);
}
var isServerless = !!process.env.VERCEL;
var bot = isServerless ? new TelegramBot(botToken, { polling: false, webHook: false }) : new TelegramBot(botToken, {
  polling: {
    params: {
      timeout: 10,
      limit: 100
    },
    retryTimeout: 2e3
  },
  webHook: false
});
async function ensureWebhookConfigured() {
  if (!isServerless) return;
  if (process.env.REGISTER_TELEGRAM_WEBHOOK !== "1") {
    console.log("[Bot] Webhook registration skipped (REGISTER_TELEGRAM_WEBHOOK not set to 1)");
    return;
  }
  const baseUrl = process.env.WEBAPP_URL || process.env.VERCEL_URL;
  if (!baseUrl) {
    console.error("[Bot] ensureWebhookConfigured: no WEBAPP_URL or VERCEL_URL");
    return;
  }
  const normalized = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const webhookUrl = `${normalized.replace(/\/$/, "")}/api/telegram/webhook`;
  try {
    const info = await bot.getWebHookInfo();
    if (info.url === webhookUrl) return;
    await bot.setWebHook(webhookUrl);
    console.log(`[Bot] Webhook configured: ${webhookUrl}`);
  } catch (err) {
    console.error("[Bot] setWebHook failed:", err);
  }
}
setTimeout(async () => {
  try {
    console.log("[BOT_SETUP] Starting deferred command setup...");
    await setupBotCommands();
    console.log("[BOT_SETUP] Commands configured successfully");
  } catch (error) {
    console.error(
      "[BOT_SETUP] Command setup failed, but bot remains functional:",
      error
    );
  }
}, 1e3);
var gracefulShutdown = (signal) => {
  console.log(
    `[BOT_CLEANUP] Received ${signal}, gracefully shutting down bot...`
  );
  try {
    if (bot) {
      bot.stopPolling();
      console.log("[BOT_CLEANUP] Bot polling stopped successfully");
    }
  } catch (error) {
    console.error("[BOT_CLEANUP] Error during bot cleanup:", error);
  }
  process.exit(0);
};
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
async function isValidChatId(chatId) {
  try {
    await bot.getChat(chatId);
    return true;
  } catch (error) {
    console.log(
      `Chat ID ${chatId} appears to be invalid or hasn't interacted with bot`
    );
    return false;
  }
}
var botPerformanceLogger = {
  startupTime: Date.now(),
  commandSetupTime: null,
  logCommandSetup() {
    this.commandSetupTime = Date.now() - this.startupTime;
    console.log(
      `[PERF] Bot command setup completed in ${this.commandSetupTime}ms`
    );
  }
};
async function setupBotCommands() {
  try {
    const regularCommands = [
      { command: "start", description: "Start using Collab Room" }
    ];
    const pendingUserCommands = [
      { command: "start", description: "Start using Collab Room" },
      { command: "status", description: "Check your application status" }
    ];
    const adminCommands = [
      ...regularCommands,
      { command: "broadcast", description: "Send message to all users" },
      { command: "broadcastcollab", description: "Promote a specific collaboration" }
    ];
    await bot.setMyCommands(regularCommands);
    console.log("[BOT_SETUP] Set regular commands as default for all users");
    setImmediate(async () => {
      try {
        await setupAdminCommands(adminCommands);
        botPerformanceLogger.logCommandSetup();
      } catch (error) {
        console.error(
          "[BOT_SETUP] Admin command setup failed, but bot remains functional:",
          error
        );
      }
    });
  } catch (error) {
    console.error("[BOT_SETUP] Error setting up basic bot commands:", error);
    return false;
  }
  return true;
}
async function setupAdminCommands(adminCommands) {
  try {
    const [admins, pendingUsers] = await Promise.all([
      db.select({
        telegram_id: users.telegram_id,
        first_name: users.first_name,
        id: users.id
      }).from(users).where(
        and(eq(users.is_admin, true), sql`${users.telegram_id} IS NOT NULL`)
      ),
      db.select({
        telegram_id: users.telegram_id,
        id: users.id
      }).from(users).where(
        and(
          eq(users.is_approved, false),
          eq(users.is_admin, false),
          sql`${users.telegram_id} IS NOT NULL`
        )
      )
    ]);
    console.log(
      `[BOT_SETUP] Found ${admins.length} admin users, ${pendingUsers.length} pending users`
    );
    const commandPromises = admins.map(
      (admin) => setupAdminCommandsForUser(admin, adminCommands).catch(
        (err) => console.warn(
          `[BOT_SETUP] Failed to set commands for ${admin.first_name}:`,
          err
        )
      )
    );
    await Promise.allSettled(commandPromises);
    console.log("[BOT_SETUP] Admin command setup completed");
  } catch (error) {
    console.error("[BOT_SETUP] Error in admin command setup:", error);
  }
}
async function setupAdminCommandsForUser(admin, adminCommands) {
  try {
    if (!admin.telegram_id) {
      return;
    }
    const chatExists = await Promise.race([
      isValidChatId(parseInt(admin.telegram_id)),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Timeout")), 5e3)
      )
    ]);
    if (chatExists) {
      const adminScope = {
        type: "chat",
        chat_id: parseInt(admin.telegram_id)
      };
      await bot.setMyCommands(adminCommands, { scope: adminScope });
      console.log(
        `[BOT_SETUP] Set admin commands for ${admin.first_name} (${admin.telegram_id})`
      );
    } else {
      console.log(
        `[BOT_SETUP] Admin ${admin.first_name} (${admin.telegram_id}) hasn't interacted with the bot yet, skipping command setup`
      );
    }
  } catch (error) {
    console.warn(
      `[BOT_SETUP] Failed to set commands for ${admin.first_name}:`,
      error
    );
  }
}
bot.on("message", async (msg) => {
  if (msg.text?.startsWith("/")) return;
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  if (!telegramId) return;
  const broadcastState = adminBroadcastState.get(telegramId);
  const collabBroadcastState = adminCollabBroadcastState.get(telegramId);
  if (broadcastState && broadcastState.state === "awaiting_message" && msg.text && !collabBroadcastState) {
    try {
      console.log(
        "[BROADCAST] Received message from admin for broadcast:",
        msg.text
      );
      adminBroadcastState.set(telegramId, {
        state: "awaiting_confirmation",
        message: msg.text,
        timestamp: Date.now()
      });
      const confirmationMessage = `\u{1F4E3} <b>Broadcast Preview</b>

This is how your message will appear (with HTML formatting applied and <b>link previews disabled</b>):

----- <b>Preview</b> -----
\u{1F4E3} <b>Admin Announcement</b>

${msg.text}
---------------------

<i>Note: All HTML formatting such as &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, and &lt;a href="https://example.com"&gt;links&lt;/a&gt; will render correctly, but link previews will be disabled.</i>

Do you want to send this message to all approved users with notifications enabled?`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: "\u2705 Send Message", callback_data: "broadcast_confirm" },
            { text: "\u274C Cancel", callback_data: "broadcast_cancel" }
          ]
        ]
      };
      await bot.sendMessage(chatId, confirmationMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard
      });
      logAdminMessage(
        telegramId,
        "BROADCAST_PREVIEW",
        "Admin provided message for broadcast and is awaiting confirmation",
        msg.text.substring(0, 50) + (msg.text.length > 50 ? "..." : "")
      );
    } catch (error) {
      console.error(
        "[BROADCAST] Error processing admin broadcast message:",
        error
      );
      adminBroadcastState.delete(telegramId);
      await bot.sendMessage(
        chatId,
        "\u274C <b>Error</b>\n\nThere was an error processing your broadcast message. Please try again with /broadcast.",
        { parse_mode: "HTML" }
      );
    }
  } else if (collabBroadcastState && collabBroadcastState.state === "awaiting_message" && msg.text) {
    try {
      console.log(
        "[COLLAB_BROADCAST] Received message from admin for collaboration broadcast:",
        msg.text
      );
      adminCollabBroadcastState.set(telegramId, {
        ...collabBroadcastState,
        state: "awaiting_confirmation",
        message: msg.text,
        timestamp: Date.now()
      });
      const collab = collabBroadcastState.selectedCollaboration;
      const usersWithJoinedPreferences = await db.select({
        id: users.id,
        telegram_id: users.telegram_id,
        notifications_enabled: notification_preferences.notifications_enabled
      }).from(users).leftJoin(
        notification_preferences,
        eq(users.id, notification_preferences.user_id)
      ).where(eq(users.is_approved, true));
      const eligibleUsers = usersWithJoinedPreferences.filter(
        (user) => user.notifications_enabled === true && user.telegram_id
      );
      const confirmationMessage = `\u{1F680} <b>Collab Broadcast Preview</b>

<b>Selected Collaboration:</b> ${collab.companyName} - ${collab.collab_type}

This is how your promotional message will appear:

----- <b>Preview</b> -----
\u{1F91D} <b>New Collab</b>

${msg.text}

\u2705 <b>Request Collab</b> | <b>View More Collabs</b>
---------------------

<i>Note: The buttons will be context-aware based on each user's relationship to this collaboration.</i>

\u{1F4CA} <b>Will be sent to ${eligibleUsers.length} users who have notifications enabled</b>

Do you want to send this broadcast?`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: "\u2705 Send Broadcast", callback_data: "collab_broadcast_confirm" },
            { text: "\u274C Cancel", callback_data: "collab_broadcast_cancel" }
          ]
        ]
      };
      await bot.sendMessage(chatId, confirmationMessage, {
        parse_mode: "HTML",
        reply_markup: keyboard
      });
      logAdminMessage(
        telegramId,
        "COLLAB_BROADCAST_PREVIEW",
        "Admin provided message for collaboration broadcast and is awaiting confirmation",
        `${collab.companyName} - ${collab.collab_type}: ${msg.text.substring(0, 50)}${msg.text.length > 50 ? "..." : ""}`
      );
    } catch (error) {
      console.error(
        "[COLLAB_BROADCAST] Error processing admin collaboration broadcast message:",
        error
      );
      adminCollabBroadcastState.delete(telegramId);
      await bot.sendMessage(
        chatId,
        "\u274C <b>Error</b>\n\nThere was an error processing your collaboration broadcast message. Please try again with /broadcastcollab.",
        { parse_mode: "HTML" }
      );
    }
  }
});
bot.onText(/\/start(?:\s+(.+))?/, handleStart);
var referralCache = /* @__PURE__ */ new Map();
var userCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 5 * 60 * 1e3;
setInterval(() => {
  const now = Date.now();
  referralCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      referralCache.delete(key);
    }
  });
  userCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  });
}, CACHE_TTL);
var KEYBOARDS = {
  newUser: (url) => ({
    inline_keyboard: [[{ text: "Launch Collab Room", web_app: { url } }]]
  }),
  approvedUser: {
    inline_keyboard: [
      [
        {
          text: "\u{1F680} Launch Collab Room",
          web_app: { url: `${WEBAPP_URL}/discover` }
        }
      ],
      [{ text: "\u{1F4E3} Announcements", url: "https://t.me/TheMarketingDAO" }]
    ]
  },
  pendingUser: {
    inline_keyboard: [
      [
        {
          text: "View Application Status",
          web_app: { url: `${WEBAPP_URL}/application-status` }
        }
      ],
      [
        {
          text: "\u{1F4E3} Join Announcement Channel",
          url: "https://t.me/TheMarketingDAO"
        }
      ]
    ]
  }
};
var lastStartError = null;
async function handleStart(msg, match) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const referralParam = match && match[1] ? match[1].trim() : null;
  let referralCode = null;
  let referrerDetails = null;
  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }
    console.log(
      `[START] User ${telegramId} started bot with param: ${referralParam || "none"}`
    );
    if (referralParam) {
      if (referralParam.startsWith("r_")) {
        referralCode = referralParam.substring(2);
      } else if (referralParam.includes("_")) {
        referralCode = referralParam;
      }
      if (referralCode && referralCode.includes("_")) {
        const telegramIdFromCode = referralCode.split("_")[0];
        console.log(
          `[REFERRAL] Processing referral from Telegram ID: ${telegramIdFromCode}`
        );
        const cacheKey = `referrer_${telegramIdFromCode}`;
        const cached = referralCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          referrerDetails = cached.data;
          console.log(`[REFERRAL] Using cached referrer data`);
        } else {
          const referrerData = await db.select({
            id: users.id,
            first_name: users.first_name,
            last_name: users.last_name,
            company_name: companies.name
          }).from(users).leftJoin(companies, eq(companies.user_id, users.id)).where(eq(users.telegram_id, telegramIdFromCode)).limit(1);
          if (referrerData.length > 0) {
            const referrer = referrerData[0];
            referrerDetails = {
              id: referrer.id,
              first_name: referrer.first_name,
              last_name: referrer.last_name || "",
              company_name: referrer.company_name
            };
            referralCache.set(cacheKey, {
              data: referrerDetails,
              timestamp: Date.now()
            });
            console.log(
              `[REFERRAL] Found referrer: ${referrerDetails.first_name} ${referrerDetails.last_name}`
            );
          } else {
            console.log(`[REFERRAL] Invalid referral code: ${referralCode}`);
          }
        }
      }
    }
    const userCacheKey = `user_${telegramId}`;
    let existingUser = null;
    const cachedUser = userCache.get(userCacheKey);
    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_TTL) {
      existingUser = cachedUser.data;
      console.log(`[START] Using cached user data for ${telegramId}`);
    } else {
      const userData = await db.select({
        id: users.id,
        telegram_id: users.telegram_id,
        is_approved: users.is_approved,
        first_name: users.first_name,
        last_name: users.last_name
      }).from(users).where(eq(users.telegram_id, telegramId)).limit(1);
      if (userData.length > 0) {
        existingUser = userData[0];
        userCache.set(userCacheKey, {
          data: existingUser,
          timestamp: Date.now()
        });
      }
    }
    let keyboard;
    let welcomeMessage;
    if (!existingUser) {
      let applicationUrl = `${WEBAPP_URL}/discover`;
      if (referralCode) {
        applicationUrl += `?referral=${referralCode}`;
      }
      keyboard = KEYBOARDS.newUser(applicationUrl);
      if (referrerDetails) {
        const referrerName = `${referrerDetails.first_name} ${referrerDetails.last_name}`.trim();
        const companyPart = referrerDetails.company_name ? ` from ${referrerDetails.company_name}` : "";
        welcomeMessage = `\u{1F389} Congratulations! You've been referred by ${referrerName}${companyPart}.

Welcome to Collab Room - the fastest way to find and share marketing collabs with other Web3 brands\u2014guest blogs, Twitter Collabs, AMAs, and more.

You'll get filtered, relevant opportunities straight to your Telegram, and can push your own out to a verified network.

Click below to start your application with your referral already applied.`;
      } else {
        welcomeMessage = "\u{1F44B} Welcome to Collab Room!\n\nFind or host collaborations with other Web3 Brands and founders\n\n\u{1F399}\uFE0F Be a guest on X Spaces\n\u270D\uFE0F Co author a Blog Posts \n\u{1F4FA} Find Podcast to appear on\n\u{1F3A4} Be a guest speaker at a conference \n\nOr host your own collaborations for other brands or founders to join.";
      }
    } else if (existingUser.is_approved) {
      keyboard = KEYBOARDS.approvedUser;
      welcomeMessage = `\u{1F44B} Welcome back to Collab Room!

You're all set! Click below to access your matches and discover new collaborations.`;
    } else {
      keyboard = KEYBOARDS.pendingUser;
      welcomeMessage = `\u{1F44B} Welcome back to Collab Room!

Your application is currently under review. Click below to check your application status or use /status command anytime.`;
    }
    await bot.sendMessage(
      chatId,
      welcomeMessage,
      keyboard ? { reply_markup: keyboard } : void 0
    );
  } catch (error) {
    const e = error;
    lastStartError = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      telegramId,
      name: e?.name,
      code: e?.code,
      message: e?.message,
      stack: (e?.stack || "").split("\n").slice(0, 20).join("\n"),
      cause: e?.cause ? {
        name: e.cause?.name,
        code: e.cause?.code,
        message: e.cause?.message
      } : void 0,
      query: e?.query,
      params: e?.params
    };
    console.error(
      `[START_ERR] name=${e?.name} code=${e?.code} msg=${String(e?.message).slice(0, 80)}`
    );
    try {
      await bot.sendMessage(
        chatId,
        "Sorry, something went wrong. Please try again in a few moments."
      );
    } catch (sendError) {
      console.error("Failed to send error message:", sendError);
    }
  }
}
async function sendApplicationConfirmation(chatId, telegramHandle) {
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "Check Application Status",
          web_app: { url: `${WEBAPP_URL}/application-status` }
        }
      ]
    ]
  };
  try {
    const handleText = telegramHandle ? ` @${telegramHandle}` : "";
    await bot.sendMessage(
      chatId,
      `\u{1F389} Application Submitted Successfully!${handleText}

Thank you for applying to join Collab Room. Click below to check your application status anytime.`,
      { reply_markup: keyboard }
    );
    console.log(
      `Application confirmation message sent successfully to user${handleText}`
    );
    logAdminMessage(
      "SYSTEM",
      "APPLICATION_CONFIRMATION",
      `Sent application confirmation to user with chat ID ${chatId}${handleText ? " " + handleText : ""}`,
      `New user application received`
    );
  } catch (error) {
    console.error("Failed to send application confirmation:", error);
  }
}
async function notifyAdminsNewUser(userData) {
  try {
    const adminUsers = await db.select().from(users).where(eq(users.is_admin, true));
    if (!adminUsers.length) {
      console.warn("No admin users found to notify");
      return;
    }
    const companyWebsite = userData.company_website ? userData.company_website.startsWith("http") ? userData.company_website : `https://${userData.company_website}` : null;
    const companyNameFormatted = companyWebsite ? `<a href="${companyWebsite}">${userData.company_name}</a>` : userData.company_name;
    const telegramHandle = userData.handle ? `@${userData.handle}` : "";
    const userTwitterFormatted = userData.twitter_url ? `<a href="${userData.twitter_url}">${userData.first_name} ${userData.last_name || ""}</a>` : `${userData.first_name} ${userData.last_name || ""}`;
    const companyTwitterUrl = userData.company_twitter_handle ? `https://twitter.com/${userData.company_twitter_handle.replace(/^@/, "")}` : null;
    const companyTwitterLink = companyTwitterUrl ? ` (<a href="${companyTwitterUrl}">Twitter</a>)` : "";
    const message = `\u{1F195} <b>New User Application!</b>

<b>Name:</b> ${userTwitterFormatted} ${telegramHandle ? `(${telegramHandle})` : ""}
<b>Company:</b> ${companyNameFormatted}${companyTwitterLink}
<b>Role:</b> ${userData.job_title}

Use the buttons below to take action:`;
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "\u2705 Approve Application",
            callback_data: `approve_user_${userData.telegram_id}`
          }
        ],
        [
          {
            text: "\u{1F441}\uFE0F View Application",
            web_app: { url: `${WEBAPP_URL}/admin/applications` }
          }
        ]
      ]
    };
    for (const admin of adminUsers) {
      try {
        let telegramId;
        if (typeof admin.telegram_id === "number") {
          telegramId = admin.telegram_id;
        } else if (typeof admin.telegram_id === "string") {
          const cleanId = admin.telegram_id.replace(/[^0-9]/g, "");
          telegramId = parseInt(cleanId, 10);
        } else {
          console.error(
            `[ADMIN_NOTIFICATION] Invalid admin Telegram ID format: ${admin.telegram_id}`
          );
          continue;
        }
        if (isNaN(telegramId) || telegramId <= 0) {
          console.error(
            `[ADMIN_NOTIFICATION] Invalid admin Telegram ID after conversion: ${telegramId}`
          );
          continue;
        }
        console.log(
          `[ADMIN_NOTIFICATION] Sending notification to admin Telegram ID: ${telegramId}`
        );
        const result = await bot.sendMessage(telegramId, message, {
          parse_mode: "HTML",
          disable_web_page_preview: false,
          // Keep website previews for admin notifications
          reply_markup: keyboard
        });
        console.log(`Enhanced notification sent to admin ${admin.telegram_id}`);
        logAdminMessage(
          admin.telegram_id.toString(),
          "NEW_USER_APPLICATION",
          `New user application from ${userData.first_name} ${userData.last_name || ""} (${userData.telegram_id})`,
          `${userData.first_name} ${userData.last_name || ""} (${userData.telegram_id})`
        );
      } catch (error) {
        console.error(
          `Failed to send notification to admin ${admin.telegram_id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}
async function notifyUserApproved(chatId, handle) {
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "\u{1F680} Launch Collab Room",
          web_app: { url: `${WEBAPP_URL}/discover` }
        }
      ],
      [
        {
          text: "\u{1F4E3} Join Announcement Channel",
          url: "https://t.me/TheMarketingDAO"
        }
      ]
    ]
  };
  const handleMention = handle ? `@${handle.replace(/^@/, "")}` : "";
  const congratsMessage = handleMention ? `\u{1F389} Congratulations ${handleMention}! Your application has been approved!` : "\u{1F389} Congratulations! Your application has been approved!";
  try {
    await bot.sendMessage(
      chatId,
      congratsMessage + "\n\nWelcome to Collab Room! You now have full access to the platform.\n\nClick below to discover new collaborations and join our announcement channel for updates.",
      { reply_markup: keyboard }
    );
    console.log("Approval notification sent successfully");
    logAdminMessage(
      "SYSTEM",
      "USER_APPROVAL_NOTIFICATION",
      `Sent approval notification to user with chat ID ${chatId}`,
      `User approved and notified`
    );
  } catch (error) {
    console.error("Failed to send approval notification:", error);
  }
}
async function notifyReferrerAboutApproval(referrerId, referredUserFirstName) {
  try {
    if (!referrerId) {
      console.error(
        `[REFERRAL NOTIFICATION] Invalid referrer ID: ${referrerId}`
      );
      return false;
    }
    if (!referredUserFirstName) {
      console.warn(
        `[REFERRAL NOTIFICATION] Missing user first name, using "New user" instead`
      );
      referredUserFirstName = "New user";
    }
    console.log(
      `[REFERRAL NOTIFICATION] Starting notification process for referrer ${referrerId} about ${referredUserFirstName}`
    );
    console.log(
      `[REFERRAL NOTIFICATION] DEBUGGING - Referrer ID type: ${typeof referrerId}`
    );
    console.log(
      `[REFERRAL NOTIFICATION] DEBUGGING - Referrer ID value: '${referrerId}'`
    );
    let referrerUser = null;
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      referrerId
    );
    console.log(
      `[REFERRAL NOTIFICATION] DEBUGGING - Is valid UUID? ${isValidUuid}`
    );
    if (isValidUuid) {
      console.log(`[REFERRAL NOTIFICATION] Looking up by UUID: ${referrerId}`);
      const [userById] = await db.select().from(users).where(eq(users.id, referrerId));
      if (userById) {
        console.log(
          `[REFERRAL NOTIFICATION] Found user by ID: ${userById.id}, Name: ${userById.first_name}, Telegram ID: ${userById.telegram_id}`
        );
        referrerUser = userById;
      } else {
        console.warn(
          `[REFERRAL NOTIFICATION] Could not find user with ID: ${referrerId}, trying alternate lookup methods`
        );
      }
    }
    if (!referrerUser) {
      console.warn(
        `[REFERRAL NOTIFICATION] Looking up by Telegram ID: ${referrerId}`
      );
      const [userByTelegramId] = await db.select().from(users).where(eq(users.telegram_id, referrerId));
      console.log(
        `[REFERRAL NOTIFICATION] DEBUGGING - User lookup by Telegram ID result: ${userByTelegramId ? JSON.stringify({
          id: userByTelegramId.id,
          name: userByTelegramId.first_name,
          telegram_id: userByTelegramId.telegram_id
        }) : "Not found"}`
      );
      if (userByTelegramId) {
        console.log(
          `[REFERRAL NOTIFICATION] Found user by Telegram ID: ${userByTelegramId.id}`
        );
        referrerUser = userByTelegramId;
      } else {
        console.warn(
          `[REFERRAL NOTIFICATION] Could not find user with Telegram ID: ${referrerId}, trying alternate lookup methods`
        );
      }
    }
    if (!referrerUser) {
      console.warn(
        `[REFERRAL NOTIFICATION] Attempting partial matching for user ID or Telegram ID: ${referrerId}`
      );
      const usersWithSimilarIds = await db.select().from(users).where(
        sql`${users.id}::text LIKE ${"%" + referrerId + "%"} OR ${users.telegram_id} LIKE ${"%" + referrerId + "%"}`
      );
      if (usersWithSimilarIds.length > 0) {
        console.log(
          `[REFERRAL NOTIFICATION] Found ${usersWithSimilarIds.length} users with similar IDs`
        );
        for (const user of usersWithSimilarIds) {
          console.log(
            `[REFERRAL NOTIFICATION] Possible match: ID=${user.id}, TelegramID=${user.telegram_id}, Name=${user.first_name}`
          );
        }
        if (usersWithSimilarIds.length === 1) {
          referrerUser = usersWithSimilarIds[0];
          console.log(
            `[REFERRAL NOTIFICATION] Using user with ID: ${referrerUser.id} (Telegram ID: ${referrerUser.telegram_id})`
          );
        }
      } else {
        console.error(
          `[REFERRAL NOTIFICATION] Could not find any users with IDs similar to: ${referrerId}`
        );
      }
    }
    if (!referrerUser) {
      console.error(
        `[REFERRAL NOTIFICATION] Failed to find referrer after multiple lookup attempts. Aborting notification.`
      );
      return false;
    }
    referrerId = referrerUser.id;
    console.log(
      `[REFERRAL NOTIFICATION] Getting fresh referrer details using ID: ${referrerId}`
    );
    const [referrer] = await db.select().from(users).where(eq(users.id, referrerId));
    if (!referrer || !referrer.telegram_id) {
      console.warn(
        `[REFERRAL NOTIFICATION] Cannot notify referrer ${referrerId}: User or Telegram ID not found`
      );
      return false;
    }
    console.log(
      `[REFERRAL NOTIFICATION] Found referrer: ${referrer.first_name} (ID: ${referrer.id}, Telegram ID: ${referrer.telegram_id})`
    );
    console.log(
      `[REFERRAL NOTIFICATION] Querying referral record for user ${referrerId}`
    );
    const [referralRecord] = await db.select().from(user_referrals).where(eq(user_referrals.user_id, referrerId));
    if (!referralRecord) {
      console.log(
        `[REFERRAL NOTIFICATION] No referral record found for referrer ${referrerId}, creating one...`
      );
      const randomSuffix = Math.random().toString(16).substring(2, 10);
      const referralCode = `${referrer.telegram_id}_${randomSuffix}`;
      const [newReferralRecord] = await db.insert(user_referrals).values({
        user_id: referrerId,
        referral_code: referralCode,
        total_available: 3,
        total_used: 1,
        // Already used 1 for the current referral
        created_at: /* @__PURE__ */ new Date(),
        updated_at: /* @__PURE__ */ new Date()
      }).returning();
      console.log(
        `[REFERRAL NOTIFICATION] Created new referral record with code ${referralCode}`
      );
      return await notifyReferrerWithRecord(
        referrer,
        newReferralRecord,
        referredUserFirstName
      );
    }
    console.log(
      `[REFERRAL NOTIFICATION] Found referral record: ${JSON.stringify({
        id: referralRecord.id,
        user_id: referralRecord.user_id,
        code: referralRecord.referral_code,
        used: referralRecord.total_used,
        available: referralRecord.total_available
      })}`
    );
    await db.update(user_referrals).set({
      total_used: referralRecord.total_used + 1,
      updated_at: /* @__PURE__ */ new Date()
    }).where(eq(user_referrals.id, referralRecord.id));
    console.log(
      `[REFERRAL NOTIFICATION] Updated referral record in database, increasing used count`
    );
    const [updatedReferralRecord] = await db.select().from(user_referrals).where(eq(user_referrals.id, referralRecord.id));
    console.log(
      `[REFERRAL NOTIFICATION] Retrieved updated referral record: ${JSON.stringify(
        {
          id: updatedReferralRecord.id,
          user_id: updatedReferralRecord.user_id,
          used: updatedReferralRecord.total_used,
          available: updatedReferralRecord.total_available
        }
      )}`
    );
    console.log(
      `[REFERRAL NOTIFICATION] Updated referral record, now used ${updatedReferralRecord.total_used} of ${updatedReferralRecord.total_available}`
    );
    console.log(
      `[REFERRAL NOTIFICATION] Calling notifyReferrerWithRecord to send Telegram message`
    );
    return await notifyReferrerWithRecord(
      referrer,
      updatedReferralRecord || referralRecord,
      referredUserFirstName
    );
  } catch (error) {
    console.error(
      `[REFERRAL NOTIFICATION] Error in notifyReferrerAboutApproval:`,
      error
    );
    return false;
  }
}
async function notifyReferrerWithRecord(referrer, referralRecord, referredUserFirstName) {
  try {
    console.log(
      `[REFERRAL NOTIFICATION] DEBUGGING - Inside notifyReferrerWithRecord`
    );
    try {
      console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Referrer details: {
        id: ${referrer?.id || "undefined"}, 
        telegram_id: ${referrer?.telegram_id || "undefined"}, 
        first_name: ${referrer?.first_name || "undefined"},
        type: ${typeof referrer?.telegram_id}
      }`);
    } catch (logError) {
      console.log(
        `[REFERRAL NOTIFICATION] Error logging referrer details: ${logError instanceof Error ? logError.message : "Unknown error"}`
      );
    }
    try {
      console.log(`[REFERRAL NOTIFICATION] DEBUGGING - Referral Record details: {
        id: ${referralRecord?.id || "undefined"}, 
        user_id: ${referralRecord?.user_id || "undefined"}, 
        code: ${referralRecord?.referral_code || "undefined"},
        used: ${referralRecord?.total_used || "undefined"},
        available: ${referralRecord?.total_available || "undefined"}
      }`);
    } catch (logError) {
      console.log(
        `[REFERRAL NOTIFICATION] Error logging referral record details: ${logError instanceof Error ? logError.message : "Unknown error"}`
      );
    }
    console.log(
      `[REFERRAL NOTIFICATION] DEBUGGING - Referred User First Name: ${referredUserFirstName}`
    );
    if (!referrer || !referrer.telegram_id) {
      console.error(
        `[REFERRAL NOTIFICATION] Missing referrer data - ID: ${referrer?.id || "null"}, TelegramID: ${referrer?.telegram_id || "null"}`
      );
      return false;
    }
    if (!referralRecord || !referralRecord.referral_code) {
      console.error(
        `[REFERRAL NOTIFICATION] Missing referral record data - ID: ${referralRecord?.id || "null"}, Code: ${referralRecord?.referral_code || "null"}`
      );
      return false;
    }
    const usedReferrals = referralRecord.total_used || 0;
    const totalReferrals = referralRecord.total_available || 3;
    const remainingReferrals = Math.max(0, totalReferrals - usedReferrals);
    console.log(
      `[REFERRAL NOTIFICATION] DEBUGGING - About to send message to Telegram ID: ${referrer.telegram_id} (type: ${typeof referrer.telegram_id})`
    );
    try {
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "\u{1F680} Invite More Friends",
              web_app: { url: `${WEBAPP_URL}/referrals` }
            }
          ],
          [
            {
              text: "\u{1F4CB} Copy Referral Code",
              callback_data: `copy_referral_code_${referralRecord.referral_code}`
            }
          ]
        ]
      };
      let telegramId;
      if (typeof referrer.telegram_id === "number") {
        telegramId = referrer.telegram_id;
        console.log(
          `[REFERRAL NOTIFICATION] Telegram ID is already a number: ${telegramId}`
        );
      } else if (typeof referrer.telegram_id === "string") {
        const cleanId = referrer.telegram_id.replace(/[^0-9]/g, "");
        telegramId = parseInt(cleanId, 10);
        console.log(
          `[REFERRAL NOTIFICATION] Converted Telegram ID from string "${referrer.telegram_id}" to number ${telegramId}`
        );
      } else {
        console.error(
          `[REFERRAL NOTIFICATION] Invalid Telegram ID format: ${referrer.telegram_id}, type: ${typeof referrer.telegram_id}`
        );
        return false;
      }
      if (isNaN(telegramId) || telegramId <= 0) {
        console.error(
          `[REFERRAL NOTIFICATION] Invalid Telegram ID after conversion: ${telegramId}`
        );
        return false;
      }
      console.log(
        `[REFERRAL NOTIFICATION] Sending notification to Telegram ID: ${telegramId} (original: ${referrer.telegram_id})`
      );
      const referrerMention = referrer.handle ? `@${referrer.handle}` : referrer.first_name;
      const referredMention = referrer.referred_handle ? `@${referrer.referred_handle}` : referredUserFirstName;
      const message = `\u{1F389} ${referrerMention} <b>Referral Success!</b>

Great news! ${referredMention} who you referred has been approved and now has full access to Collab Room.

<b>Your Referral Stats:</b>
\u2022 ${usedReferrals}/${totalReferrals} referrals used
\u2022 ${remainingReferrals} referral${remainingReferrals !== 1 ? "s" : ""} remaining

Share your unique code to invite more people:`;
      console.log(
        `[REFERRAL NOTIFICATION] About to send message: "${message.substring(0, 50)}..."`
      );
      try {
        const sendResult = await bot.sendMessage(telegramId, message, {
          parse_mode: "HTML",
          reply_markup: keyboard
        });
        console.log(
          `[REFERRAL NOTIFICATION] First message sent successfully. Message ID: ${sendResult?.message_id || "unknown"}`
        );
        try {
          const codeResult = await bot.sendMessage(
            telegramId,
            `<code>${referralRecord.referral_code}</code>`,
            { parse_mode: "HTML" }
          );
          console.log(
            `[REFERRAL NOTIFICATION] Code message sent successfully. Message ID: ${codeResult?.message_id || "unknown"}`
          );
        } catch (codeError) {
          console.error(
            `[REFERRAL NOTIFICATION] Error sending code message:`,
            codeError
          );
        }
      } catch (sendError) {
        console.error(
          `[REFERRAL NOTIFICATION] Error sending Telegram message:`,
          sendError
        );
        try {
          console.log(
            `[REFERRAL NOTIFICATION] Attempting fallback message without formatting`
          );
          await bot.sendMessage(
            telegramId,
            `Referral Success! ${referredMention} who you referred has been approved and now has full access to Collab Room.`
          );
          console.log(
            `[REFERRAL NOTIFICATION] Fallback message sent successfully`
          );
        } catch (fallbackError) {
          console.error(
            `[REFERRAL NOTIFICATION] Fallback message also failed:`,
            fallbackError
          );
          return false;
        }
      }
      console.log(
        `[REFERRAL NOTIFICATION] Success! Notification sent to referrer ${referrer.id} (${referrer.first_name})`
      );
      logAdminMessage(
        "SYSTEM",
        "REFERRAL_SUCCESS_NOTIFICATION",
        `Sent referral success notification to ${referrer.first_name} for referring ${referredUserFirstName}`,
        `Referral notification sent`
      );
      return true;
    } catch (telegramError) {
      console.error(
        `[REFERRAL NOTIFICATION] Telegram API error sending notification:`,
        telegramError
      );
      return false;
    }
  } catch (error) {
    console.error(
      "[REFERRAL NOTIFICATION] Failed to send referral success notification:",
      error
    );
    return false;
  }
}
async function notifyUserCollabCreated(userId, collaborationId) {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.telegram_id) {
      console.error(`User ${userId} not found or has no Telegram ID`);
      return false;
    }
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration) {
      console.error(`Collaboration with ID ${collaborationId} not found`);
      return false;
    }
    let companyName = "Unknown";
    try {
      if (user.company_id) {
        const companies_result = await db.select().from(companies).where(eq(companies.id, user.company_id));
        if (companies_result.length > 0) {
          companyName = companies_result[0].name;
        }
      }
      if (companyName === "Unknown") {
        const companies_by_user = await db.select().from(companies).where(eq(companies.user_id, user.id));
        if (companies_by_user.length > 0) {
          companyName = companies_by_user[0].name;
        }
      }
      if (companyName === "Unknown" && user.company_name) {
        companyName = user.company_name;
      }
      console.log(
        `Found company name for user ${user.first_name} (ID: ${user.id}): ${companyName}`
      );
    } catch (error) {
      console.error(
        `Error retrieving company details for user ${user.id}:`,
        error
      );
    }
    const [preferences] = await db.select().from(notification_preferences).where(eq(notification_preferences.user_id, userId));
    if (preferences && preferences.notifications_enabled === false) {
      console.log(
        `User ${userId} has notifications disabled, skipping collaboration creation notification`
      );
      return false;
    }
    const topicsText = collaboration.topics && collaboration.topics.length > 0 ? `
\u{1F3F7}\uFE0F <b>Topics:</b> ${collaboration.topics.join(", ")}` : "";
    const fundingStagesText = collaboration.required_funding_stages && collaboration.required_funding_stages.length > 0 ? `
\u{1F4B0} <b>Required Funding Stages:</b> ${collaboration.required_funding_stages.join(", ")}` : "";
    const blockchainNetworksText = collaboration.required_blockchain_networks && collaboration.required_blockchain_networks.length > 0 ? `
\u26D3\uFE0F <b>Required Blockchain Networks:</b> ${collaboration.required_blockchain_networks.join(", ")}` : "";
    const companySectorsText = collaboration.required_company_sectors && collaboration.required_company_sectors.length > 0 ? `
\u{1F3E2} <b>Required Company Sectors:</b> ${collaboration.required_company_sectors.join(", ")}` : "";
    const message = `\u{1F389} <b>Your Collaboration is Live!</b>

Your ${collaboration.collab_type} collaboration has been successfully created and is now visible to other users.

<b>Type:</b> ${collaboration.collab_type}
<b>Description:</b> ${collaboration.description || "No description"}
<b>Company:</b> ${companyName}
${topicsText}${fundingStagesText}${blockchainNetworksText}${companySectorsText}

Your collaboration will be shown to users who match your criteria. You'll receive a notification when someone requests to collaborate with you.`;
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "View My Collaborations",
            web_app: { url: `${WEBAPP_URL}/marketing-collabs-new?tab=my` }
          }
        ]
      ]
    };
    let telegramId;
    if (typeof user.telegram_id === "number") {
      telegramId = user.telegram_id;
    } else if (typeof user.telegram_id === "string") {
      const cleanId = user.telegram_id.replace(/[^0-9]/g, "");
      telegramId = parseInt(cleanId, 10);
    } else {
      console.error(
        `[COLLAB_NOTIFICATION] Invalid user Telegram ID format: ${user.telegram_id}`
      );
      return false;
    }
    if (isNaN(telegramId) || telegramId <= 0) {
      console.error(
        `[COLLAB_NOTIFICATION] Invalid user Telegram ID after conversion: ${telegramId}`
      );
      return false;
    }
    console.log(
      `[COLLAB_NOTIFICATION] Sending creation notification to user Telegram ID: ${telegramId}`
    );
    try {
      await bot.sendMessage(telegramId, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: keyboard
      });
      console.log(
        `Collaboration creation notification sent to user ${user.telegram_id} (${user.first_name}, Company: ${companyName})`
      );
      return true;
    } catch (error) {
      if (error?.response?.body?.description === "Bad Request: chat not found") {
        console.log(
          `[COLLAB_NOTIFICATION] User ${user.first_name} ${user.last_name || ""} (ID: ${telegramId}) hasn't interacted with the bot yet`
        );
        console.log(
          `[COLLAB_NOTIFICATION_TRACKING] User ${user.id} needs to interact with the bot to receive notifications`
        );
      } else {
        console.error(
          "Failed to notify user about collaboration creation:",
          error
        );
      }
      return false;
    }
  } catch (error) {
    console.error("Failed to notify user about collaboration creation:", error);
    return false;
  }
}
async function notifyAdminsNewCollaboration(collaborationId, creatorId) {
  try {
    const adminUsers = await db.select().from(users).where(eq(users.is_admin, true));
    if (!adminUsers.length) {
      console.warn("No admin users found to notify about new collaboration");
      return;
    }
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration) {
      console.error(`Collaboration with ID ${collaborationId} not found`);
      return;
    }
    const [creator] = await db.select().from(users).where(eq(users.id, creatorId));
    if (!creator) {
      console.error(`Creator with ID ${creatorId} not found`);
      return;
    }
    let company = null;
    let companyName = "Unknown";
    try {
      if (creator.company_id) {
        const companies_result = await db.select().from(companies).where(eq(companies.id, creator.company_id));
        if (companies_result.length > 0) {
          company = companies_result[0];
          companyName = company?.name || "Unknown";
        }
      }
      if (!company) {
        const companies_by_user = await db.select().from(companies).where(eq(companies.user_id, creator.id));
        if (companies_by_user.length > 0) {
          company = companies_by_user[0];
          companyName = company?.name || "Unknown";
        }
      }
      if (!company && creator.company_name) {
        companyName = creator.company_name;
      }
    } catch (error) {
      console.error(
        `Error retrieving company details for user ${creator.id}:`,
        error
      );
    }
    const topicsText = collaboration.topics && collaboration.topics.length > 0 ? `
\u{1F3F7}\uFE0F <b>Topics:</b> ${collaboration.topics.join(", ")}` : "";
    const fundingStagesText = collaboration.required_funding_stages && collaboration.required_funding_stages.length > 0 ? `
\u{1F4B0} <b>Required Funding Stages:</b> ${collaboration.required_funding_stages.join(", ")}` : "";
    const blockchainNetworksText = collaboration.required_blockchain_networks && collaboration.required_blockchain_networks.length > 0 ? `
\u26D3\uFE0F <b>Required Blockchain Networks:</b> ${collaboration.required_blockchain_networks.join(", ")}` : "";
    const companySectorsText = collaboration.required_company_sectors && collaboration.required_company_sectors.length > 0 ? `
\u{1F3E2} <b>Required Company Sectors:</b> ${collaboration.required_company_sectors.join(", ")}` : "";
    const message = `\u{1F195} <b>New Collaboration Created!</b>

<b>Type:</b> ${collaboration.collab_type}
<b>Type:</b> ${collaboration.collab_type}
<b>Description:</b> ${collaboration.description || "Not provided"}
${topicsText}${fundingStagesText}${blockchainNetworksText}${companySectorsText}

<b>Created by:</b> ${creator.first_name} ${creator.last_name || ""} ${creator.handle ? `(@${creator.handle})` : ""}
<b>Company:</b> ${companyName}

Use the button below to view the collaboration:`;
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "\u{1F441}\uFE0F View Collaboration",
            web_app: {
              url: `${WEBAPP_URL}/admin/collaborations/${collaborationId}`
            }
          }
        ]
      ]
    };
    for (const admin of adminUsers) {
      try {
        let telegramId;
        if (typeof admin.telegram_id === "number") {
          telegramId = admin.telegram_id;
        } else if (typeof admin.telegram_id === "string") {
          const cleanId = admin.telegram_id.replace(/[^0-9]/g, "");
          telegramId = parseInt(cleanId, 10);
        } else {
          console.error(
            `[COLLAB_NOTIFICATION] Invalid admin Telegram ID format: ${admin.telegram_id}`
          );
          continue;
        }
        if (isNaN(telegramId) || telegramId <= 0) {
          console.error(
            `[COLLAB_NOTIFICATION] Invalid admin Telegram ID after conversion: ${telegramId}`
          );
          continue;
        }
        console.log(
          `[COLLAB_NOTIFICATION] Sending notification to admin Telegram ID: ${telegramId}`
        );
        try {
          await bot.sendMessage(telegramId, message, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: keyboard
          });
          console.log(
            `New collaboration notification sent to admin ${admin.telegram_id} (${admin.first_name}, Collaboration: ${collaboration.collab_type}, Company: ${companyName})`
          );
          logAdminMessage(
            admin.telegram_id.toString(),
            "NEW_COLLABORATION",
            `New collaboration created by ${creator.first_name} ${creator.last_name || ""} (ID: ${collaborationId}, Company: ${companyName})`,
            `${creator.first_name} ${creator.last_name || ""} (${creator.telegram_id || "No Telegram ID"}) - ${collaboration.collab_type}`
          );
        } catch (sendError) {
          if (sendError?.response?.body?.description === "Bad Request: chat not found") {
            console.log(
              `[COLLAB_NOTIFICATION] Admin ${admin.first_name} ${admin.last_name || ""} (ID: ${telegramId}) hasn't interacted with the bot yet`
            );
          } else {
            console.error(
              `Failed to send notification to admin ${admin.telegram_id}:`,
              sendError
            );
          }
        }
      } catch (error) {
        console.error(
          `Failed to send collaboration notification to admin ${admin.telegram_id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Failed to notify admins about new collaboration:", error);
  }
}
async function handleBroadcast(msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  console.log("=== Handling /broadcast command ===");
  console.log("Chat ID:", chatId);
  console.log("Telegram ID:", telegramId);
  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }
    const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
    if (!user || !user.is_admin) {
      console.log("[BROADCAST] Rejected: User not an admin:", telegramId);
      await bot.sendMessage(
        chatId,
        "Sorry, this command is only available to administrators."
      );
      return;
    }
    adminCollabBroadcastState.delete(telegramId);
    adminBroadcastState.set(telegramId, {
      state: "awaiting_message",
      timestamp: Date.now()
    });
    await bot.sendMessage(
      chatId,
      `\u{1F4E3} <b>Broadcast Message</b>

Please send the message you want to broadcast to all active, approved users with notifications enabled.

<i>Your message can include:</i>
\u2022 <b>Bold text</b> using &lt;b&gt;text&lt;/b&gt;
\u2022 <i>Italic text</i> using &lt;i&gt;text&lt;/i&gt;
\u2022 <u>Underlined text</u> using &lt;u&gt;text&lt;/u&gt;
\u2022 Links like &lt;a href="https://example.com"&gt;this&lt;/a&gt;

<i>IMPORTANT: For HTML tags to work, use the exact format shown above (including quotes around URLs).</i>

<i>You can also use these personalization placeholders:</i>
\u2022 {first_name} - User's first name
\u2022 {last_name} - User's last name
\u2022 {full_name} - User's full name
\u2022 {handle} - User's Telegram handle with @ symbol
\u2022 {company} - User's company name

Example: "GM {handle}! How's everything at {company}?"

Send your message now, or type /cancel to abort.`,
      { parse_mode: "HTML" }
    );
    logAdminMessage(
      telegramId,
      "BROADCAST_INITIATED",
      "Admin initiated broadcast message flow",
      "All users with notifications enabled"
    );
  } catch (error) {
    console.error("Error handling broadcast command:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong. Please try again later."
    );
  }
}
bot.onText(/\/broadcast/, handleBroadcast);
async function handleCollabBroadcast(msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  console.log("=== Handling /broadcastcollab command ===");
  console.log("Chat ID:", chatId);
  console.log("Telegram ID:", telegramId);
  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }
    const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
    if (!user || !user.is_admin) {
      console.log("[COLLAB_BROADCAST] Rejected: User not an admin:", telegramId);
      await bot.sendMessage(
        chatId,
        "Sorry, this command is only available to administrators."
      );
      return;
    }
    const recentCollaborations = await db.select({
      id: collaborations.id,
      creator_id: collaborations.creator_id,
      collab_type: collaborations.collab_type,
      description: collaborations.description,
      created_at: collaborations.created_at,
      status: collaborations.status
    }).from(collaborations).leftJoin(companies, eq(collaborations.creator_id, companies.user_id)).where(eq(collaborations.status, "active")).orderBy(sql`${collaborations.created_at} DESC`).limit(5);
    if (recentCollaborations.length === 0) {
      await bot.sendMessage(
        chatId,
        "\u274C <b>No Active Collaborations</b>\n\nThere are no active collaborations to broadcast at the moment.",
        { parse_mode: "HTML" }
      );
      return;
    }
    const collaborationWithCompanies = await Promise.all(
      recentCollaborations.map(async (collab) => {
        const [company] = await db.select({ name: companies.name }).from(companies).where(eq(companies.user_id, collab.creator_id));
        return {
          ...collab,
          companyName: company?.name || "Unknown Company"
        };
      })
    );
    adminBroadcastState.delete(telegramId);
    adminCollabBroadcastState.set(telegramId, {
      state: "selecting_collaboration",
      timestamp: Date.now()
    });
    const keyboard = {
      inline_keyboard: collaborationWithCompanies.map((collab, index2) => [
        {
          text: `${collab.companyName} - ${collab.collab_type}`,
          callback_data: `select_collab_${collab.id}`
        }
      ])
    };
    await bot.sendMessage(
      chatId,
      "\u{1F680} <b>Collab Broadcast</b>\n\nSelect a collaboration to promote:\n\n<i>Choose from the 5 most recent active collaborations:</i>",
      {
        parse_mode: "HTML",
        reply_markup: keyboard
      }
    );
    logAdminMessage(
      telegramId,
      "COLLAB_BROADCAST_INITIATED",
      "Admin initiated collaboration broadcast flow",
      `${collaborationWithCompanies.length} collaborations available`
    );
  } catch (error) {
    console.error("Error handling collaboration broadcast command:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong. Please try again later."
    );
  }
}
bot.onText(/\/broadcastcollab/, handleCollabBroadcast);
bot.onText(/\/cancel/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  if (!telegramId) return;
  let cancelled = false;
  if (adminBroadcastState.has(telegramId)) {
    adminBroadcastState.delete(telegramId);
    cancelled = true;
    logAdminMessage(
      telegramId,
      "BROADCAST_CANCELLED",
      "Admin cancelled broadcast message flow"
    );
  }
  if (adminCollabBroadcastState.has(telegramId)) {
    adminCollabBroadcastState.delete(telegramId);
    cancelled = true;
    logAdminMessage(
      telegramId,
      "COLLAB_BROADCAST_CANCELLED",
      "Admin cancelled collaboration broadcast flow"
    );
  }
  if (cancelled) {
    await bot.sendMessage(chatId, "\u2705 Broadcast cancelled.");
  }
});
var adminBroadcastState = /* @__PURE__ */ new Map();
var adminCollabBroadcastState = /* @__PURE__ */ new Map();
async function broadcastMessageToUsers(message, senderTelegramId, chatId) {
  try {
    console.log("[BROADCAST] Starting message broadcast process");
    adminBroadcastState.set(senderTelegramId, {
      state: "sending",
      message,
      timestamp: Date.now()
    });
    await bot.sendMessage(
      chatId,
      "\u{1F4E4} <b>Broadcast process started</b>\n\nSending your message to all eligible users...",
      { parse_mode: "HTML" }
    );
    const usersWithJoinedPreferences = await db.select({
      id: users.id,
      telegram_id: users.telegram_id,
      first_name: users.first_name,
      last_name: users.last_name,
      notifications_enabled: notification_preferences.notifications_enabled
    }).from(users).leftJoin(
      notification_preferences,
      eq(users.id, notification_preferences.user_id)
    ).where(eq(users.is_approved, true));
    const eligibleUsers = usersWithJoinedPreferences.filter(
      (user) => user.notifications_enabled === true
    );
    console.log(
      `[BROADCAST] Found ${eligibleUsers.length} eligible users out of ${usersWithJoinedPreferences.length} total approved users`
    );
    let successCount = 0;
    let failCount = 0;
    const failedIds = [];
    const formattedMessage = `\u{1F4E3} <b>Admin Announcement</b>

${message}`;
    console.log(
      "[BROADCAST] Fetching user details with a batched query approach"
    );
    console.log("[BROADCAST] Fetching all user handles in a batch query");
    const userHandlesQuery = await db.select({
      id: users.id,
      handle: users.handle
    }).from(users);
    console.log("[BROADCAST] Fetching all company names in a batch query");
    const companyNamesQuery = await db.select({
      user_id: companies.user_id,
      company_name: companies.name
    }).from(companies);
    console.log(
      `[BROADCAST] Successfully fetched ${userHandlesQuery.length} user handles and ${companyNamesQuery.length} company names`
    );
    const userHandlesMap = {};
    userHandlesQuery.forEach((user) => {
      userHandlesMap[user.id] = user.handle || "";
    });
    const companyNamesMap = {};
    companyNamesQuery.forEach((company) => {
      companyNamesMap[company.user_id] = company.company_name || "";
    });
    const usersWithDetails = eligibleUsers.map((user) => {
      return {
        ...user,
        handle: userHandlesMap[user.id] || "",
        company_name: companyNamesMap[user.id] || ""
      };
    });
    console.log(
      `[BROADCAST] Successfully merged details for ${usersWithDetails.length} users`
    );
    for (const user of usersWithDetails) {
      try {
        if (!user.telegram_id) {
          console.error(`[BROADCAST] User ${user.id} has no Telegram ID`);
          failCount++;
          continue;
        }
        const userChatId = parseInt(user.telegram_id);
        let personalizedMessage = message;
        personalizedMessage = personalizedMessage.replace(
          /\{first_name\}/g,
          user.first_name || ""
        );
        personalizedMessage = personalizedMessage.replace(
          /\{last_name\}/g,
          user.last_name || ""
        );
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        personalizedMessage = personalizedMessage.replace(
          /\{full_name\}/g,
          fullName
        );
        const formattedHandle = user.handle ? `@${user.handle.replace(/^@/, "")}` : "";
        personalizedMessage = personalizedMessage.replace(
          /\{handle\}/g,
          formattedHandle
        );
        personalizedMessage = personalizedMessage.replace(
          /\{company\}/g,
          user.company_name || ""
        );
        const finalPersonalizedMessage = `\u{1F4E3} <b>Admin Announcement</b>

${personalizedMessage}`;
        console.log(`[BROADCAST] Sending message to user ${user.id} with parse_mode HTML: 
Message content: ${finalPersonalizedMessage}`);
        const launchKeyboard = {
          inline_keyboard: [
            [
              {
                text: "\u{1F680} Launch Collab Room",
                web_app: { url: `${WEBAPP_URL}/discover` }
              }
            ]
          ]
        };
        await bot.sendMessage(userChatId, finalPersonalizedMessage, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          // Disable link previews as requested
          reply_markup: launchKeyboard
        });
        console.log(
          `[BROADCAST] Message sent to user ${user.first_name} ${user.last_name || ""} (${user.telegram_id})`
        );
        successCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        console.error(
          `[BROADCAST] Failed to send to user ${user.telegram_id}:`,
          error
        );
        failCount++;
        failedIds.push(user.telegram_id);
      }
    }
    adminBroadcastState.delete(senderTelegramId);
    const summaryMessage = `\u2705 <b>Broadcast completed</b>

Message sent to ${successCount} user${successCount !== 1 ? "s" : ""}
Failed: ${failCount} user${failCount !== 1 ? "s" : ""}` + (failCount > 0 ? `

Some users may have blocked the bot or have invalid Telegram IDs.` : "");
    await bot.sendMessage(chatId, summaryMessage, { parse_mode: "HTML" });
    logAdminMessage(
      senderTelegramId,
      "BROADCAST_COMPLETED",
      `Message sent to ${successCount} users, failed for ${failCount} users`,
      `${successCount} users with notifications enabled`
    );
    return { successCount, failCount, failedIds };
  } catch (error) {
    console.error("[BROADCAST] Error in broadcast process:", error);
    adminBroadcastState.delete(senderTelegramId);
    await bot.sendMessage(
      chatId,
      "\u274C <b>Broadcast Error</b>\n\nThere was an error while sending your broadcast message. Please try again later.",
      { parse_mode: "HTML" }
    );
    throw error;
  }
}
async function broadcastCollaborationToUsers(collaboration, message, senderTelegramId, chatId) {
  try {
    console.log("[COLLAB_BROADCAST] Starting collaboration broadcast process");
    adminCollabBroadcastState.set(senderTelegramId, {
      state: "sending",
      selectedCollaboration: collaboration,
      message,
      timestamp: Date.now()
    });
    await bot.sendMessage(
      chatId,
      "\u{1F4E4} <b>Collaboration broadcast process started</b>\n\nSending your promotional message to all eligible users...",
      { parse_mode: "HTML" }
    );
    const usersWithJoinedPreferences = await db.select({
      id: users.id,
      telegram_id: users.telegram_id,
      first_name: users.first_name,
      last_name: users.last_name,
      handle: users.handle,
      notifications_enabled: notification_preferences.notifications_enabled
    }).from(users).leftJoin(
      notification_preferences,
      eq(users.id, notification_preferences.user_id)
    ).where(eq(users.is_approved, true));
    const eligibleUsers = usersWithJoinedPreferences.filter(
      (user) => user.notifications_enabled === true && user.telegram_id
    );
    console.log(
      `[COLLAB_BROADCAST] Found ${eligibleUsers.length} eligible users out of ${usersWithJoinedPreferences.length} total approved users`
    );
    const companyNamesQuery = await db.select({
      user_id: companies.user_id,
      company_name: companies.name,
      job_title: companies.job_title
    }).from(companies);
    const companyLookup = new Map(
      companyNamesQuery.map((c) => [c.user_id, { name: c.company_name, job_title: c.job_title }])
    );
    const existingRequests = await db.select({
      requester_id: requests.requester_id,
      status: requests.status
    }).from(requests).where(eq(requests.collaboration_id, collaboration.id));
    const requestLookup = new Map(
      existingRequests.map((r) => [r.requester_id, r.status])
    );
    let successCount = 0;
    let failCount = 0;
    const failedIds = [];
    for (const user of eligibleUsers) {
      try {
        const userChatId = parseInt(user.telegram_id);
        if (isNaN(userChatId)) {
          console.error(
            `[COLLAB_BROADCAST] Invalid Telegram ID for user ${user.id}: ${user.telegram_id}`
          );
          continue;
        }
        let personalizedMessage = message;
        personalizedMessage = personalizedMessage.replace(/\{\{first_name\}\}/g, user.first_name || "");
        personalizedMessage = personalizedMessage.replace(/\{\{last_name\}\}/g, user.last_name || "");
        const company = companyLookup.get(user.id);
        personalizedMessage = personalizedMessage.replace(/\{\{company_name\}\}/g, company?.name || "");
        personalizedMessage = personalizedMessage.replace(/\{\{role_title\}\}/g, company?.job_title || "");
        const formattedHandle = user.handle ? `@${user.handle.replace(/^@/, "")}` : "";
        personalizedMessage = personalizedMessage.replace(/\{\{handle\}\}/g, formattedHandle);
        let buttons;
        if (collaboration.creator_id === user.id) {
          buttons = [
            [{ text: "You are the host of this collaboration", callback_data: "host_info" }],
            [{ text: "View More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }]
          ];
        } else if (requestLookup.has(user.id)) {
          const requestStatus = requestLookup.get(user.id);
          buttons = [
            [{ text: "\u2705 Request Already Sent", callback_data: "request_sent" }],
            [{ text: "View More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }]
          ];
        } else if (collaboration.status !== "active") {
          buttons = [
            [{ text: "This collaboration is no longer available", callback_data: "unavailable" }],
            [{ text: "View More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }]
          ];
        } else {
          buttons = [
            [{ text: "\u2705 Request Collab", callback_data: `request_collab_${collaboration.id}` }],
            [{ text: "View More Collabs", web_app: { url: `${WEBAPP_URL}/discover` } }]
          ];
        }
        const keyboard = { inline_keyboard: buttons };
        const finalPersonalizedMessage = `\u{1F91D} <b>New Collab</b>

${personalizedMessage}`;
        await bot.sendMessage(userChatId, finalPersonalizedMessage, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          reply_markup: keyboard
        });
        console.log(
          `[COLLAB_BROADCAST] Message sent to user ${user.first_name} ${user.last_name || ""} (${user.telegram_id})`
        );
        successCount++;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        console.error(
          `[COLLAB_BROADCAST] Failed to send to user ${user.telegram_id}:`,
          error
        );
        failCount++;
        failedIds.push(user.telegram_id);
      }
    }
    adminCollabBroadcastState.delete(senderTelegramId);
    const summaryMessage = `\u2705 <b>Collaboration broadcast completed</b>

<b>Collaboration:</b> ${collaboration.companyName} - ${collaboration.collab_type}

Message sent to ${successCount} user${successCount !== 1 ? "s" : ""}
Failed: ${failCount} user${failCount !== 1 ? "s" : ""}` + (failCount > 0 ? `

Some users may have blocked the bot or have invalid Telegram IDs.` : "");
    await bot.sendMessage(chatId, summaryMessage, { parse_mode: "HTML" });
    logAdminMessage(
      senderTelegramId,
      "COLLAB_BROADCAST_COMPLETED",
      `Collaboration promotional message sent to ${successCount} users, failed for ${failCount} users`,
      `${collaboration.companyName} - ${collaboration.collab_type}`
    );
    return { successCount, failCount, failedIds };
  } catch (error) {
    console.error("[COLLAB_BROADCAST] Error in collaboration broadcast process:", error);
    adminCollabBroadcastState.delete(senderTelegramId);
    await bot.sendMessage(
      chatId,
      "\u274C <b>Collaboration Broadcast Error</b>\n\nThere was an error while sending your collaboration broadcast. Please try again later.",
      { parse_mode: "HTML" }
    );
    throw error;
  }
}
async function handleStatus(msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  console.log("=== Handling /status command ===");
  console.log("Chat ID:", chatId);
  console.log("Telegram ID:", telegramId);
  try {
    if (!telegramId) {
      throw new Error("No Telegram ID found in message");
    }
    const [user] = await db.select().from(users).where(eq(users.telegram_id, telegramId));
    if (!user) {
      await bot.sendMessage(
        chatId,
        "You haven't submitted an application yet. Please start the bot with /start and apply to join Collab Room."
      );
      return;
    }
    let statusText;
    let keyboard;
    if (user.is_approved) {
      statusText = "\u2705 Your application has been approved! You have full access to Collab Room.";
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "\u{1F680} Launch Collab Room",
              web_app: { url: `${WEBAPP_URL}/discover` }
            }
          ]
        ]
      };
    } else {
      statusText = "\u23F3 Your application is currently under review. We will notify you once it's approved.";
      keyboard = {
        inline_keyboard: [
          [
            {
              text: "View Application Status",
              web_app: { url: `${WEBAPP_URL}/application-status` }
            }
          ]
        ]
      };
    }
    await bot.sendMessage(
      chatId,
      statusText,
      keyboard ? { reply_markup: keyboard } : void 0
    );
  } catch (error) {
    console.error("Error in handleStatus:", error);
    await bot.sendMessage(
      chatId,
      "Sorry, something went wrong. Please try again in a few moments."
    );
  }
}
bot.onText(/\/status/, handleStatus);
bot.on("callback_query", async (callbackQuery) => {
  try {
    const action = callbackQuery.data;
    if (!action) {
      console.log("Received callback query with no data");
      return;
    }
    console.log(`[CALLBACK] Received callback query with action: ${action}`);
    console.log(
      `[CALLBACK] From user: ${callbackQuery.from.first_name} (${callbackQuery.from.id})`
    );
    console.log(`[CALLBACK] Chat ID: ${callbackQuery.message?.chat.id}`);
    console.log(`[CALLBACK] Message ID: ${callbackQuery.message?.message_id}`);
    if (action === "broadcast_confirm") {
      console.log(`[CALLBACK] Handling broadcast confirmation`);
      await handleBroadcastConfirm(callbackQuery);
    } else if (action === "broadcast_cancel") {
      console.log(`[CALLBACK] Handling broadcast cancellation`);
      await handleBroadcastCancel(callbackQuery);
    } else if (action.startsWith("select_collab_")) {
      console.log(`[CALLBACK] Handling collaboration selection: ${action}`);
      await handleCollabSelection(callbackQuery);
    } else if (action === "collab_broadcast_confirm") {
      console.log(`[CALLBACK] Handling collaboration broadcast confirmation`);
      await handleCollabBroadcastConfirm(callbackQuery);
    } else if (action === "collab_broadcast_cancel") {
      console.log(`[CALLBACK] Handling collaboration broadcast cancellation`);
      await handleCollabBroadcastCancel(callbackQuery);
    } else if (action.startsWith("request_collab_")) {
      console.log(`[CALLBACK] Handling collaboration request from broadcast: ${action}`);
      await handleCollabRequestFromBroadcast(callbackQuery);
    } else if (action.startsWith("approve_user_")) {
      console.log(`[CALLBACK] Handling user approval: ${action}`);
      await handleApproveUserCallback(callbackQuery);
    } else if (action.startsWith("swipe_") || action.startsWith("sr_") || action.startsWith("sl_")) {
      console.log(`[CALLBACK] Handling swipe action: ${action}`);
      await handleSwipeCallback(callbackQuery);
    } else if (action.startsWith("match_info_")) {
      console.log(`[CALLBACK] Handling match info: ${action}`);
      await handleMatchInfoCallback(callbackQuery);
    } else if (action.startsWith("copy_referral_code_")) {
      console.log(`[CALLBACK] Handling copy referral code: ${action}`);
      const referralCode = action.substring("copy_referral_code_".length);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `Your code: ${referralCode}

It has been copied to the clipboard!`,
        show_alert: true
      });
      console.log(
        `User ${callbackQuery.from.id} copied referral code ${referralCode}`
      );
    } else {
      console.log(`[CALLBACK] Unknown callback action: ${action}`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Unknown action"
      });
    }
  } catch (error) {
    console.error("[CALLBACK] Error handling callback query:", error);
    console.error("[CALLBACK] Error details:", error.message);
    console.error("[CALLBACK] Error stack:", error.stack);
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Sorry, something went wrong. Please try again."
      });
    } catch (err) {
      console.error("[CALLBACK] Error sending callback answer:", err);
    }
  }
});
async function handleBroadcastConfirm(callbackQuery) {
  if (!callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    console.log("Missing required callback data for broadcast");
    return;
  }
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  const state = adminBroadcastState.get(telegramId);
  if (!state || state.state !== "awaiting_confirmation" || !state.message) {
    console.log(`Invalid broadcast state for user ${telegramId}`);
    await bot.sendMessage(
      chatId,
      "\u274C <b>Error</b>\n\nBroadcast session expired or invalid. Please start again with /broadcast.",
      { parse_mode: "HTML" }
    );
    adminBroadcastState.delete(telegramId);
    return;
  }
  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Your broadcast is being processed..."
    });
    await bot.editMessageText(
      "\u{1F4E4} <b>Broadcast confirmed</b>\n\nYour message is being sent to all users with notifications enabled. Please wait...",
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      }
    );
    await broadcastMessageToUsers(state.message, telegramId, chatId);
  } catch (error) {
    console.error("Error processing broadcast confirmation:", error);
    adminBroadcastState.delete(telegramId);
    await bot.sendMessage(
      chatId,
      "\u274C <b>Error</b>\n\nThere was an error processing your broadcast. Please try again with /broadcast.",
      { parse_mode: "HTML" }
    );
  }
}
async function handleBroadcastCancel(callbackQuery) {
  if (!callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    console.log("Missing required callback data for broadcast cancel");
    return;
  }
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Broadcast cancelled"
    });
    adminBroadcastState.delete(telegramId);
    await bot.editMessageText(
      "\u2705 <b>Broadcast cancelled</b>\n\nYour message will not be sent. Use /broadcast to start again if needed.",
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      }
    );
    logAdminMessage(
      telegramId,
      "BROADCAST_CANCELLED",
      "Admin cancelled broadcast at confirmation step"
    );
  } catch (error) {
    console.error("Error cancelling broadcast:", error);
    await bot.sendMessage(
      chatId,
      "\u274C <b>Error</b>\n\nThere was an error cancelling your broadcast, but the broadcast has been stopped.",
      { parse_mode: "HTML" }
    );
  }
}
async function handleCollabSelection(callbackQuery) {
  if (!callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    console.log("Missing required callback data for collaboration selection");
    return;
  }
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  try {
    const collaborationId = callbackQuery.data.replace("select_collab_", "");
    const [collaboration] = await db.select({
      id: collaborations.id,
      creator_id: collaborations.creator_id,
      collab_type: collaborations.collab_type,
      description: collaborations.description,
      status: collaborations.status
    }).from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration || collaboration.status !== "active") {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "This collaboration is no longer available.",
        show_alert: true
      });
      return;
    }
    const [company] = await db.select({ name: companies.name }).from(companies).where(eq(companies.user_id, collaboration.creator_id));
    const companyName = company?.name || "Unknown Company";
    adminCollabBroadcastState.set(telegramId, {
      state: "awaiting_message",
      selectedCollaboration: {
        ...collaboration,
        companyName
      },
      timestamp: Date.now()
    });
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `Selected: ${companyName} - ${collaboration.collab_type}`
    });
    await bot.editMessageText(
      `\u{1F680} <b>Collab Broadcast</b>

<b>Selected Collaboration:</b> ${companyName} - ${collaboration.collab_type}

\u{1F4DD} <b>Write your promotional message:</b>

<i>Your message can include:</i>
\u2022 <b>Bold text</b> using &lt;b&gt;text&lt;/b&gt;
\u2022 <i>Italic text</i> using &lt;i&gt;text&lt;/i&gt;
\u2022 <u>Underlined text</u> using &lt;u&gt;text&lt;/u&gt;
\u2022 Links like &lt;a href="https://example.com"&gt;this&lt;/a&gt;

<i>Personalization placeholders:</i>
\u2022 {{first_name}} - User's first name
\u2022 {{last_name}} - User's last name
\u2022 {{company_name}} - User's company name
\u2022 {{role_title}} - User's job title
\u2022 {{handle}} - User's Telegram handle

Send your message now, or type /cancel to abort.`,
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      }
    );
    logAdminMessage(
      telegramId,
      "COLLAB_SELECTED",
      "Admin selected collaboration for broadcast",
      `${companyName} - ${collaboration.collab_type}`
    );
  } catch (error) {
    console.error("Error handling collaboration selection:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error selecting collaboration. Please try again.",
      show_alert: true
    });
  }
}
async function handleCollabBroadcastConfirm(callbackQuery) {
  if (!callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    console.log("Missing required callback data for collaboration broadcast confirm");
    return;
  }
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  const state = adminCollabBroadcastState.get(telegramId);
  if (!state || state.state !== "awaiting_confirmation" || !state.message || !state.selectedCollaboration) {
    console.log(`Invalid collaboration broadcast state for user ${telegramId}`);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Broadcast session expired. Please start again.",
      show_alert: true
    });
    adminCollabBroadcastState.delete(telegramId);
    return;
  }
  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Your collaboration broadcast is being processed..."
    });
    await bot.editMessageText(
      "\u{1F4E4} <b>Collaboration Broadcast confirmed</b>\n\nYour promotional message is being sent to all eligible users. Please wait...",
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      }
    );
    await broadcastCollaborationToUsers(
      state.selectedCollaboration,
      state.message,
      telegramId,
      chatId
    );
  } catch (error) {
    console.error("Error processing collaboration broadcast confirmation:", error);
    adminCollabBroadcastState.delete(telegramId);
    await bot.sendMessage(
      chatId,
      "\u274C <b>Error</b>\n\nThere was an error processing your collaboration broadcast. Please try again with /broadcastcollab.",
      { parse_mode: "HTML" }
    );
  }
}
async function handleCollabBroadcastCancel(callbackQuery) {
  if (!callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    console.log("Missing required callback data for collaboration broadcast cancel");
    return;
  }
  const telegramId = callbackQuery.from.id.toString();
  const chatId = callbackQuery.message.chat.id;
  try {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Collaboration broadcast cancelled"
    });
    adminCollabBroadcastState.delete(telegramId);
    await bot.editMessageText(
      "\u2705 <b>Collaboration broadcast cancelled</b>\n\nYour message will not be sent. Use /broadcastcollab to start again if needed.",
      {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] }
      }
    );
    logAdminMessage(
      telegramId,
      "COLLAB_BROADCAST_CANCELLED",
      "Admin cancelled collaboration broadcast at confirmation step"
    );
  } catch (error) {
    console.error("Error cancelling collaboration broadcast:", error);
    await bot.sendMessage(
      chatId,
      "\u274C <b>Error</b>\n\nThere was an error cancelling your collaboration broadcast, but the broadcast has been stopped.",
      { parse_mode: "HTML" }
    );
  }
}
async function handleCollabRequestFromBroadcast(callbackQuery) {
  if (!callbackQuery.data || !callbackQuery.from.id || !callbackQuery.message?.chat.id) {
    return;
  }
  const collaborationId = callbackQuery.data.replace("request_collab_", "");
  const requesterId = callbackQuery.from.id.toString();
  try {
    const [requesterUser] = await db.select({ id: users.id }).from(users).where(eq(users.telegram_id, requesterId));
    if (!requesterUser) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Please register first by visiting the platform.",
        show_alert: true
      });
      return;
    }
    const [collaboration] = await db.select({
      id: collaborations.id,
      creator_id: collaborations.creator_id,
      status: collaborations.status
    }).from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration || collaboration.status !== "active") {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "This collaboration is no longer available.",
        show_alert: true
      });
      return;
    }
    if (collaboration.creator_id === requesterUser.id) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "You cannot request your own collaboration.",
        show_alert: true
      });
      return;
    }
    const [existingRequest] = await db.select().from(requests).where(
      and(
        eq(requests.collaboration_id, collaborationId),
        eq(requests.requester_id, requesterUser.id)
      )
    );
    if (existingRequest) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "You have already requested this collaboration.",
        show_alert: true
      });
      return;
    }
    await db.insert(requests).values({
      collaboration_id: collaborationId,
      requester_id: requesterUser.id,
      host_id: collaboration.creator_id,
      status: "pending"
    });
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Your collaboration request has been sent!"
    });
    await notifyNewCollabRequest(
      collaboration.creator_id,
      requesterUser.id,
      collaborationId
    );
    logAdminMessage(
      "SYSTEM",
      "COLLAB_REQUEST_FROM_BROADCAST",
      "User requested collaboration from broadcast",
      `Requester: ${requesterId}, Collaboration: ${collaborationId}`
    );
  } catch (error) {
    console.error("Error handling collaboration request from broadcast:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Error processing request. Please try again.",
      show_alert: true
    });
  }
}
async function handleApproveUserCallback(callbackQuery) {
  try {
    console.log(`[APPROVAL] Starting approval handler`);
    console.log(`[APPROVAL] Callback query data: ${callbackQuery.data}`);
    console.log(
      `[APPROVAL] From user: ${callbackQuery.from.first_name} (${callbackQuery.from.id})`
    );
    if (!callbackQuery.data) {
      console.error(`[APPROVAL] No callback data provided`);
      return;
    }
    const telegramIdToApprove = callbackQuery.data.split("_")[2];
    const adminTelegramId = callbackQuery.from.id.toString();
    const chatId = callbackQuery.message?.chat.id;
    console.log(`[APPROVAL] Parsed data:`);
    console.log(`[APPROVAL] - Telegram ID to approve: ${telegramIdToApprove}`);
    console.log(`[APPROVAL] - Admin Telegram ID: ${adminTelegramId}`);
    console.log(`[APPROVAL] - Chat ID: ${chatId}`);
    if (!telegramIdToApprove || !chatId) {
      console.error(`[APPROVAL] Missing required data for user approval`);
      console.error(`[APPROVAL] - telegramIdToApprove: ${telegramIdToApprove}`);
      console.error(`[APPROVAL] - chatId: ${chatId}`);
      return;
    }
    console.log(
      `[APPROVAL] Admin ${adminTelegramId} is approving user ${telegramIdToApprove}`
    );
    const [userToApprove] = await db.select().from(users).where(eq(users.telegram_id, telegramIdToApprove));
    if (!userToApprove) {
      console.error(
        `[APPROVAL] User with Telegram ID ${telegramIdToApprove} not found`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "User not found in database.",
        show_alert: true
      });
      return;
    }
    if (userToApprove.is_approved) {
      console.log(`[APPROVAL] User ${telegramIdToApprove} is already approved`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "This user is already approved.",
        show_alert: true
      });
      if (callbackQuery.message) {
        const currentKeyboard = callbackQuery.message.reply_markup?.inline_keyboard;
        if (currentKeyboard && currentKeyboard.length > 1) {
          const updatedKeyboard = {
            inline_keyboard: currentKeyboard.slice(1)
            // Remove first row, keep the rest
          };
          await bot.editMessageReplyMarkup(updatedKeyboard, {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          });
        }
      }
      return;
    }
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "Approving user..."
    });
    await db.update(users).set({
      is_approved: true,
      approved_at: /* @__PURE__ */ new Date()
    }).where(eq(users.telegram_id, telegramIdToApprove));
    console.log(`[APPROVAL] User ${telegramIdToApprove} has been approved`);
    logAdminMessage(
      adminTelegramId,
      "USER_APPROVAL",
      `Admin approved user ${userToApprove.first_name} ${userToApprove.last_name || ""} (${telegramIdToApprove})`,
      `${userToApprove.first_name} ${userToApprove.last_name || ""} (${telegramIdToApprove})`
    );
    await notifyUserApproved(
      parseInt(telegramIdToApprove),
      userToApprove.handle
    );
    if (userToApprove.referred_by) {
      try {
        console.log(
          `[REFERRAL] User ${telegramIdToApprove} was referred by ${userToApprove.referred_by}, sending notification`
        );
        console.log(
          `[REFERRAL] User's referred_by field: ${userToApprove.referred_by}, typeof=${typeof userToApprove.referred_by}`
        );
        console.log(
          `[REFERRAL] User's ID field: ${userToApprove.id}, typeof=${typeof userToApprove.id}`
        );
        try {
          const [referrerUser] = await db.select().from(users).where(eq(users.id, userToApprove.referred_by));
          if (referrerUser) {
            console.log(
              `[REFERRAL] Found referrer user: ID=${referrerUser.id}, Name=${referrerUser.first_name}, TelegramID=${referrerUser.telegram_id}`
            );
          } else {
            console.log(
              `[REFERRAL] Could not find referrer with user ID ${userToApprove.referred_by}`
            );
            const [referrerByTelegramId] = await db.select().from(users).where(eq(users.telegram_id, userToApprove.referred_by));
            if (referrerByTelegramId) {
              console.log(
                `[REFERRAL] Found referrer by Telegram ID: ${referrerByTelegramId.id}`
              );
            } else {
              console.log(
                `[REFERRAL] Could not find referrer by Telegram ID either: ${userToApprove.referred_by}`
              );
            }
          }
        } catch (lookupError) {
          console.error(
            `[REFERRAL] Error looking up referrer details: ${lookupError}`
          );
        }
        try {
          const [existingEvent] = await db.select().from(referral_events).where(
            and(
              eq(referral_events.referrer_id, userToApprove.referred_by),
              eq(referral_events.referred_user_id, userToApprove.id)
            )
          );
          if (existingEvent) {
            await db.update(referral_events).set({
              status: "completed",
              completed_at: /* @__PURE__ */ new Date()
            }).where(eq(referral_events.id, existingEvent.id));
            console.log(
              `[REFERRAL] Updated existing referral event ${existingEvent.id} to completed status`
            );
          } else {
            const [newEvent] = await db.insert(referral_events).values({
              referrer_id: userToApprove.referred_by,
              referred_user_id: userToApprove.id,
              status: "completed",
              created_at: /* @__PURE__ */ new Date(),
              completed_at: /* @__PURE__ */ new Date()
            }).returning();
            console.log(
              `[REFERRAL] Created new referral event ${newEvent.id} with completed status`
            );
          }
        } catch (eventError) {
          console.error(
            `[REFERRAL] Error updating referral event: ${eventError}`
          );
        }
        await notifyReferrerAboutApproval(
          userToApprove.referred_by,
          userToApprove.first_name
        );
      } catch (referralError) {
        console.error(`Error notifying referrer: ${referralError}`);
      }
    }
    const confirmationMessage = `\u2705 <b>User Approved Successfully!</b>

You have approved <b>${userToApprove.first_name} ${userToApprove.last_name || ""}</b>'s application.

The user has been notified and now has full access to the platform.`;
    const confirmationKeyboard = {
      inline_keyboard: [
        [
          {
            text: "\u{1F441}\uFE0F View All Applications",
            web_app: { url: `${WEBAPP_URL}/admin/applications` }
          }
        ]
      ]
    };
    try {
      await bot.sendMessage(chatId, confirmationMessage, {
        parse_mode: "HTML",
        reply_markup: confirmationKeyboard
      });
    } catch (error) {
      console.error(`[APPROVAL] Failed to send confirmation message: ${error}`);
    }
    if (callbackQuery.message) {
      const currentKeyboard = callbackQuery.message.reply_markup?.inline_keyboard;
      if (currentKeyboard && currentKeyboard.length > 1) {
        const updatedKeyboard = {
          inline_keyboard: currentKeyboard.slice(1)
          // Remove first row, keep the rest
        };
        await bot.editMessageReplyMarkup(updatedKeyboard, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id
        });
      }
    }
  } catch (error) {
    console.error("Error handling user approval:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "An error occurred while approving the user. Please try again.",
      show_alert: true
    });
  }
}
async function handleMatchInfoCallback(callbackQuery) {
  try {
    if (!callbackQuery.data) {
      return;
    }
    const matchId = callbackQuery.data.split("_")[2];
    const chatId = callbackQuery.message?.chat.id;
    if (!matchId || !chatId) {
      console.error("Missing required data for match info");
      return;
    }
    console.log(`[MATCH_INFO] Fetching info for match ${matchId}`);
    const [request] = await db.select().from(requests).where(eq(requests.id, matchId));
    if (!request) {
      console.error(`[MATCH_INFO] Request with ID ${matchId} not found`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Request not found in database.",
        show_alert: true
      });
      return;
    }
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, request.collaboration_id));
    if (!collaboration) {
      console.error(
        `[MATCH_INFO] Collaboration with ID ${request.collaboration_id} not found`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Collaboration details not found.",
        show_alert: true
      });
      return;
    }
    const [requester] = await db.select().from(users).where(eq(users.id, request.requester_id));
    const [host] = await db.select().from(users).where(eq(users.id, request.host_id));
    if (!requester || !host) {
      console.error(`[MATCH_INFO] User details not found for match ${matchId}`);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "User details not found.",
        show_alert: true
      });
      return;
    }
    const matchInfo = `<b>\u{1F4CB} Request Details</b>

<b>Collaboration Type:</b> ${collaboration.collab_type}
<b>Created:</b> ${format(request.created_at || /* @__PURE__ */ new Date(), "MMM d, yyyy")}

<b>\u{1F464} Host:</b> ${host.first_name} ${host.last_name || ""} ${host.handle ? `(@${host.handle})` : ""}
<b>\u{1F464} Requester:</b> ${requester.first_name} ${requester.last_name || ""} ${requester.handle ? `(@${requester.handle})` : ""}

<b>Status:</b> ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}

Click below to view full details:`;
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "\u{1F50D} View Full Details",
            web_app: { url: `${WEBAPP_URL}/requests/${matchId}` }
          }
        ]
      ]
    };
    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.sendMessage(chatId, matchInfo, {
      parse_mode: "HTML",
      reply_markup: keyboard
    });
  } catch (error) {
    console.error("Error handling match info:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "An error occurred while retrieving match information.",
      show_alert: true
    });
  }
}
async function sendDirectFormattedMessage(chatId, text2, options) {
  try {
    console.log(`[TELEGRAM] Environment: ${currentEnvironment}`);
    console.log(
      `[TELEGRAM] Using ${isProduction2 ? "production" : "test"} bot for notifications`
    );
    console.log(`[TELEGRAM] Attempting to send message to chat ID: ${chatId}`);
    console.log(
      `[TELEGRAM] Message preview: ${text2.substring(0, 50)}${text2.length > 50 ? "..." : ""}`
    );
    console.log(`[TELEGRAM] Message options:`, JSON.stringify(options || {}));
    const botInfo = await bot.getMe();
    console.log(`[TELEGRAM] Bot info: ${botInfo.username} (ID: ${botInfo.id})`);
    const result = await bot.sendMessage(chatId, text2, options);
    console.log(
      `[TELEGRAM] \u2705 Successfully sent message to ${chatId}, message ID: ${result.message_id}`
    );
    return true;
  } catch (error) {
    console.error(`[TELEGRAM] Failed to send message to ${chatId}:`, error);
    if (error instanceof Error) {
      console.error(
        `[TELEGRAM] Error: ${error.name}, message: ${error.message}`
      );
      if (error.message.includes("chat not found")) {
        console.error(
          `[TELEGRAM] ERROR: Chat ${chatId} not found. User may have blocked the bot or never interacted with it.`
        );
        console.error(
          `[TELEGRAM] NOTE: Make sure user registered with the ${isProduction2 ? "production" : "test"} bot.`
        );
      } else if (error.message.includes("bot was blocked")) {
        console.error(`[TELEGRAM] ERROR: Bot was blocked by user ${chatId}.`);
      } else if (error.message.includes("Forbidden")) {
        console.error(
          `[TELEGRAM] ERROR: Bot doesn't have permission to send messages to ${chatId}.`
        );
      } else if (error.message.includes("Bad Request")) {
        console.error(
          `[TELEGRAM] ERROR: Invalid request parameters for chat ${chatId}.`
        );
      }
    }
    return false;
  }
}
async function handleSwipeCallback(callbackQuery) {
  try {
    if (!callbackQuery.data) {
      return;
    }
    const parts = callbackQuery.data.split("_");
    let direction;
    let collaborationId;
    let requesterId;
    if (callbackQuery.data.startsWith("sr_") || callbackQuery.data.startsWith("sl_")) {
      direction = callbackQuery.data.startsWith("sr_") ? "right" : "left";
      const shortCollabId = parts[1];
      const shortRequesterId = parts[2];
      console.log(
        `[SWIPE_CALLBACK] Processing shortened callback: direction=${direction}, shortCollabId=${shortCollabId}, shortRequesterId=${shortRequesterId}`
      );
      const collaborationResults = await db.execute(
        sql`SELECT * FROM collaborations WHERE SUBSTRING(CAST(id as TEXT), 1, 8) = ${shortCollabId}`
      );
      const collaboration2 = collaborationResults.rows[0];
      if (!collaboration2) {
        console.error(
          `[SWIPE_CALLBACK] Collaboration with short ID ${shortCollabId} not found`
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Collaboration not found.",
          show_alert: true
        });
        return;
      }
      const requesterResults = await db.execute(
        sql`SELECT * FROM users WHERE SUBSTRING(CAST(id as TEXT), 1, 8) = ${shortRequesterId}`
      );
      const requester2 = requesterResults.rows[0];
      if (!requester2) {
        console.error(
          `[SWIPE_CALLBACK] Requester with short ID ${shortRequesterId} not found`
        );
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Requester not found.",
          show_alert: true
        });
        return;
      }
      collaborationId = collaboration2.id;
      requesterId = requester2.id;
      console.log(
        `[SWIPE_CALLBACK] Resolved to full IDs: collaborationId=${collaborationId}, requesterId=${requesterId}`
      );
    } else {
      direction = parts[1];
      collaborationId = parts[2];
      requesterId = parts[3];
    }
    const chatId = callbackQuery.message?.chat.id;
    const fromTelegramId = callbackQuery.from.id.toString();
    if (!direction || !collaborationId || !requesterId || !chatId) {
      console.error("Missing required data for swipe action");
      return;
    }
    console.log(
      `[SWIPE_ACTION] User ${fromTelegramId} swiped ${direction} on collab ${collaborationId} for user ${requesterId}`
    );
    const [user] = await db.select().from(users).where(eq(users.telegram_id, fromTelegramId));
    if (!user) {
      console.error(
        `[SWIPE_ACTION] User with Telegram ID ${fromTelegramId} not found`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "User not found. Please try again.",
        show_alert: true
      });
      return;
    }
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration) {
      console.error(
        `[SWIPE_ACTION] Collaboration with ID ${collaborationId} not found`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Collaboration not found. It may have been deleted.",
        show_alert: true
      });
      return;
    }
    const [requester] = await db.select().from(users).where(eq(users.id, requesterId));
    if (!requester) {
      console.error(
        `[SWIPE_ACTION] Requester with ID ${requesterId} not found`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Requester not found. They may have been removed.",
        show_alert: true
      });
      return;
    }
    if (collaboration.creator_id !== user.id) {
      console.error(
        `[SWIPE_ACTION] User ${user.id} does not own collaboration ${collaborationId}, creator is ${collaboration.creator_id}`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "You can only respond to requests for your own collaborations.",
        show_alert: true
      });
      return;
    }
    const existingRequests = await db.select().from(requests).where(
      and(
        eq(requests.collaboration_id, collaborationId),
        eq(requests.requester_id, requesterId)
      )
    );
    if (!existingRequests || existingRequests.length === 0) {
      console.error(
        `[SWIPE_ACTION] No existing request found for collab ${collaborationId} and user ${requesterId}`
      );
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Original request not found. It may have been removed.",
        show_alert: true
      });
      return;
    }
    const existingMatch = existingRequests.find(
      (req) => req.status === "accepted"
    );
    if (existingMatch) {
      console.log(
        `[SWIPE_ACTION] Match already exists for collab ${collaborationId} and user ${requesterId}`
      );
      if (callbackQuery.message) {
        await bot.editMessageText(
          `\u2705 You've already matched with ${requester.first_name} ${requester.last_name || ""}${requester.handle ? ` (@${requester.handle})` : ""} on this collaboration.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "\u{1F389} View Matches",
                    web_app: { url: `${WEBAPP_URL}/matches` }
                  }
                ]
              ]
            },
            parse_mode: "HTML",
            disable_web_page_preview: true
          }
        );
      }
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "You've already matched with this user."
      });
      return;
    }
    if (direction === "right") {
      const [updatedRequest] = await db.update(requests).set({
        status: "accepted",
        updated_at: /* @__PURE__ */ new Date()
      }).where(
        and(
          eq(requests.collaboration_id, collaborationId),
          eq(requests.requester_id, requesterId)
        )
      ).returning();
      console.log(
        `[SWIPE_ACTION] Accepted request ${updatedRequest.id} for collab ${collaborationId} and user ${requesterId}`
      );
      if (requester.telegram_id) {
        const requesterChatId = parseInt(requester.telegram_id);
        const [hostCompany] = await db.select().from(companies).where(eq(companies.user_id, user.id)).limit(1);
        const hostCompanyUrl = hostCompany?.twitter_handle ? `https://twitter.com/${hostCompany.twitter_handle}` : hostCompany?.website || "#";
        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "\u{1F389} View Matches",
                web_app: { url: `${WEBAPP_URL}/matches` }
              }
            ]
          ]
        };
        await sendDirectFormattedMessage(
          requesterChatId,
          `\u{1F389} <b>New Match!</b>

<b>${user.first_name} ${user.last_name || ""}</b>${user.handle ? ` (@${user.handle})` : ""} from <a href="${hostCompanyUrl}">${hostCompany?.name || "their company"}</a> has matched with you on a <b>${collaboration.collab_type}</b> collaboration!

Click below to view your matches and start chatting:`,
          {
            parse_mode: "HTML",
            reply_markup: keyboard,
            disable_web_page_preview: true
          }
        );
      }
      const [requesterCompany] = await db.select().from(companies).where(eq(companies.user_id, requesterId)).limit(1);
      if (callbackQuery.message) {
        await bot.editMessageText(
          `\u2705 You matched with ${requester.first_name} ${requester.last_name || ""}${requester.handle ? ` (@${requester.handle})` : ""} from ${requesterCompany?.name || "their company"}!`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "\u{1F389} View Matches",
                    web_app: { url: `${WEBAPP_URL}/matches` }
                  }
                ]
              ]
            },
            parse_mode: "HTML",
            disable_web_page_preview: true
          }
        );
      }
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `You matched with ${requester.first_name}! They've been notified.`
      });
    } else if (direction === "left") {
      console.log(
        `[SWIPE_ACTION] User ${user.id} swiped left on request from ${requesterId} for collab ${collaborationId}`
      );
      const [updatedRequest] = await db.update(requests).set({
        status: "hidden",
        updated_at: /* @__PURE__ */ new Date()
      }).where(
        and(
          eq(requests.collaboration_id, collaborationId),
          eq(requests.requester_id, requesterId)
        )
      ).returning();
      console.log(
        `[SWIPE_ACTION] Hidden request ${updatedRequest.id} for collab ${collaborationId} and user ${requesterId}`
      );
      if (callbackQuery.message) {
        await bot.editMessageText(
          `\u274C You hid the collaboration request from ${requester.first_name} ${requester.last_name || ""}.`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          }
        );
      }
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `You hid the request from ${requester.first_name}.`
      });
    }
  } catch (error) {
    console.error("Error handling swipe action:", error);
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "An error occurred while processing your response. Please try again.",
      show_alert: true
    });
  }
}
async function notifyNewCollabRequest(hostUserId, requesterUserId, collaborationId) {
  try {
    console.log(`\u{1F514} TELEGRAM NOTIFICATION: Starting notifyNewCollabRequest`);
    console.log(`\u{1F514} Environment: ${currentEnvironment}`);
    console.log(`\u{1F514} Using ${currentEnvironment} bot for notifications`);
    console.log(`\u{1F514} Host User ID: ${hostUserId}`);
    console.log(`\u{1F514} Requester User ID: ${requesterUserId}`);
    console.log(`\u{1F514} Collaboration ID: ${collaborationId}`);
    const [host] = await db.select().from(users).where(eq(users.id, hostUserId));
    if (!host || !host.telegram_id) {
      console.error(
        `\u{1F514} ERROR: Host user ${hostUserId} not found or has no Telegram ID`
      );
      return false;
    }
    console.log(
      `\u{1F514} Host found: ${host.first_name} ${host.last_name}, Telegram ID: ${host.telegram_id}`
    );
    const [requester] = await db.select().from(users).where(eq(users.id, requesterUserId));
    if (!requester) {
      console.error(`\u{1F514} ERROR: Requester user ${requesterUserId} not found`);
      return false;
    }
    console.log(
      `\u{1F514} Requester found: ${requester.first_name} ${requester.last_name}`
    );
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration) {
      console.error(`Collaboration ${collaborationId} not found`);
      return false;
    }
    const [preferences] = await db.select().from(notification_preferences).where(eq(notification_preferences.user_id, hostUserId));
    if (preferences && preferences.notifications_enabled === false) {
      console.log(`Host ${hostUserId} has notifications disabled`);
      return false;
    }
    const shortCollabId = collaborationId.substring(0, 8);
    const shortRequesterId = requesterUserId.substring(0, 8);
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "\u274C Hide",
            callback_data: `sl_${shortCollabId}_${shortRequesterId}`
          },
          {
            text: "\u2705 Match",
            callback_data: `sr_${shortCollabId}_${shortRequesterId}`
          }
        ],
        [
          {
            text: "\u{1F680} Launch Collab Room",
            web_app: { url: `${WEBAPP_URL}/discover` }
          }
        ]
      ]
    };
    const [requesterCompany] = await db.select().from(companies).where(eq(companies.user_id, requesterUserId));
    const [request] = await db.select().from(requests).where(
      and(
        eq(requests.requester_id, requesterUserId),
        eq(requests.collaboration_id, collaborationId),
        eq(requests.status, "pending")
      )
    ).orderBy(sql`${requests.created_at} DESC`).limit(1);
    let noteSection = "";
    if (request && request.note) {
      noteSection = `
\u{1F4DD} <b>Note:</b> ${request.note}
`;
    }
    const companyTwitterHandle = requesterCompany?.twitter_handle ? requesterCompany.twitter_handle.replace("@", "") : "";
    const userTwitterHandle = requester.twitter_handle ? requester.twitter_handle.replace("@", "") : "";
    const twitterHandle = companyTwitterHandle || userTwitterHandle;
    const twitterLink = twitterHandle ? `<a href="https://twitter.com/${twitterHandle}">Twitter</a>` : "Twitter";
    const linkedinLink = requesterCompany?.linkedin_url ? `<a href="${requesterCompany.linkedin_url}">LinkedIn</a>` : "LinkedIn";
    const websiteLink = requesterCompany?.website ? `<a href="${requesterCompany.website}">Website</a>` : "Website";
    const hostHandle = host.handle || host.first_name;
    const message = `\u{1F525} ${host.handle ? `@${host.handle}` : host.first_name} - <b>New Collab Request from ${requesterCompany?.name || requester.first_name + "'s company"}</b>${noteSection}

\u{1F4BC} <a href="${requesterCompany?.website || requester.website || "#"}">${requesterCompany?.name || requester.first_name + "'s company"}</a>
\u2753 <i>${requesterCompany?.short_description || "Web3 company focusing on blockchain solutions"}</i>
\u{1F517} ${twitterLink} | ${linkedinLink} | ${websiteLink}
\u{1F464} ${requesterCompany?.job_title || "Unknown Role"}

\u{1F91D} <b>Your Collab:</b> ${collaboration.collab_type}
\u270F\uFE0F ${collaboration.description ? collaboration.description : "diving deep into other projects"}
${collaboration.topics?.length ? "\u{1F3F7}\uFE0F " + collaboration.topics.join(", ") : ""}`;
    console.log(
      `\u{1F514} SENDING MESSAGE: Attempting to send Telegram message to ${host.telegram_id}`
    );
    console.log(`\u{1F514} MESSAGE CONTENT: ${message.substring(0, 200)}...`);
    await sendDirectFormattedMessage(parseInt(host.telegram_id), message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
    console.log(
      `\u{1F514} SUCCESS: Sent collaboration request notification to host ${hostUserId}`
    );
    return true;
  } catch (error) {
    console.error("Error sending collaboration request notification:", error);
    return false;
  }
}
async function notifyRequesterRequestSent(requesterUserId, hostUserId, collaborationId, note) {
  try {
    console.log(`\u{1F514} TELEGRAM NOTIFICATION: Starting notifyRequesterRequestSent`);
    console.log(`\u{1F514} Environment: ${currentEnvironment}`);
    console.log(`\u{1F514} Using ${currentEnvironment} bot for notifications`);
    console.log(`\u{1F514} Requester User ID: ${requesterUserId}`);
    console.log(`\u{1F514} Host User ID: ${hostUserId}`);
    console.log(`\u{1F514} Collaboration ID: ${collaborationId}`);
    const [requester] = await db.select().from(users).where(eq(users.id, requesterUserId));
    if (!requester || !requester.telegram_id) {
      console.error(
        `\u{1F514} ERROR: Requester user ${requesterUserId} not found or has no Telegram ID`
      );
      return false;
    }
    console.log(
      `\u{1F514} Requester found: ${requester.first_name} ${requester.last_name}, Telegram ID: ${requester.telegram_id}`
    );
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration) {
      console.error(`\u{1F514} ERROR: Collaboration ${collaborationId} not found`);
      return false;
    }
    const [hostCompany] = await db.select().from(companies).where(eq(companies.user_id, hostUserId)).limit(1);
    if (!hostCompany) {
      console.error(`\u{1F514} ERROR: Host company for user ${hostUserId} not found`);
      return false;
    }
    console.log(`\u{1F514} Host company found: ${hostCompany.name}`);
    console.log(`\u{1F514} Host company Twitter handle: ${hostCompany.twitter_handle}`);
    const [preferences] = await db.select().from(notification_preferences).where(eq(notification_preferences.user_id, requesterUserId));
    if (preferences && preferences.notifications_enabled === false) {
      console.log(`\u{1F514} Requester ${requesterUserId} has notifications disabled`);
      return false;
    }
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "\u{1F4F1} View My Matches",
            web_app: { url: `${WEBAPP_URL}/matches` }
          }
        ],
        [
          {
            text: "\u{1F680} Launch Collab Room",
            web_app: { url: `${WEBAPP_URL}/discover` }
          }
        ]
      ]
    };
    const userHandle = requester.username ? `@${requester.username}` : `${requester.first_name}${requester.last_name ? ` ${requester.last_name}` : ""}`;
    const companyNameDisplay = hostCompany.twitter_handle ? `<a href="https://x.com/${hostCompany.twitter_handle}">${hostCompany.name}</a>` : hostCompany.name;
    let message = `\u2705 <b>${userHandle} - Your collab request has been sent to ${companyNameDisplay} for their collab ${collaboration.collab_type}.</b>

`;
    if (note && note.trim()) {
      message += `\u{1F4DD} <b>Your note:</b> ${note}

`;
    }
    message += `If they approve it, you'll be matched and able to connect via the My Matches section. You'll also get a notification here when that happens.`;
    console.log(
      `\u{1F514} SENDING MESSAGE: Attempting to send confirmation to ${requester.telegram_id}`
    );
    console.log(`\u{1F514} MESSAGE CONTENT: ${message}`);
    await sendDirectFormattedMessage(parseInt(requester.telegram_id), message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
      disable_web_page_preview: true
    });
    console.log(
      `\u{1F514} SUCCESS: Sent collab request confirmation to requester ${requesterUserId}`
    );
    return true;
  } catch (error) {
    console.error("Error sending collab request confirmation:", error);
    return false;
  }
}
async function notifyMatchCreated(hostUserId, requesterUserId, collaborationId, matchId) {
  try {
    const [host] = await db.select().from(users).where(eq(users.id, hostUserId));
    if (!host || !host.telegram_id) {
      console.error(`Host user ${hostUserId} not found or has no Telegram ID`);
      return false;
    }
    const [requester] = await db.select().from(users).where(eq(users.id, requesterUserId));
    if (!requester || !requester.telegram_id) {
      console.error(
        `Requester user ${requesterUserId} not found or has no Telegram ID`
      );
      return false;
    }
    const [collaboration] = await db.select().from(collaborations).where(eq(collaborations.id, collaborationId));
    if (!collaboration) {
      console.error(`Collaboration ${collaborationId} not found`);
      return false;
    }
    const [hostPreferences] = await db.select().from(notification_preferences).where(eq(notification_preferences.user_id, hostUserId));
    const [requesterPreferences] = await db.select().from(notification_preferences).where(eq(notification_preferences.user_id, requesterUserId));
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: "\u{1F389} View Matches",
            web_app: { url: `${WEBAPP_URL}/matches` }
          }
        ]
      ]
    };
    const [hostCompany] = await db.select().from(companies).where(eq(companies.user_id, hostUserId)).limit(1);
    const [requesterCompany] = await db.select().from(companies).where(eq(companies.user_id, requesterUserId)).limit(1);
    const hostTwitterLink = hostCompany?.twitter_handle ? `<a href="https://twitter.com/${hostCompany.twitter_handle}">@${hostCompany.twitter_handle}</a>` : "Twitter";
    const requesterTwitterLink = requesterCompany?.twitter_handle ? `<a href="https://twitter.com/${requesterCompany.twitter_handle}">@${requesterCompany.twitter_handle}</a>` : "Twitter";
    const requesterCompanyUrl = requesterCompany?.twitter_handle ? `https://twitter.com/${requesterCompany.twitter_handle}` : requesterCompany?.website || "#";
    const hostCompanyUrl = hostCompany?.twitter_handle ? `https://twitter.com/${hostCompany.twitter_handle}` : hostCompany?.website || "#";
    const matchMessage = `\u{1F389} <b>New Match!</b>

You've matched with <b>${requester.first_name} ${requester.last_name || ""}</b>${requester.handle ? ` (@${requester.handle})` : ""} from <a href="${requesterCompanyUrl}">${requesterCompany?.name || "their company"}</a> on your <b>${collaboration.collab_type}</b> collaboration!

Click below to view your matches and start chatting:`;
    const requesterMessage = `\u{1F389} <b>New Match!</b>

<b>${host.first_name} ${host.last_name || ""}</b>${host.handle ? ` (@${host.handle})` : ""} from <a href="${hostCompanyUrl}">${hostCompany?.name || "their company"}</a> has matched with you on a <b>${collaboration.collab_type}</b> collaboration!

Click below to view your matches and start chatting:`;
    let hostNotified = false;
    let requesterNotified = false;
    if (!hostPreferences || hostPreferences.notifications_enabled !== false) {
      await sendDirectFormattedMessage(
        parseInt(host.telegram_id),
        matchMessage,
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
          disable_web_page_preview: true
        }
      );
      hostNotified = true;
    }
    if (!requesterPreferences || requesterPreferences.notifications_enabled !== false) {
      await sendDirectFormattedMessage(
        parseInt(requester.telegram_id),
        requesterMessage,
        {
          parse_mode: "HTML",
          reply_markup: keyboard,
          disable_web_page_preview: true
        }
      );
      requesterNotified = true;
    }
    console.log(
      `Match notifications sent - Host: ${hostNotified}, Requester: ${requesterNotified}`
    );
    return true;
  } catch (error) {
    console.error("Error sending match notifications:", error);
    return false;
  }
}
setupBotCommands().then((success) => {
  if (success) {
    console.log("Bot commands set up successfully");
  } else {
    console.error("Failed to set up bot commands");
  }
}).catch((error) => {
  console.error("Error setting up bot commands:", error);
});
async function stopBot() {
  try {
    console.log("\u{1F527} Stopping Telegram bot...");
    await bot.stopPolling();
    console.log("\u{1F527} Telegram bot stopped successfully");
  } catch (error) {
    console.error("Error stopping bot:", error);
  }
}
process.on("SIGINT", async () => {
  console.log("\n\u{1F527} Received SIGINT, shutting down gracefully...");
  await stopBot();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("\n\u{1F527} Received SIGTERM, shutting down gracefully...");
  await stopBot();
  process.exit(0);
});

// server/storage.ts
import { eq as eq3, and as and3, or as or2, inArray as inArray3, not as not2, desc as desc2, sql as sql3, lt as lt2, arrayOverlaps } from "drizzle-orm";
import crypto2 from "crypto";

// server/storage.optimized.ts
import { eq as eq2, and as and2, inArray as inArray2, not, desc, sql as sql2 } from "drizzle-orm";
var logger = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args),
  debug: (...args) => console.log(...args)
};
async function searchCollaborationsPaginatedOptimized(userId, filters) {
  logger.info("============ DEBUG: Search Collaborations Paginated (Highly Optimized) ============");
  logger.info(`Filters: ${JSON.stringify(filters)}`);
  logger.info(`User ID: ${userId}`);
  const startTime = performance.now();
  const limit = filters.limit || 10;
  logger.info(`Using limit: ${limit}`);
  try {
    const marketingPrefsQuery = userId !== "anonymous" ? await db.select().from(marketing_preferences).where(eq2(marketing_preferences.user_id, userId)).limit(1) : [];
    const marketingPrefs = marketingPrefsQuery.length > 0 ? marketingPrefsQuery[0] : null;
    let query = db.select({
      // Select specific fields instead of entire tables to reduce payload size
      // ===== KEY OPTIMIZATION: Only select fields that are actually needed =====
      collaboration: {
        id: collaborations.id,
        creator_id: collaborations.creator_id,
        collab_type: collaborations.collab_type,
        status: collaborations.status,
        description: collaborations.description,
        topics: collaborations.topics,
        twitter_followers: collaborations.twitter_followers,
        company_twitter_followers: collaborations.company_twitter_followers,
        funding_stage: collaborations.funding_stage,
        company_has_token: collaborations.company_has_token,
        company_tags: collaborations.company_tags,
        date_type: collaborations.date_type,
        specific_date: collaborations.specific_date,
        details: collaborations.details,
        created_at: collaborations.created_at
      },
      company: {
        name: companies.name,
        logo_url: companies.logo_url,
        // FIX: Add missing logo_url field selection
        // Use appropriate company fields
        short_description: companies.short_description,
        long_description: companies.long_description,
        website: companies.website,
        twitter_handle: companies.twitter_handle,
        twitter_followers: companies.twitter_followers,
        linkedin_url: companies.linkedin_url,
        job_title: companies.job_title,
        has_token: companies.has_token,
        token_ticker: companies.token_ticker,
        blockchain_networks: companies.blockchain_networks,
        tags: companies.tags,
        funding_stage: companies.funding_stage
      },
      user: {
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        role_title: users.handle
        // This seems to be used as the role title in the app
      }
    }).from(collaborations).innerJoin(
      users,
      eq2(collaborations.creator_id, users.id)
    ).leftJoin(
      companies,
      eq2(users.id, companies.user_id)
    );
    const baseConditions = [
      // Only active collaborations
      eq2(collaborations.status, "active")
    ];
    const allExcludeIds = filters.excludeIds || [];
    if (allExcludeIds.length > 0) {
      baseConditions.push(not(inArray2(collaborations.id, allExcludeIds)));
    }
    if (marketingPrefs) {
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_collab_types_enabled && marketingPrefs.collabs_to_discover && marketingPrefs.collabs_to_discover.length > 0) {
        baseConditions.push(
          inArray2(collaborations.collab_type, marketingPrefs.collabs_to_discover)
        );
      }
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_topics_enabled && marketingPrefs.filtered_marketing_topics && marketingPrefs.filtered_marketing_topics.length > 0) {
        baseConditions.push(
          sql2`NOT (${collaborations.topics} && ARRAY[${marketingPrefs.filtered_marketing_topics.map((t) => `'${t}'`).join(",")}]::text[])`
        );
      }
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_company_followers_enabled && marketingPrefs.company_twitter_followers) {
        baseConditions.push(
          eq2(collaborations.company_twitter_followers, marketingPrefs.company_twitter_followers)
        );
      }
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_user_followers_enabled && marketingPrefs.twitter_followers) {
        baseConditions.push(
          eq2(collaborations.twitter_followers, marketingPrefs.twitter_followers)
        );
      }
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_funding_stages_enabled && marketingPrefs.funding_stage) {
        baseConditions.push(
          eq2(collaborations.funding_stage, marketingPrefs.funding_stage)
        );
      }
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_token_status_enabled) {
        baseConditions.push(
          sql2`${collaborations.company_has_token} = ${marketingPrefs.company_has_token ? "true" : "false"}`
        );
      }
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_company_sectors_enabled && marketingPrefs.company_tags && marketingPrefs.company_tags.length > 0) {
        baseConditions.push(
          sql2`${collaborations.company_tags} && ARRAY[${marketingPrefs.company_tags.map((t) => `'${t}'`).join(",")}]::text[]`
        );
      }
      if (marketingPrefs.discovery_filter_enabled && marketingPrefs.discovery_filter_blockchain_networks_enabled && marketingPrefs.company_blockchain_networks && marketingPrefs.company_blockchain_networks.length > 0) {
        baseConditions.push(
          sql2`${collaborations.company_blockchain_networks} && ARRAY[${marketingPrefs.company_blockchain_networks.map((t) => `'${t}'`).join(",")}]::text[]`
        );
      }
    }
    if (filters.collabTypes && filters.collabTypes.length > 0) {
      logger.info(`Applying direct collaboration type filter: ${JSON.stringify(filters.collabTypes)}`);
      const { getCollabTypeDisplayName: getCollabTypeDisplayName2, DISPLAY_NAME_TO_ID_MAP: DISPLAY_NAME_TO_ID_MAP2 } = await Promise.resolve().then(() => (init_constants(), constants_exports));
      const dbCollabTypes = [];
      for (const typeId of filters.collabTypes) {
        const displayName = getCollabTypeDisplayName2(typeId);
        if (displayName) {
          dbCollabTypes.push(displayName);
        }
        for (const [legacyName, id] of Object.entries(DISPLAY_NAME_TO_ID_MAP2)) {
          if (id === typeId) {
            dbCollabTypes.push(legacyName);
          }
        }
        dbCollabTypes.push(typeId);
      }
      const uniqueDbTypes = [...new Set(dbCollabTypes)];
      logger.info(`Converted type IDs to database values: ${JSON.stringify(uniqueDbTypes)}`);
      baseConditions.push(
        inArray2(collaborations.collab_type, uniqueDbTypes)
      );
    }
    query = query.where(and2(...baseConditions));
    if (filters.cursor) {
      logger.info(`Using cursor-based pagination with cursor: ${filters.cursor}`);
      query = query.where(
        sql2`${collaborations.created_at} < (
          SELECT created_at FROM ${collaborations}
          WHERE id = ${filters.cursor}
        )`
      );
    }
    const sortBy = filters.sortBy || "newest";
    switch (sortBy) {
      case "oldest":
        query = query.orderBy(collaborations.created_at);
        break;
      case "collab_type":
        query = query.orderBy(collaborations.collab_type, desc(collaborations.created_at));
        break;
      case "newest":
      default:
        query = query.orderBy(desc(collaborations.created_at));
        break;
    }
    query = query.limit(limit + 1);
    logger.info("Executing optimized database query...");
    const results = await query;
    logger.info(`Found ${results.length} records from database`);
    const processedItems = results.map((r) => {
      const company = r.company;
      return {
        ...r.collaboration,
        // Include these important fields from company that the frontend expects
        creator_company_name: company?.name || "Independent",
        company_logo_url: company?.logo_url,
        // FIX: Add missing company logo URL mapping
        // Map company fields to the expected frontend fields
        company_description: company ? company.long_description || company.short_description : void 0,
        company_website: company?.website,
        // Additional company fields to support the details dialog
        company_twitter: company?.twitter_handle,
        company_twitter_followers: company?.twitter_followers,
        company_linkedin: company?.linkedin_url,
        company_short_description: company?.short_description,
        company_has_token: company?.has_token || false,
        company_token_ticker: company?.token_ticker,
        company_blockchain_networks: company?.blockchain_networks,
        company_tags: company?.tags || [],
        // FIX: Add company_data object that the dialog expects
        company_data: company ? {
          name: company.name,
          short_description: company.short_description,
          long_description: company.long_description,
          twitter_handle: company.twitter_handle,
          twitter_followers: company.twitter_followers,
          website: company.website,
          linkedin_url: company.linkedin_url,
          funding_stage: company.funding_stage,
          has_token: company.has_token,
          token_ticker: company.token_ticker,
          blockchain_networks: company.blockchain_networks,
          job_title: company.job_title,
          tags: company.tags,
          logo_url: company.logo_url
        } : null,
        // User information
        creator_first_name: r.user.first_name,
        creator_last_name: r.user.last_name,
        creator_role: r.user.role_title
      };
    });
    const hasMore = processedItems.length > limit;
    const items = hasMore ? processedItems.slice(0, limit) : processedItems;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : void 0;
    const endTime = performance.now();
    const queryTime = endTime - startTime;
    logger.info(`Query execution time: ${queryTime.toFixed(2)}ms (target: <90ms)`);
    logger.info(`Returning ${items.length} collaborations, hasMore: ${hasMore}, nextCursor: ${nextCursor}`);
    if (items.length > 0) {
      logger.info("DEBUG: First collaboration item structure:");
      logger.info("- Has company_data:", !!items[0].company_data);
      logger.info("- Company data:", items[0].company_data);
      logger.info("- Creator company name:", items[0].creator_company_name);
    }
    return {
      items,
      hasMore,
      nextCursor
    };
  } catch (error) {
    logger.error("Error in highly optimized searchCollaborationsPaginated:", error);
    throw error;
  }
}

// server/storage.ts
var DatabaseStorage = class {
  // User methods
  async getUser(id) {
    const rows = await db.select().from(users).where(eq3(users.id, id));
    return rows[0];
  }
  async getUserByTelegramId(telegramId) {
    const rows = await db.select().from(users).where(eq3(users.telegram_id, telegramId));
    return rows[0];
  }
  async createUser(insertUser) {
    const rows = await db.insert(users).values(insertUser).returning();
    return rows[0];
  }
  async setUserAdminStatus(id, isAdmin) {
    try {
      const rows = await db.update(users).set({ is_admin: isAdmin }).where(eq3(users.id, id)).returning();
      return rows[0];
    } catch (error) {
      console.error("Error updating user admin status:", error);
      throw error;
    }
  }
  async deleteUser(id) {
    try {
      const result = await db.delete(users).where(eq3(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
  // Collaboration methods
  async createCollaboration(collaboration) {
    console.log("Creating collaboration with data:", collaboration);
    let collabData = { ...collaboration };
    if (!collabData.creator_id) {
      console.error("Missing creator_id in collaboration data");
      throw new Error("creator_id is required for collaboration creation");
    }
    if (collabData.date_type === "any_future_date") {
      console.log("Removing specific_date for any_future_date option");
      delete collabData.specific_date;
    } else if (collabData.date_type === "specific_date" && collabData.specific_date) {
      console.log("Formatting specific_date:", collabData.specific_date);
    }
    if (collabData.details) {
      console.log("Processing details object:", collabData.details);
      if (collabData.description) {
        console.log("Description already set from client:", collabData.description);
      } else {
        console.log("No description provided, setting empty string as default");
        collabData.description = "";
      }
      if (collabData.collab_type === "Co-Marketing on Twitter") {
        console.log("Processing Twitter co-marketing details:", collabData.details);
        if (collabData.details.twittercomarketing_type) {
          if (!Array.isArray(collabData.details.twittercomarketing_type)) {
            collabData.details.twittercomarketing_type = [collabData.details.twittercomarketing_type];
            console.log("Converted twittercomarketing_type to array:", collabData.details.twittercomarketing_type);
          }
        }
      } else if (collabData.collab_type === "Twitter Spaces Guest") {
        console.log("Processing Twitter Spaces Guest details:", collabData.details);
      }
    }
    const preparedData = {
      ...collabData,
      // Make sure each array field is properly formatted as an array of strings
      topics: Array.isArray(collabData.topics) ? collabData.topics.map((topic) => String(topic)) : collabData.topics ? [String(collabData.topics)] : [],
      required_company_sectors: Array.isArray(collabData.required_company_sectors) ? collabData.required_company_sectors.map((sector) => String(sector)) : collabData.required_company_sectors ? [String(collabData.required_company_sectors)] : [],
      required_funding_stages: Array.isArray(collabData.required_funding_stages) ? collabData.required_funding_stages.map((stage) => String(stage)) : collabData.required_funding_stages ? [String(collabData.required_funding_stages)] : [],
      // Special handling based on collaboration type
      details: (() => {
        if (collabData.collab_type === "Co-Marketing on Twitter") {
          return {
            twittercomarketing_type: Array.isArray(collabData.details?.twittercomarketing_type) ? collabData.details.twittercomarketing_type : collabData.details?.twittercomarketing_type ? [collabData.details.twittercomarketing_type] : ["Thread Collab"],
            host_twitter_handle: collabData.details?.host_twitter_handle || "https://x.com/",
            host_follower_count: collabData.details?.host_follower_count || "0-1K"
            // No longer add short_description to details as we're using root-level description
          };
        } else if (collabData.collab_type === "Twitter Spaces Guest") {
          return {
            twitter_handle: collabData.details?.twitter_handle || "https://x.com/",
            host_follower_count: collabData.details?.host_follower_count || "0-1K"
            // No longer add short_description to details as we're using root-level description
          };
        }
        return collabData.details;
      })(),
      // Ensure description is set
      description: collabData.description || "",
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
    console.log("Final prepared data:", preparedData);
    try {
      const [newCollaboration] = await db.insert(collaborations).values(preparedData).returning();
      return newCollaboration;
    } catch (error) {
      console.error("Database error inserting collaboration:", error);
      throw error;
    }
  }
  async getCollaboration(id) {
    const [collaboration] = await db.select().from(collaborations).where(eq3(collaborations.id, id));
    return collaboration;
  }
  async getUserCollaborations(userId) {
    return db.select().from(collaborations).where(eq3(collaborations.creator_id, userId)).orderBy(desc2(collaborations.created_at));
  }
  /**
   * Get the total count of active collaborations in the database
   * This helps identify discrepancies between swipe counts and available collaborations
   */
  async getActiveCollaborationsCount() {
    const result = await db.select({
      count: sql3`count(*)`
    }).from(collaborations).where(eq3(collaborations.status, "active"));
    return result[0]?.count || 0;
  }
  async searchCollaborations(userId, filters) {
    const result = await this.searchCollaborationsPaginated(userId, filters);
    return result.items;
  }
  /**
   * Legacy implementation of search collaborations paginated - kept for reference and fallback
   */
  async searchCollaborationsPaginatedLegacy(userId, filters) {
    console.log("============ DEBUG: Search Collaborations Paginated (Join-Based Legacy) ============");
    console.log("Filters:", filters);
    console.log("User ID:", userId);
    const limit = filters.limit || 10;
    console.log(`Using limit: ${limit}`);
    const marketingPrefs = await this.getUserMarketingPreferences(userId);
    const userRequests = await this.getUserRequestsAsRequester(userId);
    const skippedCollaborationIds = userRequests.filter((r) => r.status === "skipped").map((r) => r.collaboration_id);
    console.log(`Found ${userRequests.length} previous requests by user ${userId}, of which ${skippedCollaborationIds.length} are skipped`);
    const userCollaborations = await this.getUserCollaborations(userId);
    const userCollaborationIds = userCollaborations.map((collab) => collab.id);
    console.log(`Found ${userCollaborations.length} collaborations created by user ${userId}`);
    console.log(`User collaboration IDs: ${userCollaborationIds.join(", ")}`);
    const allIds = [
      ...userCollaborationIds,
      ...skippedCollaborationIds,
      ...filters.excludeIds || []
    ];
    const excludeIds = allIds.filter((id, index2) => allIds.indexOf(id) === index2);
    console.log(`Total IDs to exclude: ${excludeIds.length} (${userCollaborationIds.length} own + ${skippedCollaborationIds.length} skipped + ${filters.excludeIds?.length || 0} additional)`);
    let query = db.select({
      collaboration: collaborations,
      company: companies,
      user: users
    }).from(collaborations).innerJoin(
      users,
      eq3(collaborations.creator_id, users.id)
    ).innerJoin(
      companies,
      eq3(users.id, companies.user_id)
    ).where(
      eq3(collaborations.status, "active")
    );
    console.log("Using join structure: collaborations -> users -> companies");
    if (excludeIds.length > 0) {
      console.log(`Excluding ${excludeIds.length} total collaborations from results`);
      query = query.where(not2(inArray3(collaborations.id, excludeIds)));
      console.log("Excluded IDs for debugging:", excludeIds);
    }
    console.log("Excluding user's own collaborations (creator_id filtering)");
    query = query.where(not2(eq3(collaborations.creator_id, userId)));
    if (marketingPrefs) {
      console.log("Found marketing preferences - applying any enabled filters");
      if (marketingPrefs.discovery_filter_collab_types_enabled && marketingPrefs.collabs_to_discover && marketingPrefs.collabs_to_discover.length > 0) {
        console.log(`Filtering by collaboration types: ${marketingPrefs.collabs_to_discover.join(", ")}`);
        query = query.where(inArray3(collaborations.collab_type, marketingPrefs.collabs_to_discover));
      }
      if (marketingPrefs.discovery_filter_topics_enabled && marketingPrefs.filtered_marketing_topics && marketingPrefs.filtered_marketing_topics.length > 0) {
        console.log(`Excluding topics: ${marketingPrefs.filtered_marketing_topics.join(", ")}`);
        query = query.where(
          not2(arrayOverlaps(collaborations.topics, marketingPrefs.filtered_marketing_topics))
        );
      }
      if (marketingPrefs.discovery_filter_company_followers_enabled && marketingPrefs.company_twitter_followers) {
        console.log(`Filtering by company followers: ${marketingPrefs.company_twitter_followers}`);
        query = query.where(eq3(collaborations.company_twitter_followers, marketingPrefs.company_twitter_followers));
      }
      if (marketingPrefs.discovery_filter_user_followers_enabled && marketingPrefs.twitter_followers) {
        console.log(`Filtering by user followers: ${marketingPrefs.twitter_followers}`);
        query = query.where(eq3(collaborations.twitter_followers, marketingPrefs.twitter_followers));
      }
      if (marketingPrefs.discovery_filter_funding_stages_enabled && marketingPrefs.funding_stage) {
        console.log(`Filtering by funding stage: ${marketingPrefs.funding_stage}`);
        query = query.where(eq3(collaborations.funding_stage, marketingPrefs.funding_stage));
      }
      if (marketingPrefs.discovery_filter_token_status_enabled) {
        console.log(`Filtering by token status: ${marketingPrefs.company_has_token}`);
        query = query.where(eq3(collaborations.company_has_token, marketingPrefs.company_has_token === true));
      }
      if (marketingPrefs.discovery_filter_company_sectors_enabled && marketingPrefs.company_tags && marketingPrefs.company_tags.length > 0) {
        console.log(`Filtering by company sectors: ${marketingPrefs.company_tags.join(", ")}`);
        query = query.where(
          arrayOverlaps(collaborations.company_tags, marketingPrefs.company_tags)
        );
      }
      if (marketingPrefs.discovery_filter_blockchain_networks_enabled && marketingPrefs.company_blockchain_networks && marketingPrefs.company_blockchain_networks.length > 0) {
        console.log(`Filtering by blockchain networks: ${marketingPrefs.company_blockchain_networks.join(", ")}`);
        query = query.where(
          arrayOverlaps(collaborations.company_blockchain_networks, marketingPrefs.company_blockchain_networks)
        );
      }
    }
    if (filters.cursor) {
      console.log(`Using cursor-based pagination with cursor: ${filters.cursor}`);
      const [cursorCollab] = await db.select().from(collaborations).where(eq3(collaborations.id, filters.cursor));
      if (cursorCollab && cursorCollab.created_at) {
        console.log(`Found cursor collaboration with timestamp: ${cursorCollab.created_at}`);
        query = query.where(lt2(collaborations.created_at, cursorCollab.created_at));
      } else {
        console.log(`Warning: Cursor collaboration with ID ${filters.cursor} not found`);
      }
    }
    query = query.orderBy(desc2(collaborations.created_at));
    query = query.limit(limit + 1);
    const results = await query;
    console.log(`Found ${results.length} collaborations (including potential extra for pagination)`);
    const collaborationResults = results.map((r) => r.collaboration);
    const hasMore = collaborationResults.length > limit;
    const items = hasMore ? collaborationResults.slice(0, limit) : collaborationResults;
    if (userCollaborationIds.length > 0) {
      const finalItems = items.filter((item) => !userCollaborationIds.includes(item.id));
      if (finalItems.length < items.length) {
        console.warn(`CRITICAL BUG: Found ${items.length - finalItems.length} of user's own collaborations in LEGACY implementation that weren't filtered out earlier!`);
        console.warn(`User's own collaboration IDs: ${userCollaborationIds.join(", ")}`);
        console.warn(`IDs that slipped through: ${items.filter((item) => userCollaborationIds.includes(item.id)).map((item) => item.id).join(", ")}`);
        items.length = 0;
        items.push(...finalItems);
      }
    }
    console.log(`User collaboration IDs for reference: ${userCollaborationIds.join(", ")}`);
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : void 0;
    console.log(`Returning ${items.length} collaborations, hasMore: ${hasMore}, nextCursor: ${nextCursor}`);
    return {
      items,
      hasMore,
      nextCursor
    };
  }
  /**
   * Optimized implementation of search collaborations paginated that combines multiple database calls
   * into a single operation with subqueries to improve performance.
   * 
   * Updated to use the highly optimized implementation that leverages custom database indexes
   * to significantly improve query performance for discovery cards.
   */
  async searchCollaborationsPaginated(userId, filters) {
    console.log("============ DEBUG: Search Collaborations Paginated (Super Optimized) ============");
    const useHighlyOptimized = process.env.USE_OPTIMIZED_DISCOVERY !== "false";
    if (useHighlyOptimized) {
      console.log("Using HIGHLY optimized implementation with advanced database indexing");
      try {
        return await searchCollaborationsPaginatedOptimized(userId, filters);
      } catch (error) {
        console.error("Error in highly optimized implementation, falling back to previous version:", error);
      }
    }
    console.log("Using standard optimized implementation");
    console.log("Filters:", filters);
    console.log("User ID:", userId);
    const startTime = Date.now();
    const limit = filters.limit || 10;
    console.log(`Using limit: ${limit}`);
    const totalCollabCount = await db.select({ count: sql3`count(*)` }).from(collaborations).where(eq3(collaborations.status, "active"));
    console.log(`Total active collaborations in database: ${totalCollabCount[0]?.count || 0}`);
    try {
      let cursorTimestamp;
      if (filters.cursor) {
        const [cursorCollab] = await db.select({
          created_at: collaborations.created_at
        }).from(collaborations).where(eq3(collaborations.id, filters.cursor));
        if (cursorCollab && cursorCollab.created_at) {
          cursorTimestamp = cursorCollab.created_at;
          console.log(`Found cursor collaboration with timestamp: ${cursorTimestamp}`);
        } else {
          console.log(`Warning: Cursor collaboration with ID ${filters.cursor} not found`);
        }
      }
      const userCollaborations = await this.getUserCollaborations(userId);
      const userCollaborationIds = userCollaborations.map((collab) => collab.id);
      console.log(`Found ${userCollaborations.length} collaborations created by user ${userId}`);
      console.log(`User collaboration IDs: ${userCollaborationIds.join(", ")}`);
      let query = db.select({
        collaboration: collaborations,
        company: companies,
        user: users,
        marketingPrefs: marketing_preferences
      }).from(collaborations).innerJoin(
        users,
        eq3(collaborations.creator_id, users.id)
      ).innerJoin(
        companies,
        eq3(users.id, companies.user_id)
      ).leftJoin(
        marketing_preferences,
        eq3(marketing_preferences.user_id, userId)
      ).where(
        eq3(collaborations.status, "active")
      );
      console.log("Using optimized join structure with marketing preferences included");
      const allExcludeIds = [
        ...userCollaborationIds,
        // Always exclude user's own collaborations
        ...filters.excludeIds || []
        // Add any explicitly provided IDs
      ];
      const excludeConditions = and3(
        // Only exclude explicitly provided IDs (if any)
        filters.excludeIds && filters.excludeIds.length > 0 ? not2(inArray3(collaborations.id, filters.excludeIds)) : void 0
      );
      query = query.where(excludeConditions);
      if (cursorTimestamp) {
        query = query.where(lt2(collaborations.created_at, cursorTimestamp));
      }
      query = query.orderBy(desc2(collaborations.created_at));
      query = query.limit(limit + 1);
      const results = await query;
      const marketingPrefs = results.length > 0 ? results[0].marketingPrefs : null;
      let filteredResults = [...results];
      if (marketingPrefs) {
        console.log("Found marketing preferences - applying any enabled filters");
        if (marketingPrefs.discovery_filter_enabled) {
          if (marketingPrefs.discovery_filter_collab_types_enabled && marketingPrefs.collabs_to_discover && marketingPrefs.collabs_to_discover.length > 0) {
            console.log(`Filtering by collaboration types: ${marketingPrefs.collabs_to_discover.join(", ")}`);
            filteredResults = filteredResults.filter(
              (r) => marketingPrefs.collabs_to_discover.includes(r.collaboration.collab_type)
            );
          }
          if (marketingPrefs.discovery_filter_topics_enabled && marketingPrefs.filtered_marketing_topics && marketingPrefs.filtered_marketing_topics.length > 0) {
            console.log(`Excluding topics: ${marketingPrefs.filtered_marketing_topics.join(", ")}`);
            filteredResults = filteredResults.filter((r) => {
              const collabTopics = r.collaboration.topics || [];
              const filteredTopics = marketingPrefs.filtered_marketing_topics || [];
              return !collabTopics.some((topic) => filteredTopics.includes(topic));
            });
          }
          if (marketingPrefs.discovery_filter_company_followers_enabled && marketingPrefs.company_twitter_followers) {
            console.log(`Filtering by company followers: ${marketingPrefs.company_twitter_followers}`);
            filteredResults = filteredResults.filter(
              (r) => r.collaboration.company_twitter_followers === marketingPrefs.company_twitter_followers
            );
          }
          if (marketingPrefs.discovery_filter_user_followers_enabled && marketingPrefs.twitter_followers) {
            console.log(`Filtering by user followers: ${marketingPrefs.twitter_followers}`);
            filteredResults = filteredResults.filter(
              (r) => r.collaboration.twitter_followers === marketingPrefs.twitter_followers
            );
          }
          if (marketingPrefs.discovery_filter_funding_stages_enabled && marketingPrefs.funding_stage) {
            console.log(`Filtering by funding stage: ${marketingPrefs.funding_stage}`);
            filteredResults = filteredResults.filter(
              (r) => r.collaboration.funding_stage === marketingPrefs.funding_stage
            );
          }
          if (marketingPrefs.discovery_filter_token_status_enabled) {
            console.log(`Filtering by token status: ${marketingPrefs.company_has_token}`);
            filteredResults = filteredResults.filter(
              (r) => r.collaboration.company_has_token === marketingPrefs.company_has_token
            );
          }
          if (marketingPrefs.discovery_filter_company_sectors_enabled && marketingPrefs.company_tags && marketingPrefs.company_tags.length > 0) {
            console.log(`Filtering by company sectors: ${marketingPrefs.company_tags.join(", ")}`);
            filteredResults = filteredResults.filter((r) => {
              const collabTags = r.collaboration.company_tags || [];
              const prefTags = marketingPrefs.company_tags || [];
              return collabTags.some((tag) => prefTags.includes(tag));
            });
          }
          if (marketingPrefs.discovery_filter_blockchain_networks_enabled && marketingPrefs.company_blockchain_networks && marketingPrefs.company_blockchain_networks.length > 0) {
            console.log(`Filtering by blockchain networks: ${marketingPrefs.company_blockchain_networks.join(", ")}`);
            filteredResults = filteredResults.filter((r) => {
              const collabNetworks = r.collaboration.company_blockchain_networks || [];
              const prefNetworks = marketingPrefs.company_blockchain_networks || [];
              return collabNetworks.some((network) => prefNetworks.includes(network));
            });
          }
        }
      }
      const collaborationResults = filteredResults.map((r) => {
        return {
          ...r.collaboration,
          // Include these important fields from company that the frontend expects
          creator_company_name: r.company.name,
          company_logo_url: r.company.logo_url,
          company_description: r.company.description,
          company_website: r.company.website,
          // Additional company fields to support the details dialog
          company_twitter: r.company.twitter_handle,
          company_twitter_followers: r.company.twitter_followers,
          company_linkedin: r.company.linkedin_url,
          company_short_description: r.company.short_description,
          company_has_token: r.company.has_token,
          company_token_ticker: r.company.token_ticker,
          company_blockchain_networks: r.company.blockchain_networks,
          company_tags: r.company.tags,
          // User information
          creator_first_name: r.user.first_name,
          creator_last_name: r.user.last_name,
          creator_role: r.user.role_title
        };
      });
      const hasMore = collaborationResults.length > limit;
      const items = hasMore ? collaborationResults.slice(0, limit) : collaborationResults;
      if (userCollaborationIds.length > 0) {
        const finalItems = items.filter((item) => !userCollaborationIds.includes(item.id));
        if (finalItems.length < items.length) {
          console.warn(`CRITICAL BUG: Found ${items.length - finalItems.length} of user's own collaborations that weren't filtered out earlier!`);
          console.warn(`User's own collaboration IDs: ${userCollaborationIds.join(", ")}`);
          console.warn(`IDs that slipped through: ${items.filter((item) => userCollaborationIds.includes(item.id)).map((item) => item.id).join(", ")}`);
          items.length = 0;
          items.push(...finalItems);
        }
      }
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : void 0;
      const endTime = Date.now();
      console.log(`Query execution time: ${endTime - startTime}ms`);
      console.log(`Found ${results.length} initial results, ${filteredResults.length} after filtering`);
      console.log(`Returning ${items.length} collaborations, hasMore: ${hasMore}, nextCursor: ${nextCursor}`);
      return {
        items,
        hasMore,
        nextCursor
      };
    } catch (error) {
      console.error("Error in optimized searchCollaborationsPaginated:", error);
      console.log("Falling back to legacy implementation");
      return this.searchCollaborationsPaginatedLegacy(userId, filters);
    }
  }
  async updateCollaborationStatus(id, status) {
    try {
      const [updatedCollaboration] = await db.update(collaborations).set({
        status,
        updated_at: /* @__PURE__ */ new Date()
      }).where(eq3(collaborations.id, id)).returning();
      return updatedCollaboration;
    } catch (error) {
      console.error("Error updating collaboration status:", error);
      throw error;
    }
  }
  async createCollabApplication(collaborationId, applicantId, message) {
    console.log("Creating collaboration application using new requests table");
    const collaboration = await this.getCollaboration(collaborationId);
    if (!collaboration) {
      throw new Error("Collaboration not found");
    }
    const requestData = {
      collaboration_id: collaborationId,
      requester_id: applicantId,
      host_id: collaboration.creator_id,
      status: "pending",
      note: message
    };
    const request = await this.createRequest(requestData);
    return {
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: { message },
      // Keep backward compatibility by putting message in details
      created_at: request.created_at
    };
  }
  // Collaboration applications (Legacy implementation - using swipes now)
  async applyToCollaboration(application) {
    console.log("Creating collaboration application using new requests table");
    console.log(`\u{1F4DD} Application details structure:`, JSON.stringify(application.details, null, 2));
    const collaboration = await this.getCollaboration(application.collaboration_id);
    if (!collaboration) {
      throw new Error("Collaboration not found");
    }
    const appDetails = application.details ?? {};
    const requestData = {
      collaboration_id: application.collaboration_id,
      requester_id: application.applicant_id,
      host_id: collaboration.creator_id,
      status: "pending",
      note: appDetails.notes || appDetails.message || null
    };
    console.log(`\u{1F4DD} Creating request with note: "${requestData.note}"`);
    const request = await this.createRequest(requestData);
    console.log(`\u{1F4DD} Request created successfully with ID: ${request.id}`);
    return {
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: application.details,
      created_at: request.created_at
    };
  }
  async getCollaborationApplications(collaborationId) {
    console.log("Getting collaboration applications using new requests table");
    const requests2 = await this.getRequestsForCollaboration(collaborationId);
    const pendingRequests = requests2.filter((req) => req.status === "pending");
    return pendingRequests.map((request) => ({
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: { message: request.note },
      created_at: request.created_at
    }));
  }
  async getUserApplications(userId) {
    console.log("Getting user applications using new requests table");
    const requests2 = await this.getUserRequestsAsRequester(userId);
    return requests2.map((request) => ({
      id: request.id,
      collaboration_id: request.collaboration_id,
      applicant_id: request.requester_id,
      status: request.status,
      details: { message: request.note },
      created_at: request.created_at
    }));
  }
  async updateApplicationStatus(id, status) {
    console.warn("Legacy updateApplicationStatus called - this is now managed via matches");
    return {
      id,
      collaboration_id: "",
      applicant_id: "",
      status,
      details: {},
      created_at: /* @__PURE__ */ new Date()
    };
  }
  async createCollaborationRequest(userId, collaborationId, action, note) {
    console.log(`Creating collaboration ${action} from user ${userId} for collaboration ${collaborationId}`);
    const collaboration = await this.getCollaboration(collaborationId);
    if (!collaboration) {
      throw new Error("Collaboration not found");
    }
    const existingRequest = await db.select().from(requests).where(
      and3(
        eq3(requests.collaboration_id, collaborationId),
        eq3(requests.requester_id, userId)
      )
    );
    if (existingRequest.length > 0) {
      console.log(`Request already exists: ${existingRequest[0].id}`);
      return existingRequest[0];
    }
    const requestData = {
      collaboration_id: collaborationId,
      requester_id: userId,
      host_id: collaboration.creator_id,
      status: action === "request" ? "pending" : "skipped",
      note: note || null
    };
    return await this.createRequest(requestData);
  }
  /**
   * Delete all skipped requests for a user and return the count.
   * Lets users "reset" and see collaborations they previously passed on.
   */
  async deleteSkippedRequests(userId) {
    console.log(`Deleting requests with status='skipped' for user ${userId}`);
    const deletedRequests = await db.delete(requests).where(
      and3(
        eq3(requests.requester_id, userId),
        eq3(requests.status, "skipped")
      )
    ).returning();
    console.log(`Deleted ${deletedRequests.length} skipped requests for user ${userId}`);
    return deletedRequests.length;
  }
  async getPotentialMatchesForHost(userId) {
    console.log("Finding potential matches for host:", userId);
    const hostCollaborations = await this.getUserCollaborations(userId);
    console.log(`Found ${hostCollaborations.length} collaborations created by host ${userId}`);
    const collabIds = hostCollaborations.map((collab) => collab.id);
    console.log(`Collaboration IDs for host ${userId}:`, collabIds);
    if (collabIds.length === 0) {
      console.log("Host has no collaborations to match");
      return [];
    }
    const userRequests = await db.select({ collaboration_id: requests.collaboration_id }).from(requests).where(eq3(requests.requester_id, userId));
    const alreadyRequestedCollabIds = userRequests.map((r) => r.collaboration_id);
    console.log(`Found ${alreadyRequestedCollabIds.length} collaborations already requested by user ${userId}`);
    const existingMatches = await db.select({
      collaboration_id: requests.collaboration_id,
      requester_id: requests.requester_id,
      host_id: requests.host_id
    }).from(requests).where(
      and3(
        or2(
          // Requests where the user's collaboration was matched with
          inArray3(requests.collaboration_id, collabIds),
          // Also requests where the user was a requester
          eq3(requests.requester_id, userId)
        ),
        eq3(requests.status, "accepted")
      )
    );
    console.log(`Found ${existingMatches.length} existing accepted requests for host collaborations`);
    const matchedUserCollabPairs = /* @__PURE__ */ new Set();
    existingMatches.forEach((match) => {
      matchedUserCollabPairs.add(`${match.requester_id}_${match.collaboration_id}`);
      matchedUserCollabPairs.add(`${match.host_id}_${match.collaboration_id}`);
    });
    console.log(`Excluding ${matchedUserCollabPairs.size} user-collaboration pairs that already have matches`);
    const pendingRequests = await db.select({
      request: requests,
      user: users,
      company: companies
    }).from(requests).innerJoin(users, eq3(requests.requester_id, users.id)).innerJoin(companies, eq3(users.id, companies.user_id)).where(
      and3(
        inArray3(requests.collaboration_id, collabIds),
        eq3(requests.status, "pending"),
        // CRITICAL FIX: Exclude requests made by the host themselves
        // This prevents users from seeing their own requests as potential matches
        not2(eq3(requests.requester_id, userId)),
        // ROBUST FILTERING: Exclude any collaborations the user has already requested
        alreadyRequestedCollabIds.length > 0 ? not2(inArray3(requests.collaboration_id, alreadyRequestedCollabIds)) : void 0
      )
    ).orderBy(desc2(requests.created_at));
    console.log(`Found ${pendingRequests.length} pending requests on host's collaborations`);
    if (pendingRequests.length > 0) {
      console.log("Pending requests detail:");
      pendingRequests.forEach((req, index2) => {
        console.log(`[${index2 + 1}] Request ID: ${req.request.id}`);
        console.log(`    Collaboration ID: ${req.request.collaboration_id}`);
        console.log(`    User: ${req.user.first_name} ${req.user.last_name || ""} (${req.user.id})`);
        console.log(`    Company: ${req.company.name}`);
      });
    }
    const jimRequest = pendingRequests.find(
      (req) => req.user.first_name.toLowerCase() === "jim" || req.user.first_name.toLowerCase().includes("jim")
    );
    if (jimRequest) {
      console.log("Found Jim's potential match:", {
        requestId: jimRequest.request.id,
        userId: jimRequest.user.id,
        firstName: jimRequest.user.first_name,
        lastName: jimRequest.user.last_name,
        company: jimRequest.company.name
      });
    } else {
      console.log("No request from Jim found");
    }
    const enrichedRequests = [];
    for (const result of pendingRequests) {
      try {
        const collaborationId = result.request.collaboration_id;
        const collaboration = await this.getCollaboration(collaborationId);
        const userCollabPair = `${result.user.id}_${collaborationId}`;
        const reverseUserCollabPair = `${userId}_${collaborationId}`;
        if (matchedUserCollabPairs.has(userCollabPair) || matchedUserCollabPairs.has(reverseUserCollabPair)) {
          console.log(`Skipping already matched user-collaboration pair: ${userCollabPair} or ${reverseUserCollabPair}`);
          continue;
        }
        const enriched = {
          ...result.request,
          user: result.user,
          company: result.company,
          // Add the complete collaboration as a nested object
          collaboration,
          // Add flattened fields for easier client-side access
          user_id: result.user.id,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          company_name: result.company.name,
          company_description: result.company.short_description || "",
          job_title: result.user.job_title,
          // Include collaboration data directly on the object for legacy code
          collab_type: collaboration?.collab_type || "Collaboration",
          title: collaboration?.title || "",
          description: collaboration?.description || "",
          topics: collaboration?.topics || [],
          details: collaboration?.details || {},
          // Create potentialMatchData field directly with ALL required fields
          potentialMatchData: {
            user_id: result.user.id,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            company_name: result.company.name,
            company_description: result.company.short_description || "",
            company_website: result.company.website,
            company_twitter: result.company.twitter_handle || "",
            company_linkedin: result.company.linkedin_url || "",
            job_title: result.user.job_title,
            twitter_followers: result.user.twitter_followers,
            company_twitter_followers: result.company.twitter_followers,
            request_created_at: result.request.created_at?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
            collaboration_id: result.request.collaboration_id,
            note: result.request.note || ""
          }
        };
        enrichedRequests.push(enriched);
      } catch (error) {
        console.error(`Error fetching collaboration ${result.request.collaboration_id}:`, error);
      }
    }
    console.log(`Returning ${enrichedRequests.length} potential matches with enhanced data structure`);
    if (enrichedRequests.length > 0) {
      console.log("Sample potential match data structure:", JSON.stringify(enrichedRequests[0], null, 2));
    }
    return enrichedRequests;
  }
  // Collaboration-requests summary for the host's inbox.
  async getCollaborationRequestsSummary(userId) {
    console.log("Getting collaboration requests summary for user:", userId);
    const userCollaborations = await this.getUserCollaborations(userId);
    const collabIds = userCollaborations.map((collab) => collab.id);
    if (collabIds.length === 0) {
      return { recentRequests: [], totalPendingCount: 0 };
    }
    const rawQuery = `
      SELECT 
        r.id as request_id,
        r.collaboration_id,
        r.note,
        r.created_at as request_created_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        c.name as company_name,
        c.twitter_handle,
        c.logo_url,
        co.collab_type,
        co.description as collab_description
      FROM requests r
      INNER JOIN users u ON r.requester_id = u.id
      INNER JOIN companies c ON u.id = c.user_id
      INNER JOIN collaborations co ON r.collaboration_id = co.id
      WHERE r.collaboration_id = ANY($1)
        AND r.status = 'pending'
        AND r.requester_id != $2
      ORDER BY r.created_at DESC
    `;
    const results = await db.execute(sql3`
      SELECT 
        r.id as request_id,
        r.collaboration_id,
        r.note,
        r.created_at as request_created_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        c.name as company_name,
        c.twitter_handle,
        c.logo_url,
        co.collab_type,
        co.description as collab_description
      FROM requests r
      INNER JOIN users u ON r.requester_id = u.id
      INNER JOIN companies c ON u.id = c.user_id
      INNER JOIN collaborations co ON r.collaboration_id = co.id
      WHERE r.collaboration_id = ANY(${collabIds})
        AND r.status = 'pending'
        AND r.requester_id != ${userId}
      ORDER BY r.created_at DESC
    `);
    const allRequests = results.rows;
    const recentRequests = allRequests.slice(0, 4).map((req) => ({
      id: req.request_id,
      collaboration_id: req.collaboration_id,
      collaboration_type: req.collab_type,
      collaboration_title: req.collab_description || req.collab_type,
      requester: {
        id: req.user_id,
        first_name: req.first_name,
        last_name: req.last_name,
        avatar_url: null
      },
      company: {
        name: req.company_name,
        twitter_handle: req.twitter_handle,
        logo_url: req.logo_url
      },
      note: req.note,
      created_at: req.request_created_at
    }));
    return {
      recentRequests,
      totalPendingCount: allRequests.length
    };
  }
  // Match methods (legacy - now using requests table)
  async createMatch(match) {
    console.log("createMatch called - this is now handled by accepting requests");
    return {
      id: crypto2.randomUUID(),
      collaboration_id: match.collaboration_id,
      host_id: match.host_id,
      requester_id: match.requester_id,
      status: match.status || "active",
      note: match.note ?? null,
      host_accepted: match.host_accepted ?? true,
      requester_accepted: match.requester_accepted ?? false,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    };
  }
  async getUserMatches(userId) {
    console.log(`\u{1F9E9} getUserMatches - Finding accepted requests for user ${userId}`);
    try {
      const acceptedRequests = await db.select().from(requests).where(
        and3(
          or2(
            eq3(requests.host_id, userId),
            eq3(requests.requester_id, userId)
          ),
          eq3(requests.status, "accepted")
        )
      ).orderBy(desc2(requests.created_at));
      console.log(`\u{1F9E9} getUserMatches - Found ${acceptedRequests.length} accepted requests`);
      const matches = acceptedRequests.map((req) => ({
        id: req.id,
        collaboration_id: req.collaboration_id,
        host_id: req.host_id,
        requester_id: req.requester_id,
        status: "active",
        note: req.note,
        host_accepted: true,
        requester_accepted: true,
        created_at: req.created_at,
        updated_at: req.created_at
      }));
      if (matches.length > 0) {
        console.log(`\u{1F9E9} getUserMatches - First match sample:`, JSON.stringify(matches[0], null, 2));
      } else {
        console.log(`\u{1F9E9} getUserMatches - No matches found in database`);
      }
      return matches;
    } catch (error) {
      console.error(`\u{1F9E9} getUserMatches - Error fetching matches:`, error);
      throw error;
    }
  }
  async getUserMatchesWithDetails(userId) {
    console.log(`\u{1F50D} getUserMatchesWithDetails - Getting enriched matches for user ${userId}`);
    try {
      try {
        const activeMatchesCount = await db.execute(sql3`
          SELECT COUNT(*) as count
          FROM requests r
          WHERE (r.host_id = ${userId} OR r.requester_id = ${userId})
          AND r.status = 'accepted'
        `);
        const count = activeMatchesCount.rows?.[0]?.count || "0";
        console.log(`\u{1F50D} getUserMatchesWithDetails - Found ${count} accepted requests in database for user ${userId}`);
      } catch (countError) {
        console.error(`\u{1F50D} getUserMatchesWithDetails - Error counting accepted requests:`, countError);
      }
      const matchesResult = await db.execute(sql3`
        SELECT 
          r.id as match_id,
          r.created_at as match_date,
          r.status as match_status,
          r.note as swipe_note,
          r.collaboration_id,
          r.host_id,
          r.requester_id
        FROM requests r
        WHERE (r.host_id = ${userId} OR r.requester_id = ${userId})
        AND r.status = 'accepted'
        ORDER BY r.created_at DESC
      `);
      const matchesRows = matchesResult.rows || [];
      console.log(`\u{1F50D} getUserMatchesWithDetails - Found ${matchesRows.length} basic matches for user ${userId} from raw SQL query`);
      if (matchesRows.length > 0) {
        console.log(`\u{1F50D} getUserMatchesWithDetails - First match: ${JSON.stringify(matchesRows[0], null, 2)}`);
        const statusCounts = {};
        matchesRows.forEach((match) => {
          statusCounts[match.match_status || "unknown"] = (statusCounts[match.match_status || "unknown"] || 0) + 1;
        });
        console.log(`\u{1F50D} getUserMatchesWithDetails - Match status distribution:`, statusCounts);
      }
      const matchesArray = matchesRows;
      if (matchesArray.length === 0) {
        console.log("No matches found for this user");
        return [];
      }
      const enrichedResults = await Promise.all(matchesArray.map(async (match) => {
        try {
          const collaborationResult = await db.execute(sql3`
            SELECT 
              c.collab_type,
              c.description,
              c.creator_id,
              c.details
            FROM collaborations c
            WHERE c.id = ${match.collaboration_id}
          `);
          if (!collaborationResult || !collaborationResult.rows || !collaborationResult.rows.length) {
            console.log(`No collaboration found for match ${match.match_id}`);
            return null;
          }
          const collaborationData = collaborationResult.rows[0];
          const isUserHost = match.host_id === userId;
          const otherUserId = isUserHost ? match.requester_id : match.host_id;
          const otherUserResult = await db.execute(sql3`
            SELECT 
              u.first_name,
              u.last_name,
              u.handle,
              u.twitter_url,
              u.twitter_followers,
              u.linkedin_url
            FROM users u
            WHERE u.id = ${otherUserId}
          `);
          if (!otherUserResult || !otherUserResult.rows || !otherUserResult.rows.length) {
            console.log(`No other user found for match ${match.match_id}`);
            return null;
          }
          const otherUserData = otherUserResult.rows[0];
          const companyResult = await db.execute(sql3`
            SELECT 
              c.name,
              c.short_description,
              c.website,
              c.twitter_handle,
              c.twitter_followers,
              c.linkedin_url,
              c.funding_stage,
              c.has_token,
              c.token_ticker,
              c.blockchain_networks,
              c.tags,
              c.job_title,
              c.logo_url
            FROM companies c
            WHERE c.user_id = ${otherUserId}
          `);
          let companyData = null;
          if (companyResult && companyResult.rows && companyResult.rows.length > 0) {
            companyData = companyResult.rows[0];
          } else {
            console.log(`No company found for other user ${otherUserId} in match ${match.match_id}`);
          }
          return {
            match_id: match.match_id,
            match_date: match.match_date,
            match_status: match.match_status,
            swipe_note: match.swipe_note,
            // Include the note from the request
            collab_type: collaborationData.collab_type,
            collab_description: collaborationData.description,
            collab_details: collaborationData.details,
            // Other user information
            other_user_first_name: otherUserData?.first_name || "",
            other_user_last_name: otherUserData?.last_name || "",
            other_user_handle: otherUserData?.handle || "",
            role_title: companyData?.job_title || "Unknown Role",
            // Using job_title from the company table
            other_user_twitter_url: otherUserData?.twitter_url || null,
            other_user_twitter_followers: otherUserData?.twitter_followers || null,
            other_user_linkedin_url: otherUserData?.linkedin_url || null,
            // Company information
            company_name: companyData?.name || "Unknown Company",
            company_description: companyData?.short_description || "",
            company_website: companyData?.website || null,
            company_twitter_handle: companyData?.twitter_handle || null,
            company_twitter_followers: companyData?.twitter_followers || null,
            company_linkedin_url: companyData?.linkedin_url || null,
            company_logo_url: companyData?.logo_url || null,
            // FIX: Add missing company logo URL field
            funding_stage: companyData?.funding_stage || null,
            has_token: companyData?.has_token || false,
            token_ticker: companyData?.token_ticker || null,
            blockchain_networks: companyData?.blockchain_networks || [],
            company_tags: companyData?.tags || []
          };
        } catch (error) {
          console.error(`Error processing match ${match.match_id}:`, error);
          return null;
        }
      }));
      const validResults = enrichedResults.filter((result) => result !== null);
      console.log(`Found ${validResults.length} detailed matches for user ${userId}`);
      if (validResults.length > 0) {
        console.log("Sample match details:", JSON.stringify(validResults[0], null, 2));
      }
      return validResults;
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      throw error;
    }
  }
  async getCollaborationMatches(collaborationId) {
    console.log("Getting matches using requests table");
    const acceptedRequests = await db.select().from(requests).where(
      and3(
        eq3(requests.collaboration_id, collaborationId),
        eq3(requests.status, "accepted")
      )
    ).orderBy(desc2(requests.created_at));
    return acceptedRequests.map((req) => ({
      id: req.id,
      collaboration_id: req.collaboration_id,
      host_id: req.host_id,
      requester_id: req.requester_id,
      status: "active",
      note: req.note,
      host_accepted: true,
      requester_accepted: true,
      created_at: req.created_at,
      updated_at: req.created_at
    }));
  }
  async getMatchById(id) {
    console.log("Getting match using requests table");
    const request = await this.getRequestById(id);
    if (!request || request.status !== "accepted") {
      return void 0;
    }
    return {
      id: request.id,
      collaboration_id: request.collaboration_id,
      host_id: request.host_id,
      requester_id: request.requester_id,
      status: "active",
      note: request.note,
      host_accepted: true,
      requester_accepted: true,
      created_at: request.created_at,
      updated_at: request.created_at
    };
  }
  async updateMatchStatus(id, status) {
    console.log("updateMatchStatus called - updating request status instead");
    try {
      const requestStatus = status === "active" ? "accepted" : status;
      await this.updateRequestStatus(id, requestStatus);
      return this.getMatchById(id);
    } catch (error) {
      console.error("Error updating match status:", error);
      throw error;
    }
  }
  // Request methods (new unified table)
  async createRequest(request) {
    const [newRequest] = await db.insert(requests).values({
      ...request,
      created_at: /* @__PURE__ */ new Date(),
      updated_at: /* @__PURE__ */ new Date()
    }).returning();
    return newRequest;
  }
  async getUserRequestsAsHost(userId) {
    return db.select().from(requests).where(eq3(requests.host_id, userId)).orderBy(desc2(requests.created_at));
  }
  async getUserRequestsAsRequester(userId) {
    return db.select().from(requests).where(eq3(requests.requester_id, userId)).orderBy(desc2(requests.created_at));
  }
  async getRequestsForCollaboration(collaborationId) {
    return db.select().from(requests).where(eq3(requests.collaboration_id, collaborationId)).orderBy(desc2(requests.created_at));
  }
  async getRequestById(id) {
    const [request] = await db.select().from(requests).where(eq3(requests.id, id));
    return request;
  }
  async updateRequestStatus(id, status) {
    try {
      const [updatedRequest] = await db.update(requests).set({
        status,
        updated_at: /* @__PURE__ */ new Date()
      }).where(eq3(requests.id, id)).returning();
      return updatedRequest;
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  }
  async getPendingRequestsForHost(userId, filter) {
    console.log(`Getting requests for host ${userId} with filter: ${filter}`);
    try {
      const statusFilter = filter === "hidden" ? "hidden" : "pending";
      const results = await db.execute(sql3`
        SELECT 
          r.id as request_id,
          r.collaboration_id,
          r.requester_id,
          r.host_id,
          r.status,
          r.note,
          r.created_at,
          co.collab_type as collaboration_type,
          co.description as collaboration_description,
          u.first_name as requester_first_name,
          u.last_name as requester_last_name,
          c.job_title as requester_job_title,
          u.twitter_followers as requester_twitter_followers,
          c.name as company_name,
          c.twitter_handle as company_twitter_handle,
          c.twitter_followers as company_twitter_followers,
          c.website as company_website,
          c.logo_url as company_logo_url,
          c.tags as company_tags
        FROM requests r
        LEFT JOIN collaborations co ON r.collaboration_id = co.id
        LEFT JOIN users u ON r.requester_id = u.id
        LEFT JOIN companies c ON u.id = c.user_id
        WHERE r.host_id = ${userId} AND r.status = ${statusFilter}
        ORDER BY r.created_at DESC
      `);
      console.log(`Found ${results.rows.length} requests for host ${userId} with filter ${filter}`);
      return results.rows;
    } catch (error) {
      console.error("Error getting pending requests:", error);
      throw error;
    }
  }
  async getSentRequestsForUser(userId) {
    console.log(`Getting sent requests for user ${userId}`);
    try {
      const results = await db.execute(sql3`
        SELECT 
          r.id as request_id,
          r.collaboration_id,
          r.requester_id,
          r.host_id,
          r.status,
          r.note,
          r.created_at,
          co.collab_type as collaboration_type,
          co.description as collaboration_description,
          u.first_name as host_first_name,
          u.last_name as host_last_name,
          c.job_title as host_job_title,
          u.twitter_followers as host_twitter_followers,
          c.name as company_name,
          c.twitter_handle as company_twitter_handle,
          c.twitter_followers as company_twitter_followers,
          c.website as company_website,
          c.logo_url as company_logo_url,
          c.tags as company_tags
        FROM requests r
        LEFT JOIN collaborations co ON r.collaboration_id = co.id
        LEFT JOIN users u ON r.host_id = u.id
        LEFT JOIN companies c ON u.id = c.user_id
        WHERE r.requester_id = ${userId} 
          AND r.status = 'pending'
          AND co.id IS NOT NULL
        ORDER BY r.created_at DESC
      `);
      console.log(`Found ${results.rows.length} sent requests for user ${userId}`);
      return results.rows.map((row) => ({
        ...row,
        // For sent requests, the "requester" data is actually the host (the person we sent the request to)
        requester_first_name: row.host_first_name,
        requester_last_name: row.host_last_name,
        requester_job_title: row.host_job_title,
        requester_twitter_followers: row.host_twitter_followers
      }));
    } catch (error) {
      console.error("Error getting sent requests:", error);
      throw error;
    }
  }
  async getCollaborationRequests(userId, options) {
    const { cursor, limit = 20, filter = "received" } = options;
    console.log(`Getting collaboration requests for user ${userId} with filter: ${filter}`);
    try {
      let requests2;
      if (filter === "sent") {
        requests2 = await this.getSentRequestsForUser(userId);
      } else {
        const hostFilter = filter === "hidden" ? "hidden" : "received";
        requests2 = await this.getPendingRequestsForHost(userId, hostFilter === "received" ? "all" : "hidden");
      }
      let startIndex = 0;
      if (cursor) {
        const cursorIndex = requests2.findIndex((r) => r.request_id === cursor);
        if (cursorIndex !== -1) {
          startIndex = cursorIndex + 1;
        }
      }
      const paginatedRequests = requests2.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < requests2.length;
      const nextCursor = hasMore ? paginatedRequests[paginatedRequests.length - 1]?.request_id : void 0;
      return {
        requests: paginatedRequests,
        hasMore,
        nextCursor
      };
    } catch (error) {
      console.error("Error getting collaboration requests:", error);
      throw error;
    }
  }
  async acceptCollaborationRequest(userId, requestId) {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: "Request not found" };
      }
      if (request.host_id !== userId) {
        return { success: false, error: "Unauthorized" };
      }
      await this.updateRequestStatus(requestId, "accepted");
      await notifyMatchCreated(request.host_id, request.requester_id, request.collaboration_id, request.id);
      return { success: true, match: request };
    } catch (error) {
      console.error("Error accepting collaboration request:", error);
      return { success: false, error: "Internal server error" };
    }
  }
  async hideCollaborationRequest(userId, requestId) {
    try {
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: "Request not found" };
      }
      if (request.host_id !== userId) {
        return { success: false, error: "Unauthorized" };
      }
      await this.updateRequestStatus(requestId, "hidden");
      return { success: true };
    } catch (error) {
      console.error("Error hiding collaboration request:", error);
      return { success: false, error: "Internal server error" };
    }
  }
  // Notification methods removed - notifications are sent directly via Telegram
  // Notification preferences
  async getUserNotificationPreferences(userId) {
    const [prefs] = await db.select().from(notification_preferences).where(eq3(notification_preferences.user_id, userId));
    return prefs;
  }
  async updateUserNotificationPreferences(userId, prefs) {
    const existingPrefs = await this.getUserNotificationPreferences(userId);
    if (existingPrefs) {
      const [updatedPrefs] = await db.update(notification_preferences).set({
        ...prefs,
        updated_at: /* @__PURE__ */ new Date()
      }).where(eq3(notification_preferences.id, existingPrefs.id)).returning();
      return updatedPrefs;
    } else {
      const [newPrefs] = await db.insert(notification_preferences).values({
        user_id: userId,
        notifications_enabled: prefs.notifications_enabled !== void 0 ? prefs.notifications_enabled : true,
        notification_frequency: prefs.notification_frequency || "Daily",
        updated_at: /* @__PURE__ */ new Date()
      }).returning();
      return newPrefs;
    }
  }
  // Marketing preferences
  async getUserMarketingPreferences(userId) {
    const [prefs] = await db.select().from(marketing_preferences).where(eq3(marketing_preferences.user_id, userId));
    return prefs;
  }
  async updateUserMarketingPreferences(userId, prefs) {
    const existingPrefs = await this.getUserMarketingPreferences(userId);
    const processedPrefs = {
      ...prefs,
      // Make sure array fields are properly initialized
      collabs_to_discover: Array.isArray(prefs.collabs_to_discover) ? prefs.collabs_to_discover : [],
      collabs_to_host: Array.isArray(prefs.collabs_to_host) ? prefs.collabs_to_host : [],
      twitter_collabs: Array.isArray(prefs.twitter_collabs) ? prefs.twitter_collabs : [],
      filtered_marketing_topics: Array.isArray(prefs.filtered_marketing_topics) ? prefs.filtered_marketing_topics : [],
      company_blockchain_networks: Array.isArray(prefs.company_blockchain_networks) ? prefs.company_blockchain_networks : [],
      company_tags: Array.isArray(prefs.company_tags) ? prefs.company_tags : []
    };
    console.log("STORAGE: Saving marketing preferences with arrays:", {
      collabs_to_discover: processedPrefs.collabs_to_discover,
      collabs_to_host: processedPrefs.collabs_to_host,
      twitter_collabs: processedPrefs.twitter_collabs,
      filtered_marketing_topics: processedPrefs.filtered_marketing_topics,
      company_blockchain_networks: processedPrefs.company_blockchain_networks,
      company_tags: processedPrefs.company_tags
    });
    if (existingPrefs) {
      const [updatedPrefs] = await db.update(marketing_preferences).set({
        ...processedPrefs,
        // Ensure defaults for boolean fields
        discovery_filter_enabled: prefs.discovery_filter_enabled || false,
        discovery_filter_collab_types_enabled: prefs.discovery_filter_collab_types_enabled || false,
        discovery_filter_topics_enabled: prefs.discovery_filter_topics_enabled || false,
        discovery_filter_company_followers_enabled: prefs.discovery_filter_company_followers_enabled || false,
        discovery_filter_user_followers_enabled: prefs.discovery_filter_user_followers_enabled || false,
        discovery_filter_funding_stages_enabled: prefs.discovery_filter_funding_stages_enabled || false,
        discovery_filter_token_status_enabled: prefs.discovery_filter_token_status_enabled || false,
        discovery_filter_company_sectors_enabled: prefs.discovery_filter_company_sectors_enabled || false,
        discovery_filter_blockchain_networks_enabled: prefs.discovery_filter_blockchain_networks_enabled || false
      }).where(eq3(marketing_preferences.id, existingPrefs.id)).returning();
      return updatedPrefs;
    } else {
      const [newPrefs] = await db.insert(marketing_preferences).values({
        user_id: userId,
        collabs_to_discover: processedPrefs.collabs_to_discover,
        collabs_to_host: processedPrefs.collabs_to_host,
        twitter_collabs: processedPrefs.twitter_collabs,
        filtered_marketing_topics: processedPrefs.filtered_marketing_topics,
        // Ensure defaults for boolean fields
        discovery_filter_enabled: prefs.discovery_filter_enabled || false,
        discovery_filter_collab_types_enabled: prefs.discovery_filter_collab_types_enabled || false,
        discovery_filter_topics_enabled: prefs.discovery_filter_topics_enabled || false,
        discovery_filter_company_followers_enabled: prefs.discovery_filter_company_followers_enabled || false,
        discovery_filter_user_followers_enabled: prefs.discovery_filter_user_followers_enabled || false,
        discovery_filter_funding_stages_enabled: prefs.discovery_filter_funding_stages_enabled || false,
        discovery_filter_token_status_enabled: prefs.discovery_filter_token_status_enabled || false,
        discovery_filter_company_sectors_enabled: prefs.discovery_filter_company_sectors_enabled || false,
        discovery_filter_blockchain_networks_enabled: prefs.discovery_filter_blockchain_networks_enabled || false
      }).returning();
      return newPrefs;
    }
  }
  // Referral methods
  async getUserReferral(userId) {
    const [referral] = await db.select().from(user_referrals).where(eq3(user_referrals.user_id, userId));
    return referral;
  }
  async createUserReferral(referral) {
    const [newReferral] = await db.insert(user_referrals).values(referral).returning();
    return newReferral;
  }
  async getReferralByCode(referralCode) {
    const [referral] = await db.select().from(user_referrals).where(eq3(user_referrals.referral_code, referralCode));
    return referral;
  }
  async incrementReferralUsage(referralId) {
    try {
      const result = await db.transaction(async (tx) => {
        const [updatedReferral] = await tx.update(user_referrals).set({
          total_used: sql3`${user_referrals.total_used} + 1`,
          updated_at: /* @__PURE__ */ new Date()
        }).where(eq3(user_referrals.id, referralId)).returning();
        if (!updatedReferral) {
          throw new Error(`Referral with ID ${referralId} not found`);
        }
        return updatedReferral;
      });
      console.log(`Successfully incremented referral usage for ID ${referralId}`);
      return result;
    } catch (error) {
      console.error("Error incrementing referral usage:", error);
      if (error instanceof Error && error.message.includes("serialization_failure")) {
        console.log("Retrying referral increment due to serialization failure");
        return this.incrementReferralUsage(referralId);
      }
      throw error;
    }
  }
  async createReferralEvent(event) {
    const [newEvent] = await db.insert(referral_events).values(event).returning();
    return newEvent;
  }
  async completeReferralEvent(referralEventId) {
    try {
      const [updatedEvent] = await db.update(referral_events).set({
        status: "completed",
        completed_at: /* @__PURE__ */ new Date()
      }).where(eq3(referral_events.id, referralEventId)).returning();
      return updatedEvent;
    } catch (error) {
      console.error("Error completing referral event:", error);
      throw error;
    }
  }
  async getUserReferralEvents(userId) {
    return db.select().from(referral_events).where(eq3(referral_events.referrer_id, userId)).orderBy(desc2(referral_events.created_at));
  }
  // Additional referral methods required by the API routes
  async updateUserReferralCode(userId, referralCode) {
    try {
      const rows = await db.update(users).set({ referral_code: referralCode }).where(eq3(users.id, userId)).returning();
      return rows[0];
    } catch (error) {
      console.error("Error updating user referral code:", error);
      throw error;
    }
  }
  async getUserByReferralCode(code) {
    try {
      const rows = await db.select().from(users).where(eq3(users.referral_code, code));
      return rows[0];
    } catch (error) {
      console.error("Error getting user by referral code:", error);
      throw error;
    }
  }
  async getReferredUsers(referrerId) {
    try {
      const referredUsers = await db.select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        handle: users.handle,
        created_at: users.created_at
      }).from(users).where(eq3(users.referred_by, referrerId));
      return referredUsers;
    } catch (error) {
      console.error("Error getting referred users:", error);
      throw error;
    }
  }
  async applyReferral(userId, referrerId) {
    try {
      await db.transaction(async (tx) => {
        await tx.update(users).set({
          referred_by: referrerId,
          // Auto-approve referred users
          is_approved: true,
          approved_at: /* @__PURE__ */ new Date()
        }).where(eq3(users.id, userId));
        await tx.insert(referral_events).values({
          referrer_id: referrerId,
          referred_user_id: userId,
          status: "pending",
          created_at: /* @__PURE__ */ new Date()
        });
        const [referrerRecord] = await tx.select().from(user_referrals).where(eq3(user_referrals.user_id, referrerId));
        if (!referrerRecord) {
          const [referrer] = await tx.select().from(users).where(eq3(users.id, referrerId));
          if (referrer) {
            const randomSuffix = crypto2.randomBytes(4).toString("hex");
            const referralCode = `r_${referrer.telegram_id}_${randomSuffix}`;
            await tx.insert(user_referrals).values({
              user_id: referrerId,
              referral_code: referralCode,
              total_available: 3,
              // Default limit
              total_used: 1,
              // This is the first use
              created_at: /* @__PURE__ */ new Date(),
              updated_at: /* @__PURE__ */ new Date()
            });
            await tx.update(users).set({ referral_code: referralCode }).where(eq3(users.id, referrerId));
          }
        } else {
          await tx.update(user_referrals).set({
            total_used: referrerRecord.total_used + 1,
            updated_at: /* @__PURE__ */ new Date()
          }).where(eq3(user_referrals.id, referrerRecord.id));
        }
      });
    } catch (error) {
      console.error("Error applying referral:", error);
      throw error;
    }
  }
  async getReferralEvents() {
    try {
      return db.select().from(referral_events).orderBy(desc2(referral_events.created_at));
    } catch (error) {
      console.error("Error getting all referral events:", error);
      throw error;
    }
  }
  async logReferralActivity(data) {
    try {
      console.log(`Logging referral activity of type ${data.eventType} for user ${data.userId}`);
      console.log(JSON.stringify({
        user_id: data.userId,
        event_type: data.eventType,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        details: data.details
      }));
    } catch (error) {
      console.error("Error logging referral activity:", error);
      console.error(error);
    }
  }
};
var storage = new DatabaseStorage();

// server/middleware/rate-limiter.ts
var rateLimitStore = {};
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1e3);
function createRateLimiter(options) {
  const {
    windowMs,
    max,
    message = "Too many requests, please try again later",
    statusCode = 429,
    skipIfDevelopment = true
  } = options;
  return (req, res, next) => {
    if (skipIfDevelopment && config.NODE_ENV !== "production") {
      return next();
    }
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitStore[key].count += 1;
    }
    const timeRemaining = Math.ceil((rateLimitStore[key].resetTime - now) / 1e3);
    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - rateLimitStore[key].count).toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil(rateLimitStore[key].resetTime / 1e3).toString());
    if (rateLimitStore[key].count > max) {
      res.setHeader("Retry-After", timeRemaining.toString());
      return res.status(statusCode).json({
        error: message,
        retryAfter: timeRemaining
      });
    }
    next();
  };
}
var apiLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  // From config
  max: config.RATE_LIMIT_MAX_REQUESTS,
  // From config
  skipIfDevelopment: true
});
var authLimiter = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: 10,
  // Stricter limit for authentication attempts
  message: "Too many authentication attempts, please try again later",
  skipIfDevelopment: true
});
var requestLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 60,
  // Limit each IP to 60 requests per minute (1 per second)
  skipIfDevelopment: true
});
var applicationLimiter = createRateLimiter({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 10,
  // Very strict limit for collaboration applications (5 per minute)
  message: "Too many application attempts, please try again later",
  skipIfDevelopment: true
});

// server/utils/logger.ts
var LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};
var LOG_LEVEL = parseInt(process.env.LOG_LEVEL || "2", 10);
var logger2 = {
  error: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.ERROR) console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] [ERROR]`, ...args);
  },
  warn: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.WARN) console.warn(`[${(/* @__PURE__ */ new Date()).toISOString()}] [WARN]`, ...args);
  },
  info: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.INFO) console.info(`[${(/* @__PURE__ */ new Date()).toISOString()}] [INFO]`, ...args);
  },
  http: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.HTTP) console.info(`[${(/* @__PURE__ */ new Date()).toISOString()}] [HTTP]`, ...args);
  },
  debug: (...args) => {
    if (LOG_LEVEL >= LOG_LEVELS.DEBUG) console.debug(`[${(/* @__PURE__ */ new Date()).toISOString()}] [DEBUG]`, ...args);
  }
};

// server/routes/referral-routes.ts
import express from "express";
import { z as z3 } from "zod";
import { eq as eq4 } from "drizzle-orm";
import crypto3 from "crypto";
var requestCounts = {};
var referralLimiter = (req, res, next) => {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const windowMs = 60 * 60 * 1e3;
  if (requestCounts[ip] && requestCounts[ip].resetTime < now) {
    delete requestCounts[ip];
  }
  if (!requestCounts[ip]) {
    requestCounts[ip] = {
      count: 0,
      resetTime: now + windowMs
    };
  }
  requestCounts[ip].count++;
  if (requestCounts[ip].count > 20) {
    return res.status(429).json({
      success: false,
      message: "Too many referral requests, please try again later"
    });
  }
  next();
};
var router = express.Router();
function getTelegramUserFromRequest(req) {
  try {
    if (req.session?.impersonating) {
      return req.session.impersonating.impersonatedUser;
    }
    const SESSION_DATA_TTL = 30 * 60 * 1e3;
    if (req.session?.telegramUser && req.session.telegramUser.id && Date.now() - req.session.telegramUser.cachedAt < SESSION_DATA_TTL) {
      return req.session.telegramUser;
    }
    const initData = req.headers["x-telegram-init-data"];
    if (initData) {
      try {
        const decodedInitData = new URLSearchParams(initData);
        const userJson = decodedInitData.get("user") || "{}";
        const telegramUser = JSON.parse(userJson);
        if (telegramUser.id) {
          if (req.session) {
            req.session.telegramUser = {
              ...telegramUser,
              cachedAt: Date.now()
            };
          }
          return telegramUser;
        }
      } catch (err) {
        console.error("Failed to parse Telegram init data:", err);
      }
    }
    return null;
  } catch (err) {
    console.error("Error extracting Telegram user:", err);
    return null;
  }
}
var telegramAuthMiddleware = (req, res, next) => {
  console.log("============ DEBUG: Referral API Request ============");
  console.log("URL:", req.originalUrl);
  console.log("Headers:", req.headers);
  const telegramUser = getTelegramUserFromRequest(req);
  if (telegramUser) {
    console.log("Telegram User Found:", telegramUser.id, telegramUser.first_name, telegramUser.last_name);
    req.telegramData = telegramUser;
    next();
  } else {
    console.error("No Telegram user data found in request - Authentication failed");
    res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }
};
router.use(telegramAuthMiddleware);
var validateReferralSchema = z3.object({
  referral_code: z3.string().min(5)
});
var applyReferralSchema = z3.object({
  referral_code: z3.string().min(5)
});
router.get("/my-code", async (req, res) => {
  try {
    if (!req.telegramData || !req.telegramData.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    const telegramId = req.telegramData.id;
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const [userReferral] = await db.select().from(user_referrals).where(eq4(user_referrals.user_id, user.id));
    if (!userReferral) {
      const randomSuffix = crypto3.randomBytes(4).toString("hex");
      const referralCode = `r_${user.telegram_id}_${randomSuffix}`;
      const [newUserReferral] = await db.insert(user_referrals).values({
        user_id: user.id,
        referral_code: referralCode,
        total_available: 3,
        // Default limit
        total_used: 0,
        created_at: /* @__PURE__ */ new Date(),
        updated_at: /* @__PURE__ */ new Date()
      }).returning();
      await db.update(users).set({ referral_code: referralCode }).where(eq4(users.id, user.id));
      const shareableLink = `https://t.me/collabroom_test_bot?start=${referralCode}`;
      return res.status(200).json({
        success: true,
        referral_code: referralCode,
        total_available: newUserReferral.total_available,
        total_used: newUserReferral.total_used,
        remaining: newUserReferral.total_available - newUserReferral.total_used,
        shareable_link: shareableLink
      });
    } else {
      const shareableLink = `https://t.me/collabroom_test_bot?start=${userReferral.referral_code}`;
      return res.status(200).json({
        success: true,
        referral_code: userReferral.referral_code,
        total_available: userReferral.total_available,
        total_used: userReferral.total_used,
        remaining: userReferral.total_available - userReferral.total_used,
        shareable_link: shareableLink
      });
    }
  } catch (error) {
    console.error("Error getting referral code:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving referral code"
    });
  }
});
router.get("/my-referrals", async (req, res) => {
  try {
    if (!req.telegramData || !req.telegramData.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    const telegramId = req.telegramData.id;
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const referredUsers = await db.select({
      user: users
    }).from(users).where(eq4(users.referred_by, user.id));
    const formattedUsers = referredUsers.map((item) => ({
      id: item.user.id,
      first_name: item.user.first_name,
      last_name: item.user.last_name,
      handle: item.user.handle,
      created_at: item.user.created_at
    }));
    const [userReferral] = await db.select().from(user_referrals).where(eq4(user_referrals.user_id, user.id));
    if (!userReferral) {
      return res.status(200).json({
        success: true,
        referral_code: null,
        total_available: 3,
        total_used: 0,
        remaining: 3,
        referred_users: formattedUsers
      });
    }
    return res.status(200).json({
      success: true,
      referral_code: userReferral.referral_code,
      total_available: userReferral.total_available,
      total_used: userReferral.total_used,
      remaining: userReferral.total_available - userReferral.total_used,
      referred_users: formattedUsers
    });
  } catch (error) {
    console.error("Error getting referred users:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving referred users"
    });
  }
});
router.post("/validate", referralLimiter, async (req, res) => {
  try {
    const validation = validateReferralSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral code format"
      });
    }
    const { referral_code } = validation.data;
    const [referral] = await db.select({
      user_referral: user_referrals,
      user: users
    }).from(user_referrals).innerJoin(users, eq4(user_referrals.user_id, users.id)).where(eq4(user_referrals.referral_code, referral_code));
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral code not found"
      });
    }
    if (referral.user_referral.total_used >= referral.user_referral.total_available) {
      return res.status(400).json({
        success: false,
        message: "Referral code has reached its usage limit"
      });
    }
    return res.status(200).json({
      success: true,
      referrer: {
        first_name: referral.user.first_name,
        last_name: referral.user.last_name
      }
    });
  } catch (error) {
    console.error("Error validating referral code:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while validating referral code"
    });
  }
});
router.post("/log-activity", referralLimiter, async (req, res) => {
  try {
    if (!req.telegramData || !req.telegramData.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    const telegramId = req.telegramData.id;
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const { activity_type, details } = req.body;
    if (!activity_type || !["share", "view", "copy", "generate"].includes(activity_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type"
      });
    }
    await storage.logReferralActivity({
      userId: user.id,
      eventType: activity_type,
      details
    });
    return res.status(200).json({
      success: true,
      message: "Activity logged successfully"
    });
  } catch (error) {
    console.error("Error logging referral activity:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while logging activity"
    });
  }
});
var referral_routes_default = router;

// server/utils/webhook.ts
import axios from "axios";
import { eq as eq5 } from "drizzle-orm";
async function sendCollaborationWebhook(collaborationId) {
  try {
    console.log(`[Webhook] Preparing to send webhook for collaboration ${collaborationId}`);
    const result = await db.select({
      collaboration: collaborations,
      company: companies,
      user: users
    }).from(collaborations).leftJoin(users, eq5(collaborations.creator_id, users.id)).leftJoin(companies, eq5(companies.user_id, users.id)).where(eq5(collaborations.id, collaborationId)).limit(1);
    if (!result.length) {
      console.error(`[Webhook] Collaboration ${collaborationId} not found`);
      return;
    }
    const { collaboration, company, user } = result[0];
    if (!collaboration || !company || !user) {
      console.error(`[Webhook] Missing data for collaboration ${collaborationId}`);
      return;
    }
    const payload = {
      collaboration_id: collaboration.id,
      collab_type: collaboration.collab_type,
      collab_description: collaboration.description || "",
      collab_date: collaboration.specific_date || null,
      collab_date_type: collaboration.date_type || "any_future_date",
      collab_details: collaboration.details || {},
      company_name: company.name,
      company_twitter_url: company.twitter_handle ? `https://x.com/${company.twitter_handle.replace("@", "")}` : "",
      company_twitter_handle: company.twitter_handle || "",
      company_linkedin_url: company.linkedin_url || "",
      company_logo_url: company.logo_url || "",
      creator_name: `${user.first_name} ${user.last_name || ""}`.trim(),
      created_at: collaboration.created_at?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("[Webhook] Sending payload:", JSON.stringify(payload, null, 2));
    const webhookUrl = process.env.N8N_COLLABORATION_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("[Webhook] N8N_COLLABORATION_WEBHOOK_URL not set; skipping webhook for collaboration", collaborationId);
      return;
    }
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 1e4
      // 10 second timeout
    });
    console.log(`[Webhook] Successfully sent webhook for collaboration ${collaborationId}. Status: ${response.status}`);
  } catch (error) {
    console.error(`[Webhook] Failed to send webhook for collaboration ${collaborationId}:`, error);
  }
}
async function sendTestWebhookForAlchemy() {
  try {
    console.log("[Webhook Test] Looking for latest Alchemy collaboration...");
    const result = await db.select({
      collaboration: collaborations,
      company: companies,
      user: users
    }).from(collaborations).leftJoin(users, eq5(collaborations.creator_id, users.id)).leftJoin(companies, eq5(companies.user_id, users.id)).where(eq5(companies.name, "Alchemy")).orderBy(collaborations.created_at).limit(1);
    if (!result.length) {
      console.error("[Webhook Test] No Alchemy collaborations found");
      return { success: false, message: "No Alchemy collaborations found" };
    }
    const { collaboration } = result[0];
    if (!collaboration) {
      console.error("[Webhook Test] Invalid collaboration data");
      return { success: false, message: "Invalid collaboration data" };
    }
    console.log(`[Webhook Test] Found Alchemy collaboration: ${collaboration.id}`);
    await sendCollaborationWebhook(collaboration.id);
    return { success: true, message: `Test webhook sent for Alchemy collaboration ${collaboration.id}` };
  } catch (error) {
    console.error("[Webhook Test] Error:", error);
    return { success: false, message: `Error: ${error}` };
  }
}

// server/routes.ts
var activeStatusConnections = /* @__PURE__ */ new Map();
function isValidTelegramUserId(id) {
  const idStr = typeof id === "number" ? id.toString() : id;
  const telegramIdRegex = /^[1-9]\d{0,19}$/;
  if (!telegramIdRegex.test(idStr)) {
    return false;
  }
  const parsed = Number(idStr);
  return Number.isSafeInteger(parsed) && parsed > 0;
}
function validateTelegramInitData(initData) {
  try {
    if (!initData || typeof initData !== "string") {
      return { valid: false };
    }
    const decodedData = new URLSearchParams(initData);
    const userJson = decodedData.get("user");
    if (!userJson) {
      return { valid: false };
    }
    const userData = JSON.parse(userJson);
    const isValid = userData.id && isValidTelegramUserId(userData.id) && userData.first_name && typeof userData.first_name === "string" && userData.first_name.length > 0;
    return {
      valid: isValid,
      userId: isValid ? userData.id.toString() : void 0
    };
  } catch {
    return { valid: false };
  }
}
function getTelegramUserFromRequest2(req) {
  try {
    if (req.session?.impersonating && !req.path?.startsWith("/api/admin")) {
      return req.session.impersonating.impersonatedUser;
    }
    const SESSION_DATA_TTL = 30 * 60 * 1e3;
    if (req.session?.telegramUser && req.session.telegramUser.id && typeof req.session.telegramUser.cachedAt === "number" && !isNaN(req.session.telegramUser.cachedAt) && Date.now() - req.session.telegramUser.cachedAt < SESSION_DATA_TTL) {
      logger2.debug("Using cached session data for user:", req.session.telegramUser.id);
      return req.session.telegramUser;
    }
    if (req.session?.telegramUser && (!req.session.telegramUser.cachedAt || typeof req.session.telegramUser.cachedAt !== "number" || isNaN(req.session.telegramUser.cachedAt))) {
      logger2.warn("Clearing invalid session data - missing or invalid cachedAt timestamp");
      delete req.session.telegramUser;
    }
    const initData = req.headers["x-telegram-init-data"];
    if (initData) {
      const validationResult = validateTelegramInitData(initData);
      if (!validationResult.valid) {
        logger2.warn("Invalid Telegram init data format received", {
          ip: req.ip || "unknown",
          path: req.path || "unknown",
          userAgent: req.headers?.["user-agent"] || "unknown"
        });
      } else {
        try {
          const decodedInitData = new URLSearchParams(initData);
          const userJson = decodedInitData.get("user") || "{}";
          const telegramUser = JSON.parse(userJson);
          if (telegramUser.id && isValidTelegramUserId(telegramUser.id)) {
            if (req.session) {
              req.session.telegramUser = {
                ...telegramUser,
                cachedAt: Date.now()
              };
            }
            logger2.info("Successful authentication via Telegram init data", {
              userId: telegramUser.id,
              method: "init_data"
            });
            return telegramUser;
          }
        } catch (parseError) {
          logger2.error("Error parsing Telegram init data:", parseError, {
            ip: req.ip || "unknown"
          });
        }
      }
    }
    const telegramUserId = req.headers["x-telegram-user-id"];
    if (telegramUserId) {
      if (!isValidTelegramUserId(telegramUserId)) {
        logger2.warn("Invalid Telegram user ID format in header", {
          userId: telegramUserId,
          ip: req.ip || "unknown",
          path: req.path || "unknown"
        });
        return null;
      }
      logger2.warn("Using fallback header authentication - potential security risk", {
        userId: telegramUserId,
        ip: req.ip || "unknown",
        path: req.path || "unknown"
      });
      const minimalTelegramUser = {
        id: telegramUserId,
        first_name: "User",
        // Generic placeholder
        cachedAt: Date.now()
      };
      if (req.session) {
        req.session.telegramUser = minimalTelegramUser;
      }
      return minimalTelegramUser;
    }
    logger2.debug("No Telegram init data or user ID found in request headers");
    const safeHeaders = { ...req.headers };
    delete safeHeaders.cookie;
    delete safeHeaders.authorization;
    logger2.debug("Available headers:", safeHeaders);
    logger2.warn("\u26A0\uFE0F No Telegram data found in request");
    return null;
  } catch (error) {
    logger2.error("Error in getTelegramUserFromRequest:", error);
    if (error instanceof Error && error.stack) {
      logger2.error(error.stack);
    } else {
      logger2.error(String(error));
    }
    return null;
  }
}
async function checkAdminMiddleware(req, res, next) {
  try {
    const telegramUser = getTelegramUserFromRequest2(req);
    if (!telegramUser) {
      logger2.warn("Admin check failed: No Telegram user found");
      res.status(401);
      return res.json({ error: "Unauthorized - Not logged in" });
    }
    const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
    if (!user) {
      logger2.warn("Admin check failed: User not found in database");
      res.status(401);
      return res.json({ error: "Unauthorized - User not found" });
    }
    if (!user.is_admin) {
      logger2.warn("Admin check failed: User is not an admin");
      res.status(403);
      return res.json({ error: "Forbidden - Admin access required" });
    }
    next();
  } catch (error) {
    logger2.error("Error in admin middleware:", error);
    res.status(500);
    return res.json({ error: "Internal server error" });
  }
}
async function registerRoutes(app) {
  console.log("\u{1F527} ROUTE REGISTRATION: Starting API route registration");
  app.get("/api/network-stats", async (_req, res) => {
    try {
      const usersResult = await db.select({ count: sql4`count(*)` }).from(users).where(eq6(users.is_approved, true));
      const collabsResult = await db.select({ count: sql4`count(*)` }).from(collaborations).where(eq6(collaborations.status, "active"));
      const matchesResult = await db.select({ count: sql4`count(*)` }).from(requests).where(eq6(requests.status, "accepted"));
      res.json({
        users: Number(usersResult[0]?.count || 0),
        collaborations: Number(collabsResult[0]?.count || 0),
        matches: Number(matchesResult[0]?.count || 0)
      });
    } catch (error) {
      console.error("Error fetching network stats:", error);
      res.status(500).json({ error: "Failed to fetch network statistics" });
    }
  });
  const httpServer = createServer(app);
  app.get("/api/profile", async (req, res) => {
    try {
      logger2.debug("============ DEBUG: Profile Endpoint ============");
      logger2.debug("Headers:", req.headers);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "-1");
      res.setHeader("Surrogate-Control", "no-store");
      res.setHeader("Last-Modified", (/* @__PURE__ */ new Date()).toUTCString());
      res.setHeader("X-Response-Time", Date.now().toString());
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        res.status(401);
        return res.json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        logger2.debug("User not found with telegram ID:", telegramUser.id);
        res.status(404);
        return res.json({ error: "User not found" });
      }
      const [company] = await db.select().from(companies).where(eq6(companies.user_id, user.id));
      const [notificationPreferences] = await db.select().from(notification_preferences).where(eq6(notification_preferences.user_id, user.id));
      const [marketingPreferences] = await db.select().from(marketing_preferences).where(eq6(marketing_preferences.user_id, user.id));
      const response = {
        user,
        company,
        // Include all preference objects with proper null handling
        notificationPreferences: notificationPreferences || null,
        marketingPreferences: marketingPreferences || null,
        // For backward compatibility
        preferences: notificationPreferences || {},
        impersonating: req.session?.impersonating ? {
          originalUser: req.session.impersonating.originalUser
        } : null
      };
      if (notificationPreferences) {
        logger2.debug("Notification Preferences Found:");
        logger2.debug("- Notifications Enabled:", notificationPreferences.notifications_enabled);
        logger2.debug("- Notification Frequency:", notificationPreferences.notification_frequency);
        logger2.debug("- Raw Value Type:", typeof notificationPreferences.notifications_enabled);
        logger2.debug("- Updated At:", notificationPreferences.updated_at);
      } else {
        logger2.debug("No notification preferences found for user");
      }
      return res.json(response);
    } catch (error) {
      logger2.error("Error fetching profile:", error);
      res.status(500);
      return res.json({ error: "Internal server error" });
    }
  });
  app.delete("/api/user/delete-account", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        res.status(401);
        return res.json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      const deleted = await storage.deleteUser(user.id);
      if (!deleted) {
        res.status(500);
        return res.json({ error: "Failed to delete account" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
      return res.json({
        success: true,
        message: "Account deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500);
      return res.json({ error: "Failed to delete account" });
    }
  });
  app.get("/api/admin/check", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        res.status(401);
        return res.json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      return res.json({
        success: true,
        isAdmin: !!user.is_admin
      });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500);
      return res.json({ error: "Failed to check admin status" });
    }
  });
  app.get("/api/admin/users", checkAdminMiddleware, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      console.log(`Found ${allUsers.length} users in database`);
      return res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500);
      return res.json({ error: "Failed to fetch users" });
    }
  });
  app.post("/api/admin/set-user-admin-status", checkAdminMiddleware, async (req, res) => {
    try {
      const { userId, isAdmin } = req.body;
      if (!userId) {
        res.status(400);
        return res.json({ error: "User ID is required" });
      }
      if (typeof isAdmin !== "boolean") {
        res.status(400);
        return res.json({ error: "isAdmin must be a boolean value" });
      }
      const updatedUser = await storage.setUserAdminStatus(userId, isAdmin);
      if (!updatedUser) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      return res.json({
        success: true,
        user: updatedUser,
        message: `User admin status ${isAdmin ? "granted" : "revoked"} successfully`
      });
    } catch (error) {
      console.error("Error setting user admin status:", error);
      res.status(500);
      return res.json({ error: "Failed to update user admin status" });
    }
  });
  app.patch("/api/admin/users/:userId/admin-status", checkAdminMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin } = req.body;
      if (typeof isAdmin !== "boolean") {
        res.status(400);
        return res.json({ error: "isAdmin must be a boolean value" });
      }
      const updatedUser = await storage.setUserAdminStatus(userId, isAdmin);
      if (!updatedUser) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      return res.json({
        success: true,
        user: updatedUser,
        message: `User admin status ${isAdmin ? "granted" : "revoked"} successfully`
      });
    } catch (error) {
      console.error("Error setting user admin status:", error);
      res.status(500);
      return res.json({ error: "Failed to update user admin status" });
    }
  });
  app.post("/api/admin/impersonate", checkAdminMiddleware, async (req, res) => {
    try {
      const { telegram_id } = req.body;
      logger2.debug("Impersonation request for telegram_id:", telegram_id);
      if (!telegram_id) {
        res.status(400);
        return res.json({ error: "Telegram ID is required" });
      }
      const [userToImpersonate] = await db.select().from(users).where(eq6(users.telegram_id, telegram_id));
      if (!userToImpersonate) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      logger2.debug("Found user to impersonate:", userToImpersonate);
      const adminUser = getTelegramUserFromRequest2(req);
      if (!req.session) {
        logger2.error("No session object found");
        res.status(500);
        return res.json({ error: "Session not initialized" });
      }
      req.session.impersonating = {
        originalUser: adminUser,
        impersonatedUser: {
          id: userToImpersonate.telegram_id,
          first_name: userToImpersonate.first_name,
          last_name: userToImpersonate.last_name || void 0,
          username: userToImpersonate.handle || void 0
        }
      };
      req.session.save((err) => {
        if (err) {
          logger2.error("Error saving session:", err);
          res.status(500);
          return res.json({ error: "Failed to save session" });
        }
        logger2.debug("Impersonation session saved successfully");
        return res.json({
          success: true,
          message: "Impersonation started",
          user: userToImpersonate
        });
      });
    } catch (error) {
      logger2.error("Error starting impersonation:", error);
      res.status(500);
      return res.json({ error: "Failed to start impersonation" });
    }
  });
  app.post("/api/admin/stop-impersonation", checkAdminMiddleware, async (req, res) => {
    try {
      if (!req.session?.impersonating) {
        res.status(400);
        return res.json({ error: "Not currently impersonating" });
      }
      delete req.session.impersonating;
      req.session.save((err) => {
        if (err) {
          logger2.error("Error saving session:", err);
          res.status(500);
          return res.json({ error: "Failed to save session" });
        }
        logger2.debug("Impersonation session cleared successfully");
        return res.json({
          success: true,
          message: "Impersonation ended"
        });
      });
    } catch (error) {
      logger2.error("Error ending impersonation:", error);
      res.status(500);
      return res.json({ error: "Failed to end impersonation" });
    }
  });
  app.post("/api/admin/approve-user", checkAdminMiddleware, async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400);
        return res.json({ error: "User ID is required" });
      }
      const [user] = await db.select().from(users).where(eq6(users.id, userId));
      if (!user) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      let updatedUser;
      await db.transaction(async (tx) => {
        const [user2] = await tx.update(users).set({
          is_approved: true,
          approved_at: /* @__PURE__ */ new Date()
        }).where(eq6(users.id, userId)).returning();
        updatedUser = user2;
        if (user2.referred_by) {
          logger2.info(`User ${userId} was referred by ${user2.referred_by}, processing referral completion`);
          logger2.info(`REFERRAL TRACKING: User approval with referral - ${JSON.stringify({
            user_id: userId,
            referred_by: user2.referred_by,
            telegram_id: user2.telegram_id,
            first_name: user2.first_name,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          })}`);
          try {
            const [referrer] = await tx.select().from(users).where(eq6(users.id, user2.referred_by));
            if (referrer) {
              await tx.insert(referral_events).values({
                referrer_id: referrer.id,
                referred_user_id: userId,
                status: "completed",
                completed_at: /* @__PURE__ */ new Date()
              });
              logger2.info(`Created completed referral event for referrer ${referrer.id} and user ${userId}`);
              const [referrerReferral] = await tx.select().from(user_referrals).where(eq6(user_referrals.user_id, referrer.id));
              if (referrerReferral) {
                await tx.update(user_referrals).set({
                  total_used: referrerReferral.total_used + 1,
                  updated_at: /* @__PURE__ */ new Date()
                }).where(eq6(user_referrals.id, referrerReferral.id));
                logger2.info(`Updated referral count for referrer ${referrer.id}`);
              } else {
                logger2.warn(`No referral record found for referrer ${referrer.id}`);
              }
            } else {
              logger2.warn(`Referrer with ID ${user2.referred_by} not found for user ${userId}`);
            }
          } catch (referralError) {
            logger2.error(`Error processing referral completion: ${referralError}`);
          }
        }
      });
      try {
        await notifyUserApproved(parseInt(user.telegram_id), user.handle);
      } catch (msgError) {
        console.error("Failed to send user approval notification:", msgError);
      }
      if (user.referred_by && user.first_name) {
        try {
          logger2.info(`Notifying referrer ${user.referred_by} about approval of ${user.first_name}`);
          await notifyReferrerAboutApproval(user.referred_by, user.first_name);
          logger2.info(`Successfully notified referrer ${user.referred_by} about approval`);
        } catch (referrerNotifyError) {
          logger2.error(`Failed to send notification to referrer: ${referrerNotifyError}`);
        }
      }
      if (typeof sendApplicationStatusUpdate === "function") {
        sendApplicationStatusUpdate(
          userId,
          "approved",
          "Your application has been approved! You can now access all platform features."
        );
      } else {
        logger2.info(`User ${userId} approved. Status update would be sent if SSE was implemented.`);
      }
      return res.json({
        success: true,
        user: updatedUser,
        message: "User approved successfully"
      });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500);
      return res.json({ error: "Failed to approve user" });
    }
  });
  app.post("/api/onboarding", authLimiter, async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        linkedin_url,
        email,
        twitter_url,
        twitter_followers,
        referral_code,
        company_name,
        company_website,
        twitter_handle,
        job_title,
        funding_stage,
        has_token,
        token_ticker,
        blockchain_networks,
        tags,
        company_linkedin_url,
        company_twitter_followers,
        collabs_to_host,
        notification_frequency,
        filtered_marketing_topics
      } = req.body;
      let telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        logger2.error("No Telegram user data found and not in development mode");
        res.status(400);
        return res.json({ error: "Invalid Telegram data" });
      }
      if (!first_name) {
        res.status(400);
        return res.json({ error: "First name is required" });
      }
      const result = await db.transaction(async (tx) => {
        const existingUsers = await tx.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
        const isProfileUpdate = existingUsers.length > 0;
        let user;
        if (isProfileUpdate) {
          const updatedRows = await tx.update(users).set({
            first_name,
            last_name,
            linkedin_url,
            email,
            twitter_url,
            twitter_followers,
            referral_code
          }).where(eq6(users.telegram_id, telegramUser.id.toString())).returning();
          user = updatedRows[0];
        } else {
          const handle = telegramUser.username || `user_${telegramUser.id.toString().substring(0, 8)}`;
          logger2.debug(`Creating user with Telegram ID: ${telegramUser.id} and handle: ${handle}`);
          const insertedRows = await tx.insert(users).values({
            telegram_id: telegramUser.id.toString(),
            handle,
            first_name,
            last_name,
            linkedin_url,
            email,
            twitter_url,
            twitter_followers,
            referral_code,
            applied_at: /* @__PURE__ */ new Date()
          }).returning();
          user = insertedRows[0];
        }
        if (!user) {
          throw new Error("Failed to update/create user");
        }
        if (!isProfileUpdate) {
          if (!company_name || !job_title || !company_website) {
            throw new Error("Missing required company fields for new user");
          }
          let shouldAutoApprove = false;
          if (referral_code) {
            logger2.info(`Processing referral code: ${referral_code} for new user ${user.id}`);
            try {
              if (referral_code.includes("_")) {
                let processedCode = referral_code;
                if (referral_code.startsWith("r_")) {
                  processedCode = referral_code.substring(2);
                }
                const telegramIdFromCode = processedCode.split("_")[0];
                logger2.info(`Extracted referrer Telegram ID from code: ${telegramIdFromCode}`);
                const [referrer] = await tx.select().from(users).where(eq6(users.telegram_id, telegramIdFromCode));
                if (referrer) {
                  logger2.info(`Found referrer user: ${referrer.id} (${referrer.first_name} ${referrer.last_name || ""}) for code ${referral_code}`);
                  const [referralRecord] = await tx.select().from(user_referrals).where(eq6(user_referrals.referral_code, processedCode));
                  if (referralRecord && referralRecord.is_auto_approve) {
                    shouldAutoApprove = true;
                    logger2.info(`Referral code ${referral_code} has auto-approval enabled - user will be automatically approved`);
                  }
                  await tx.update(users).set({ referred_by: referrer.id }).where(eq6(users.id, user.id));
                  logger2.info(`Updated user ${user.id} with referrer ${referrer.id}`);
                } else {
                  logger2.warn(`Could not find referrer with Telegram ID ${telegramIdFromCode} for code ${referral_code}`);
                }
              } else {
                logger2.warn(`Referral code ${referral_code} doesn't match expected format TELEGRAM_ID_RANDOM`);
              }
            } catch (referralError) {
              logger2.error(`Error processing referral: ${referralError}`);
            }
          }
          await tx.insert(companies).values({
            user_id: user.id,
            name: company_name,
            job_title,
            website: company_website,
            twitter_handle: twitter_handle ? twitter_handle.replace(/https?:\/\/(www\.)?(x\.com|twitter\.com)\//, "") : null,
            twitter_followers: company_twitter_followers || null,
            linkedin_url: company_linkedin_url || null,
            funding_stage: funding_stage || "Pre-seed",
            has_token: Boolean(has_token || false),
            token_ticker: has_token ? token_ticker : null,
            blockchain_networks: has_token ? blockchain_networks || [] : [],
            tags: tags || []
          });
          await tx.insert(notification_preferences).values({
            user_id: user.id,
            notifications_enabled: true,
            notification_frequency: notification_frequency || "Daily"
          });
          await tx.insert(marketing_preferences).values({
            user_id: user.id,
            // Enable all collaboration types by default
            collabs_to_discover: [
              "Co-Marketing on Twitter",
              "Podcast Guest Appearance",
              "Twitter Spaces Guest",
              "Live Stream Guest Appearance",
              "Report & Research Feature",
              "Newsletter Feature",
              "Blog Post Feature",
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
              "Exclusive Announcement"
            ],
            collabs_to_host: collabs_to_host || [],
            filtered_marketing_topics: filtered_marketing_topics || [],
            // Enable all discovery filters by default. Column names are
            // `discovery_filter_*_enabled` — older code used the shorter
            // `filter_*_enabled` / `matchingEnabled` names which don't exist
            // on the table and cause the INSERT to fail.
            discovery_filter_enabled: true,
            discovery_filter_company_sectors_enabled: true,
            discovery_filter_company_followers_enabled: true,
            discovery_filter_user_followers_enabled: true,
            discovery_filter_funding_stages_enabled: true,
            discovery_filter_token_status_enabled: true
          });
        }
        return { user, isProfileUpdate };
      });
      if (!result.isProfileUpdate && result.user) {
        try {
          const [company] = await db.select().from(companies).where(eq6(companies.user_id, result.user.id));
          if (company) {
            await notifyAdminsNewUser({
              telegram_id: result.user.telegram_id,
              first_name: result.user.first_name,
              last_name: result.user.last_name,
              handle: result.user.handle,
              company_name: company.name,
              company_website: company.website,
              job_title: company.job_title,
              twitter_url: result.user.twitter_url,
              company_twitter_handle: company.twitter_handle ?? void 0
            });
            console.log("Admin notification sent for new user application");
            try {
              const baseWebhookUrl = process.env.N8N_COMPANY_SIGNUP_WEBHOOK_URL;
              if (!baseWebhookUrl) {
                logger2.warn(`N8N_COMPANY_SIGNUP_WEBHOOK_URL not set; skipping signup webhook for company ${company.id}`);
              } else {
                const webhookUrl = `${baseWebhookUrl}${baseWebhookUrl.includes("?") ? "&" : "?"}id=${company.id}`;
                const webhookResponse = await fetch(webhookUrl, {
                  method: "GET",
                  headers: {
                    "User-Agent": "CollabRoom/1.0",
                    "Content-Type": "application/json"
                  }
                });
                if (webhookResponse.ok) {
                  const webhookData = await webhookResponse.text();
                  logger2.info(`Webhook fired successfully for company ${company.id}. Response: ${webhookData}`);
                } else {
                  logger2.error(`Webhook failed for company ${company.id}. Status: ${webhookResponse.status}`);
                }
              }
            } catch (webhookError) {
              logger2.error(`Failed to fire webhook for company ${company.id}:`, webhookError);
            }
            try {
              const telegramId = parseInt(result.user.telegram_id);
              if (!isNaN(telegramId)) {
                await sendApplicationConfirmation(telegramId, result.user.handle);
                console.log(`Application confirmation sent to user ${result.user.first_name} (${result.user.telegram_id})`);
              } else {
                console.error(`Invalid Telegram ID for user confirmation: ${result.user.telegram_id}`);
              }
            } catch (userNotifyError) {
              console.error("Failed to send user application confirmation:", userNotifyError);
            }
          } else {
            console.error("Could not find company data for admin notification");
          }
        } catch (notifyError) {
          console.error("Failed to send admin notification:", notifyError);
        }
      }
      return res.json({
        success: true,
        message: result.isProfileUpdate ? "Profile updated successfully" : "Application submitted successfully",
        ...result
      });
    } catch (error) {
      const pgCode = error?.code;
      if (pgCode === "23505") {
        logger2.warn("User-creation race: concurrent signup for same telegram_id");
        return res.status(409).json({ error: "Signup already in progress, please retry" });
      }
      console.error("Error in onboarding:", error instanceof Error ? error.message : "Unknown error");
      res.status(500);
      return res.json({ error: "Server error" });
    }
  });
  app.post("/api/company", authLimiter, async (req, res) => {
    console.log("============ DEBUG: Company Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    try {
      const {
        company_name,
        job_title,
        website,
        twitter_handle,
        twitter_followers,
        linkedin_url,
        funding_stage,
        has_token,
        token_ticker,
        blockchain_networks,
        tags,
        short_description,
        long_description
      } = req.body;
      if (!company_name || !job_title || !website) {
        console.error("Missing required fields");
        res.status(400);
        return res.json({ error: "Missing required fields" });
      }
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        res.status(400);
        return res.json({ error: "Invalid Telegram data" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        console.error("User not found");
        res.status(404);
        return res.json({ error: "User not found" });
      }
      try {
        const existingCompany = await db.select().from(companies).where(eq6(companies.user_id, user.id));
        let company;
        const companyData = {
          name: company_name,
          job_title,
          website,
          twitter_handle: twitter_handle ? twitter_handle.replace(/https?:\/\/(www\.)?(x\.com|twitter\.com)\//, "") : null,
          // Extract handle from URL
          twitter_followers,
          linkedin_url,
          funding_stage,
          has_token: Boolean(has_token),
          token_ticker: has_token ? token_ticker : null,
          blockchain_networks: has_token ? blockchain_networks : [],
          tags: tags || [],
          short_description,
          long_description
        };
        console.log("Company data to save:", companyData);
        if (existingCompany.length > 0) {
          console.log("Updating existing company:", existingCompany[0]);
          [company] = await db.update(companies).set(companyData).where(eq6(companies.user_id, user.id)).returning();
          console.log("Updated company:", company);
          return res.json({
            success: true,
            company,
            message: "Company information updated successfully"
          });
        }
        console.log("Creating new company with data:", {
          user_id: user.id,
          ...companyData
        });
        [company] = await db.insert(companies).values({
          user_id: user.id,
          ...companyData
        }).returning();
        console.log("Created company:", company);
        return res.json({
          success: true,
          company,
          message: "Company information saved successfully"
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Failed to save company: ${dbError}`);
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0,
        name: error instanceof Error ? error.name : "Unknown"
      });
      res.status(500);
      return res.json({ error: "Server error", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app.post("/api/preferences", authLimiter, async (req, res) => {
    console.log("============ DEBUG: Preferences Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    try {
      const {
        // General preferences
        notification_frequency,
        // Marketing preferences 
        collabs_to_discover,
        collabs_to_host,
        filtered_marketing_topics,
        // Previously named excluded_tags
        twitter_collabs,
        // Conference preferences
        coffee_match_enabled,
        coffee_match_company_sectors,
        coffee_match_company_followers,
        coffee_match_user_followers,
        coffee_match_funding_stages,
        coffee_match_token_status,
        // Coffee match filter toggle states
        coffee_match_filter_company_sectors_enabled,
        coffee_match_filter_company_followers_enabled,
        coffee_match_filter_user_followers_enabled,
        coffee_match_filter_funding_stages_enabled,
        coffee_match_filter_token_status_enabled
      } = req.body;
      if (!notification_frequency) {
        console.error("Missing required field: notification_frequency");
        res.status(400);
        return res.json({ error: "Missing required field: notification_frequency" });
      }
      const collab_discover = Array.isArray(collabs_to_discover) ? collabs_to_discover : [];
      const collab_host = Array.isArray(collabs_to_host) ? collabs_to_host : [];
      const filtered_topics = Array.isArray(filtered_marketing_topics) ? filtered_marketing_topics : [];
      const company_sectors = Array.isArray(coffee_match_company_sectors) ? coffee_match_company_sectors : [];
      const funding_stages = Array.isArray(coffee_match_funding_stages) ? coffee_match_funding_stages : [];
      const twitter_collab_types = Array.isArray(twitter_collabs) ? twitter_collabs : [];
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        res.status(400);
        return res.json({ error: "Invalid Telegram data" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        console.error("User not found");
        res.status(404);
        return res.json({ error: "User not found" });
      }
      try {
        const existingNotificationPrefs = await db.select().from(notification_preferences).where(eq6(notification_preferences.user_id, user.id));
        const existingMarketingPrefs = await db.select().from(marketing_preferences).where(eq6(marketing_preferences.user_id, user.id));
        const result = await db.transaction(async (tx) => {
          let generalPrefs;
          let marketingPrefs;
          const notifications_enabled = req.body.notifications_enabled === false ? false : true;
          if (existingNotificationPrefs.length > 0) {
            [generalPrefs] = await tx.update(notification_preferences).set({
              notification_frequency,
              notifications_enabled
            }).where(eq6(notification_preferences.user_id, user.id)).returning();
            console.log("Updated notification preferences:", generalPrefs);
          } else {
            [generalPrefs] = await tx.insert(notification_preferences).values({
              user_id: user.id,
              notifications_enabled,
              notification_frequency
            }).returning();
            console.log("Created notification preferences:", generalPrefs);
          }
          const marketingPrefsData = {
            collabs_to_discover: collab_discover,
            collabs_to_host: collab_host,
            filtered_marketing_topics: filtered_topics,
            // Renamed from excluded_tags
            twitter_collabs: twitter_collab_types
          };
          if (existingMarketingPrefs.length > 0) {
            [marketingPrefs] = await tx.update(marketing_preferences).set(marketingPrefsData).where(eq6(marketing_preferences.user_id, user.id)).returning();
            console.log("Updated marketing preferences:", marketingPrefs);
          } else {
            [marketingPrefs] = await tx.insert(marketing_preferences).values({
              user_id: user.id,
              ...marketingPrefsData
            }).returning();
            console.log("Created marketing preferences:", marketingPrefs);
          }
          return { generalPrefs, marketingPrefs };
        });
        return res.json({
          success: true,
          preferences: result.generalPrefs,
          marketingPreferences: result.marketingPrefs,
          message: "All preferences updated successfully"
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Failed to save preferences: ${dbError}`);
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0,
        name: error instanceof Error ? error.name : "Unknown"
      });
      res.status(500).json({ error: "Server error", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app.get("/api/collaborations/my", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const myCollaborations = await db.select().from(collaborations).where(eq6(collaborations.creator_id, user.id)).orderBy(desc4(collaborations.created_at));
      return res.json(myCollaborations);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/marketing-preferences", async (req, res) => {
    const telegramUser = getTelegramUserFromRequest2(req);
    if (!telegramUser) {
      console.log("No Telegram user found");
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const user = await storage.getUserByTelegramId(telegramUser.id);
      if (!user) {
        console.log(`User not found for Telegram ID: ${telegramUser.id}`);
        return res.status(401).json({ error: "User not found" });
      }
      const prefs = await storage.getUserMarketingPreferences(user.id);
      if (!prefs) {
        console.log(`No marketing preferences found for user: ${user.id}`);
        return res.status(200).json({
          collabs_to_discover: [],
          filtered_marketing_topics: [],
          company_tags: [],
          company_blockchain_networks: [],
          company_twitter_followers: null,
          twitter_followers: null,
          company_has_token: false,
          discovery_filter_enabled: false,
          discovery_filter_collab_types_enabled: false,
          discovery_filter_topics_enabled: false,
          discovery_filter_company_sectors_enabled: false,
          discovery_filter_company_followers_enabled: false,
          discovery_filter_user_followers_enabled: false,
          discovery_filter_funding_stages_enabled: false,
          discovery_filter_token_status_enabled: false,
          discovery_filter_blockchain_networks_enabled: false
        });
      }
      return res.status(200).json(prefs);
    } catch (error) {
      console.error("Error getting marketing preferences:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
  app.post("/api/marketing-preferences", authLimiter, async (req, res) => {
    console.log("============ DEBUG: Marketing Preferences Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Raw Body:", req.body);
    const collabs_to_discover = Array.isArray(req.body.collabs_to_discover) ? req.body.collabs_to_discover : [];
    const collabs_to_host = Array.isArray(req.body.collabs_to_host) ? req.body.collabs_to_host : [];
    const twitter_collabs = Array.isArray(req.body.twitter_collabs) ? req.body.twitter_collabs : [];
    const filtered_marketing_topics = Array.isArray(req.body.filtered_marketing_topics) ? req.body.filtered_marketing_topics : [];
    console.log("DEBUG ARRAYS: collabs_to_discover:", JSON.stringify(collabs_to_discover));
    console.log("DEBUG ARRAYS: collabs_to_host:", JSON.stringify(collabs_to_host));
    console.log("DEBUG ARRAYS: twitter_collabs:", JSON.stringify(twitter_collabs));
    console.log("DEBUG ARRAYS: filtered_marketing_topics:", JSON.stringify(filtered_marketing_topics));
    console.log("TOPICS DEBUG: filtered_marketing_topics array length:", filtered_marketing_topics.length);
    console.log("TOPICS DEBUG: filtered_marketing_topics raw data:", JSON.stringify(filtered_marketing_topics));
    const topicEntries = filtered_marketing_topics.filter((t) => t && typeof t === "string" && t.startsWith("filter:topic:"));
    console.log("TOPICS DEBUG: topic entries count:", topicEntries.length);
    console.log("TOPICS DEBUG: topic entries raw data:", JSON.stringify(topicEntries));
    const topicValues = topicEntries.map((t) => t.replace("filter:topic:", ""));
    console.log("TOPICS DEBUG: extracted topic values:", JSON.stringify(topicValues));
    try {
      const {
        collabs_to_discover: collabs_to_discover2,
        collabs_to_host: collabs_to_host2,
        filtered_marketing_topics: filtered_marketing_topics2,
        twitter_collabs: twitter_collabs2,
        discovery_filter_enabled,
        discovery_filter_collab_types_enabled,
        discovery_filter_topics_enabled,
        discovery_filter_company_sectors_enabled,
        discovery_filter_company_followers_enabled,
        discovery_filter_user_followers_enabled,
        discovery_filter_funding_stages_enabled,
        discovery_filter_token_status_enabled,
        discovery_filter_blockchain_networks_enabled,
        // Direct field values for filter criteria
        company_tags,
        company_twitter_followers,
        twitter_followers,
        funding_stage,
        company_has_token,
        company_blockchain_networks
      } = req.body;
      let telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        if (process.env.NODE_ENV === "production") {
          res.status(400);
          return res.json({ error: "Invalid Telegram data" });
        }
        console.log("Using development fallback for Telegram data");
        telegramUser = {
          id: "123456789",
          first_name: "Dev",
          username: "dev_user"
        };
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        console.error("User not found");
        res.status(404);
        return res.json({ error: "User not found" });
      }
      try {
        const existingMarketingPrefs = await db.select().from(marketing_preferences).where(eq6(marketing_preferences.user_id, user.id));
        let result;
        console.log("MARKETING PREFERENCES DEBUG: Received filtered_marketing_topics:", JSON.stringify(filtered_marketing_topics2));
        const safeFilteredTopics = Array.isArray(filtered_marketing_topics2) ? filtered_marketing_topics2.filter((item) => typeof item === "string") : [];
        console.log(`MARKETING PREFERENCES DEBUG: Safe filtered_marketing_topics (${safeFilteredTopics.length} items):`, JSON.stringify(safeFilteredTopics));
        const topicEntries2 = safeFilteredTopics.filter(
          (item) => item && typeof item === "string" && item.startsWith("filter:topic:")
        );
        console.log(`MARKETING PREFERENCES DEBUG: Found ${topicEntries2.length} topic entries:`, JSON.stringify(topicEntries2));
        const topicValues2 = topicEntries2.map((item) => item.replace("filter:topic:", ""));
        console.log("MARKETING PREFERENCES DEBUG: Extracted topic values:", JSON.stringify(topicValues2));
        const safeCollabsToDiscover = Array.isArray(collabs_to_discover2) ? collabs_to_discover2 : [];
        const safeCollabsToHost = Array.isArray(collabs_to_host2) ? collabs_to_host2 : [];
        const safeTwitterCollabs = Array.isArray(twitter_collabs2) ? twitter_collabs2 : [];
        const uniqueFilteredTopics = [];
        const seen = /* @__PURE__ */ new Set();
        for (const item of safeFilteredTopics) {
          if (typeof item !== "string") continue;
          if (item.startsWith("filter:topic:")) {
            if (seen.has(item)) {
              console.log(`MARKETING PREFERENCES DEBUG: Found duplicate topic entry: ${item}`);
              continue;
            }
            seen.add(item);
          }
          uniqueFilteredTopics.push(item);
        }
        let finalFilteredTopics = safeFilteredTopics;
        if (safeFilteredTopics.length !== uniqueFilteredTopics.length) {
          console.log(`MARKETING PREFERENCES DEBUG: Removed ${safeFilteredTopics.length - uniqueFilteredTopics.length} duplicate topic entries`);
          finalFilteredTopics = uniqueFilteredTopics;
          console.log("MARKETING PREFERENCES DEBUG: Using deduplicated topics array");
        }
        let processedTopics = finalFilteredTopics;
        const topicDebugEntries = processedTopics.filter(
          (item) => item && typeof item === "string" && item.startsWith("filter:topic:")
        );
        console.log("SAVE OPERATION: Topics being saved:", JSON.stringify(topicDebugEntries.map((t) => t.replace("filter:topic:", ""))));
        console.log("SAVE OPERATION: Full filtered_marketing_topics array:", JSON.stringify(processedTopics));
        processedTopics = processedTopics.filter((item) => typeof item === "string");
        console.log("FINAL SAVE OPERATION: filtered_marketing_topics array after safety checks:", JSON.stringify(processedTopics));
        const safeCompanyTags = Array.isArray(company_tags) ? company_tags : null;
        const safeCompanyBlockchainNetworks = Array.isArray(company_blockchain_networks) ? company_blockchain_networks : null;
        console.log("DIRECT FIELDS DEBUG: company_tags:", JSON.stringify(safeCompanyTags));
        console.log("DIRECT FIELDS DEBUG: company_blockchain_networks:", JSON.stringify(safeCompanyBlockchainNetworks));
        console.log("DIRECT FIELDS DEBUG: company_twitter_followers:", company_twitter_followers);
        console.log("DIRECT FIELDS DEBUG: twitter_followers:", twitter_followers);
        console.log("DIRECT FIELDS DEBUG: funding_stage:", funding_stage);
        console.log("DIRECT FIELDS DEBUG: company_has_token:", company_has_token);
        if (discovery_filter_blockchain_networks_enabled && (!safeCompanyBlockchainNetworks || safeCompanyBlockchainNetworks.length === 0)) {
          console.log("WARNING: Blockchain networks filter is enabled but no networks are selected");
        }
        let blockchainNetworks = safeCompanyBlockchainNetworks;
        if (discovery_filter_blockchain_networks_enabled && blockchainNetworks) {
          console.log("BLOCKCHAIN NETWORKS: Storing selected blockchain networks:", JSON.stringify(blockchainNetworks));
        } else {
          console.log("BLOCKCHAIN NETWORKS: No blockchain networks selected or filter disabled");
          blockchainNetworks = null;
        }
        const marketingPrefsData = {
          collabs_to_discover: safeCollabsToDiscover,
          collabs_to_host: safeCollabsToHost,
          filtered_marketing_topics: processedTopics,
          // All filter toggle states
          discovery_filter_enabled: discovery_filter_enabled === void 0 ? false : discovery_filter_enabled,
          discovery_filter_collab_types_enabled: discovery_filter_collab_types_enabled === void 0 ? false : discovery_filter_collab_types_enabled,
          discovery_filter_topics_enabled: discovery_filter_topics_enabled === void 0 ? false : discovery_filter_topics_enabled,
          discovery_filter_company_sectors_enabled: discovery_filter_company_sectors_enabled === void 0 ? false : discovery_filter_company_sectors_enabled,
          discovery_filter_company_followers_enabled: discovery_filter_company_followers_enabled === void 0 ? false : discovery_filter_company_followers_enabled,
          discovery_filter_user_followers_enabled: discovery_filter_user_followers_enabled === void 0 ? false : discovery_filter_user_followers_enabled,
          discovery_filter_funding_stages_enabled: discovery_filter_funding_stages_enabled === void 0 ? false : discovery_filter_funding_stages_enabled,
          discovery_filter_token_status_enabled: discovery_filter_token_status_enabled === void 0 ? false : discovery_filter_token_status_enabled,
          discovery_filter_blockchain_networks_enabled: discovery_filter_blockchain_networks_enabled === void 0 ? false : discovery_filter_blockchain_networks_enabled,
          // Direct field values for each filter criteria
          company_tags: discovery_filter_company_sectors_enabled ? safeCompanyTags : null,
          company_twitter_followers: discovery_filter_company_followers_enabled ? company_twitter_followers : null,
          twitter_followers: discovery_filter_user_followers_enabled ? twitter_followers : null,
          funding_stage: discovery_filter_funding_stages_enabled ? funding_stage || null : null,
          company_has_token: discovery_filter_token_status_enabled ? company_has_token === void 0 ? false : company_has_token : null,
          company_blockchain_networks: blockchainNetworks
        };
        if (existingMarketingPrefs.length > 0) {
          [result] = await db.update(marketing_preferences).set(marketingPrefsData).where(eq6(marketing_preferences.user_id, user.id)).returning();
          console.log("Updated marketing preferences:", result);
        } else {
          [result] = await db.insert(marketing_preferences).values({
            user_id: user.id,
            ...marketingPrefsData
          }).returning();
          console.log("Created marketing preferences:", result);
        }
        return res.json({
          success: true,
          message: "Marketing preferences updated successfully",
          marketingPrefs: result
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Failed to save marketing preferences: ${dbError}`);
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0,
        name: error instanceof Error ? error.name : "Unknown"
      });
      res.status(500).json({ error: "Server error", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app.post("/api/notification-toggle", authLimiter, async (req, res) => {
    console.log("============ DEBUG: Notification Toggle Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Request URL:", req.url);
    console.log("Request Method:", req.method);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "-1");
    res.setHeader("Surrogate-Control", "no-store");
    const timestamp2 = Date.now();
    res.setHeader("Last-Modified", (/* @__PURE__ */ new Date()).toUTCString());
    res.setHeader("X-Response-Time", timestamp2.toString());
    try {
      const { enabled } = req.body;
      console.log("DEBUG: Notification toggle requested with enabled =", enabled, "type =", typeof enabled);
      if (typeof enabled !== "boolean") {
        console.log("ERROR: Invalid enabled parameter type:", typeof enabled, "value:", enabled);
        return res.status(400).json({ error: 'Missing or invalid "enabled" parameter - must be a boolean' });
      }
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log("DEBUG: Updating notification preferences for user:", user.id);
      console.log("DEBUG: Setting notifications_enabled to:", enabled);
      const existingNotificationPrefs = await db.select().from(notification_preferences).where(eq6(notification_preferences.user_id, user.id));
      const notification_frequency = enabled ? "Instant" : "Daily";
      let result;
      if (existingNotificationPrefs.length > 0) {
        console.log("DEBUG: Updating existing notification preferences");
        [result] = await db.update(notification_preferences).set({
          notification_frequency,
          notifications_enabled: enabled,
          updated_at: /* @__PURE__ */ new Date()
        }).where(eq6(notification_preferences.user_id, user.id)).returning();
      } else {
        console.log("DEBUG: Creating new notification preferences");
        [result] = await db.insert(notification_preferences).values({
          user_id: user.id,
          notifications_enabled: enabled,
          notification_frequency,
          created_at: /* @__PURE__ */ new Date(),
          updated_at: /* @__PURE__ */ new Date()
        }).returning();
      }
      console.log("DEBUG: Updated notification preferences:", result);
      console.log("DEBUG: Result notifications_enabled type:", typeof result.notifications_enabled);
      console.log("DEBUG: Result notifications_enabled value:", result.notifications_enabled);
      return res.json({
        success: true,
        preferences: result,
        message: enabled ? "Notifications enabled" : "Notifications disabled"
      });
    } catch (error) {
      console.error("Error updating notification status:", error);
      return res.status(500).json({ error: "Failed to update notification status" });
    }
  });
  app.get("/api/profile", async (req, res) => {
    console.log("============ DEBUG: Profile Endpoint ============");
    console.log("Headers:", req.headers);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("ETag", Date.now().toString());
    res.setHeader("Last-Modified", (/* @__PURE__ */ new Date()).toUTCString());
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        if (process.env.NODE_ENV === "production") {
          res.status(400);
          return res.json({ error: "Invalid Telegram data" });
        }
        console.log("Using development fallback for Telegram data");
        const devUser = {
          id: "123456789",
          username: "test_user",
          first_name: "Test",
          last_name: "User"
        };
        return res.json({ user: devUser });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        res.status(404);
        return res.json({ error: "User not found" });
      }
      const [company] = await db.select().from(companies).where(eq6(companies.user_id, user.id));
      const [marketingPreferences] = await db.select().from(marketing_preferences).where(eq6(marketing_preferences.user_id, user.id));
      const conferencePreferences = null;
      const [notificationPrefs] = await db.select().from(notification_preferences).where(eq6(notification_preferences.user_id, user.id)).catch((error) => {
        console.error("Error fetching notification preferences:", error);
        return [null];
      });
      console.log("DEBUG - Notification preferences from DB:", notificationPrefs);
      if (notificationPrefs) {
        console.log("DEBUG - notificationPrefs.notifications_enabled type:", typeof notificationPrefs.notifications_enabled);
        console.log("DEBUG - notificationPrefs.notifications_enabled value:", notificationPrefs.notifications_enabled);
        console.log("DEBUG - notificationPrefs.notification_frequency:", notificationPrefs.notification_frequency);
        const boolValue = Boolean(notificationPrefs.notifications_enabled);
        console.log("DEBUG - Boolean(notificationPrefs.notifications_enabled):", boolValue);
        const isEnabled = typeof notificationPrefs.notifications_enabled === "string" ? ["t", "true"].includes(String(notificationPrefs.notifications_enabled).toLowerCase()) : Boolean(notificationPrefs.notifications_enabled);
        console.log("DEBUG - Parsed boolean value with string check:", isEnabled);
      } else {
        console.log("DEBUG - No notification preferences found for user");
      }
      return res.json({
        user,
        company,
        // Still return the preferences object for backward compatibility
        preferences: {
          id: "",
          user_id: user.id,
          notification_frequency: notificationPrefs?.notification_frequency || "Daily",
          // Empty fields that used to be in preferences but are now in specialized tables
          collabs_to_discover: [],
          collabs_to_host: [],
          twitter_collabs: [],
          filtered_marketing_topics: []
        },
        // Include notification preferences in the response
        notificationPreferences: notificationPrefs || {
          id: "",
          user_id: user.id,
          notifications_enabled: true,
          notification_frequency: "Instant",
          created_at: /* @__PURE__ */ new Date(),
          updated_at: /* @__PURE__ */ new Date()
        },
        marketingPreferences,
        conferencePreferences
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500);
      return res.json({ error: "Failed to fetch profile data" });
    }
  });
  app.get("/api/application-status-updates/:userId", async (req, res) => {
    console.log("============ DEBUG: Application Status SSE Connection ============");
    console.log("Params:", req.params);
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user || user.id !== userId) {
        return res.status(403).json({ error: "Forbidden - Cannot access this user status" });
      }
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      const initialStatus = user.is_approved ? "approved" : "processing";
      res.write(`data: ${JSON.stringify({
        status: initialStatus,
        message: initialStatus === "approved" ? "Your application has been approved!" : "Your application is currently being processed...",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })}

`);
      activeStatusConnections.set(userId, res);
      req.on("close", () => {
        console.log(`Client disconnected from status updates for user ${userId}`);
        activeStatusConnections.delete(userId);
      });
    } catch (error) {
      console.error("Error establishing SSE connection:", error);
      return res.status(500).json({ error: "Failed to establish status update connection" });
    }
  });
  function sendApplicationStatusUpdate(userId, status, message) {
    const client = activeStatusConnections.get(userId);
    if (client) {
      client.write(`data: ${JSON.stringify({
        status,
        message: message || `Application status changed to: ${status}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      })}

`);
      if (status === "approved" || status === "rejected") {
        setTimeout(() => {
          client.write(`data: ${JSON.stringify({
            status: "connection_closing",
            message: "Status updates complete, this connection will close.",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          })}

`);
          activeStatusConnections.delete(userId);
        }, 2e3);
      }
    }
  }
  app.get("/api/my-applications", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        if (process.env.NODE_ENV === "production") {
          return res.status(400).json({ error: "Invalid Telegram data" });
        }
        console.log("Using development fallback for Telegram data");
        const devUser = {
          id: "123456789",
          username: "test_user",
          first_name: "Test",
          last_name: "User"
        };
        return devUser;
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const userApplications = await storage.getUserApplications(user.id);
      const applicationsWithCollabData = await Promise.all(
        userApplications.map(async (app2) => {
          const collab = await storage.getCollaboration(app2.collaboration_id);
          return {
            ...app2,
            collaboration: collab
          };
        })
      );
      return res.json(applicationsWithCollabData);
    } catch (error) {
      console.error("Failed to fetch user applications:", error);
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });
  app.post("/api/collaborations/update", async (req, res) => {
    console.log("============ DEBUG: Direct Collaboration Update Endpoint ============");
    console.log("Body:", req.body);
    try {
      const updateData = req.body;
      const id = updateData.id;
      if (!id) {
        return res.status(400).json({ error: "Collaboration ID is required" });
      }
      const telegramData = getTelegramUserFromRequest2(req);
      if (!telegramData?.id) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const telegramId = telegramData.id.toString();
      console.log(`Telegram ID: ${telegramId} attempting to update collaboration: ${id}`);
      const [dbUser] = await db.select().from(users).where(eq6(users.telegram_id, telegramId));
      if (!dbUser) {
        console.log("User not found with telegramId:", telegramId);
        return res.status(404).json({ error: "User not found" });
      }
      const userId = dbUser.id;
      console.log(`Found user with ID: ${userId}`);
      const existingCollab = await db.select().from(collaborations).where(and4(eq6(collaborations.id, id), eq6(collaborations.creator_id, userId))).limit(1);
      if (!existingCollab.length) {
        console.log("Collaboration not found or does not belong to the user");
        return res.status(404).json({ error: "Collaboration not found or you do not have permission to update it" });
      }
      delete updateData.id;
      delete updateData.creator_id;
      if (updateData.created_at && typeof updateData.created_at === "string") {
        delete updateData.created_at;
      }
      if (updateData.specific_date && typeof updateData.specific_date === "string") {
      }
      if (updateData.updated_at && typeof updateData.updated_at === "string") {
        delete updateData.updated_at;
      }
      if (typeof updateData.details === "string") {
        try {
          updateData.details = JSON.parse(updateData.details);
        } catch (e) {
          console.error("Error parsing details JSON:", e);
          return res.status(400).json({ error: "Invalid JSON in `details` field" });
        }
      }
      console.log("Handling special fields:");
      if (updateData.details && updateData.details.host_follower_count) {
        console.log("Found host_follower_count in details:", updateData.details.host_follower_count);
      }
      if (updateData.min_company_followers) {
        console.log("Found min_company_followers:", updateData.min_company_followers);
      }
      if (updateData.min_user_followers) {
        console.log("Found min_user_followers:", updateData.min_user_followers);
      }
      if (updateData.required_funding_stages) {
        console.log("Found required_funding_stages:", updateData.required_funding_stages);
        if (typeof updateData.required_funding_stages === "string") {
          try {
            updateData.required_funding_stages = JSON.parse(updateData.required_funding_stages);
          } catch (e) {
            console.error("Error parsing required_funding_stages:", e);
            return res.status(400).json({ error: "Invalid JSON in `required_funding_stages` field" });
          }
        }
      }
      if (updateData.required_company_sectors) {
        console.log("Found required_company_sectors:", updateData.required_company_sectors);
        if (typeof updateData.required_company_sectors === "string") {
          try {
            updateData.required_company_sectors = JSON.parse(updateData.required_company_sectors);
          } catch (e) {
            console.error("Error parsing required_company_sectors:", e);
            return res.status(400).json({ error: "Invalid JSON in `required_company_sectors` field" });
          }
        }
      }
      updateData.updated_at = /* @__PURE__ */ new Date();
      console.log("=== DETAILED UPDATE DATA DEBUG ===");
      console.log("1. Original data received:", JSON.stringify(req.body, null, 2));
      console.log("2. Type of details object:", typeof updateData.details);
      if (updateData.details && typeof updateData.details === "object") {
        console.log("3. Nested details fields:");
        console.log("   - collaboration_types:", JSON.stringify(updateData.details.collaboration_types));
        console.log("   - host_follower_count:", updateData.details.host_follower_count);
        console.log("   - host_twitter_handle:", updateData.details.host_twitter_handle);
      }
      console.log("4. Other important fields:");
      console.log("   - required_company_sectors:", JSON.stringify(updateData.required_company_sectors));
      console.log("   - required_funding_stages:", JSON.stringify(updateData.required_funding_stages));
      console.log("   - min_company_followers:", updateData.min_company_followers);
      console.log("   - min_user_followers:", updateData.min_user_followers);
      console.log("5. Cleaned update data:", JSON.stringify(updateData, null, 2));
      console.log("=== END DEBUG ===");
      const [updatedCollab] = await db.update(collaborations).set(updateData).where(eq6(collaborations.id, id)).returning();
      console.log(`Successfully updated collaboration ${id}`);
      return res.status(200).json(updatedCollab);
    } catch (error) {
      console.error("Error updating collaboration:", error);
      return res.status(500).json({ error: "Failed to update collaboration" });
    }
  });
  app.post("/api/collaborations", async (req, res) => {
    console.log("============ DEBUG: Create Collaboration Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    try {
      const result = createCollaborationSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Validation error:", result.error);
        return res.status(400).json({
          error: "Invalid collaboration data",
          details: result.error.format()
        });
      }
      const initData = req.headers["x-telegram-init-data"];
      if (!initData) {
        console.error("No Telegram init data found in headers");
        return res.status(400).json({ error: "Invalid Telegram data" });
      }
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get("user") || "{}");
      if (!telegramUser.id) {
        console.error("No Telegram user ID found in parsed data");
        return res.status(400).json({ error: "Invalid Telegram data" });
      }
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error("User not found");
        return res.status(404).json({ error: "User not found" });
      }
      const validatedData = result.data;
      console.log("Details from form data:", validatedData.details);
      const collabData = {
        creator_id: user.id,
        collab_type: validatedData.collab_type,
        title: validatedData.title,
        description: validatedData.description,
        date_type: validatedData.date_type,
        specific_date: validatedData.specific_date,
        is_free_collab: validatedData.is_free_collab,
        required_token_status: validatedData.required_token_status || false,
        min_company_followers: validatedData.min_company_followers || null,
        min_user_followers: validatedData.min_user_followers || null,
        details: validatedData.details,
        // Convert arrays to ensure they're string arrays
        topics: validatedData.topics.map(String),
        required_company_sectors: validatedData.required_company_sectors ? validatedData.required_company_sectors.map(String) : [],
        required_funding_stages: validatedData.required_funding_stages ? validatedData.required_funding_stages.map(String) : [],
        required_blockchain_networks: validatedData.required_blockchain_networks ? validatedData.required_blockchain_networks.map(String) : [],
        // Add standardized fields for consistent filtering across all tables
        company_tags: validatedData.required_company_sectors ? validatedData.required_company_sectors.map(String) : [],
        company_twitter_followers: validatedData.min_company_followers,
        twitter_followers: validatedData.min_user_followers,
        funding_stage: validatedData.required_funding_stages && validatedData.required_funding_stages.length > 0 ? validatedData.required_funding_stages[0] : null,
        company_has_token: validatedData.required_token_status || false,
        company_blockchain_networks: validatedData.required_blockchain_networks ? validatedData.required_blockchain_networks.map(String) : [],
        // Set filter toggle states based on whether requirements are specified
        filter_company_sectors_enabled: Array.isArray(validatedData.required_company_sectors) && validatedData.required_company_sectors.length > 0,
        filter_company_followers_enabled: !!validatedData.min_company_followers,
        filter_user_followers_enabled: !!validatedData.min_user_followers,
        filter_funding_stages_enabled: Array.isArray(validatedData.required_funding_stages) && validatedData.required_funding_stages.length > 0,
        filter_token_status_enabled: !!validatedData.required_token_status,
        filter_blockchain_networks_enabled: Array.isArray(validatedData.required_blockchain_networks) && validatedData.required_blockchain_networks.length > 0
      };
      try {
        const newCollaboration = await storage.createCollaboration(collabData);
        try {
          await notifyUserCollabCreated(newCollaboration.creator_id, newCollaboration.id);
          console.log(`User notification sent for new collaboration ${newCollaboration.id}`);
        } catch (userNotifyError) {
          console.error("Failed to send user notification for new collaboration:", userNotifyError);
        }
        try {
          await notifyAdminsNewCollaboration(newCollaboration.id, newCollaboration.creator_id);
          console.log(`Admin notification sent for new collaboration ${newCollaboration.id}`);
        } catch (adminNotifyError) {
          console.error("Failed to send admin notification for new collaboration:", adminNotifyError);
        }
        try {
          await sendCollaborationWebhook(newCollaboration.id);
          console.log(`Webhook sent for new collaboration ${newCollaboration.id}`);
        } catch (webhookError) {
          console.error("Failed to send webhook for new collaboration:", webhookError);
        }
        res.status(201);
        return res.json({
          success: true,
          collaboration: newCollaboration,
          message: "Collaboration created successfully"
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Failed to create collaboration: ${String(dbError)}`);
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0,
        name: error instanceof Error ? error.name : "Unknown"
      });
      res.status(500).json({
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.get("/api/auth-test", async (req, res) => {
    console.log("============ DEBUG: Auth Test Endpoint ============");
    console.log("Headers:", req.headers);
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user found in request");
        return res.status(401).json({ error: "Unauthorized - No Telegram user found" });
      }
      console.log("Found Telegram user in request:", telegramUser.id);
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        console.error("User not found in database for Telegram ID:", telegramUser.id);
        return res.status(404).json({ error: "User not found" });
      }
      console.log("Found database user:", user.id);
      return res.json({
        success: true,
        message: "Authentication successful",
        auth_method: req.headers["x-telegram-user-id"] ? "Direct User ID" : "Telegram Init Data",
        telegram_id: telegramUser.id,
        user_id: user.id,
        first_name: user.first_name
      });
    } catch (error) {
      console.error("Auth test failed:", error);
      return res.status(500).json({
        error: "Auth test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.patch("/api/collaborations/:id/status", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { status } = req.body;
      if (!status || status !== "active" && status !== "paused") {
        return res.status(400).json({ error: 'Invalid status value. Status must be either "active" or "paused".' });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const collabId = req.params.id;
      const [collaboration] = await db.select().from(collaborations).where(eq6(collaborations.id, collabId));
      if (!collaboration) {
        return res.status(404).json({ error: "Collaboration not found" });
      }
      if (collaboration.creator_id !== user.id) {
        return res.status(403).json({ error: "Not authorized to update this collaboration" });
      }
      const updatedCollaboration = await storage.updateCollaborationStatus(collabId, status);
      return res.json(updatedCollaboration);
    } catch (error) {
      console.error("Failed to update collaboration status:", error);
      res.status(500);
      return res.json({ error: "Failed to update collaboration status" });
    }
  });
  app.get("/api/collaborations/my", async (req, res) => {
    console.log("============ DEBUG: My Collaborations Endpoint ============");
    console.log("Headers:", req.headers);
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        console.error("User not found");
        return res.status(404).json({ error: "User not found" });
      }
      const myCollaborations = await db.select({
        id: collaborations.id,
        creator_id: collaborations.creator_id,
        collab_type: collaborations.collab_type,
        title: collaborations.title,
        description: collaborations.description,
        details: collaborations.details,
        topics: collaborations.topics,
        status: collaborations.status,
        created_at: collaborations.created_at,
        updated_at: collaborations.updated_at,
        // Add company data
        company_name: companies.name,
        company_logo_url: companies.logo_url,
        company_short_description: companies.short_description,
        company_website: companies.website,
        company_twitter_handle: companies.twitter_handle,
        company_job_title: companies.job_title
      }).from(collaborations).leftJoin(companies, eq6(companies.user_id, collaborations.creator_id)).where(eq6(collaborations.creator_id, user.id)).orderBy(desc4(collaborations.created_at));
      console.log("Found collaborations:", myCollaborations.length);
      console.log("Collaborations data:", JSON.stringify(myCollaborations, null, 2));
      const collabTypes = myCollaborations.map((collab) => collab.collab_type);
      console.log("Collaboration types:", collabTypes);
      return res.json(myCollaborations);
    } catch (error) {
      console.error("Failed to fetch user collaborations:", error);
      return res.status(500).json({
        error: "Failed to fetch collaborations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.get("/api/collaborations/get/:id", async (req, res) => {
    console.log("============ DEBUG: Get Collaboration Endpoint ============");
    console.log("Params:", req.params);
    try {
      const { id } = req.params;
      const [collaboration] = await db.select().from(collaborations).where(eq6(collaborations.id, id)).limit(1);
      if (!collaboration) {
        console.log(`Collaboration with ID ${id} not found`);
        return res.status(404).json({ error: "Collaboration not found" });
      }
      console.log(`Found collaboration: ${collaboration.title}`);
      return res.json(collaboration);
    } catch (error) {
      console.error("Error fetching collaboration:", error);
      return res.status(500).json({ error: "Failed to fetch collaboration" });
    }
  });
  app.get("/api/potential-matches", async (req, res) => {
    console.log("============ DEBUG: Potential Matches Endpoint ============");
    console.log("Headers:", req.headers);
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        console.error("User not found");
        return res.status(404).json({ error: "User not found" });
      }
      const potentialMatches = await storage.getPotentialMatchesForHost(user.id);
      console.log(`Found ${potentialMatches.length} potential matches for user ${user.id}`);
      return res.json(potentialMatches);
    } catch (error) {
      console.error("Failed to fetch potential matches:", error);
      return res.status(500).json({
        error: "Failed to fetch potential matches",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.get("/api/collaborations/interactions", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const userCollaborations = await db.select({ id: collaborations.id }).from(collaborations).where(eq6(collaborations.creator_id, user.id));
      const userCollaborationIds = userCollaborations.map((c) => c.id);
      const userRequests = await db.select().from(requests).where(or3(
        eq6(requests.requester_id, user.id),
        eq6(requests.host_id, user.id)
      ));
      const interactions = {};
      userRequests.forEach((request) => {
        if (userCollaborationIds.includes(request.collaboration_id)) {
          return;
        }
        if (request.status === "accepted") {
          interactions[request.collaboration_id] = {
            status: "matched",
            matchId: request.id
          };
        } else if (request.status === "pending" && request.requester_id === user.id) {
          interactions[request.collaboration_id] = { status: "requested" };
        }
      });
      return res.json(interactions);
    } catch (error) {
      console.error("Failed to fetch collaboration interactions:", error);
      return res.status(500).json({ error: "Failed to fetch interactions" });
    }
  });
  app.get("/api/collaborations/search", async (req, res) => {
    console.log("============ DEBUG: Search Collaborations GET Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Query:", req.query);
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      let currentUserId = null;
      if (telegramUser) {
        const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
        if (user) {
          currentUserId = user.id;
          console.log("Found authenticated user:", currentUserId);
        }
      } else {
        console.log("No authenticated user - showing public view");
      }
      const filters = {
        collabTypes: req.query.collabTypes ? req.query.collabTypes.split(",") : void 0,
        companyTags: req.query.companyTags ? req.query.companyTags.split(",") : void 0,
        minCompanyFollowers: req.query.minCompanyFollowers,
        minUserFollowers: req.query.minUserFollowers,
        hasToken: req.query.hasToken ? req.query.hasToken === "true" : void 0,
        fundingStages: req.query.fundingStages ? req.query.fundingStages.split(",") : void 0,
        blockchainNetworks: req.query.blockchainNetworks ? req.query.blockchainNetworks.split(",") : void 0,
        // Only exclude user's own collaborations if user is authenticated
        excludeOwn: currentUserId ? true : false,
        // Pagination parameters
        cursor: req.query.cursor,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
        // Sorting parameter
        sortBy: req.query.sortBy
      };
      console.log("Calling searchCollaborationsPaginated with user ID:", currentUserId || "anonymous");
      console.log("Using filters:", filters);
      const paginatedResults = await storage.searchCollaborationsPaginated(currentUserId || "anonymous", filters);
      console.log(`Found ${paginatedResults.items.length} collaborations, hasMore: ${paginatedResults.hasMore}`);
      return res.json(paginatedResults);
    } catch (error) {
      console.error("Failed to search collaborations:", error);
      res.status(500).json({
        error: "Failed to search collaborations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.post("/api/collaborations/search", async (req, res) => {
    console.log("============ DEBUG: Search Collaborations POST Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Query:", req.query);
    console.log("Body:", req.body);
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user found");
        return res.status(400).json({ error: "Invalid Telegram data" });
      }
      console.log("Found Telegram user:", telegramUser.id);
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error("Database user not found for Telegram ID:", telegramUser.id);
        return res.status(404).json({ error: "User not found" });
      }
      console.log("Found database user:", user.id);
      const filters = {
        collabTypes: req.query.collabTypes ? req.query.collabTypes.split(",") : void 0,
        companyTags: req.query.companyTags ? req.query.companyTags.split(",") : void 0,
        minCompanyFollowers: req.query.minCompanyFollowers,
        minUserFollowers: req.query.minUserFollowers,
        hasToken: req.query.hasToken ? req.query.hasToken === "true" : void 0,
        fundingStages: req.query.fundingStages ? req.query.fundingStages.split(",") : void 0,
        blockchainNetworks: req.query.blockchainNetworks ? req.query.blockchainNetworks.split(",") : void 0,
        // Always exclude user's own collaborations in Regular Collaboration Cards
        // This is a non-negotiable rule for the application
        excludeOwn: true,
        // Pagination parameters
        cursor: req.query.cursor,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 10
      };
      let excludeIds = [];
      if (req.body && req.body.excludeIds && Array.isArray(req.body.excludeIds)) {
        excludeIds = req.body.excludeIds;
        console.log(`Excluding ${excludeIds.length} additional IDs from body:`, excludeIds);
      }
      console.log("Calling searchCollaborationsPaginated with user ID:", user.id);
      console.log("Using filters:", filters);
      const paginatedResults = await storage.searchCollaborationsPaginated(user.id, {
        ...filters,
        excludeIds
        // Pass additional excluded IDs to storage function
      });
      console.log(`Found ${paginatedResults.items.length} collaborations, hasMore: ${paginatedResults.hasMore}`);
      return res.json(paginatedResults);
    } catch (error) {
      console.error("Failed to search collaborations:", error);
      res.status(500).json({
        error: "Failed to search collaborations",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.patch("/api/collaborations/applications/:id", async (req, res) => {
    console.log("============ DEBUG: Update Application Status Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      if (!status || !["approved", "rejected", "pending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const initData = req.headers["x-telegram-init-data"];
      if (!initData) {
        console.error("No Telegram init data found in headers");
        return res.status(400).json({ error: "Invalid Telegram data" });
      }
      const decodedInitData = new URLSearchParams(initData);
      const telegramUser = JSON.parse(decodedInitData.get("user") || "{}");
      if (!telegramUser.id) {
        console.error("No Telegram user ID found in parsed data");
        return res.status(400).json({ error: "Invalid Telegram data" });
      }
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error("User not found");
        return res.status(404).json({ error: "User not found" });
      }
      const [application] = await db.select().from(collab_applications).where(eq6(collab_applications.id, id));
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const [collaboration] = await db.select().from(collaborations).where(eq6(collaborations.id, application.collaboration_id));
      if (!collaboration) {
        return res.status(404).json({ error: "Collaboration not found" });
      }
      if (collaboration.creator_id !== user.id) {
        return res.status(403).json({ error: "You are not authorized to update this application" });
      }
      try {
        const updatedApplication = await storage.updateApplicationStatus(id, status);
        const [applicant] = await db.select().from(users).where(eq6(users.id, application.applicant_id));
        if (applicant) {
        }
        return res.json({
          success: true,
          application: updatedApplication,
          message: `Application ${status} successfully`
        });
      } catch (err) {
        console.error("Database error:", err);
        throw new Error(`Failed to update application status: ${String(err)}`);
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0,
        name: error instanceof Error ? error.name : "Unknown"
      });
      res.status(500).json({
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.patch("/api/collaborations/:id", async (req, res) => {
    console.log("============ DEBUG: Update Collaboration Endpoint ============");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    try {
      const { id } = req.params;
      const updateData = req.body;
      const telegramData = getTelegramUserFromRequest2(req);
      if (!telegramData?.id) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const telegramId = telegramData.id.toString();
      console.log(`Telegram ID: ${telegramId} attempting to update collaboration: ${id}`);
      const [dbUser] = await db.select().from(users).where(eq6(users.telegram_id, telegramId));
      if (!dbUser) {
        console.log("User not found with telegramId:", telegramId);
        return res.status(404).json({ error: "User not found" });
      }
      const userId = dbUser.id;
      console.log(`Found user with ID: ${userId}`);
      const existingCollab = await db.select().from(collaborations).where(and4(eq6(collaborations.id, id), eq6(collaborations.creator_id, userId))).limit(1);
      if (!existingCollab.length) {
        console.log("Collaboration not found or does not belong to the user");
        return res.status(404).json({ error: "Collaboration not found or you do not have permission to update it" });
      }
      delete updateData.id;
      delete updateData.creator_id;
      if (!updateData.collab_type || !updateData.description || !updateData.date_type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      updateData.updated_at = /* @__PURE__ */ new Date();
      const [updatedCollab] = await db.update(collaborations).set(updateData).where(eq6(collaborations.id, id)).returning();
      console.log(`Successfully updated collaboration ${id}`);
      return res.status(200).json(updatedCollab);
    } catch (error) {
      console.error("Error updating collaboration:", error);
      return res.status(500).json({ error: "Failed to update collaboration" });
    }
  });
  app.delete("/api/collaborations/:id", async (req, res) => {
    console.log("============ DEBUG: Delete Collaboration Endpoint ============");
    console.log("Params:", req.params);
    try {
      const { id } = req.params;
      const telegramData = getTelegramUserFromRequest2(req);
      if (!telegramData?.id) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const telegramId = telegramData.id.toString();
      console.log(`Telegram ID: ${telegramId} attempting to delete collaboration: ${id}`);
      const [dbUser] = await db.select().from(users).where(eq6(users.telegram_id, telegramId));
      if (!dbUser) {
        console.log("User not found with telegramId:", telegramId);
        return res.status(404).json({ error: "User not found" });
      }
      const userId = dbUser.id;
      console.log(`Found user with ID: ${userId}`);
      const existingCollab = await db.select().from(collaborations).where(and4(eq6(collaborations.id, id), eq6(collaborations.creator_id, userId))).limit(1);
      if (!existingCollab.length) {
        console.log("Collaboration not found or does not belong to the user");
        return res.status(404).json({ error: "Collaboration not found or you do not have permission to delete it" });
      }
      const deletedCollab = await db.delete(collaborations).where(eq6(collaborations.id, id)).returning();
      const deletedRequests = await db.delete(requests).where(eq6(requests.collaboration_id, id)).returning();
      console.log(`Successfully deleted collaboration ${id} and ${deletedRequests.length} related requests`);
      return res.status(200).json({
        success: true,
        message: "Collaboration deleted successfully",
        deletedId: id,
        deletedRequestsCount: deletedRequests.length
      });
    } catch (error) {
      console.error("Error deleting collaboration:", error);
      return res.status(500).json({ error: "Failed to delete collaboration" });
    }
  });
  console.log("\u{1F527} ROUTE REGISTRATION: Registering POST /api/collaborations/:id/apply");
  app.post("/api/collaborations/:id/apply", applicationLimiter, async (req, res) => {
    console.log("============ DEBUG: Apply to Collaboration Endpoint ============");
    console.log("Headers:", req.headers);
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("\u{1F680} ROUTE HANDLER: Starting collaboration application process");
    console.log("\u{1F680} ENHANCED LOGGING: Route handler is executing");
    try {
      const { id } = req.params;
      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        console.error("Validation error: message is required");
        return res.status(400).json({
          error: "Message is required for collaboration application"
        });
      }
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user found");
        return res.status(400).json({ error: "Invalid Telegram data" });
      }
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.error("User not found");
        return res.status(404).json({ error: "User not found" });
      }
      const collaboration = await storage.getCollaboration(id);
      if (!collaboration) {
        return res.status(404).json({ error: "Collaboration not found" });
      }
      if (collaboration.creator_id === user.id) {
        return res.status(400).json({ error: "You cannot apply to your own collaboration" });
      }
      const applicationResult = await storage.createCollabApplication(id, user.id, message);
      if (!applicationResult) {
        return res.status(500).json({ error: "Failed to create collaboration application" });
      }
      try {
        console.log(`\u{1F4DD} Application created successfully for collaboration ${id} by user ${user.id}`);
        console.log(`\u{1F4DD} Database notifications removed - using Telegram notifications only`);
        try {
          console.log(`\u{1F4E7} About to send Telegram notification to host ${collaboration.creator_id} about application from user ${user.id}`);
          console.log(`\u{1F4E7} DEBUG: collaboration.creator_id = ${collaboration.creator_id}`);
          console.log(`\u{1F4E7} DEBUG: user.id = ${user.id}`);
          console.log(`\u{1F4E7} DEBUG: collaboration.id = ${collaboration.id}`);
          const hostNotificationResult = await notifyNewCollabRequest(collaboration.creator_id, user.id, collaboration.id);
          console.log(`\u{1F4E7} DEBUG: hostNotificationResult = ${hostNotificationResult}`);
          console.log(`\u2705 Sent Telegram notification to host ${collaboration.creator_id} about new collaboration application`);
          const requesterNotificationResult = await notifyRequesterRequestSent(user.id, collaboration.creator_id, collaboration.id, message);
          console.log(`\u{1F4E7} DEBUG: requesterNotificationResult = ${requesterNotificationResult}`);
          console.log(`\u2705 Sent Telegram confirmation to requester ${user.id} about collab request sent`);
        } catch (notificationError) {
          console.error("\u274C Error sending collaboration application notifications:", notificationError);
          console.error("\u274C Error stack:", notificationError instanceof Error ? notificationError.stack : notificationError);
        }
        console.log(`\u{1F4DD} About to send success response`);
        res.status(201).json({
          success: true,
          application: applicationResult,
          message: "Application submitted successfully"
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        throw new Error(`Failed to submit application: ${String(dbError)}`);
      }
    } catch (error) {
      console.error("Detailed error:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0,
        name: error instanceof Error ? error.name : "Unknown"
      });
      res.status(500).json({
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  console.log("\u{1F527} ROUTE REGISTRATION: Registering POST /api/test-notification");
  app.post("/api/test-notification", async (req, res) => {
    try {
      console.log("\u{1F9EA} TEST NOTIFICATION: Starting test notification");
      const { hostUserId, requesterUserId, collaborationId } = req.body;
      if (!hostUserId || !requesterUserId || !collaborationId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      console.log("\u{1F9EA} TEST NOTIFICATION: Calling notifyNewCollabRequest");
      const result = await notifyNewCollabRequest(hostUserId, requesterUserId, collaborationId);
      console.log("\u{1F9EA} TEST NOTIFICATION: Result:", result);
      return res.json({ success: true, result });
    } catch (error) {
      console.error("\u{1F9EA} TEST NOTIFICATION: Error:", error);
      return res.status(500).json({ error: "Test notification failed" });
    }
  });
  app.get("/api/matches", async (req, res) => {
    console.log("============ DEBUG: User Matches Endpoint ============");
    console.log("Request URL:", req.url);
    console.log("Request Query:", req.query);
    console.log("Request Method:", req.method);
    console.log("Headers:", req.headers);
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.log("\u274C No Telegram user found in request");
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log("\u2705 Found Telegram user:", telegramUser.id, telegramUser.username || "(no username)");
      const user = await storage.getUserByTelegramId(telegramUser.id.toString());
      if (!user) {
        console.log("\u274C User not found in database for Telegram ID:", telegramUser.id);
        return res.status(404).json({ error: "User not found" });
      }
      console.log("\u2705 Found database user:", user.id);
      console.log(`\u{1F50D} Fetching matches with details for user ${user.id}`);
      try {
        const rawMatches = await storage.getUserMatches(user.id);
        console.log(`\u{1F4CA} Raw matches count: ${rawMatches.length}`);
        if (rawMatches.length > 0) {
          console.log("\u{1F4CB} First raw match sample:", JSON.stringify(rawMatches[0], null, 2));
          console.log("\u{1F4CA} Match statuses:", rawMatches.map((m) => m.status).join(", "));
          console.log("\u{1F4CA} Match created dates:", rawMatches.map((m) => m.created_at).join(", "));
        } else {
          console.log("\u26A0\uFE0F No raw matches found in the database!");
        }
      } catch (rawMatchError) {
        console.error("\u274C Error fetching raw matches:", rawMatchError);
      }
      const startTime = Date.now();
      try {
        const matchDetails = await storage.getUserMatchesWithDetails(user.id);
        console.log(`Found ${matchDetails.length} matches in ${Date.now() - startTime}ms`);
        if (matchDetails.length === 0) {
          console.log(`No matches found for user ${user.id}`);
          return res.json([]);
        }
        const enrichedMatches = matchDetails.map((match) => {
          try {
            return {
              id: match.match_id,
              matchDate: match.match_date ? new Date(match.match_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              }) : "Unknown date",
              status: match.match_status,
              collaborationType: match.collab_type || "Unknown",
              description: match.collab_description || "",
              details: match.collab_details || {},
              // User information
              matchedPerson: `${match.other_user_first_name || ""} ${match.other_user_last_name || ""}`.trim(),
              companyName: match.company_name || "Unknown Company",
              roleTitle: match.role_title || "Unknown Role",
              companyDescription: match.company_description || "No company description available.",
              username: match.other_user_handle,
              // Additional user information
              linkedinUrl: match.other_user_linkedin_url || null,
              twitterUrl: match.other_user_twitter_url || null,
              // Extract Twitter handle from URL or use null if not available
              twitterHandle: match.other_user_twitter_url ? match.other_user_twitter_url.split("/").pop() : null,
              twitterFollowers: match.other_user_twitter_followers || null,
              email: null,
              // We don't return email for privacy reasons
              note: match.swipe_note || match.match_note || null,
              // Include the personalized note from swipes table
              // Additional company information
              companyWebsite: match.company_website || null,
              companyLinkedinUrl: match.company_linkedin_url || null,
              companyTwitterHandle: match.company_twitter_handle || null,
              companyTwitterFollowers: match.company_twitter_followers || null,
              companyLogoUrl: match.company_logo_url || null,
              // FIX: Add missing company logo URL field mapping
              fundingStage: match.funding_stage || null,
              hasToken: match.has_token || false,
              tokenTicker: match.token_ticker || null,
              blockchainNetworks: match.blockchain_networks || [],
              companyTags: match.company_tags || []
            };
          } catch (error) {
            console.error(`Error formatting match ${match.match_id}:`, error);
            return {
              id: match.match_id,
              matchDate: match.match_date ? new Date(match.match_date).toLocaleDateString("en-US") : "Unknown date",
              status: match.match_status || "Unknown",
              collaborationType: match.collab_type || "Unknown",
              description: "Unable to load full details",
              details: match.collab_details || {},
              matchedPerson: "Unknown",
              companyName: "Unknown Company",
              roleTitle: "Unknown Role",
              companyDescription: "No company description available.",
              userDescription: "No user description available.",
              username: null,
              // Additional user information
              linkedinUrl: null,
              twitterUrl: null,
              twitterHandle: null,
              // Correctly handle null case for Twitter handle
              twitterFollowers: null,
              email: null,
              note: null,
              // Include empty note field in error case
              // Additional company information
              companyWebsite: null,
              companyLinkedinUrl: null,
              companyTwitterHandle: null,
              companyTwitterFollowers: null,
              fundingStage: null,
              hasToken: false,
              tokenTicker: null,
              blockchainNetworks: [],
              companyTags: []
            };
          }
        });
        res.setHeader("Cache-Control", "private, max-age=30");
        const simpleHash = String(enrichedMatches.length) + "-" + Date.now();
        res.setHeader("ETag", `W/"${simpleHash}"`);
        res.setHeader("Last-Modified", (/* @__PURE__ */ new Date()).toUTCString());
        return res.status(200).json(enrichedMatches);
      } catch (fetchError) {
        console.error("Error in matches query:", fetchError);
        console.log("Returning empty array instead of error");
        return res.json([]);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
      return res.json([]);
    }
  });
  app.post("/api/requests", requestLimiter, async (req, res) => {
    console.log("============ DEBUG: Create Request Endpoint ============");
    console.log("Request timestamp:", (/* @__PURE__ */ new Date()).toISOString());
    console.log("Body:", JSON.stringify(req.body, null, 2));
    try {
      const { collaboration_id, request_id, action, is_potential_match, note } = req.body;
      console.log("Parsed request parameters:", { collaboration_id, request_id, action, is_potential_match, note });
      if (action !== "request" && action !== "skip") {
        console.log("Validation error: Invalid action value:", action);
        return res.status(400).json({ error: 'Action must be either "request" or "skip"' });
      }
      if (!collaboration_id && !request_id) {
        console.log("Validation error: Missing required parameters");
        return res.status(400).json({ error: "Either collaboration_id or request_id is required" });
      }
      console.log("Attempting to extract telegram user data from request...");
      const telegramData = getTelegramUserFromRequest2(req);
      if (!telegramData) {
        console.log("Authentication error: No telegram data found in the request");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const telegramId = telegramData.id.toString();
      console.log(`Authentication success: Found Telegram ID: ${telegramId}`);
      console.log(`User details: first_name=${telegramData.first_name}, last_name=${telegramData.last_name || "N/A"}, username=${telegramData.username || "N/A"}`);
      console.log(`Looking up user by Telegram ID: ${telegramId}...`);
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        console.log("Database error: User not found with telegramId:", telegramId);
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`Database success: Found user ${user.id} (${user.first_name} ${user.last_name || ""})`);
      if (is_potential_match && request_id) {
        console.log(`Processing potential match with request ID: ${request_id}`);
        try {
          const [originalRequest] = await db.select({
            request: requests,
            user: users,
            collaboration: collaborations
          }).from(requests).where(eq6(requests.id, request_id)).innerJoin(users, eq6(requests.requester_id, users.id)).innerJoin(collaborations, eq6(requests.collaboration_id, collaborations.id));
          if (!originalRequest) {
            console.log(`Database error: Original request ${request_id} not found`);
            return res.status(404).json({ error: "Original request not found" });
          }
          const actualCollaborationId = originalRequest.collaboration.id;
          const otherUserId = originalRequest.user.id;
          const collaborationType = originalRequest.collaboration.collab_type;
          console.log(`Found original request with collaboration ID: ${actualCollaborationId}`);
          console.log(`Original request was from user ID: ${otherUserId}`);
          if (action === "request") {
            const newRequest = await db.insert(requests).values({
              collaboration_id: actualCollaborationId,
              requester_id: user.id,
              host_id: originalRequest.collaboration.creator_id,
              status: "accepted",
              // Auto-accept since this is a match
              note: note || null
            }).returning();
            console.log(`Success: Created request record with ID: ${newRequest[0].id}`);
            console.log(`Details: request for collaboration ${actualCollaborationId} by user ${user.id}`);
            console.log("MATCH CREATED! Both users made requests.");
            const [collaboration] = await db.select().from(collaborations).where(eq6(collaborations.id, actualCollaborationId));
            console.log("Collaboration details for notification:", {
              id: actualCollaborationId,
              creator_id: collaboration?.creator_id,
              collab_type: collaboration?.collab_type
            });
            const isUserTheHost = user.id === collaboration.creator_id;
            const originalRequesterId = originalRequest.user.id;
            console.log("Match roles:", {
              current_user_id: user.id,
              collaboration_creator_id: collaboration.creator_id,
              original_requester_id: originalRequesterId,
              is_user_the_host: isUserTheHost
            });
            const hostId = isUserTheHost ? user.id : collaboration.creator_id;
            const requesterId = isUserTheHost ? originalRequesterId : user.id;
            console.log("Creating match record with parameters:", {
              collaboration_id: actualCollaborationId,
              host_id: hostId,
              requester_id: requesterId
            });
            const matchNote = note || originalRequest.request.note;
            const match = await storage.createMatch({
              collaboration_id: actualCollaborationId,
              host_id: hostId,
              requester_id: requesterId,
              status: "active",
              host_accepted: true,
              requester_accepted: true,
              note: matchNote
            });
            console.log(`Success: Created match record with ID: ${match.id}`);
            console.log("Database notifications removed - using Telegram notifications only");
            try {
              console.log("Sending enhanced Telegram notifications via notifyMatchCreated function");
              await notifyMatchCreated(hostId, requesterId, actualCollaborationId, matchNote);
              console.log("Enhanced Telegram notifications sent to both users");
            } catch (telegramError) {
              console.error("Error sending Telegram notifications:", telegramError);
              console.error("Full error details:", JSON.stringify(telegramError, null, 2));
            }
            return res.status(201).json({
              request: newRequest[0],
              match: true,
              matchData: match,
              matchedUser: {
                id: originalRequesterId,
                name: `${originalRequest.user.first_name} ${originalRequest.user.last_name || ""}`,
                collaboration: originalRequest.collaboration
              }
            });
          }
          return res.status(201).json({ message: "Request skipped" });
        } catch (matchError) {
          console.error("Error processing potential match:", matchError);
          console.error("Stack trace:", matchError instanceof Error ? matchError.stack : "No stack trace available");
          return res.status(500).json({ error: "Failed to process potential match" });
        }
      } else if (collaboration_id) {
        console.log(`Creating request for collaboration: ${collaboration_id}`);
        let collaboration;
        try {
          collaboration = await storage.getCollaboration(collaboration_id);
          if (!collaboration) {
            console.log(`Database error: Collaboration ${collaboration_id} not found`);
            return res.status(404).json({ error: "Collaboration not found" });
          }
          console.log(`Collaboration verification success: Found type: ${collaboration.collab_type}, status: ${collaboration.status}`);
        } catch (collabError) {
          console.error("Error verifying collaboration:", collabError);
          return res.status(500).json({ error: "Failed to verify collaboration" });
        }
        let requestResult;
        if (action === "request") {
          console.log("Creating request record with parameters:", {
            requester_id: user.id,
            collaboration_id,
            host_id: collaboration.creator_id,
            note
          });
          const newRequest = await db.insert(requests).values({
            collaboration_id,
            requester_id: user.id,
            host_id: collaboration.creator_id,
            status: "pending",
            note: note || null
          }).returning();
          console.log(`Success: Created request record with ID: ${newRequest[0].id}`);
          console.log(`Details: request for collaboration ${collaboration_id} by user ${user.id}`);
          console.log(`Timestamp: ${newRequest[0].created_at}`);
          requestResult = newRequest[0];
        }
        if (action === "request") {
          try {
            const collaboration2 = await storage.getCollaboration(collaboration_id);
            if (collaboration2) {
              await notifyNewCollabRequest(collaboration2.creator_id, user.id, collaboration_id);
              console.log(`\u2705 Sent Telegram notification to host ${collaboration2.creator_id} about new collaboration request`);
              await notifyRequesterRequestSent(user.id, collaboration2.creator_id, collaboration_id, note);
              console.log(`\u2705 Sent Telegram confirmation to requester ${user.id} about collab request sent`);
            }
          } catch (notificationError) {
            console.error("Error sending collaboration request notifications:", notificationError);
          }
        }
        if (action === "request") {
          try {
            const collaboration2 = await storage.getCollaboration(collaboration_id);
            if (!collaboration2) {
              console.log(`Warning: Could not find collaboration ${collaboration_id} when checking for host match`);
              return res.status(201).json(requestResult);
            }
            const hostId = collaboration2.creator_id;
            console.log(`Checking if host (${hostId}) has made requests on any of user's (${user.id}) collaborations`);
            if (hostId === user.id) {
              console.log(`User is the host of this collaboration - no need to check for match`);
              return res.status(201).json(requestResult);
            }
            const userCollaborations = await storage.getUserCollaborations(user.id);
            if (userCollaborations.length === 0) {
              console.log(`User has no collaborations - no match possible`);
              return res.status(201).json(requestResult);
            }
            console.log(`Found ${userCollaborations.length} collaborations for user ${user.id}`);
            const userCollabIds = userCollaborations.map((collab) => collab.id);
            const hostPendingRequests = await db.select().from(requests).where(
              and4(
                eq6(requests.requester_id, hostId),
                inArray4(requests.collaboration_id, userCollabIds),
                eq6(requests.status, "pending")
              )
            );
            console.log(`Found ${hostPendingRequests.length} pending requests from host for user's collaborations`);
            if (hostPendingRequests.length > 0) {
              const matchedCollaboration = hostPendingRequests[0];
              console.log(`MATCH FOUND! Host has made a request on user collaboration ${matchedCollaboration.collaboration_id}`);
              const matchedUserCollab = await storage.getCollaboration(matchedCollaboration.collaboration_id);
              if (!matchedUserCollab) {
                console.log(`Warning: Could not find user's collaboration ${matchedCollaboration.collaboration_id}`);
                return res.status(201).json(requestResult);
              }
              console.log("Creating match record for mutual right swipes with parameters:", {
                collaboration_id: matchedCollaboration.collaboration_id,
                host_id: user.id,
                // In this case, the user is the host of their own collaboration
                requester_id: hostId
                // And the host of the other collaboration is the requester for this match
              });
              const note2 = requestResult.note;
              const match = await storage.createMatch({
                collaboration_id: matchedCollaboration.collaboration_id,
                host_id: user.id,
                requester_id: hostId,
                status: "active",
                host_accepted: true,
                requester_accepted: true,
                note: note2
              });
              console.log(`Success: Created match record with ID: ${match.id}`);
              const userCollabType = matchedUserCollab.collab_type;
              const hostCollabType = collaboration2.collab_type;
              const [hostCompanyInfo] = await db.select().from(companies).where(eq6(companies.user_id, hostId));
              const [userCompanyInfo] = await db.select().from(companies).where(eq6(companies.user_id, user.id));
              console.log("Database notifications removed - using Telegram notifications only");
              try {
                await notifyMatchCreated(user.id, hostId, matchedCollaboration.collaboration_id, note2);
                console.log("Enhanced Telegram match notifications sent to both users");
              } catch (telegramError) {
                console.error("Error sending Telegram match notifications:", telegramError);
              }
              return res.status(201).json({
                request: requestResult,
                match: true,
                matchData: match
              });
            }
          } catch (matchCheckError) {
            console.error("Error checking for potential match:", matchCheckError);
            console.error("Stack trace:", matchCheckError instanceof Error ? matchCheckError.stack : "No stack trace available");
          }
        }
        return res.status(201).json(requestResult || { message: "Request processed successfully" });
      } else {
        console.log("Validation error: Invalid request format");
        return res.status(400).json({ error: "Invalid request format" });
      }
    } catch (error) {
      console.error("Error creating collaboration request:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
      return res.status(500).json({ error: "Failed to create collaboration request" });
    }
  });
  app.post("/api/reset-skipped", async (req, res) => {
    console.log("============ DEBUG: Reset Skipped Requests Endpoint ============");
    console.log("Request timestamp:", (/* @__PURE__ */ new Date()).toISOString());
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    try {
      console.log("Attempting to extract telegram user data from request...");
      const telegramData = getTelegramUserFromRequest2(req);
      if (!telegramData) {
        console.log("Authentication error: No telegram data found in the request");
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log(`Looking up user by Telegram ID: ${telegramData.id}`);
      const user = await storage.getUserByTelegramId(telegramData.id);
      if (!user) {
        console.log(`Database error: User with Telegram ID ${telegramData.id} not found`);
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`Found database user: ${user.id}`);
      const deletedCount = await storage.deleteSkippedRequests(user.id);
      console.log(`Success: Deleted ${deletedCount} skipped requests for user ${user.id}`);
      res.setHeader("X-Reset-Skipped", "true");
      return res.status(200).json({
        success: true,
        deleted_count: deletedCount,
        message: `Successfully reset ${deletedCount} skipped requests`,
        should_clear_local_cache: true
      });
    } catch (error) {
      console.error("Error resetting skipped requests:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
      return res.status(500).json({ error: "Failed to reset skipped requests" });
    }
  });
  app.get("/api/collaboration-requests/summary", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const user = await storage.getUserByTelegramId(telegramUser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const summary = await storage.getCollaborationRequestsSummary(user.id);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching collaboration requests summary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/collaboration-requests", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const user = await storage.getUserByTelegramId(telegramUser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const cursor = req.query.cursor;
      const limit = parseInt(req.query.limit) || 20;
      const filter = req.query.filter || "received";
      const requests2 = await storage.getCollaborationRequests(user.id, { cursor, limit, filter });
      res.json(requests2);
    } catch (error) {
      console.error("Error fetching collaboration requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/api/collaboration-requests/:id/accept", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const user = await storage.getUserByTelegramId(telegramUser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const requestId = req.params.id;
      const result = await storage.acceptCollaborationRequest(user.id, requestId);
      if (result.success) {
        res.json({ success: true, match: result.match });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Error accepting collaboration request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/api/collaboration-requests/:id/hide", async (req, res) => {
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const user = await storage.getUserByTelegramId(telegramUser.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const requestId = req.params.id;
      const result = await storage.hideCollaborationRequest(user.id, requestId);
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      console.error("Error hiding collaboration request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/user-requests", async (req, res) => {
    console.log("============ DEBUG: Get User Requests Endpoint ============");
    console.log("Headers:", req.headers);
    try {
      const telegramUser = getTelegramUserFromRequest2(req);
      if (!telegramUser) {
        console.error("No Telegram user ID found");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const [user] = await db.select().from(users).where(eq6(users.telegram_id, telegramUser.id.toString()));
      if (!user) {
        console.error("User not found in database");
        return res.status(404).json({ error: "User not found" });
      }
      const userRequests = await db.select().from(requests).where(eq6(requests.requester_id, user.id));
      console.log(`Found ${userRequests.length} requests for user ${user.id}`);
      const formattedRequests = userRequests.map((request) => ({
        id: request.id,
        collaboration_id: request.collaboration_id,
        user_id: request.requester_id,
        status: request.status,
        // Use status field instead of action
        created_at: request.created_at,
        note: request.note
      }));
      return res.json(formattedRequests);
    } catch (error) {
      console.error("Failed to fetch user requests:", error);
      return res.status(500).json({
        error: "Failed to fetch user requests",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app.use("/api/referrals", referral_routes_default);
  app.get("/api/test-webhook-alchemy", async (req, res) => {
    console.log("[Webhook Test] Testing webhook for latest Alchemy collaboration");
    try {
      const result = await sendTestWebhookForAlchemy();
      if (result.success) {
        return res.json({
          success: true,
          message: result.message
        });
      } else {
        return res.status(404).json({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      console.error("[Webhook Test] Error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to send test webhook"
      });
    }
  });
  return httpServer;
}

// server/middleware/logger-middleware.ts
function requestLogger(req, res, next) {
  if (config.NODE_ENV === "production" && req.path === "/health") {
    return next();
  }
  if (config.LOG_LEVEL === 0) {
    const errorTrackingStart = Date.now();
    const originalEnd2 = res.end;
    res.end = function(chunk, encoding, callback) {
      res.end = originalEnd2;
      const result = res.end(chunk, encoding, callback);
      if (res.statusCode >= 500) {
        const responseTime = Date.now() - errorTrackingStart;
        logger2.error(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip || req.socket.remoteAddress
        });
      }
      return result;
    };
    return next();
  }
  if (config.LOG_LEVEL !== 4) {
    const staticFileExts = [".js", ".css", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot"];
    const isStaticFile = staticFileExts.some((ext) => req.path.endsWith(ext));
    const isSourceMapFile = req.path.endsWith(".map");
    const isHotUpdate = req.path.includes("hot-update");
    const isViteInternal = req.path.startsWith("/@");
    const isViteDevResource = req.path.includes("node_modules") || req.path.includes("__vite") || req.path.includes("src/") || req.path.includes("client/") || req.path.includes("@fs");
    if (config.LOG_LEVEL <= 1) {
      const isAPIRequest = req.path.startsWith("/api/");
      if (!isAPIRequest) {
        return next();
      }
    } else if (isStaticFile || isSourceMapFile || isHotUpdate || isViteInternal || isViteDevResource) {
      return next();
    }
  }
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(chunk, encoding, callback) {
    res.end = originalEnd;
    const result = res.end(chunk, encoding, callback);
    const responseTime = Date.now() - start;
    const requestData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.socket.remoteAddress
    };
    if (res.statusCode >= 500) {
      logger2.error(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else if (res.statusCode >= 400) {
      logger2.warn(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else if (res.statusCode >= 300) {
      logger2.info(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`, requestData);
    } else {
      logger2.http(`${req.method} ${req.path} ${res.statusCode} in ${responseTime}ms`);
    }
    return result;
  };
  next();
}
function errorLogger(err, req, res, next) {
  logger2.error("Request error", {
    error: {
      message: err.message,
      stack: config.NODE_ENV !== "production" ? err.stack : void 0,
      name: err.name,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip || req.socket.remoteAddress
    }
  });
  next(err);
}

// server/app.ts
var PgSession = connectPg(session);
async function createApp() {
  const app = express2();
  app.set("etag", false);
  app.use((req, res, next) => {
    if (!config.ENABLE_SECURITY_HEADERS) return next();
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://telegram.org https://*.telegram.org https://*.supabase.co; connect-src 'self' https://api.telegram.org https://*.supabase.co; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://telegram.org https://*.telegram.org; upgrade-insecure-requests;"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=()"
    );
    if (config.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
    res.removeHeader("X-Powered-By");
    next();
  });
  app.use(express2.json({ limit: "100kb" }));
  app.use(express2.urlencoded({ extended: false, limit: "100kb" }));
  app.use(
    session({
      store: new PgSession({
        conString: config.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: true
      }),
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1e3,
        path: "/"
      }
    })
  );
  app.get("/api/debug/last-start-error", (_req, res) => {
    res.json({ error: lastStartError ?? null });
  });
  app.post("/api/telegram/webhook", async (req, res) => {
    const pending = [];
    const originalEmit = bot.emit.bind(bot);
    bot.emit = (event, ...args) => {
      const listeners = bot.listeners(event);
      for (const listener of listeners) {
        try {
          const result = listener(...args);
          if (result && typeof result.then === "function") {
            pending.push(
              result.catch(
                (err) => logger2.error(`[Bot] listener for ${event} threw`, err)
              )
            );
          }
        } catch (err) {
          logger2.error(`[Bot] listener for ${event} threw sync`, err);
        }
      }
      return listeners.length > 0;
    };
    try {
      bot.processUpdate(req.body);
      await Promise.all(pending);
    } catch (err) {
      logger2.error("[Bot] processUpdate failed", err);
    } finally {
      bot.emit = originalEmit;
    }
    res.sendStatus(200);
  });
  app.use(requestLogger);
  app.use("/api", apiLimiter);
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Last-Modified", (/* @__PURE__ */ new Date()).toUTCString());
    next();
  });
  const httpServer = await registerRoutes(app);
  app.use(errorLogger);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = config.NODE_ENV === "production" && status === 500 ? "Internal Server Error" : err.message || "Internal Server Error";
    res.status(status).json({
      error: message,
      ...config.NODE_ENV !== "production" && { stack: err.stack }
    });
  });
  return { app, httpServer };
}

// server/vercel-handler.ts
var appPromise = null;
function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { app } = await createApp();
      ensureWebhookConfigured().catch((err) => {
        console.error("[Vercel] ensureWebhookConfigured failed:", err);
      });
      return app;
    })();
  }
  return appPromise;
}
async function handler(req, res) {
  const app = await getApp();
  return app(req, res);
}
export {
  handler as default
};
