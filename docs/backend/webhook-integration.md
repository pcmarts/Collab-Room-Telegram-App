# Webhook Integration Documentation

## Overview

The collaboration platform automatically sends webhooks to external services when new collaborations are created. This enables real-time integration with external workflows and automation systems.

## Implementation

### Webhook Utility (`server/utils/webhook.ts`)

The webhook system is implemented as a standalone utility that:
- Fetches complete collaboration details including company and creator information
- Formats data into a standardized payload
- Sends HTTP POST requests to configured webhook endpoints
- Handles errors gracefully without disrupting the main collaboration creation flow

### Integration Point

Webhooks are triggered in the collaboration creation endpoint (`POST /api/collaborations`) immediately after:
1. Collaboration is successfully created in the database
2. User notifications are sent
3. Admin notifications are sent

The webhook call is non-blocking and will not cause collaboration creation to fail if the webhook endpoint is unavailable.

## Webhook Payload Structure

```json
{
  "collaboration_id": "string",
  "collab_type": "string",
  "collab_description": "string", 
  "collab_date": "string|null",
  "collab_date_type": "string",
  "collab_details": "object",
  "company_name": "string",
  "company_twitter_url": "string",
  "company_twitter_handle": "string",
  "company_linkedin_url": "string",
  "company_logo_url": "string",
  "creator_name": "string",
  "created_at": "string"
}
```

### Field Descriptions

- `collaboration_id`: Unique identifier for the collaboration
- `collab_type`: Type of collaboration (e.g., "Co-Marketing on Twitter", "Podcast Guest Appearance")
- `collab_description`: Description provided by the creator
- `collab_date`: Specific date if set, null for flexible timing
- `collab_date_type`: Either "specific_date" or "any_future_date"
- `collab_details`: Type-specific details object (varies by collaboration type)
- `company_name`: Name of the company creating the collaboration
- `company_twitter_url`: Full Twitter URL (https://x.com/handle)
- `company_twitter_handle`: Twitter handle without @ symbol
- `company_linkedin_url`: LinkedIn company page URL
- `company_logo_url`: URL to company logo image
- `creator_name`: Full name of the user who created the collaboration
- `created_at`: ISO timestamp of collaboration creation

## Configuration

### Webhook URL

The webhook endpoint is currently configured in the `sendCollaborationWebhook` function:

```typescript
const webhookUrl = 'https://paulsworkspace.app.n8n.cloud/webhook/1d92b7d4-9a9b-4211-bc0a-53dc8d4c5aaa';
```

### Timeout and Error Handling

- HTTP timeout: 10 seconds
- Errors are logged but do not interrupt collaboration creation
- Failed webhooks do not retry automatically

## Testing

### Test Endpoint

A test endpoint is available at `/api/test-webhook-alchemy` that:
- Finds the latest collaboration created by Alchemy
- Sends a webhook with that collaboration's data
- Returns success/failure status

### Manual Testing

```bash
curl -X GET http://localhost:5000/api/test-webhook-alchemy
```

Expected response:
```json
{
  "success": true,
  "message": "Test webhook sent for Alchemy collaboration [collaboration-id]"
}
```

## Example Payload

```json
{
  "collaboration_id": "1cd3126a-a4ac-4cab-adbd-012fb25bf59a",
  "collab_type": "Co-Marketing on Twitter",
  "collab_description": "We're launching something super exciting next Thursday, would love for retweets and quote tweets!",
  "collab_date": "2025-08-01",
  "collab_date_type": "specific_date",
  "collab_details": {
    "host_follower_count": "100K-500K",
    "host_twitter_handle": "https://x.com/Alchemy",
    "twittercomarketing_type": [
      "Thread Collab",
      "Exclusive Announcement", 
      "Retweet & Boost"
    ]
  },
  "company_name": "Alchemy",
  "company_twitter_url": "https://x.com/Alchemy",
  "company_twitter_handle": "Alchemy",
  "company_linkedin_url": "https://linkedin.com/alchemy/",
  "company_logo_url": "https://gunifdyywvzgntaubezl.supabase.co/storage/v1/object/public/logos//Alchemy_sd.jpg",
  "creator_name": "Mihir C",
  "created_at": "2025-07-25T15:11:48.000Z"
}
```

## Future Enhancements

Potential improvements include:
- Configurable webhook URLs via environment variables
- Webhook retry logic with exponential backoff
- Webhook delivery status tracking
- Multiple webhook endpoints support
- Webhook payload customization options