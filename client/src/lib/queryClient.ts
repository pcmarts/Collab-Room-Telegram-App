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

// Helper function to check for Telegram initialization - NO AUTOMATIC RETRY
// This has been modified to prevent authentication refresh loops
const waitForTelegramInitData = async (): Promise<boolean> => {
  // Only check if Telegram WebApp is already initialized with initData
  // Do not attempt to initialize it automatically
  if (window.Telegram?.WebApp?.initData) {
    // Telegram initData is available, this is our primary authentication method
    logger.debug('Telegram WebApp initData is available');
    return true;
  }
  
  // Log the missing authentication but don't attempt to fix it automatically
  logger.error('No Telegram initData available - authentication will fail');
  logger.error('This app must be opened from Telegram to function correctly');
  
  // Return false to indicate that we don't have Telegram data
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
    
    // Try to wait for Telegram initData (with a short timeout)
    const hasTelegramData = await waitForTelegramInitData();
    
    // Check for and add Telegram WebApp authentication - this is our primary authentication method
    if (hasTelegramData && window.Telegram?.WebApp?.initData) {
      headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      logger.info('Telegram initData found and added to query request headers');
    } else {
      // If we couldn't get Telegram initData, authentication will likely fail
      logger.error('No Telegram initData available - authentication will likely fail');
      logger.debug('This app should be opened from Telegram to function correctly');
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

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Simply log and rethrow the error
      logger.error('Query request failed:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity, // Changed to Infinity to prevent all auto-refresh
      retry: false,
      enabled: true, // Queries will run when initialized but not refresh
    },
    mutations: {
      retry: false,
      // Removed the onSuccess handler that was invalidating profile data queries
    },
  },
});