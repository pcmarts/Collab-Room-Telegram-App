# Documentation Index

## Troubleshooting Guides

### UI & Frontend Issues
- **[Company Logo Loading Issues](./troubleshooting/company-logos.md)** - Complete guide for fixing company logos not displaying (CSP, backend APIs, field mappings)

## AI Assistant Guides

### Quick Fix References
- **[Logo Loading Fix](./ai-assistant-guides/logo-loading-fix.md)** - Quick reference for AI assistants to identify and fix company logo loading issues

## Component Documentation

### UI Components
- **LogoAvatar** (`client/src/components/ui/logo-avatar.tsx`) - Displays company/user logos with fallback handling
- **CollaborationListItem** (`client/src/components/CollaborationListItem.tsx`) - Shows collaboration cards with company logos
- **RequestsManagementTab** (`client/src/components/requests-management-tab.tsx`) - Manages collaboration requests with company logos

## API Documentation

### Storage & Database
- **Search APIs** (`server/storage.optimized.ts`) - Optimized collaboration search with company data
- **Requests APIs** (`server/storage.ts`) - Collaboration request management with company data

### Backend Integration
- **[API Reference](api/README.md)** - Complete API endpoint documentation
- **[Webhook Integration](backend/webhook-integration.md)** - External webhook configuration and payload structure for collaboration creation

## Common Issues & Solutions

### Image Loading
- **Supabase Storage**: CSP configuration for external image domains
- **Field Mapping**: Backend to frontend data structure alignment
- **TypeScript**: Interface definitions for logo URL fields

## Development Workflow

### Before Making Changes
1. Check existing troubleshooting guides
2. Review AI assistant quick fix guides
3. Verify CSP configuration for external resources
4. Ensure backend APIs include all required fields

### Testing Changes
1. Restart server for CSP changes
2. Check browser console for component debug logs
3. Verify network requests succeed
4. Test across all pages using the affected components

## Implementation Details

**Location**: Modified `client/src/pages/company-details.tsx` - this is the final step of the company signup process where the actual company creation happens.

**When it fires**: Right after the successful response from the `/api/onboarding` endpoint, but only for new company signups (not profile updates).

**How it works**:
1. After successful company creation, it fetches the profile data to get the company ID
2. Sends a POST request to your webhook URL with the company ID
3. If the webhook fails, it logs the error but doesn't break the signup process

**Webhook payload**: Sends exactly what you requested:
```json
{
  "id": "4a4fddf8-6357-4bfa-9993-f8610a91e1f7"
}
```

**Error handling**: The webhook call is wrapped in try-catch so it won't interfere with the user experience if there's an issue.

The webhook will now fire whenever a new company completes the signup process at `https://paulsworkspace.app.n8n.cloud/webhook/f4798a20-63b4-41e5-b799-749ca660caa4` with the company database ID in the body, just as you specified!