# Company Logo Loading Issues

## Problem Description

Company logos not displaying in the application, showing fallback letter avatars instead of actual company logos stored in Supabase storage.

## Root Causes

### 1. Content Security Policy (CSP) Blocking Supabase Storage
- **Issue**: CSP in `server/index.ts` doesn't allow images from Supabase storage domain
- **Symptom**: Browser console shows CSP violations when trying to load logos
- **Location**: `server/index.ts` CSP configuration

### 2. Missing `logo_url` Field Mapping in Backend APIs
- **Issue**: Backend APIs don't include `company_logo_url` field in responses
- **Symptom**: Frontend receives `undefined` for logo URLs, LogoAvatar shows debug messages about missing URLs
- **Locations**: Various storage functions and API endpoints

## Complete Solution

### Step 1: Fix Content Security Policy (CSP)

**File**: `server/index.ts`

**Find**: The CSP configuration around line 36:
```typescript
"img-src 'self' data: https://telegram.org https://*.telegram.org; " +
"connect-src 'self' https://api.telegram.org; " +
```

**Replace with**:
```typescript
"img-src 'self' data: https://telegram.org https://*.telegram.org https://*.supabase.co; " +
"connect-src 'self' https://api.telegram.org https://*.supabase.co; " +
```

**Why**: This allows the browser to load images from any Supabase storage domain and make API requests to Supabase.

### Step 2: Fix Discovery Page API (searchCollaborationsPaginated)

**File**: `server/storage.optimized.ts`

**Find**: The company field selection around line 280:
```typescript
company: {
  name: companies.name,
  // ... other fields
},
```

**Add**: The missing `logo_url` field:
```typescript
company: {
  name: companies.name,
  logo_url: companies.logo_url, // FIX: Add missing logo_url field selection
  // ... other fields
},
```

**And Find**: The field mapping around line 290:
```typescript
// Map company fields to the expected frontend fields
company_description: company ? (company.long_description || company.short_description) : undefined,
company_website: company?.website,
```

**Add**: The missing `company_logo_url` mapping:
```typescript
// Map company fields to the expected frontend fields
company_logo_url: company?.logo_url, // FIX: Add missing company_logo_url field mapping
company_description: company ? (company.long_description || company.short_description) : undefined,
company_website: company?.website,
```

### Step 3: Fix Collaboration Requests API

**File**: `server/storage.ts`

**Find**: In `getCollaborationRequestsSummary` method around line 1390:
```typescript
company: {
  name: req.company.name,
  twitter_handle: req.company.twitter_handle,
},
```

**Replace with**:
```typescript
company: {
  name: req.company.name,
  twitter_handle: req.company.twitter_handle,
  logo_url: req.company.logo_url, // FIX: Add missing logo_url field
},
```

**Find**: In `getCollaborationRequests` method around line 1520:
```typescript
company: {
  name: req.company.name,
  twitter_handle: req.company.twitter_handle,
  job_title: req.company.job_title,
  website: req.company.website,
},
```

**Replace with**:
```typescript
company: {
  name: req.company.name,
  twitter_handle: req.company.twitter_handle,
  job_title: req.company.job_title,
  website: req.company.website,
  logo_url: req.company.logo_url, // FIX: Add missing logo_url field
},
```

### Step 4: Update Frontend TypeScript Interfaces

**File**: `client/src/components/requests-management-tab.tsx`

**Find**: The `CollaborationRequest` interface around line 30:
```typescript
company: {
  name: string;
  twitter_handle?: string;
  job_title?: string;
  website?: string;
};
```

**Replace with**:
```typescript
company: {
  name: string;
  twitter_handle?: string;
  job_title?: string;
  website?: string;
  logo_url?: string; // FIX: Add missing logo_url field
};
```

## Verification Steps

