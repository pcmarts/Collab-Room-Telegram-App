/**
 * Utility for making API requests with proper Telegram authentication handling
 * Based on the implementation in queryClient.ts
 */

// Get Telegram user ID from localStorage if available
export function getTelegramUserId(): string | null {
  try {
    return localStorage.getItem("telegram_user_id");
  } catch (e) {
    console.warn('Error accessing localStorage for telegram_user_id:', e);
    return null;
  }
}

// Store Telegram user ID in localStorage
export function storeTelegramUserId(telegramData: any) {
  if (telegramData?.id) {
    try {
      localStorage.setItem("telegram_user_id", telegramData.id.toString());
    } catch (e) {
      console.warn('Error storing telegram_user_id in localStorage:', e);
    }
  }
}

/**
 * Makes an API request with proper authentication headers
 * @param url The API endpoint URL
 * @param method The HTTP method (GET, POST, etc.)
 * @param body Optional request body for POST/PUT/PATCH requests
 * @param params Optional URL query parameters
 * @returns The parsed JSON response
 */
export async function apiRequest(
  url: string,
  method = "GET",
  body?: any,
  params?: Record<string, string>
): Promise<any> {
  // Get Telegram authentication data
  const telegramInitData = window.Telegram?.WebApp?.initData || "";
  const telegramUserId = getTelegramUserId();
  
  // Set up headers with authentication data
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (telegramInitData) {
    headers["x-telegram-init-data"] = telegramInitData;
  }
  
  if (telegramUserId) {
    headers["x-telegram-user-id"] = telegramUserId;
  }

  // Add URL parameters if provided
  if (params) {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      urlParams.append(key, value);
    });
    
    // Append parameters to URL
    if (url.includes('?')) {
      url = `${url}&${urlParams.toString()}`;
    } else {
      url = `${url}?${urlParams.toString()}`;
    }
  }
  
  // Set up request options
  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };
  
  // Add body for non-GET requests if provided
  if (method !== "GET" && body !== undefined) {
    options.body = JSON.stringify(body);
  }
  
  // Make the request
  try {
    const response = await fetch(url, options);
    
    // Check for authentication errors
    if (response.status === 401) {
      console.error('[apiRequest] Authentication error:', response.statusText);
      const error = new Error("Unauthorized");
      error.name = "AuthenticationError";
      throw error;
    }
    
    // Check for other errors
    if (!response.ok) {
      console.error(`[apiRequest] Error ${response.status}:`, response.statusText);
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    // Parse response as JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[apiRequest] Request error:', error);
    throw error;
  }
}