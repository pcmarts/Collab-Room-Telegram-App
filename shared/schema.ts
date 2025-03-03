import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegram_id: text('telegram_id').unique(),
  name: text('name').notNull(),
  handle: text('handle'),
  profile_info: jsonb('profile_info'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  website: text('website').notNull(),
  logo_url: text('logo_url'),
  industry: text('industry'),
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

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Collaboration = typeof collaborations.$inferSelect;
export type UserCompanyRelation = typeof userCompanyRelations.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
export type InsertUserCompanyRelation = z.infer<typeof insertUserCompanyRelationSchema>;
