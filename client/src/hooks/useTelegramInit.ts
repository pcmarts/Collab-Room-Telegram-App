import { useState, useLayoutEffect, useRef } from 'react';

/**
 * Custom hook to optimize Telegram WebApp initialization
 *
 * This hook provides an improved initialization process with minimal impact on rendering:
 * 1. Uses useLayoutEffect to execute initialization outside of render cycle
 * 2. Uses dynamic import to keep initialization code out of main bundle
 * 3. Only runs initialization once per component mount (guarded by a ref so Strict Mode
 *    re-invocation or state-triggered re-renders don't retrigger import)
 * 4. Returns initialization status for dependent operations
 *
 * @returns boolean indicating whether Telegram WebApp is initialized
 */
export function useTelegramInit() {
  const [isInitialized, setIsInitialized] = useState(false);
  const initStartedRef = useRef(false);

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || initStartedRef.current) return;
    initStartedRef.current = true;

    import('../utils/TelegramHelper').then(({ initTelegramWebApp }) => {
      initTelegramWebApp({
        expandApp: true,
        debugLog: false,
      });
      setIsInitialized(true);
    }).catch(err => {
      console.error('[TelegramInit] Failed to load helper:', err);
      initStartedRef.current = false; // allow retry on transient load failure
    });
  }, []);

  return isInitialized;
}

export default useTelegramInit;