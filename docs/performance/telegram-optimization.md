# Telegram WebApp Performance Optimization

## Overview

The Telegram WebApp initialization process was optimized to reduce performance issues and improve application loading time. This document explains the changes made and the benefits they provide.

## Problem

The initial implementation of Telegram WebApp initialization had several issues:
- It was performed directly in the render cycle, affecting initial render performance
- The initialization code was part of the main bundle, increasing initial load time
- There was no clear separation between initialization and usage

## Solution

We implemented a custom React hook called `useTelegramInit` that:

1. Moves initialization outside the render cycle using `useLayoutEffect`
2. Uses dynamic imports to keep initialization code out of the main bundle
3. Provides a clear indication of initialization status via a boolean return value
4. Only initializes once per component mount

## Implementation

The new hook is implemented in `client/src/hooks/useTelegramInit.ts`:

```typescript
function useTelegramInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize outside of render cycle using a layout effect
  useLayoutEffect(() => {
    // Only attempt to initialize once and in client
    if (typeof window !== 'undefined' && !isInitialized) {
      // Use dynamic import to keep initialization code out of main bundle
      import('../utils/TelegramHelper').then(({ initTelegramWebApp }) => {
        initTelegramWebApp({
          expandApp: true,
          debugLog: false // Reduce console output
        });
        setIsInitialized(true);
      }).catch(err => {
        console.error('[TelegramInit] Failed to load helper:', err);
      });
    }
  }, [isInitialized]);
  
  return isInitialized;
}
```

## Usage

This hook is used in the App component:

```typescript
function App() {
  // Use the optimized Telegram WebApp initialization hook
  const telegramInitialized = useTelegramInit();
  
  // Rest of the component can use telegramInitialized status
  // to conditionally render or enable functionality
}
```

## Benefits

- **Improved Performance**: By moving initialization outside the render cycle, we reduce the impact on UI responsiveness
- **Better User Experience**: The application loads more quickly and smoothly
- **Code Organization**: Clear separation between initialization and usage
- **Bundle Optimization**: Dynamic imports ensure initialization code isn't loaded until needed
- **Maintenance**: Easier to debug and maintain with a single, well-defined initialization point

## Future Improvements

- Consider adding initialization status to a global context for broader access
- Add retry logic for failed initializations
- Implement more granular status reporting (initializing, success, error)