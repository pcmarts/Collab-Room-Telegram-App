# Authentication System Documentation

This directory contains documentation for the authentication system used in the Collab Room application.

## Overview

The Collab Room uses a robust multi-layered authentication system based on Telegram's WebApp API with additional fallback mechanisms to ensure persistent user identity across sessions.

## Authentication Documentation

- [Persistent Authentication System](./persistent-auth.md) - Detailed explanation of the multi-layered authentication system
- [Authentication Testing Page](./auth-test.md) - Documentation for the authentication testing utility

## Key Features

1. **Multi-layered Authentication**:
   - Express session cookies
   - Telegram WebApp initialization data
   - Telegram user ID fallback header

2. **Persistent User Identity**:
   - Client-side caching of Telegram user ID
   - Consistent user identification across sessions
   - Seamless experience even when sessions change

3. **Robust Error Handling**:
   - Graceful fallback when primary authentication fails
   - Detailed logging for debugging authentication issues
   - Testing utilities to verify authentication mechanisms

## Integration with Other Systems

The authentication system is tightly integrated with other core features:

- **Discovery System**: Ensures the same user always has the same swipe history
- **User Profiles**: Consistently identifies the same user across profile updates
- **Notification System**: Ensures notifications are sent to the correct user

## Authentication Flow

1. User opens the application through Telegram
2. Telegram provides signed initialization data
3. Server verifies the data and establishes a session
4. Client stores the Telegram user ID in localStorage
5. For subsequent requests, the system checks multiple authentication methods in order
6. If session authentication fails, the system falls back to the Telegram user ID header

## Implementation History

- **Version 1.0.0**: Basic Telegram WebApp authentication
- **Version 1.2.5**: Added Express session support
- **Version 1.4.7**: Implemented the Telegram user ID fallback system

## Related Documentation

- [API Authentication](../api/README.md#authentication) - API-specific authentication details
- [Swipe Filtering](../discovery/swipe-filtering.md) - How authentication integrates with the discovery system