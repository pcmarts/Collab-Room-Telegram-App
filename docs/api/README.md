# API Documentation

## Overview

Collab Room provides a RESTful API for interaction between the client and server. All API endpoints are prefixed with `/api/` and follow standard RESTful conventions.

## Authentication

Authentication is handled via Telegram WebApp. The user's Telegram information is passed in the `x-telegram-init-data` header, which is validated by the server.

## API Endpoints

### Profile Management

#### GET /api/profile

Retrieves the user's profile information.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "telegram_id": "string",
    "first_name": "string",
    "last_name": "string",
    "handle": "string",
    "linkedin_url": "string",
    "email": "string",
    "twitter_url": "string",
    "twitter_followers": "string",
    "is_approved": boolean,
    "is_admin": boolean,
    "applied_at": "timestamp",
    "created_at": "timestamp"
  },
  "company": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "string",
    "short_description": "string",
    "long_description": "string",
    "website": "string",
    "job_title": "string",
    "twitter_handle": "string",
    "twitter_followers": "string",
    "linkedin_url": "string",
    "funding_stage": "string",
    "has_token": boolean,
    "token_ticker": "string",
    "blockchain_networks": ["string"],
    "tags": ["string"],
    "created_at": "timestamp"
  },
  "notificationPreferences": {
    "id": "uuid",
    "user_id": "uuid",
    "frequency": "string",
    "collab_applied": boolean,
    "collab_accepted": boolean,
    "created_at": "timestamp"
  },
  "marketingPreferences": {
    "id": "uuid",
    "user_id": "uuid",
    "collabs_to_discover": ["string"],
    "collabs_to_host": ["string"],
    "twitter_collabs": ["string"],
    "filtered_marketing_topics": ["string"],
    "twitter_followers": "string",
    "company_twitter_followers": "string",
    "funding_stage": "string",
    "company_has_token": boolean,
    "company_token_ticker": "string",
    "company_blockchain_networks": ["string"],
    "company_tags": ["string"],
    "created_at": "timestamp"
  },
  "conferencePreferences": {
    "id": "uuid",
    "user_id": "uuid",
    "wants_to_meet": ["string"],
    "company_types": ["string"],
    "created_at": "timestamp"
  }
}
```

#### POST /api/onboarding

Creates a new user profile during the onboarding process.

**Request Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "handle": "string",
  "linkedin_url": "string",
  "email": "string",
  "twitter_url": "string",
  "twitter_followers": "string",
  "referral_code": "string"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid"
}
```

#### POST /api/company

Creates or updates a company profile.

**Request Body:**
```json
{
  "name": "string",
  "short_description": "string",
  "long_description": "string",
  "website": "string",
  "job_title": "string",
  "twitter_handle": "string",
  "twitter_followers": "string",
  "linkedin_url": "string",
  "funding_stage": "string",
  "has_token": boolean,
  "token_ticker": "string",
  "blockchain_networks": ["string"],
  "tags": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "companyId": "uuid"
}
```

### Collaboration Management

#### GET /api/collaborations/my

Retrieves the user's collaborations.

