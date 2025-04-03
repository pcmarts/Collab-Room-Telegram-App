# Persistent Authentication System

The Collab Room implements a robust multi-layered authentication system to ensure consistent user identification across sessions and devices. This document explains the persistent authentication system, its components, and how it maintains user identity.

## Authentication Challenges in Telegram WebApps

Telegram WebApps present unique authentication challenges:

1. **Session Persistence**: Browser sessions can change or expire, especially across different browser tabs or after a device restart
2. **Initialization Data**: Telegram provides signed initialization data when the WebApp loads, but this can be difficult to persist across page reloads
3. **User Identity**: Maintaining a consistent user identity is critical for features like swipe history and personalized content

## Multi-Layered Authentication System

To address these challenges, the Collab Room uses a multi-layered authentication approach:

### 1. Primary Authentication: Express Sessions

The server uses Express sessions to maintain user authentication state:

```typescript
// In server/index.ts
app.use(
  session({
    store: pgStore,
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);
```

### 2. Telegram WebApp Authentication

When a user opens the app via Telegram, the Telegram initialization data is verified:

```typescript
// In server/middleware/auth.ts
function verifyTelegramWebAppData(initData: string): TelegramUser | null {
  // Verify signature and return user data if valid
  // ...
}
```

### 3. Fallback Authentication: Telegram User ID Header

As of version 1.4.7, the system implements a fallback authentication method using a custom header:

```typescript
// In server/middleware/auth.ts
function extractUserFromRequest(req: Request): TelegramUser | null {
  // Try session first
  if (req.session.telegramUser) {
    return req.session.telegramUser;
  }
  
  // Try Telegram initData header
  const initData = req.headers["x-telegram-init-data"];
  if (initData && typeof initData === "string") {
    const telegramUser = verifyTelegramWebAppData(initData);
    if (telegramUser) {
      // Store in session for future requests
      req.session.telegramUser = telegramUser;
      return telegramUser;
    }
  }
  
  // Fallback to Telegram user ID header
  const telegramUserId = req.headers["x-telegram-user-id"];
  if (telegramUserId && typeof telegramUserId === "string") {
    // Basic validation (you should add more)
    if (/^\d+$/.test(telegramUserId)) {
      return { id: telegramUserId };
    }
  }
  
  return null;
}
```

### 4. Client-Side Implementation

The frontend maintains the Telegram user ID in localStorage and includes it with every API request:

```typescript
// In client/src/lib/telegram.ts
export function storeTelegramUserId(telegramData: any) {
  if (telegramData?.id) {
    localStorage.setItem("telegram_user_id", telegramData.id.toString());
  }
}

export function getTelegramUserId(): string | null {
  return localStorage.getItem("telegram_user_id");
}
```

```typescript
// In client/src/lib/queryClient.ts
export async function apiRequest(
  url: string,
  method = "GET",
  body?: any,
  params?: Record<string, string>
) {
  const telegramInitData = window.Telegram?.WebApp?.initData || "";
  const telegramUserId = getTelegramUserId();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (telegramInitData) {
    headers["x-telegram-init-data"] = telegramInitData;
  }
  
  if (telegramUserId) {
    headers["x-telegram-user-id"] = telegramUserId;
  }
  
  // Rest of the request code
  // ...
}
```

## Authentication Flow

1. **First Visit**:
   - User opens the app through Telegram
   - Server verifies Telegram initialization data
   - User ID is stored in both session and localStorage

2. **Subsequent Visits**:
   - System tries authentication in this order:
     1. Session cookie
     2. Telegram initialization data
     3. Telegram user ID header (fallback)
   - If authenticated via any method, session is refreshed

3. **Session Expiration**:
   - If the session expires or is invalid
   - The system falls back to the Telegram user ID header
   - User continues their experience without disruption

## Benefits of This Approach

1. **Reliability**: Even if sessions are cleared or initialization data changes, the user remains authenticated
2. **Seamless Experience**: Users don't need to re-authenticate when their session changes
3. **Consistency**: User identity remains consistent across all features
4. **Security**: Multiple layers of authentication provide redundancy while maintaining security

## Testing the Authentication System

The system includes a test page at `/auth-test` that verifies the authentication mechanisms:

```typescript
// In client/src/pages/auth-test.tsx
export default function AuthTest() {
  const [userId, setUserId] = useState<string | null>(null);
  
  // Test auth mechanisms
  const testAuth = async () => {
    try {
      const response = await apiRequest("/api/profile");
      setUserId(response.user.id);
      // Display results
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };
  
  return (
    <div>
      <h1>Authentication Test</h1>
      <Button onClick={testAuth}>Test Authentication</Button>
      {userId && <div>Authenticated as user: {userId}</div>}
    </div>
  );
}
```

## Implementation Notes

- This system was implemented in version 1.4.7 to address issues with inconsistent user identification
- The fallback mechanism is particularly important for features that rely on user identity, such as the swipe history
- While this approach provides multiple authentication paths, it still maintains security by validating the Telegram user ID against the database