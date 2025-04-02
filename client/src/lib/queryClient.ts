import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper function to wait for Telegram initialization (shared between API functions)
const waitForTelegramInitData = async (maxAttempts = 3, delay = 500): Promise<boolean> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Check if Telegram WebApp is available and has initData
    if (window.Telegram?.WebApp?.initData) {
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
  
  // Try to wait for Telegram initData (with a short timeout)
  const hasTelegramData = await waitForTelegramInitData();
  
  // Check for and add Telegram WebApp authentication
  if (hasTelegramData && window.Telegram?.WebApp?.initData) {
    headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
    console.log('[API] Telegram initData found and added to request headers');
  } else {
    console.warn('[API] No Telegram initData available after retry attempts - authentication may fail');
  }
  if (data) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json(); // Parse JSON response
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
    
    // Check for and add Telegram WebApp authentication
    if (hasTelegramData && window.Telegram?.WebApp?.initData) {
      headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      console.log('[API] Telegram initData found and added to query request headers');
    } else {
      console.warn('[API] No Telegram initData available in query after retry attempts - authentication may fail');
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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