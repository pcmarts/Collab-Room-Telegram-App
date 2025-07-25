/**
 * Utility functions for haptic feedback through Telegram WebApp
 */

/**
 * Trigger haptic feedback for button presses
 * @param type The type of haptic feedback to trigger
 */
export const triggerHapticFeedback = (type: 'impact' | 'notification' | 'selection' | 'light' = 'impact') => {
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
      case 'light':
        haptic.impactOccurred('light');
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