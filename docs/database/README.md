# Database Schema and Data Models

## Overview

Collab Room uses PostgreSQL as its primary database, with Drizzle ORM for database interactions. The database schema is defined in `shared/schema.ts` and is used by both the client and server for type safety and validation.

## Entity-Relationship Diagram

```
┌──────────────┐       ┌───────────────┐       ┌─────────────────────┐
│    users     │       │   companies   │       │   collaborations    │
├──────────────┤       ├───────────────┤       ├─────────────────────┤
│ id           │───┐   │ id            │       │ id                  │
│ telegram_id  │   └──►│ user_id       │       │ creator_id          │◄─┐
│ first_name   │       │ name          │       │ title               │  │
│ last_name    │       │ short_desc    │       │ collab_type         │  │
│ handle       │       │ long_desc     │       │ description         │  │
│ linkedin_url │       │ website       │       │ details             │  │
│ email        │       │ job_title     │       │ status              │  │
│ twitter_url  │       │ twitter_handle│       │ availability        │  │
│ twitter_foll │       │ twitter_foll  │       │ specific_date       │  │
│ is_approved  │       │ linkedin_url  │       └─────────────────────┘  │
│ is_admin     │       │ funding_stage │                                │
│ applied_at   │       │ has_token     │                                │
│ created_at   │       │ token_ticker  │                                │
└──────────────┘       │ blockchain_net│                                │
        ▲              │ tags          │                                │
        │              │ created_at    │                                │
        │              └───────────────┘                                │
        │                                                               │
        │                                                               │
        │              ┌─────────────────────┐                          │
        │              │  collab_applications│                          │
        │              ├─────────────────────┤                          │
        └──────────────│ applicant_id        │                          │
                       │ collaboration_id    │◄─────────────────────────┘
                       │ status              │
                       │ message             │
                       │ created_at          │
                       │ updated_at          │
                       └─────────────────────┘
                                ▲
                                │
                                │
                       ┌─────────────────────┐
                       │ collab_notifications│
                       ├─────────────────────┤
                       │ id                  │
                       │ user_id             │◄────────────────────────┐
                       │ collaboration_id    │◄───────────────┐        │
                       │ application_id      │◄─────────┐     │        │
                       │ type                │          │     │        │
                       │ content             │          │     │        │
                       │ is_read             │          │     │        │
                       │ is_sent             │          │     │        │
                       │ created_at          │          │     │        │
                       └─────────────────────┘          │     │        │
                                                        │     │        │
                                                        │     │        │
                                                        │     │        │
┌────────────────┐    ┌────────────────┐    ┌────────────────┐        │
│notification_pref│    │marketing_pref  │    │conference_pref │        │
├────────────────┤    ├────────────────┤    ├────────────────┤        │
│id              │    │id              │    │id              │        │
│user_id         │◄───┤user_id         │◄───┤user_id         │◄───────┘
│frequency       │    │collab_discover │    │conf_match_enab │
│collab_applied  │    │collab_host     │    │wants_to_meet   │
│collab_accepted │    │twitter_collabs │    │company_types   │
│created_at      │    │marketing_topics│    │created_at      │
└────────────────┘    │twitter_follower│    └────────────────┘
                      │company_twitter │
                      │funding_stage   │
                      │has_token       │
                      │token_ticker    │
                      └────────────────┘
```

## Main Tables

### users

This table stores information about users in the system.

| Column          | Type      | Description                       |
|-----------------|-----------|-----------------------------------|
| id              | uuid      | Primary key                       |
| telegram_id     | text      | Unique Telegram user ID           |
| first_name      | text      | User's first name                 |
| last_name       | text      | User's last name (optional)       |
| handle          | text      | User's handle/username            |
| linkedin_url    | text      | LinkedIn profile URL (optional)   |
| email           | text      | User's email address (optional)   |
| referral_code   | text      | Referral code (optional)          |
| twitter_url     | text      | Twitter profile URL (optional)    |
| twitter_followers| text     | Number of Twitter followers       |
| is_approved     | boolean   | Whether user is approved          |
| is_admin        | boolean   | Whether user is an admin          |
| applied_at      | timestamp | When user applied                 |
| created_at      | timestamp | When user was created             |

### companies

This table stores information about companies associated with users.

| Column           | Type       | Description                           |
|------------------|------------|---------------------------------------|
| id               | uuid       | Primary key                           |
| user_id          | uuid       | Foreign key to users table            |
| name             | text       | Company name                          |
| short_description| text       | Brief description (optional)          |
| long_description | text       | Detailed description (optional)       |
| website          | text       | Company website                       |
| job_title        | text       | User's job title                      |
| twitter_handle   | text       | Company Twitter handle (optional)     |
| twitter_followers| text       | Company Twitter followers (optional)  |
| linkedin_url     | text       | Company LinkedIn URL (optional)       |
| funding_stage    | text       | Funding stage                         |
| has_token        | boolean    | Whether company has a token           |
| token_ticker     | text       | Token ticker symbol (optional)        |
| blockchain_networks| text[]   | Blockchain networks (optional)        |
| tags             | text[]     | Company tags                          |
| created_at       | timestamp  | When company was created              |

### collaborations

This table stores information about collaboration opportunities.

| Column          | Type      | Description                          |
|-----------------|-----------|--------------------------------------|
| id              | uuid      | Primary key                          |
| creator_id      | uuid      | Foreign key to users table           |
| title           | text      | Collaboration title                  |
| collab_type     | text      | Type of collaboration                |
| description     | text      | Collaboration description            |
| details         | jsonb     | Detailed information (JSON)          |
| status          | text      | Status of collaboration              |
| availability    | text      | Availability for collaboration       |
| specific_date   | text      | Specific date if required (optional) |
| created_at      | timestamp | When collaboration was created       |
| updated_at      | timestamp | When collaboration was last updated  |

### collab_applications

This table stores applications for collaborations.

| Column          | Type      | Description                          |
|-----------------|-----------|--------------------------------------|
| id              | uuid      | Primary key                          |
| collaboration_id| uuid      | Foreign key to collaborations table  |
| applicant_id    | uuid      | Foreign key to users table           |
| status          | text      | Application status                   |
| message         | text      | Application message (optional)       |
| created_at      | timestamp | When application was created         |
| updated_at      | timestamp | When application was last updated    |

## Additional Tables

- `collab_notifications`: Notifications for collaboration activities
- `notification_preferences`: User notification preferences
- `marketing_preferences`: User marketing preferences
- `conference_preferences`: User conference preferences
- `events`: Blockchain industry events and conferences
- `user_events`: Junction table for users attending events
- `swipes`: User swipe actions in the discovery interface

## Schema Definition

The database schema is defined using Drizzle ORM in `shared/schema.ts`. This allows for type-safe database operations and seamless integration between the client and server.

Example schema definition:

```typescript
// User information
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegram_id: text('telegram_id').notNull().unique(),
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
  applied_at: timestamp('applied_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});
```

## Type Definitions

For each database table, there are corresponding TypeScript type definitions:

```typescript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

These types are used throughout the application to ensure type safety and consistency.