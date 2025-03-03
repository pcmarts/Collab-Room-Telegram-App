import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Core user table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegram_id: text('telegram_id').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  handle: text('handle').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Minimal schema without validation
export const userFormSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  handle: z.string(),
  initData: z.string()
});

export type UserFormData = z.infer<typeof userFormSchema>;