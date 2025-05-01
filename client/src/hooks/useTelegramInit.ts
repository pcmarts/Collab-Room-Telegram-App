import { useState, useLayoutEffect } from 'react';

/**
 * Custom hook to optimize Telegram WebApp initialization
 * 
 * This hook provides an improved initialization process with minimal impact on rendering:
 * 1. Uses useLayoutEffect to execute initialization outside of render cycle
 * 2. Uses dynamic import to keep initialization code out of main bundle
 * 3. Only runs initialization once per component mount
 * 4. Returns initialization status for dependent operations
 * 
 * @returns boolean indicating whether Telegram WebApp is initialized
 */
export function useTelegramInit() {
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

export default useTelegramInit;