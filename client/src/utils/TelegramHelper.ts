/**
 * TelegramHelper - Utility for Telegram WebApp integration
 * 
 * This utility provides a reliable way to open links in Telegram WebApp
 * with special handling for iOS devices.
 */

/**
 * Opens a link in the Telegram WebApp environment
 * This function handles both desktop and mobile (iOS/Android) environments
 * 
 * @param url The URL to open
 * @param options Optional configuration
 */
export function openTelegramLink(url: string, options?: {
  useTimeout?: boolean; // Whether to use a timeout (helps with iOS)
  timeoutMs?: number;   // Timeout in milliseconds
  debugLog?: boolean;   // Whether to log debug information
}) {
  const {
    useTimeout = true,
    timeoutMs = 50,
    debugLog = true
  } = options || {};

  // Clean up and validate URL
  if (!url || url.trim() === '') {
    if (debugLog) console.warn('[TelegramHelper] Cannot open empty URL');
    return;
  }
  
  const validUrl = url.trim();
  
  if (debugLog) {
    console.log(`[TelegramHelper] Opening URL: ${validUrl}`);
    console.log(`[TelegramHelper] Telegram WebApp available: ${!!window.Telegram?.WebApp}`);
  }
  
  // Function to actually open the link
  const openLink = () => {
    // Try using Telegram WebApp API first
    if (window.Telegram?.WebApp?.openLink) {
      if (debugLog) console.log('[TelegramHelper] Opening via Telegram.WebApp.openLink()');
      window.Telegram.WebApp.openLink(validUrl);
    } else {
      // Fallback to window.open for desktop or non-Telegram environments
      if (debugLog) console.log('[TelegramHelper] Falling back to window.open()');
      window.open(validUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  // Use timeout if requested (helps with iOS touch events)
  if (useTimeout) {
    setTimeout(openLink, timeoutMs);
  } else {
    openLink();
  }
}

/**
 * Check if the current environment is a Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  return !!window.Telegram?.WebApp;
}

/**
 * Check if the device is likely iOS (helps with iOS-specific handling)
 */
export function isIOSDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

/**
 * Helper for creating Twitter URLs from handles
 * @param handle Twitter handle which may contain @ or full URL
 */
export function createTwitterUrl(handle: string): string {
  if (!handle) return '';
  
  // Clean the handle - remove @ prefix, twitter.com URLs, etc.
  const cleanHandle = handle
    .replace('@', '')
    .replace('https://twitter.com/', '')
    .replace('https://x.com/', '')
    .trim();
    
  return `https://twitter.com/${cleanHandle}`;
}

/**
 * Create a direct click handler for Telegram links
 * This simplifies adding the handler to React components
 */
export function createTelegramLinkHandler(url: string, options?: {
  stopPropagation?: boolean;
  preventDefault?: boolean;
  useTimeout?: boolean;
  timeoutMs?: number;
  debugLog?: boolean;
}) {
  const {
    stopPropagation = true,
    preventDefault = true,
    useTimeout = true,
    timeoutMs = 50,
    debugLog = true
  } = options || {};
  
  return (e: React.MouseEvent | React.TouchEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (preventDefault) e.preventDefault();
    
    openTelegramLink(url, { useTimeout, timeoutMs, debugLog });
  };
}