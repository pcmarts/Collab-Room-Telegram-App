# Notifications System

The Collab Room platform includes a notification system to keep users informed about important events such as matches, application updates, and collaboration status changes.

## Version 1.6.8 Update: Fixed Notification Toggle Persistence

As of Version 1.6.8, the notification persistence issues have been resolved with the following improvements:

1. **Profile API Enhancement**: The `/api/profile` endpoint now includes notification preferences data
2. **Cache Busting Implementation**: Strong cache control headers prevent stale data after preference changes
3. **Improved State Synchronization**: Better handling of boolean values from PostgreSQL
4. **Enhanced Debugging**: Added comprehensive logging of notification preference states

## Version 1.3.9 Update: Simplified Notification Settings

As of Version 1.3.9, the notification handling has been simplified with the following changes:

1. **Removed Frequency Selection**: The notification frequency dropdown has been removed from the dashboard UI
2. **"Instant" as Default**: All notifications are now set to "Instant" frequency by default
3. **Binary Toggle**: Notifications can only be toggled on or off, with no intermediate frequency options
4. **Improved Error Handling**: Enhanced error handling in notification toggle functionality prevents double-processing of API responses

## Technical Implementation

### Dashboard Component

The Dashboard component includes a simple notification toggle UI:

```tsx
{/* Notification Settings */}
<Card className="shadow-sm">
  <CardHeader className="pb-2 px-4 pt-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm flex items-center gap-2">
        <Bell className="h-4 w-4" />
        Notifications
      </CardTitle>
      <div className="flex items-center gap-2">
                  <div className="h-7 text-xs px-2 text-primary">
            {notificationsEnabled ? 'Instant' : 'Never'}
          </div>

        <Switch
          checked={notificationsEnabled}
          onCheckedChange={handleNotificationSettingsChange}
          className="scale-75"
        />
      </div>
    </div>
  </CardHeader>
</Card>
```

### Notification Toggle Handler

The handler for toggling notifications has been simplified to always use "Instant" frequency when enabled:

```tsx
const handleNotificationSettingsChange = async (enabled: boolean) => {
  try {
    setIsSubmitting(true);
    
    const newFrequency = enabled ? 'Instant' : 'Never';
    
    // Update notification preferences using the dedicated notifications endpoint
    await apiRequest('/api/preferences/notifications', 'POST', {
      // Only send the enabled status - the API will automatically set the correct frequency
      notifications_enabled: enabled
    });
    
    // Update the local state if toggling on
    if (enabled) {
      setNotificationFrequency('Instant');
    }

    toast({
      title: "Success",
      description: enabled ? "Notifications have been enabled" : "Notifications have been disabled",
    });
  } catch (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to update notification settings"
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Error Handling Improvements

The API response handling in `apiRequest` function has been updated to prevent double-processing of JSON responses:

```tsx
export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<any> {
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
  return await res.json(); // Parse JSON response only once
}
```

### IMPORTANT: Using apiRequest Return Values Correctly

When using the `apiRequest` function, remember:

1. It returns an already parsed JSON object, not a Response object
2. Never check `response.ok` on the returned value; error checking is already handled internally
3. Never call `response.json()` on the returned value; JSON parsing is already done

**Wrong:**
```tsx
const response = await apiRequest('/api/endpoint', 'POST', data);
if (!response.ok) { // ERROR: response is not a Response object
  const error = await response.json(); // ERROR: response.json is not available
  throw new Error(error.message);
}
```

**Correct:**
```tsx
const responseData = await apiRequest('/api/endpoint', 'POST', data);
// Use responseData directly - it's already parsed JSON
console.log(responseData.success);
```

## Benefits of Simplified Notification Settings

1. **Improved User Experience**: Simplifies the notification settings to a single on/off toggle
2. **Reduced Complexity**: Removes rarely used frequency options that added unnecessary complexity
3. **Faster Notification Delivery**: All notifications are delivered instantly, ensuring users receive time-sensitive alerts
4. **More Reliable API Calls**: Improved error handling prevents issues with repeated JSON parsing

## Future Plans

In future releases, we may explore additional notification settings such as:

1. **Channel Selection**: Allow users to choose which notification channels they prefer (e.g., Telegram, email)
2. **Category Filtering**: Enable users to filter notifications by type (e.g., matches, applications, admin messages)
3. **Custom Notification Schedules**: For specific types of non-urgent notifications