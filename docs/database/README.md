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

### Collaboration Requests (Unified System)

**⚠️ IMPORTANT: As of v1.10.19 (2025-07-13), the legacy `swipes` and `matches` tables have been permanently deleted and replaced with a unified `requests` table.**

The application implements a Tinder-like swiping system for collaborations using a unified requests table:

```typescript
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
});
```

#### Request Status Types

The unified requests table handles all user interactions with collaborations:

- **`pending`**: Right swipe (collaboration request) awaiting host decision
- **`accepted`**: Mutual match - both users interested in collaboration
- **`hidden`**: Request hidden by host (declined)
- **`skipped`**: Left swipe (passed on collaboration)

#### System Benefits

The unified system provides several advantages over the legacy dual-table approach:

1. **Data Consistency**: All user interactions stored in single table eliminates synchronization issues
2. **Simplified Queries**: No complex JOINs between swipes and matches tables
3. **Better Performance**: Single table queries with proper indexing
4. **Easier Maintenance**: One source of truth for all collaboration interactions

#### Note Display in Matches

When users view their matches, the system displays the original collaboration request notes from the `note` field in the requests table. Only `accepted` status requests appear as matches:

```sql
-- Get matches with notes from unified requests table
SELECT * FROM requests 
WHERE status = 'accepted' 
  AND (host_id = ${userId} OR requester_id = ${userId})
ORDER BY created_at DESC;
```

This ensures that when viewing matches, users see the personalized messages that were sent with the original collaboration requests, now stored directly in the unified requests table.

## Relationships

Key relationships in the database:

1. Each user can have one company profile
2. Users can create multiple collaborations
3. Users can apply to multiple collaborations
4. Each collaboration belongs to a specific user and company
5. Applications link users to collaborations they're interested in
6. Users can create requests for collaborations (recorded in the unified requests table)
7. When a host accepts a request, the status changes to 'accepted' creating a match
8. Each request connects a host (collaboration creator) with a requester (user who made the request)

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

#### Legacy Table Migration (v1.10.19)

In version 1.10.19, a major database restructuring was completed that unified the swipe and match system:

**Migration Overview:**
- **185 swipes** and **12 matches** successfully migrated from legacy `swipes` and `matches` tables to unified `requests` table
- Legacy table data preserved with original timestamps and proper status mapping
- Data integrity validated to ensure no loss of user interaction history

**Legacy Status Mapping:**
- Legacy right swipes → `pending` status requests
- Legacy left swipes → `skipped` status requests  
- Legacy matches → `accepted` status requests
- Legacy declined matches → `hidden` status requests

**Post-Migration Cleanup:**
- Legacy `swipes` and `matches` tables permanently deleted from database
- All schema references and imports updated throughout codebase
- API endpoints converted to use unified requests table
- Database queries optimized for single-table operations

**Benefits Achieved:**
- Eliminated data consistency issues between separate swipe and match tables
- Improved query performance with single-table operations
- Simplified maintenance with unified data structure
- Resolved discover page anomalies where users had match status but missing request data

For technical details on the migration process, see `scripts/migrate-legacy-data.ts`.

#### Table Cleanup (v1.3.1)

In version 1.3.1, the redundant `match_requests` table was removed from the database as it was not being used by the application. The table contained no data and had no code references. All matching functionality is properly handled by the `matches` table, which tracks relationships between hosts and requesters.

### Database Update Process

When updating the database schema:

1. Update models in `shared/schema.ts`
2. Create a migration script if needed (see examples in project root)
3. Run `npm run db:push` to apply changes

For database indexing, use the `index` function from `drizzle-orm/pg-core` within table definitions to create appropriate indexes.