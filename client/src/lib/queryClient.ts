import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Configure log levels - set to false in production for performance
const LOG_LEVELS = {
  DEBUG: false,  // Set to true to enable detailed debug logs
  INFO: false,   // Set to true to enable info logs
  WARN: true,    // Warnings stay enabled
  ERROR: true    // Errors stay enabled
};

// Simple logger with configurable levels to improve performance
const logger = {
  debug: (message: string, ...args: any[]) => {
    if (LOG_LEVELS.DEBUG) console.debug(`[API] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (LOG_LEVELS.INFO) console.log(`[API] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (LOG_LEVELS.WARN) console.warn(`[API] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    if (LOG_LEVELS.ERROR) console.error(`[API] ${message}`, ...args);
  }
};

// Helper function to wait for Telegram initialization (shared between API functions)
const waitForTelegramInitData = async (maxAttempts = 3, delay = 500): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Check if Telegram WebApp is available and has initData
    if (window.Telegram?.WebApp?.initData) {
      // Telegram initData is available, this is our primary authentication method
      logger.debug('Telegram WebApp initData is available');
      return true;
    }
    
    // If Telegram is available but no initData, try to initialize it
    if (window.Telegram?.WebApp) {
      try {
        logger.debug(`Attempt ${attempts + 1}: Initializing Telegram WebApp`);
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        logger.error('Error initializing Telegram WebApp:', e);
      }
    } else {
      logger.error('Telegram WebApp is not available - this app must be opened from Telegram');
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }
  
  return false;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Create a specific error for authentication failures
    if (res.status === 401) {
      const authError = new Error(`Authentication Error: ${text}`);
      authError.name = 'AuthenticationError';
      logger.error('Authentication failed:', authError);
      throw authError;
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<any> {
  // Add Telegram initData to headers if available
  const headers: Record<string, string> = {};
  
  // Try to wait for Telegram initData (with a short timeout)
  const hasTelegramData = await waitForTelegramInitData();
  
  // Check for and add Telegram WebApp authentication - this is our primary authentication method
  if (hasTelegramData && window.Telegram?.WebApp?.initData) {
    headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
    logger.info('Telegram initData found and added to request headers');
  } else {
    // If we couldn't get Telegram initData, authentication will likely fail
    logger.error('No Telegram initData available - authentication will likely fail');
    logger.debug('This app should be opened from Telegram to function correctly');
  }
  
  // Add content type header if we have data
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    // Add cache-busting parameter to URL for requests that need fresh data
    let requestUrl = url;
    
    // Add timestamp to URLs that need to be cache-busted (especially for profile data)
    if (url === '/api/profile' || url.includes('notification')) {
      const cacheBuster = `_t=${Date.now()}`;
      requestUrl = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
      logger.debug('Added cache-busting timestamp to URL:', requestUrl);
    }
    
    const res = await fetch(requestUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Ensure cookies are sent for session authentication
      cache: 'no-cache' // Prevent caching of responses
    });

    await throwIfResNotOk(res);
    return await res.json(); // Parse JSON response
  } catch (error) {
    // Simply log and rethrow the error
    logger.error('API request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add Telegram initData to headers if available
    const headers: Record<string, string> = {};
    
    // Check if session authentication is available (stored in localStorage)
    const sessionAuthStatus = localStorage.getItem('sessionAuthEstablished');
    const hasEstablishedSession = sessionAuthStatus === 'true';
    
    // Try to wait for Telegram initData (with a short timeout)
    const hasTelegramData = await waitForTelegramInitData();
    
    // Check for and add Telegram WebApp authentication
    if (hasTelegramData && window.Telegram?.WebApp?.initData) {
      headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      logger.info('Telegram initData found and added to query request headers');
      
      // If we successfully got Telegram initData, mark that we have established a session
      localStorage.setItem('sessionAuthEstablished', 'true');
      localStorage.setItem('lastSessionTime', Date.now().toString());
    } else {
      // Check if we've established a session before
      if (hasEstablishedSession) {
        logger.info('No current Telegram initData but session is established');
        // Check if session is still likely to be valid (less than 24 hours old)
        const lastSessionTime = parseInt(localStorage.getItem('lastSessionTime') || '0', 10);
        const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (Date.now() - lastSessionTime < SESSION_MAX_AGE) {
          logger.debug('Using established session - last session within timeframe');
        } else {
          logger.warn('Session may have expired - attempting request but may fail');
        }
      } else {
        logger.warn('No Telegram initData available in query after retry attempts and no established session');
      }
      
      logger.debug('Continuing with request using session authentication');
    }
    
    // Add the cached Telegram User ID as a fallback authentication mechanism
    // This allows the server to identify the user even when session cookies change
    const cachedUserId = localStorage.getItem('telegram_user_id');
    if (cachedUserId) {
      headers['x-telegram-user-id'] = cachedUserId;
      logger.debug('Added cached Telegram user ID to query headers:', cachedUserId);
    }

    try {
      // Add cache-busting parameter to URL for requests that need fresh data
      let url = queryKey[0] as string;
      
      // Add timestamp to URLs that need to be cache-busted (especially for profile data)
      if (url === '/api/profile' || url.includes('notification')) {
        const cacheBuster = `_t=${Date.now()}`;
        url = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
        logger.debug('Added cache-busting timestamp to URL:', url);
      }
      
      const res = await fetch(url, {
        credentials: "include", // Ensure cookies are sent for session authentication
        headers,
        // Add cache control to the fetch request options
        cache: 'no-cache'
      });
      
      if (res.ok) {
        // If request succeeds, we know we have a working session
        localStorage.setItem('sessionAuthEstablished', 'true');
        localStorage.setItem('lastSessionTime', Date.now().toString());
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // Session might have expired if we get a 401
        if (hasEstablishedSession) {
          logger.warn('Session authentication failed - clearing session status');
          localStorage.removeItem('sessionAuthEstablished');
        }
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // If we get an authentication error and had a supposedly valid session,
      // our session might have expired or been invalidated
      if (error && (error as Error).name === 'AuthenticationError' && hasEstablishedSession) {
        logger.warn('Session authentication failed in query - clearing session status');
        localStorage.removeItem('sessionAuthEstablished');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Reduce staleTime to ensure fresh data is always fetched
      retry: false,
    },
    mutations: {
      retry: false,
      onSuccess: () => {
        // Force a refetch of profile data whenever any mutation succeeds
        queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      }
    },
  },
});