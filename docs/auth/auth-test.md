# Authentication Testing Page

The Collab Room includes a dedicated authentication testing page that allows developers and administrators to verify that the authentication system is working correctly. This document explains the purpose, functionality, and implementation of the auth-test page.

## Overview

The auth-test page (available at `/auth-test`) provides a simple interface to test the multi-layered authentication system:

1. Allows testing all authentication layers in a single place
2. Provides visual feedback on authentication success or failure
3. Shows detailed information about the authenticated user
4. Helps diagnose authentication issues in different environments

## Features

The auth-test page includes the following features:

### 1. Authentication Test Button

A button that makes an API request to `/api/profile` using the standard authentication headers:

- Tests whether the current session can successfully authenticate
- Verifies that the apiRequest utility is correctly including authentication headers
- Shows the user ID if authentication is successful

### 2. Authentication Mechanism Display

Shows which authentication method was used to successfully authenticate:

- Session cookie
- Telegram initialization data
- Telegram user ID header (fallback)

### 3. User Information Display

Shows detailed information about the authenticated user:

- User ID
- Telegram ID
- First and last name
- Account status (approved, admin, etc.)

### 4. Local Storage Information

Displays the contents of localStorage related to authentication:

- Telegram user ID
- When it was last stored
- Whether it matches the current user

## Implementation

The auth-test page is implemented as a React component:

```tsx
// In client/src/pages/auth-test.tsx
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { getTelegramUserId } from "@/lib/telegram";
import { Button } from "@/components/ui/button";

export default function AuthTest() {
  const [userId, setUserId] = useState<string | null>(null);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testAuth = async () => {
    try {
      setError(null);
      
      // Test authentication by making a request to /api/profile
      const response = await apiRequest("/api/profile");
      
      if (response.user) {
        setUserId(response.user.id);
        setTelegramId(response.user.telegram_id);
        setUserName(`${response.user.first_name} ${response.user.last_name}`);
        
        // Determine which auth method was used (from response header)
        setAuthMethod(response.auth_method || "Unknown");
      } else {
        setError("No user data returned");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      setError(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const storedTelegramId = getTelegramUserId();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="mb-4">
        <Button onClick={testAuth}>Test Authentication</Button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {userId && (
        <div className="p-4 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h2 className="font-bold mb-2">Authentication Successful</h2>
          <p><strong>User ID:</strong> {userId}</p>
          <p><strong>Telegram ID:</strong> {telegramId}</p>
          <p><strong>Name:</strong> {userName}</p>
          <p><strong>Auth Method:</strong> {authMethod}</p>
        </div>
      )}
      
      <div className="p-4 mb-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
        <h2 className="font-bold mb-2">Local Storage</h2>
        <p><strong>Telegram ID:</strong> {storedTelegramId || "Not stored"}</p>
        
        {storedTelegramId && telegramId && (
          <p>
            <strong>Match Status:</strong>{" "}
            {storedTelegramId === telegramId ? "✅ Matches current user" : "❌ Does not match current user"}
          </p>
        )}
      </div>
    </div>
  );
}
```

## Server-Side Support

The server adds the authentication method to the response for debugging purposes:

```typescript
// In server/routes.ts (simplified)
app.get("/api/profile", authenticateUser, async (req, res) => {
  try {
    // Get the authenticated user
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });
    
    // Add authentication method to the response
    res.json({
      user,
      auth_method: req.authMethod, // Added by the authentication middleware
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});
```

## How to Use

1. Navigate to `/auth-test` in the application
2. Click the "Test Authentication" button
3. Review the authentication results
4. If authentication fails, check the error message for troubleshooting

## Common Issues and Troubleshooting

### 1. Authentication Failed

If the authentication test fails, check the following:

- Ensure you're logged in through Telegram
- Verify that localStorage has a valid Telegram user ID
- Check browser console for any errors
- Ensure the server is running properly

### 2. Auth Method Mismatch

If the auth method is not what you expect:

- For sessions: Make sure cookies are enabled
- For Telegram initData: Ensure you've opened the app through Telegram
- For the Telegram user ID fallback: Check that localStorage contains the correct ID

## Implementation Notes

- The auth-test page was added in version 1.4.7 to help verify the authentication fallback mechanism
- This page is intended for development and debugging purposes
- In a production environment, access to this page should be restricted to administrators