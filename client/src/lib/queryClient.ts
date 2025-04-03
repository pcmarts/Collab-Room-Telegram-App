import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper function to wait for Telegram initialization (shared between API functions)
const waitForTelegramInitData = async (maxAttempts = 3, delay = 500): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Check if Telegram WebApp is available and has initData
    if (window.Telegram?.WebApp?.initData) {
      // Cache the Telegram user data when available
      try {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          const userData = window.Telegram.WebApp.initDataUnsafe.user;
          // Store basic user info in localStorage as a fallback for authentication
          localStorage.setItem('telegram_user_id', userData.id?.toString() || '');
          localStorage.setItem('telegram_user_first_name', userData.first_name || '');
          if (userData.last_name) localStorage.setItem('telegram_user_last_name', userData.last_name);
          if (userData.username) localStorage.setItem('telegram_user_username', userData.username);
          console.log('[API] Cached Telegram user data in localStorage:', userData.id);
        }
      } catch (e) {
        console.warn('[API] Failed to cache Telegram user data:', e);
      }
      return true;
    }
    
    // If Telegram is available but no initData, try to initialize it
    if (window.Telegram?.WebApp) {
      try {
        console.log(`[API] Attempt ${attempts + 1}: Initializing Telegram WebApp`);
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        console.error('[API] Error initializing Telegram WebApp:', e);
      }
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
      console.error('[API] Authentication failed:', authError);
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
  
  // Check if session authentication is available (stored in localStorage)
  const sessionAuthStatus = localStorage.getItem('sessionAuthEstablished');
  const hasEstablishedSession = sessionAuthStatus === 'true';
  
  // Try to wait for Telegram initData (with a short timeout)
  const hasTelegramData = await waitForTelegramInitData();
  
  // Check for and add Telegram WebApp authentication
  if (hasTelegramData && window.Telegram?.WebApp?.initData) {
    headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
    console.log('[API] Telegram initData found and added to request headers');
    
    // If we successfully got Telegram initData, mark that we have established a session
    // This is used as a fallback when future Telegram initData might be missing
    localStorage.setItem('sessionAuthEstablished', 'true');
    localStorage.setItem('lastSessionTime', Date.now().toString());
  } else {
    // Check if we've established a session before
    if (hasEstablishedSession) {
      console.log('[API] No current Telegram initData but session is established');
      // Check if session is still likely to be valid (less than 24 hours old)
      const lastSessionTime = parseInt(localStorage.getItem('lastSessionTime') || '0', 10);
      const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
      
      if (Date.now() - lastSessionTime < SESSION_MAX_AGE) {
        console.log('[API] Using established session - last session within timeframe');
      } else {
        console.warn('[API] Session may have expired - attempting request but may fail');
      }
    } else {
      console.warn('[API] No Telegram initData available after retry attempts and no established session');
    }
    
    console.log('[API] Continuing with request using session authentication');
  }
  
  // Add the cached Telegram User ID as a fallback authentication mechanism
  // This allows the server to identify the user even when session cookies change
  const cachedUserId = localStorage.getItem('telegram_user_id');
  if (cachedUserId) {
    headers['x-telegram-user-id'] = cachedUserId;
    console.log('[API] Added cached Telegram user ID to headers:', cachedUserId);
  }
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Ensure cookies are sent for session authentication
    });
    
    if (res.ok) {
      // If request succeeds, we know we have a working session
      localStorage.setItem('sessionAuthEstablished', 'true');
      localStorage.setItem('lastSessionTime', Date.now().toString());
    }

    await throwIfResNotOk(res);
    return await res.json(); // Parse JSON response
  } catch (error) {
    // If we get an authentication error and had a supposedly valid session,
    // our session might have expired or been invalidated
    if (error && (error as Error).name === 'AuthenticationError' && hasEstablishedSession) {
      console.warn('[API] Session authentication failed - clearing session status');
      localStorage.removeItem('sessionAuthEstablished');
    }
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
      console.log('[API] Telegram initData found and added to query request headers');
      
      // If we successfully got Telegram initData, mark that we have established a session
      localStorage.setItem('sessionAuthEstablished', 'true');
      localStorage.setItem('lastSessionTime', Date.now().toString());
    } else {
      // Check if we've established a session before
      if (hasEstablishedSession) {
        console.log('[API] No current Telegram initData but session is established');
        // Check if session is still likely to be valid (less than 24 hours old)
        const lastSessionTime = parseInt(localStorage.getItem('lastSessionTime') || '0', 10);
        const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
        
        if (Date.now() - lastSessionTime < SESSION_MAX_AGE) {
          console.log('[API] Using established session - last session within timeframe');
        } else {
          console.warn('[API] Session may have expired - attempting request but may fail');
        }
      } else {
        console.warn('[API] No Telegram initData available in query after retry attempts and no established session');
      }
      
      console.log('[API] Continuing with request using session authentication');
    }
    
    // Add the cached Telegram User ID as a fallback authentication mechanism
    // This allows the server to identify the user even when session cookies change
    const cachedUserId = localStorage.getItem('telegram_user_id');
    if (cachedUserId) {
      headers['x-telegram-user-id'] = cachedUserId;
      console.log('[API] Added cached Telegram user ID to query headers:', cachedUserId);
    }

    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include", // Ensure cookies are sent for session authentication
        headers
      });
      
      if (res.ok) {
        // If request succeeds, we know we have a working session
        localStorage.setItem('sessionAuthEstablished', 'true');
        localStorage.setItem('lastSessionTime', Date.now().toString());
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // Session might have expired if we get a 401
        if (hasEstablishedSession) {
          console.warn('[API] Session authentication failed - clearing session status');
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
        console.warn('[API] Session authentication failed in query - clearing session status');
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});