**Response:**
```json
[
  {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "string",
    "collab_type": "string",
    "description": "string",
    "details": { ... },
    "status": "string",
    "availability": "string",
    "specific_date": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### POST /api/collaborations

Creates a new collaboration.

**Request Body:**
```json
{
  "title": "string",
  "collab_type": "string",
  "description": "string",
  "details": { ... },
  "availability": "string",
  "specific_date": "string"
}
```

**Response:**
```json
{
  "success": true,
  "collaboration": {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "string",
    "collab_type": "string",
    "description": "string",
    "details": { ... },
    "status": "string",
    "availability": "string",
    "specific_date": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

#### GET /api/collaborations/search

Searches for collaborations based on filters.

**Query Parameters:**
- `collabTypes`: Array of collaboration types
- `companyTags`: Array of company tags
- `minCompanyFollowers`: Minimum company Twitter followers
- `minUserFollowers`: Minimum user Twitter followers
- `hasToken`: Boolean indicating if company has a token
- `fundingStages`: Array of funding stages
- `blockchainNetworks`: Array of blockchain networks

**Response:**
```json
[
  {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "string",
    "collab_type": "string",
    "description": "string",
    "details": { ... },
    "status": "string",
    "availability": "string",
    "specific_date": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### POST /api/collaborations/:id/apply

Applies to a collaboration.

**Request Body:**
```json
{
  "message": "string",
  "applicationData": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "applicationId": "uuid"
}
```

### Discovery System

#### GET /api/discovery/cards

Retrieves collaboration cards for the discovery interface.

**Response:**
```json
[
  {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "string",
    "collab_type": "string",
    "description": "string",
    "details": { ... },
    "status": "string",
    "availability": "string",
    "specific_date": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### POST /api/swipes

Records a user's swipe action.

**Request Body:**
```json
{
  "collaboration_id": "uuid",
  "direction": "string" // "left" or "right"
}
```

**Response:**
```json
{
  "success": true,
  "swipeId": "uuid"
}
```

#### POST /api/swipes/undo

Undoes the last swipe action.

**Response:**
```json
{
  "success": true
}
```

### Preferences Management

#### GET /api/marketing-preferences

Retrieves the user's marketing preferences.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "collabs_to_discover": ["string"],
  "collabs_to_host": ["string"],
  "twitter_collabs": ["string"],
  "filtered_marketing_topics": ["string"],
  "twitter_followers": "string",
  "company_twitter_followers": "string",
  "funding_stage": "string",
  "company_has_token": boolean,
  "company_token_ticker": "string",
  "company_blockchain_networks": ["string"],
  "company_tags": ["string"],
  "discovery_filter_enabled": boolean,
  "discovery_filter_collab_types_enabled": boolean,
  "discovery_filter_topics_enabled": boolean,
  "discovery_filter_company_followers_enabled": boolean,
  "discovery_filter_user_followers_enabled": boolean,
  "discovery_filter_funding_stages_enabled": boolean,
  "discovery_filter_token_status_enabled": boolean,
  "discovery_filter_company_sectors_enabled": boolean,
  "discovery_filter_blockchain_networks_enabled": boolean,
  "created_at": "timestamp"
}
```

#### POST /api/marketing-preferences

Updates the user's marketing preferences.

**Request Body:**
```json
{
  "collabs_to_discover": ["string"],
  "collabs_to_host": ["string"],
  "twitter_collabs": ["string"],
  "filtered_marketing_topics": ["string"],
  "twitter_followers": "string",
  "company_twitter_followers": "string",
  "funding_stage": "string",
  "company_has_token": boolean,
  "company_token_ticker": "string",
  "company_blockchain_networks": ["string"],
  "company_tags": ["string"],
  "discovery_filter_enabled": boolean,
  "discovery_filter_collab_types_enabled": boolean,
  "discovery_filter_topics_enabled": boolean,
  "discovery_filter_company_followers_enabled": boolean,
  "discovery_filter_user_followers_enabled": boolean,
  "discovery_filter_funding_stages_enabled": boolean,
  "discovery_filter_token_status_enabled": boolean,
  "discovery_filter_company_sectors_enabled": boolean,
  "discovery_filter_blockchain_networks_enabled": boolean
}
```

**Response:**
```json
{
  "success": true,
  "preferences": { ... }
}
```

### Notification Management

#### GET /api/notifications

Retrieves the user's notifications.

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "collaboration_id": "uuid",
    "application_id": "uuid",
    "type": "string",
    "content": "string",
    "is_read": boolean,
    "is_sent": boolean,
    "created_at": "timestamp"
  }
]
```

#### PATCH /api/notifications/:id/read

Marks a notification as read.

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "user_id": "uuid",
    "collaboration_id": "uuid",
    "application_id": "uuid",
    "type": "string",
    "content": "string",
    "is_read": true,
    "is_sent": boolean,
    "created_at": "timestamp"
  }
}
```

### Admin Endpoints

#### POST /api/admin/impersonate

Allows an admin to impersonate another user.

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /api/admin/stop-impersonation

Stops impersonating a user.

**Response:**
```json
{
  "success": true
}
```

### Network Statistics

#### GET /api/network-stats

Retrieves network statistics.

**Response:**
```json
{
  "users": number,
  "collaborations": number
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

Common status codes:
- `200 OK`: Request was successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error