1. **Restart the server** (CSP changes require restart)
2. **Open browser console** (F12) and look for LogoAvatar debug messages:
   - ✅ Success: `[LogoAvatar] ✅ Logo loaded successfully for CompanyName`
   - ❌ Failure: `[LogoAvatar] ❌ Logo failed to load` or CSP violation errors
3. **Check the network tab** for failed image requests
4. **Verify actual logo URLs** are being passed to components (not `undefined`)

## Common Patterns for Similar Issues

### When to Apply This Fix
- Company/user logos not showing (displaying letter avatars instead)
- Browser console shows CSP violations for Supabase storage
- LogoAvatar component logs indicate missing or failed logo URLs
- Frontend receives `undefined` for `logo_url` or `company_logo_url` fields

### Files Usually Involved
- **CSP Configuration**: `server/index.ts`
- **Main Discovery API**: `server/storage.optimized.ts`
- **Collaboration Requests API**: `server/storage.ts`
- **Frontend Interfaces**: Component files using LogoAvatar

### Debug Commands
```bash
# Check if logos are in database
npx tsx -e "
import { db } from './server/db.js';
import { companies } from './shared/schema.js';
import { isNotNull } from 'drizzle-orm';

const result = await db.select({ name: companies.name, logo_url: companies.logo_url })
  .from(companies) 
  .where(isNotNull(companies.logo_url))
  .limit(5);
console.log('Companies with logos:', result);
process.exit();
"
```

## Related Components
- `LogoAvatar` - Displays company/user logos with fallback
- `CollaborationListItem` - Shows company logos in discovery
- `RequestsManagementTab` - Shows company logos in collaboration requests
- `MatchesPage` - Shows company logos in matches list
- `MatchDetail` - Shows company logos in match details dialog
- Any component using `company_logo_url` field

## My Matches Page Fix

If company logos are not showing in the **My Matches** section, apply this additional fix:

### Backend API Fix

**File**: `server/storage.ts`

**Find**: In `getUserMatchesWithDetails` method around line 1835:
```typescript
SELECT 
  c.name,
  c.short_description,
  // ... other fields
  c.job_title
FROM companies c
WHERE c.user_id = ${otherUserId}
```

**Add**: The missing `logo_url` field:
```typescript
SELECT 
  c.name,
  c.short_description,
  // ... other fields
  c.job_title,
  c.logo_url
FROM companies c
WHERE c.user_id = ${otherUserId}
```

**Find**: The company mapping around line 1875:
```typescript
company_linkedin_url: companyData?.linkedin_url || null,
funding_stage: companyData?.funding_stage || null,
```

**Add**: The missing field mapping:
```typescript
company_linkedin_url: companyData?.linkedin_url || null,
company_logo_url: companyData?.logo_url || null, // FIX: Add missing company logo URL field
funding_stage: companyData?.funding_stage || null,
```

### API Response Field Mapping

**File**: `server/routes.ts`

**Find**: In `/api/matches` endpoint around line 3400:
```typescript
companyTwitterFollowers: match.company_twitter_followers || null,
fundingStage: match.funding_stage || null,
```

**Add**: The missing field mapping:
```typescript
companyTwitterFollowers: match.company_twitter_followers || null,
companyLogoUrl: match.company_logo_url || null, // FIX: Add missing company logo URL field mapping
fundingStage: match.funding_stage || null,
```

### Frontend Updates

**Files**: `client/src/pages/MatchesPage.tsx` and `client/src/components/MatchDetail.tsx`

1. **Add LogoAvatar import**:
```typescript
import { LogoAvatar } from "@/components/ui/logo-avatar";
```

2. **Update Match interface** to include:
```typescript
companyLogoUrl?: string; // FIX: Add missing company logo URL field
```

3. **Add LogoAvatar component** to match cards:
```typescript
<LogoAvatar
  name={match.companyName || "Company"}
  logoUrl={match.companyLogoUrl}
  className="w-12 h-12"
  size="lg"
/>
``` 