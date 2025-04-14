# Authentication Refresh Loop Fix

## Overview

This document describes the implementation of fixes for authentication refresh loops that were occurring when users accessed the application outside of the Telegram WebApp environment.

## Problem Description

When users accessed the application outside of Telegram (e.g., directly via the browser), they would experience the following issues:

1. Authentication errors due to missing Telegram WebApp initData
2. Continuous API calls triggering authentication errors
3. Automatic page reloads attempting to re-authenticate
4. Excessive network requests causing poor performance and potential rate limiting

The root cause was an aggressive auto-refresh strategy in the React Query configuration combined with automatic re-initialization attempts for the Telegram WebApp.

## Solution Implemented

### 1. Modified Telegram WebApp Initialization

The `waitForTelegramInitData` function in `client/src/lib/queryClient.ts` was previously attempting to automatically initialize the Telegram WebApp multiple times. We modified this to:

- Remove automatic initialization attempts
- Only check if Telegram WebApp initData is already available
- Provide clear error logging without triggering additional retries

```typescript
// Before: Aggressive retry with multiple attempts
const waitForTelegramInitData = async (maxAttempts = 3, delay = 500): Promise<boolean> => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    // Retry logic with delays and automatic initialization
    // ...
  }
  return false;
};

// After: Simple check without automatic retries
const waitForTelegramInitData = async (): Promise<boolean> => {
  if (window.Telegram?.WebApp?.initData) {
    logger.debug('Telegram WebApp initData is available');
    return true;
  }
  
  logger.error('No Telegram initData available - authentication will fail');
  return false;
};
```

### 2. Global React Query Configuration Updates

The global React Query configuration in `queryClient.ts` was updated to prevent automatic refreshes:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity, // Changed from 0 to Infinity
      retry: false,
      enabled: true,
    },
    mutations: {
      retry: false,
      // Removed the onSuccess handler that was invalidating profile data queries
    },
  },
});
```

Key changes:
- Set `staleTime` to `Infinity` to prevent queries from being considered stale
- Disabled all refresh triggers (`refetchOnMount`, `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchInterval`)
- Removed the `onSuccess` handler that was causing profile data refreshes

### 3. Component-Level Query Configuration

Individual React Query hooks in components were also modified to override the global settings and ensure they don't auto-refresh:

```typescript
const { data: serverSwipeHistory } = useQuery({
  queryKey: ['/api/user-swipes'],
  queryFn: async () => {
    // ...query function...
  },
  staleTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  retry: false,
});
```

### 4. Removed Automatic Page Reloads

In `DiscoverPageNew.tsx`, we removed the automatic page reload that was triggering when Telegram initData was missing:

```typescript
// Before
if (!initDataAvailable) {
  console.error('[Auth] Telegram WebApp initData is missing - authentication will fail');
  setAuthError(true);
  
  // Attempt to trigger re-initialization from Telegram
  if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
    console.log('[Auth] Will attempt to reload the page to reinitialize Telegram WebApp in 2 seconds');
    setTimeout(() => window.location.reload(), 2000);
  }
}

// After
if (!initDataAvailable) {
  console.error('[Auth] Telegram WebApp initData is missing - authentication will fail');
  setAuthError(true);
  
  // DISABLED: No auto-reload anymore to prevent authentication loops
  console.log('[Auth] Auto-reload on missing Telegram initData has been disabled');
  // User will need to manually reload using the button if needed
}
```

## Benefits

1. **Improved Error Handling**: The application now shows clear authentication errors without continuously trying to refresh.
2. **Reduced Network Traffic**: Eliminated unnecessary API calls that were previously made when authentication was failing.
3. **Better User Experience**: Users now see a stable error message rather than a constantly refreshing page.
4. **Improved Performance**: Reduced the number of network requests and page reloads, resulting in better performance.

## Testing

To test these changes:
1. Open the application outside of Telegram (e.g., directly in a browser)
2. Verify that a clear authentication error is shown
3. Confirm that the error message remains stable and doesn't trigger continuous refreshes
4. Check that no continuous authentication-related API calls are made in the network tab
5. Verify that the "Reload Page" button works correctly when clicked manually

## Additional Notes

These changes ensure the application behaves gracefully when Telegram authentication is unavailable while maintaining full functionality when used within the Telegram WebApp environment.