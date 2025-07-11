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

### Swipes and Matches

The application implements a Tinder-like swiping system for collaborations:

```typescript
export const swipes = pgTable('swipes', {
  id: text('id').primaryKey().notNull(),
  user_id: text('user_id').references(() => users.id).notNull(),
  collaboration_id: text('collaboration_id').references(() => collaborations.id).notNull(),
  direction: text('direction').notNull(), // 'left' or 'right'
  details: jsonb('details').default({}).notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const matches = pgTable('matches', {
  id: text('id').primaryKey().notNull(),
  collaboration_id: text('collaboration_id').references(() => collaborations.id).notNull(),
  host_id: text('host_id').references(() => users.id).notNull(),
  requester_id: text('requester_id').references(() => users.id).notNull(),
  status: text('status').default('pending').notNull(),
  host_accepted: boolean('host_accepted').default(false),
  requester_accepted: boolean('requester_accepted').default(false),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updated_at: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});
```

The `swipes` table records when a user swipes left or right on a collaboration, while the `matches` table is created when both users have swiped right on each other's collaborations.

#### Note Display in Matches

When users view their matches, the system displays the original collaboration request notes from the swipes table. The `getUserMatchesWithDetails` function uses a SQL JOIN to retrieve these notes:

```sql
-- Join matches with swipes to get original collaboration request notes
LEFT JOIN swipes s ON (
  s.collaboration_id = m.collaboration_id 
  AND s.user_id = m.requester_id -- Note from the person who made the collaboration request
  AND s.direction = 'right'
)
```

This ensures that when viewing matches, users see the personalized messages that were sent with the original collaboration requests.

## Relationships

Key relationships in the database:

1. Each user can have one company profile
2. Users can create multiple collaborations
3. Users can apply to multiple collaborations
4. Each collaboration belongs to a specific user and company
5. Applications link users to collaborations they're interested in
6. Users can swipe on multiple collaborations (recorded in the swipes table)
7. When both users swipe right on each other's collaborations, a match is created
8. Each match connects a host (collaboration creator) with a requester (user who swiped right)

## Database Migrations

The project includes several migration scripts for evolving the database schema:

- `db-migrate-add-indexes.js`: Adds database indexes for query optimization
- `db-migrate-add-description.js`: Adds the 'description' column to collaborations
- `db-migrate-add-note-to-swipes-matches.js`: Adds note column to swipes and matches tables
- `db-migrate-add-twitter-rest-id.js`: Adds Twitter REST ID field
- `db-migrate-add-details-to-swipes.js`: Adds the 'details' JSON column to the swipes table
- `db-migrate-blockchain-networks.js`: Adds blockchain networks related fields
- `db-migrate-blockchain-filters.js`: Adds blockchain filter fields
- `db-migrate-collab-fields.js`: Restructures collaboration fields
- `db-migrate-preferences.js`: Updates preference tables
- `db-migrate-referral-system.js`: Adds referral tables and fields
- `db-migrate-twitter-profiles.js`: Adds company_twitter_data table
- `db-migrate-fix-matches-table.js`: Drops and recreates the matches table with correct foreign key references

### Recent Database Optimizations

#### Performance Testing and Measurement (v1.9.5)

In version 1.9.5, we conducted comprehensive performance testing of the database indexes implemented in v1.9.4:

- Measured query execution time reduction from ~40ms to ~20ms (50% improvement)
- Created performance test utility (`test-query-performance.js`) for benchmarking database operations
- Documented query execution patterns and optimizations for future reference
- Verified real-world performance improvements in the discovery cards feature

For detailed benchmark results and performance analysis, see [Database Indexing for Discovery Cards](../discovery/database-indexing.md).

#### Database Indexing (v1.9.4)

In version 1.9.4, strategic database indexes were added to improve query performance, particularly for the discovery cards functionality:

- Indexes for key join columns: `users.id`, `companies.user_id`, `collaborations.creator_id`
- Index on `collaborations.created_at` for improved pagination performance
- Composite indexes for frequently used query patterns, such as `swipes.user_id + swipes.collaboration_id`
- Indexes on filter fields to optimize the performance of frequently used filter operations

For detailed information about the database indexing strategy, see [Database Indexing for Discovery Cards](../discovery/database-indexing.md).

#### Table Cleanup (v1.3.1)

In version 1.3.1, the redundant `match_requests` table was removed from the database as it was not being used by the application. The table contained no data and had no code references. All matching functionality is properly handled by the `matches` table, which tracks relationships between hosts and requesters.

### Database Update Process

When updating the database schema:

1. Update models in `shared/schema.ts`
2. Create a migration script if needed (see examples in project root)
3. Run `npm run db:push` to apply changes

For database indexing, use the `index` function from `drizzle-orm/pg-core` within table definitions to create appropriate indexes.