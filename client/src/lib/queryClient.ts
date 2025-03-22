import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<Response> {
  // Add Telegram initData to headers if available
  const headers: Record<string, string> = {};
  if (window.Telegram?.WebApp?.initData) {
    headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
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
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add Telegram initData to headers if available
    const headers: Record<string, string> = {};
    if (window.Telegram?.WebApp?.initData) {
      headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
    }
    
    // For debugging
    console.log(`Query request: ${queryKey[0]}`);

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });
    
    console.log(`Query response status: ${res.status} - ${res.statusText}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    try {
      // Force clone response to ensure we can read it
      const clonedRes = res.clone();
      const text = await clonedRes.text();
      
      console.log(`Response length: ${text.length} bytes`);
      
      try {
        const data = JSON.parse(text);
        console.log(`Parsed data type: ${Array.isArray(data) ? 'array' : typeof data}`);
        if (Array.isArray(data)) {
          console.log(`Array length: ${data.length}`);
        }
        return data;
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`Failed to parse JSON response: ${parseError}`);
      }
    } catch (error) {
      console.error('Error reading response:', error);
      // Fall back to original method
      return await res.json();
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