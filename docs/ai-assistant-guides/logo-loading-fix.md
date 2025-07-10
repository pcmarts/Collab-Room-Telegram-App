# AI Assistant Quick Fix: Company Logo Loading Issues

## 🚨 Issue Identification

**User reports**: "Company logos not showing" / "Logos showing as letter avatars"

**Quick Check**:
1. Look for `LogoAvatar` component usage in the codebase
2. Check if browser console shows CSP violations for `*.supabase.co` 
3. Verify if backend APIs return `company_logo_url` field

## 🔧 Immediate Fix Checklist

### 1. CSP Fix (Most Common Issue)
**File**: `server/index.ts`
```typescript
// BEFORE
"img-src 'self' data: https://telegram.org https://*.telegram.org; " +

// AFTER  
"img-src 'self' data: https://telegram.org https://*.telegram.org https://*.supabase.co; " +
```

### 2. Backend API Field Mapping
**Key Pattern**: Look for APIs that return company data but miss `logo_url` field

**Files to check**:
- `server/storage.optimized.ts` → `searchCollaborationsPaginated`
- `server/storage.ts` → `getCollaborationRequests*` methods
- `server/storage.ts` → `getUserMatchesWithDetails` method
- `server/routes.ts` → `/api/matches` endpoint field mapping

**Fix Pattern**:
```typescript
// ADD missing field selection
company: {
  name: companies.name,
  logo_url: companies.logo_url, // <- ADD THIS
  // ... other fields
}

// ADD missing field mapping  
company_logo_url: company?.logo_url, // <- ADD THIS
```

### 3. Frontend TypeScript Interfaces
**Pattern**: Find interfaces that define company objects missing `logo_url`

**Common locations**:
- Component files using `LogoAvatar`
- Request/API response type definitions

**Fix**:
```typescript
company: {
  name: string;
  logo_url?: string; // <- ADD THIS
  // ... other fields
};
```

## ⚡ Quick Fix Command Sequence

```bash
# 1. Find all LogoAvatar usages
grep -r "LogoAvatar" client/src/

# 2. Find API endpoints returning company data
grep -r "company.*logo" server/

# 3. Check CSP configuration
grep -A5 -B5 "img-src" server/index.ts
```

## 🎯 Testing Verification

1. **Restart server** (CSP changes need restart)
2. **Open browser console** → Look for LogoAvatar debug messages:
   - ✅ `[LogoAvatar] ✅ Logo loaded successfully`
   - ❌ `[LogoAvatar] ❌ Logo failed to load` or CSP errors
3. **Check Network tab** for failed image requests

## 📝 Common Mistake Patterns

- **CSP only**: Adding CSP fix but missing backend field mappings
- **Frontend only**: Updating TypeScript types but not backend APIs  
- **Missing restart**: CSP changes require server restart
- **Wrong field names**: Using `logo_url` vs `company_logo_url` consistently

## 🔗 Related Documentation

- Full troubleshooting guide: `docs/troubleshooting/company-logos.md`
- LogoAvatar component: `client/src/components/ui/logo-avatar.tsx`
- Changelog entry: `CHANGELOG.md` (search for "Company Logo Loading Issues") 