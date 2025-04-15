# Discovery Page Authentication Timing Fix

This document describes the authentication timing fix implemented in version 1.8.2 to resolve the blank discovery page issue.

## Problem Overview

Users reported that when first opening the discovery page in the Telegram WebApp, the page would initially appear blank with no cards. Only after pressing the refresh button would cards be displayed correctly.

### Root Cause

The investigation revealed two main issues:

1. **Authentication Timing**: The initial data loading was happening before Telegram authentication was fully established, resulting in 401 Unauthorized errors.

2. **Inconsistent Data Loading Approaches**: Initial page load was using direct GET requests to endpoints, while the refresh button used a different approach with POST requests to `/api/collaborations/search`.

## Implementation Details

### 1. Delayed Initial Data Loading

In `DiscoverPageNew.tsx`, the component mount effect was modified to add a short delay before triggering data loading, giving Telegram authentication time to initialize properly:

```typescript
// Handle initial data loading on component mount
useEffect(() => {
  // Logging only on component mount to help with debugging
  console.log('[Discovery] Component mounted with route:', {
    location,
    windowLocation: window.location.pathname,
    telegramAvailable: !!window?.Telegram?.WebApp,
    telegramInitData: !!window?.Telegram?.WebApp?.initData
  });
  
  // Initial setup of refs
  initialLoadCompletedRef.current = false;
  prevLocationRef.current = location;
  lastFetchTimeRef.current = Date.now();
  
  // Wait a short time for Telegram authentication to initialize
  // This allows the Telegram SDK to properly initialize
  const initialLoadTimer = setTimeout(() => {
    console.log('[Discovery] Initial data load triggered with authentication check');
    
    // Use the same loading mechanism as refresh for consistency
    handleRefresh();
  }, 300); // Short delay to ensure authentication is ready
  
  // Return cleanup function
  return () => {
    console.log('[Discovery] Component unmounting, cleaning up');
    clearTimeout(initialLoadTimer);
  };
}, []); // Empty dependency array - only runs once on mount
```

### 2. Unified Data Loading Approach

The implementation now uses the same data loading mechanism for both initial page load and the refresh button action. This ensures consistent behavior and prevents authentication issues:

- Initial page load now triggers `handleRefresh()` after a short delay
- Both initial load and manual refresh use the same code path
- Both approaches properly check authentication status before attempting to load data

## Benefits

1. **Improved User Experience**: Users now see cards immediately on their first visit to the discovery page
2. **Consistent Behavior**: The same data loading mechanism is used for both initial load and refresh
3. **More Reliable Authentication**: The delay ensures Telegram authentication has time to initialize properly
4. **Simplified Code**: Using a single approach for both initial load and refresh reduces code complexity

## Testing Considerations

When testing this fix, verify:

1. Cards appear correctly when the discovery page is first loaded
2. Refresh button continues to work as expected
3. Authentication errors are properly handled and displayed
4. The fix works consistently across different users and devices

## Related Documentation

- [Authentication System](../auth/README.md)
- [Discovery System](./README.md)
- [Swipe Filtering](./swipe-filtering.md)