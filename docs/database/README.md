# Database Documentation

The Collab Room uses a PostgreSQL database to store all application data. This document provides information about the database schema, models, and relationships.

## Data Models

The application uses Drizzle ORM with PostgreSQL. Here's an overview of the primary data models:

### Users

The `users` table stores information about registered users:

```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  telegram_id: text('telegram_id').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name'),
  username: text('username'),
  email: text('email'),
  handle: text('handle'),
  job_title: text('job_title'),
  is_admin: boolean('is_admin').default(false).notNull(),
  is_approved: boolean('is_approved').default(false).notNull(),
  linkedin_url: text('linkedin_url'),
  twitter_url: text('twitter_url'),
  twitter_followers: text('twitter_followers'),
  applied_at: timestamp('applied_at', { mode: 'date' }).defaultNow(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
  referral_code: text('referral_code'),
});
```

### Companies

The `companies` table stores information about companies associated with users:

```typescript
export const companies = pgTable('companies', {
  id: text('id').primaryKey().notNull(),
  user_id: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  website: text('website'),
  description: text('description'),
  logo_url: text('logo_url'),
  twitter_handle: text('twitter_handle'),
  twitter_followers: integer('twitter_followers'),
  linkedin_url: text('linkedin_url'),
  category: text('category'),
  size: text('size'),
  funding_stage: text('funding_stage'),
  has_token: boolean('has_token').default(false),
  token_ticker: text('token_ticker'),
  blockchain_networks: text('blockchain_networks').array(),
  tags: text('tags').array(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
});
```

### Collaborations

The `collaborations` table stores collaboration opportunities:

```typescript
export const collaborations = pgTable('collaborations', {
  id: text('id').primaryKey().notNull(),
  user_id: text('user_id').references(() => users.id).notNull(),
  company_id: text('company_id').references(() => companies.id).notNull(),
  type: text('type').notNull(),
  status: text('status').default('pending').notNull(),
  details: jsonb('details').notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});
```

The `details` field uses a JSON structure that varies based on the collaboration type.

### Collaboration Applications

The `collab_applications` table stores applications to collaborations:

```typescript
export const collab_applications = pgTable('collab_applications', {
  id: text('id').primaryKey().notNull(),
  collaboration_id: text('collaboration_id').references(() => collaborations.id).notNull(),
  user_id: text('user_id').references(() => users.id).notNull(),
  company_id: text('company_id').references(() => companies.id).notNull(),
  status: text('status').default('pending').notNull(),
  details: jsonb('details').notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});
```

### Notifications

The `collab_notifications` table stores notifications for users:

```typescript
export const collab_notifications = pgTable('collab_notifications', {
  id: text('id').primaryKey().notNull(),
  user_id: text('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  is_sent: boolean('is_sent').default(false).notNull(),
  related_id: text('related_id'),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
});
```

### Preferences

The application uses multiple tables to store user preferences:

1. `notification_preferences`: User preferences for notifications
2. `marketing_preferences`: Marketing-related preferences including discovery filters
3. `conference_preferences`: Preferences for conference matchmaking

## Schema Validation

The application uses Zod with Drizzle to validate data. For each table, there are corresponding schemas:

```typescript
export const insertUserSchema = createInsertSchema(users);
export const insertCompanySchema = createInsertSchema(companies);
export const insertCollaborationSchema = createInsertSchema(collaborations);
// etc.
```

## Relationships

Key relationships in the database:

1. Each user can have one company profile
2. Users can create multiple collaborations
3. Users can apply to multiple collaborations
4. Each collaboration belongs to a specific user and company
5. Applications link users to collaborations they're interested in

## Database Migrations

The project includes several migration scripts for evolving the database schema:

- `db-migrate-add-description.js`: Adds the 'description' column to collaborations
- `db-migrate-blockchain-networks.js`: Adds blockchain networks related fields
- `db-migrate-collab-fields.js`: Restructures collaboration fields
- `db-migrate-preferences.js`: Updates preference tables

When updating the database schema:

1. Update models in `shared/schema.ts`
2. Create a migration script if needed
3. Run `npm run db:push` to apply changes