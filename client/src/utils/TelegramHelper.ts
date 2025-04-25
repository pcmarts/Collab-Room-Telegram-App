/**
 * TelegramHelper - Utility for Telegram WebApp integration
 * 
 * This utility provides a reliable way to open links in Telegram WebApp
 * with special handling for iOS devices.
 * 
 * Call initTelegramWebApp() when your app first loads to ensure proper WebApp initialization.
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

/**
 * Initialize the Telegram WebApp 
 * 
 * This should be called when your application first loads to ensure proper
 * WebApp functionality, especially on iOS devices.
 * 
 * @param options Configuration options
 */
export function initTelegramWebApp(options?: {
  expandApp?: boolean; 
  debugLog?: boolean;
}): boolean {
  const { 
    expandApp = true, 
    debugLog = true 
  } = options || {};
  
  try {
    // Check if we're in a Telegram WebApp environment
    if (!window.Telegram?.WebApp) {
      if (debugLog) console.log("[TelegramHelper] Not running inside Telegram WebApp");
      return false;
    }
    
    if (debugLog) console.log("[TelegramHelper] Initializing Telegram WebApp");
    
    // Signal to Telegram that the WebApp is ready to display
    window.Telegram.WebApp.ready();
    
    // Optionally expand the app to take up the entire available space
    if (expandApp) {
      if (debugLog) console.log("[TelegramHelper] Expanding WebApp");
      window.Telegram.WebApp.expand();
    }
    
    if (debugLog) {
      console.log(`[TelegramHelper] WebApp platform: ${window.Telegram.WebApp.platform}`);
      console.log(`[TelegramHelper] WebApp version: ${window.Telegram.WebApp.version}`);
      console.log(`[TelegramHelper] WebApp viewport height: ${window.Telegram.WebApp.viewportHeight}`);
      console.log(`[TelegramHelper] WebApp viewport stable height: ${window.Telegram.WebApp.viewportStableHeight}`);
    }
    
    return true;
  } catch (error) {
    console.error("[TelegramHelper] Error initializing Telegram WebApp:", error);
    return false;
  }
}