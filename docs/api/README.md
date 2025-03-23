# API Documentation

The Collab Room exposes a RESTful API for frontend-backend communication. This document describes the available endpoints, their purpose, and usage.

## Authentication

All API endpoints use Telegram WebApp authentication. The Telegram user data is sent in the `x-telegram-init-data` header, which is verified by the backend.

In development mode, a fallback user is provided for testing purposes.

## API Endpoints

### User Management

#### `GET /api/profile`

Retrieves the current user's profile information.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "first_name": "First",
    "last_name": "Last",
    "is_admin": false,
    "is_approved": true,
    // Other user fields
  },
  "company": {
    "id": "company-id",
    "name": "Company Name",
    "website": "https://example.com",
    // Other company fields
  },
  "notificationPreferences": {
    // Notification preferences
  },
  "marketingPreferences": {
    // Marketing preferences
  },
  "conferencePreferences": {
    // Conference preferences
  }
}
```

#### `POST /api/onboarding`

Creates a new user during the onboarding process.

**Request Body:**
```json
{
  "first_name": "First",
  "last_name": "Last",
  "email": "user@example.com",
  "job_title": "Developer",
  "linkedin_url": "https://linkedin.com/in/user",
  "twitter_url": "https://twitter.com/user",
  "twitter_followers": "1000-5000",
  "referral_code": "REFCODE123"
}
```

### Company Management

#### `POST /api/company`

Creates or updates a company profile.

**Request Body:**
```json
{
  "name": "Company Name",
  "website": "https://example.com",
  "description": "Company description",
  "twitter_handle": "company",
  "twitter_followers": 5000,
  "linkedin_url": "https://linkedin.com/company/name",
  "category": "Technology",
  "size": "1-10",
  "funding_stage": "Seed",
  "has_token": true,
  "token_ticker": "TKN",
  "blockchain_networks": ["Ethereum", "Solana"],
  "tags": ["DeFi", "NFT"]
}
```

### Collaboration Management

#### `GET /api/collaborations/my`

Retrieves collaborations created by the current user.

**Response:**
```json
[
  {
    "id": "collab-id",
    "type": "podcast",
    "status": "active",
    "details": {
      // Collaboration-specific details
    },
    "description": "Collaboration description",
    "created_at": "2025-03-22T12:00:00Z",
    // Other fields
  }
]
```

#### `GET /api/collaborations/search`

Searches for collaborations based on filter criteria.

**Query Parameters:**
- `collabTypes`: Types of collaborations to include
- `companyTags`: Company tags to filter by
- `minCompanyFollowers`: Minimum company Twitter followers
- `minUserFollowers`: Minimum user Twitter followers
- `hasToken`: Filter by token status
- `fundingStages`: Filter by funding stages
- `blockchainNetworks`: Filter by blockchain networks
- `excludeOwn`: Boolean flag to control whether to exclude the user's own collaborations (defaults to true)

**Response:**
```json
[
  {
    "id": "collab-id",
    "type": "podcast",
    "status": "active",
    "details": {
      // Collaboration-specific details
    },
    "description": "Collaboration description",
    "created_at": "2025-03-22T12:00:00Z",
    // Other fields
  }
]
```

#### `POST /api/collaborations`

Creates a new collaboration.

**Request Body:**
```json
{
  "type": "podcast",
  "details": {
    // Collaboration-specific details
  },
  "description": "Collaboration description"
}
```

#### `POST /api/collaborations/:id/apply`

Applies to a collaboration.

**Request Body:**
```json
{
  "details": {
    "reason": "Application reason",
    "availability": "Available times",
    // Other application details
  }
}
```

#### `GET /api/potential-matches`

Retrieves potential matches for the current user. These are users who have already swiped right on the user's collaborations.

**Response:**
```json
[
  {
    "id": "swipe-id",
    "user_id": "user-id",
    "collaboration_id": "collab-id",
    "swipe_direction": "right",
    "user_first_name": "First",
    "user_last_name": "Last",
    "user_twitter_followers": "1000-5000",
    "company_name": "Company",
    "company_job_title": "Job Title",
    "company_twitter_followers": "5000-10000",
    "collaboration_type": "Twitter Spaces Guest",
    "collaboration_description": "Description of the collaboration"
  }
]
```

#### `POST /api/swipes`

Records a user's swipe action on a collaboration or a potential match.

**Request Body for a Regular Collaboration:**
```json
{
  "collaboration_id": "collab-id",
  "direction": "left" | "right"
}
```

**Request Body for a Potential Match:**
```json
{
  "swipe_id": "original-swipe-id",
  "direction": "left" | "right",
  "is_potential_match": true
}
```

**Response:**
```json
{
  "swipe": {
    "id": "swipe-id",
    "user_id": "user-id",
    "collaboration_id": "collab-id",
    "direction": "left" | "right",
    "details": {},
    "created_at": "2025-03-22T12:00:00Z"
  },
  "match": {
    "id": "match-id",
    "collaboration_id": "collab-id",
    "host_id": "host-user-id",
    "requester_id": "requester-user-id",
    "status": "pending",
    "created_at": "2025-03-22T12:00:00Z"
  }
}
```

The `match` field is only included when both users have swiped right on each other's collaborations, creating a match. When a match is created, both users will also receive a notification through the Telegram bot.

### Notification Management

#### `GET /api/notifications`

Retrieves notifications for the current user.

**Response:**
```json
[
  {
    "id": "notification-id",
    "type": "application",
    "title": "New Application",
    "message": "Someone applied to your collaboration",
    "is_read": false,
    "created_at": "2025-03-22T12:00:00Z",
    // Other fields
  }
]
```

#### `PATCH /api/notifications/:id/read`

Marks a notification as read.

### Network Statistics

#### `GET /api/network-stats`

Retrieves network statistics.

**Response:**
```json
{
  "users": 100,
  "collaborations": 50
}
```

### Administrative Endpoints

#### `POST /api/admin/impersonate`

Allows administrators to impersonate other users for testing and support.

#### `POST /api/admin/stop-impersonation`

Stops impersonating another user.

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a JSON body with an error message:

```json
{
  "error": "Error message"
}
```

## API Implementation

The API endpoints are implemented in `server/routes.ts` and use the storage interface defined in `server/storage.ts` to perform operations on the database.