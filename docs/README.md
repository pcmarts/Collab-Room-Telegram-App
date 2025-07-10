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