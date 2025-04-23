import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { pgTable, text, timestamp, integer, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegram_id: text("telegram_id").unique(),
  first_name: text("first_name"),
  last_name: text("last_name"),
  handle: text("handle"),
  telegram_username: text("telegram_username"),
  is_admin: boolean("is_admin").default(false),
  is_approved: boolean("is_approved").default(false),
  referral_code: text("referral_code"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// User Referrals table for managing generated codes and limits
export const user_referrals = pgTable("user_referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referral_code: text("referral_code").notNull().unique(),
  total_available: integer("total_available").notNull().default(3),
  total_used: integer("total_used").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Referral Events table for tracking each referral usage
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

// Collaborations table
export const collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().defaultRandom(),
  creator_id: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  type: text("type").notNull(),
  date_type: text("date_type").notNull(),
  specific_date: text("specific_date"),
  urgency: text("urgency"),
  details: jsonb("details"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Collaboration Applications table
export const collab_applications = pgTable("collab_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaboration_id: uuid("collaboration_id")
    .notNull()
    .references(() => collaborations.id, { onDelete: "cascade" }),
  applicant_id: uuid("applicant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Swipes table
export const swipes = pgTable("swipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  collaboration_id: uuid("collaboration_id")
    .notNull()
    .references(() => collaborations.id, { onDelete: "cascade" }),
  direction: text("direction").notNull(), // left, right
  details: jsonb("details"),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Matches table
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  collaboration_id: uuid("collaboration_id")
    .notNull()
    .references(() => collaborations.id, { onDelete: "cascade" }),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creator_id: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Notification Preferences table
export const notification_preferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  new_match_notification: boolean("new_match_notification").default(true),
  application_status_notification: boolean("application_status_notification").default(true),
  collaboration_application_notification: boolean("collaboration_application_notification").default(true),
  marketing_notification: boolean("marketing_notification").default(true),
  referral_notification: boolean("referral_notification").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  is_read: boolean("is_read").default(false),
  is_sent: boolean("is_sent").default(false),
  related_id: text("related_id"),
  related_type: text("related_type"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Notifications alias for compatibility
export const collab_notifications = notifications;

// Marketing preferences table
export const marketing_preferences = pgTable("marketing_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email_marketing: boolean("email_marketing").default(false),
  telegram_marketing: boolean("telegram_marketing").default(true),
  product_updates: boolean("product_updates").default(true),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Conference preferences table
export const conference_preferences = pgTable("conference_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  attending_conferences: boolean("attending_conferences").default(false),
  conference_list: text("conference_list").array(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Companies table
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  website: text("website"),
  twitter_handle: text("twitter_handle"),
  logo_url: text("logo_url"),
  tagline: text("tagline"),
  description: text("description"),
  sector: text("sector"),
  blockchain_networks: text("blockchain_networks").array(),
  followers_count: integer("followers_count"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Company Twitter Data table
export const company_twitter_data = pgTable("company_twitter_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  company_id: uuid("company_id").notNull(),
  rest_id: text("rest_id"),
  name: text("name"),
  screen_name: text("screen_name"),
  description: text("description"),
  profile_image_url: text("profile_image_url"),
  followers_count: integer("followers_count"),
  following_count: integer("following_count"),
  tweet_count: integer("tweet_count"),
  listed_count: integer("listed_count"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Create Zod schemas for referral-related operations
export const referralCodeSchema = z.string().regex(/^[0-9]+_[a-f0-9]{8}$/, 
  "Invalid referral code format");

export const createUserReferralSchema = createInsertSchema(user_referrals, {
  referral_code: referralCodeSchema,
});

export const createReferralEventSchema = createInsertSchema(referral_events);

// Create relations
export const usersRelations = relations(users, ({ many, one }) => ({
  collaborations: many(collaborations),
  swipes: many(swipes),
  matches: many(matches),
  notifications: many(notifications),
  referral: one(user_referrals, {
    fields: [users.id],
    references: [user_referrals.user_id],
  }),
  referrals_sent: many(referral_events, {
    relationName: "referrer",
    fields: [users.id],
    references: [referral_events.referrer_id],
  }),
  referrals_received: many(referral_events, {
    relationName: "referred",
    fields: [users.id],
    references: [referral_events.referred_user_id],
  }),
}));

export const userReferralsRelations = relations(user_referrals, ({ one }) => ({
  user: one(users, {
    fields: [user_referrals.user_id],
    references: [users.id],
  }),
}));

export const referralEventsRelations = relations(referral_events, ({ one }) => ({
  referrer: one(users, {
    relationName: "referrer",
    fields: [referral_events.referrer_id],
    references: [users.id],
  }),
  referred_user: one(users, {
    relationName: "referred",
    fields: [referral_events.referred_user_id],
    references: [users.id],
  }),
}));

// Create schemas and types
export const createUserSchema = createInsertSchema(users, {
  telegram_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  handle: z.string().optional(),
  telegram_username: z.string().optional(),
  is_admin: z.boolean().default(false),
  is_approved: z.boolean().default(false),
  referral_code: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof createUserSchema>;

export type UserReferral = typeof user_referrals.$inferSelect;
export type InsertUserReferral = z.infer<typeof createUserReferralSchema>;

export type ReferralEvent = typeof referral_events.$inferSelect;
export type InsertReferralEvent = z.infer<typeof createReferralEventSchema>;

export type Collaboration = typeof collaborations.$inferSelect;
export type CollabApplication = typeof collab_applications.$inferSelect;
export type InsertCollabApplication = z.infer<
  typeof createCollabApplicationSchema
>;

export type Swipe = typeof swipes.$inferSelect;
export type InsertSwipe = z.infer<typeof createSwipeSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof createMatchSchema>;

export type NotificationPreferences = typeof notification_preferences.$inferSelect;
export type CollabNotification = typeof notifications.$inferSelect;
export type InsertCollabNotification = z.infer<typeof createNotificationSchema>;

export type MarketingPreferences = typeof marketing_preferences.$inferSelect;
export type ConferencePreferences = typeof conference_preferences.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof createCompanySchema>;
export type CompanyTwitterData = typeof company_twitter_data.$inferSelect;
export type InsertCollaboration = z.infer<typeof createCollaborationSchema>;

export const createCollaborationSchema = createInsertSchema(collaborations);
export const createCollabApplicationSchema = createInsertSchema(collab_applications);
export const createSwipeSchema = createInsertSchema(swipes);
export const createMatchSchema = createInsertSchema(matches);
export const createNotificationSchema = createInsertSchema(notifications);
export const createCompanySchema = createInsertSchema(companies);