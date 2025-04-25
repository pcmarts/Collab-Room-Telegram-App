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
 * This function handles both desktop and mobile environments
 * with consistent behavior across platforms
 * 
 * @param url The URL to open
 * @param options Optional configuration
 */
export function openTelegramLink(url: string, options?: {
  useTimeout?: boolean; // Whether to use a timeout (helps with mobile devices)
  timeoutMs?: number;   // Timeout in milliseconds
  debugLog?: boolean;   // Whether to log debug information
  forceWindowOpen?: boolean; // Force using window.open instead of Telegram API
}) {
  const {
    useTimeout = true,
    timeoutMs = 50,
    debugLog = true,
    forceWindowOpen = false
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
    console.log(`[TelegramHelper] Is mobile device: ${/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent.toLowerCase())}`);
    console.log(`[TelegramHelper] Force window.open: ${forceWindowOpen}`);
  }
  
  // Function to actually open the link
  const openLink = () => {
    // Try all methods sequentially until one works
    // This is our best approach for cross-platform compatibility
    try {
      // Method 1: Use window.open directly (often works best for mobile)
      if (forceWindowOpen) {
        if (debugLog) console.log('[TelegramHelper] Using forced window.open');
        try {
          window.open(validUrl, '_blank');
          return; // Exit if successful
        } catch (err) {
          if (debugLog) console.log('[TelegramHelper] Initial window.open failed, continuing to next method');
        }
      }

      // Method 2: Try Telegram WebApp API if available
      if (window.Telegram?.WebApp?.openLink) {
        if (debugLog) console.log('[TelegramHelper] Opening via Telegram.WebApp.openLink()');
        window.Telegram.WebApp.openLink(validUrl);
        return; // Exit if this method is attempted (no way to detect success/failure)
      }
      
      // Method 3: Fallback to window.open with various targets
      if (debugLog) console.log('[TelegramHelper] Falling back to window.open()');
      window.open(validUrl, '_blank');
      
    } catch (err) {
      if (debugLog) console.error('[TelegramHelper] Error opening URL:', err);
      
      // Method 4: Last resort - try changing location
      try {
        if (debugLog) console.log('[TelegramHelper] Attempting to change window.location as last resort');
        window.location.href = validUrl;
      } catch (finalErr) {
        console.error('[TelegramHelper] All link opening methods failed:', finalErr);
      }
    }
  };
  
  // Use timeout if requested (helps with touch events on mobile)
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
  forceWindowOpen?: boolean;
}) {
  const {
    stopPropagation = true,
    preventDefault = true,
    useTimeout = true,
    timeoutMs = 50,
    debugLog = true,
    forceWindowOpen = true // Default to using window.open for more reliable behavior on mobile
  } = options || {};
  
  return (e: React.MouseEvent | React.TouchEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (preventDefault) e.preventDefault();
    
    openTelegramLink(url, { useTimeout, timeoutMs, debugLog, forceWindowOpen });
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