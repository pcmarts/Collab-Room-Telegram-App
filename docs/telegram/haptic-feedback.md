# Telegram Haptic Feedback Integration

## Overview

The Collab Room leverages Telegram's WebApp API to provide haptic feedback (vibration) on mobile devices, enhancing the user experience with tactile responses to interactions.

## Telegram WebApp HapticFeedback API

Telegram's WebApp provides a built-in API for triggering haptic feedback on mobile devices. This API is accessed through the `window.Telegram.WebApp.HapticFeedback` object and offers three main types of haptic feedback:

1. **Impact**: Physical tap sensation with varying intensity
2. **Notification**: Distinct patterns for success, warning, or error notifications
3. **Selection**: Subtle feedback for selection changes

## Implementation

### Haptics Utility Module

The application implements a dedicated haptics utility module in `client/src/lib/haptics.ts` that provides a standardized interface for triggering various types of haptic feedback:

```typescript
/**
 * Utility functions for haptic feedback through Telegram WebApp
 */

/**
 * Trigger haptic feedback for button presses
 * @param type The type of haptic feedback to trigger
 */
export const triggerHapticFeedback = (type: 'impact' | 'notification' | 'selection' = 'impact') => {
  // Check if Telegram WebApp and HapticFeedback is available
  if (!window.Telegram?.WebApp?.HapticFeedback) {
    console.log('Haptic feedback not available in this environment');
    return;
  }

  const haptic = window.Telegram.WebApp.HapticFeedback;

  try {
    switch (type) {
      case 'impact':
        haptic.impactOccurred('medium');
        break;
      case 'notification':
        haptic.notificationOccurred('success');
        break;
      case 'selection':
        haptic.selectionChanged();
        break;
      default:
        haptic.impactOccurred('medium');
    }
  } catch (error) {
    console.error('Error triggering haptic feedback:', error);
  }
};

/**
 * Trigger swipe action haptic feedback
 * @param direction 'left' or 'right' swipe direction
 */
export const triggerSwipeHaptic = (direction: 'left' | 'right') => {
  // Check if Telegram WebApp and HapticFeedback is available
  if (!window.Telegram?.WebApp?.HapticFeedback) {
    console.log('Haptic feedback not available in this environment');
    return;
  }

  const haptic = window.Telegram.WebApp.HapticFeedback;

  try {
    if (direction === 'right') {
      // Success haptic - for right swipe (accept/request)
      haptic.notificationOccurred('success');
      // Add a slight delay for more tactile feedback
      setTimeout(() => haptic.impactOccurred('light'), 100);
    } else {
      // Error haptic - for left swipe (reject/pass)
      haptic.impactOccurred('rigid');
    }
  } catch (error) {
    console.error('Error triggering swipe haptic feedback:', error);
  }
};
```

### Integration with SwipeableCard Component

The haptic feedback system is integrated with the SwipeableCard component to provide tactile feedback during swipe interactions:

```typescript
// Button click handler
const handleButtonClick = async (direction: "left" | "right", note?: string) => {
  try {
    // Trigger haptic feedback for button press
    triggerHapticFeedback('impact');
    
    // If it's a right swipe (request) and not a potential match, show the note dialog
    if (direction === "right" && !data.isPotentialMatch && !note) {
      setShowNoteDialog(true);
      return;
    }
    
    setExitX(direction === 'right' ? 1000 : -1000);
    await handleSwipe(direction, note);
    
    // Trigger directional haptic feedback for swipe action
    triggerSwipeHaptic(direction);
    
    // Show toast notification for successful right swipe
    if (direction === "right") {
      toast({
        title: "Collaboration Request Sent",
        description: "The host will be notified of your interest.",
        variant: "default",
        duration: 3000,
      });
    }
  } catch (error) {
    console.error("Error handling button click:", error);
    // Error handling...
  }
};

// Drag end handler
const handleDragEnd = async (e: any, info: any) => {
  // ...existing code...
  
  // Consider it a swipe only if dragged more than 100px
  if (dragDistance > 100) {
    const direction = xOffset > 0 ? "right" : "left";
    
    // Trigger haptic feedback for swipe action
    triggerSwipeHaptic(direction);
    
    // ...existing code...
  }
  // ...existing code...
};
```

## Type Definitions

The Telegram WebApp type definitions have been updated to include the HapticFeedback API:

```typescript
// client/src/types/telegram.d.ts
interface TelegramWebApp {
  // ...existing properties...
  
  // Haptic feedback methods
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  
  // ...other properties...
}
```

## Fallback Behavior

The haptic feedback system implements graceful fallbacks for environments where the Telegram WebApp API or haptic feedback is not available:

1. First checks for the existence of `window.Telegram?.WebApp?.HapticFeedback`
2. If not available, logs a debug message and returns without error
3. In desktop environments or non-Telegram WebApps, the visual feedback (toasts, animations) still works

## User Experience Benefits

Haptic feedback provides several benefits to the mobile user experience:

1. **Immediate Tactile Confirmation**: Users feel a physical response to their actions
2. **Differentiated Interactions**: Different haptic patterns help users distinguish between action types
3. **Multi-sensory Feedback**: Combined with visual cues, creates a richer interaction model
4. **Reduced Cognitive Load**: Physical feedback reduces the need to visually confirm actions
5. **Native App-like Experience**: Makes the web application feel more like a native mobile app

## Best Practices

When implementing haptic feedback:

1. **Use Sparingly**: Reserve haptic feedback for meaningful interactions to prevent feedback fatigue
2. **Be Consistent**: Use the same haptic patterns for similar actions throughout the app
3. **Test on Different Devices**: Haptic feedback may vary between device models
4. **Always Have Fallbacks**: Ensure the application works properly when haptic feedback is unavailable
5. **Pair with Visual Feedback**: Always combine haptic feedback with visual cues for accessibility