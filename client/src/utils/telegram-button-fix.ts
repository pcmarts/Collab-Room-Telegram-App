/**
 * Telegram button visibility fix
 * 
 * This script creates a tiny MutationObserver to ensure that any buttons with
 * the telegram-button class are always visible, regardless of what Telegram's
 * WebApp might be doing to hide or modify them.
 */

export function initTelegramButtonFix(): void {
  if (typeof window === 'undefined') return;

  // Wait for DOM to be ready
  window.addEventListener('DOMContentLoaded', () => {
    // Set up a MutationObserver to watch for style changes
    const observer = new MutationObserver((mutations) => {
      // Select all telegram buttons
      const telegramButtons = document.querySelectorAll('.telegram-button');
      const telegramContainers = document.querySelectorAll('.telegram-fixed-container');
      
      // Fix buttons
      telegramButtons.forEach(button => {
        if (button instanceof HTMLElement) {
          // Force button to be visible
          button.style.setProperty('opacity', '1', 'important');
          button.style.setProperty('visibility', 'visible', 'important');
          button.style.setProperty('display', 'inline-flex', 'important');
          button.style.setProperty('position', 'relative', 'important');
          button.style.setProperty('z-index', '9999', 'important');
          button.style.setProperty('color', 'white', 'important');
          button.style.setProperty('background-color', '#4034B9', 'important');
          button.style.setProperty('box-shadow', 'none', 'important');
          button.style.setProperty('border', '1px solid rgba(255,255,255,0.1)', 'important');
          button.style.setProperty('pointer-events', 'auto', 'important');
        }
      });

      // Fix containers
      telegramContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          // Force container to be visible
          container.style.setProperty('opacity', '1', 'important');
          container.style.setProperty('visibility', 'visible', 'important');
          container.style.setProperty('display', 'block', 'important');
          container.style.setProperty('position', 'fixed', 'important');
          container.style.setProperty('bottom', '0', 'important');
          container.style.setProperty('left', '0', 'important');
          container.style.setProperty('right', '0', 'important');
          container.style.setProperty('z-index', '9999', 'important');
          container.style.setProperty('width', '100%', 'important');
          container.style.setProperty('background-color', 'black', 'important');
          container.style.setProperty('pointer-events', 'auto', 'important');
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      subtree: true, 
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Re-apply every 500ms to be super safe
    setInterval(() => {
      const telegramButtons = document.querySelectorAll('.telegram-button');
      const telegramContainers = document.querySelectorAll('.telegram-fixed-container');
      
      telegramButtons.forEach(button => {
        if (button instanceof HTMLElement) {
          button.style.setProperty('opacity', '1', 'important');
          button.style.setProperty('visibility', 'visible', 'important');
        }
      });

      telegramContainers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.style.setProperty('opacity', '1', 'important');
          container.style.setProperty('visibility', 'visible', 'important');
        }
      });
    }, 500);
  });
}