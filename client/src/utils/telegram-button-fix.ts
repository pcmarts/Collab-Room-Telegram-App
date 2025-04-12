/**
 * Telegram button visibility fix
 * 
 * This script creates a more aggressive fix for Telegram's WebApp to ensure
 * buttons are always visible, by directly overriding styles and injecting
 * CSS rules into the document head.
 */

export function initTelegramButtonFix(): void {
  if (typeof window === 'undefined') return;

  // Inject a global CSS to enforce styles
  const injectGlobalCSS = () => {
    // Remove any existing style element we might have added before
    const existingStyle = document.getElementById('telegram-button-fix-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create a style element
    const style = document.createElement('style');
    style.id = 'telegram-button-fix-styles';
    style.innerHTML = `
      /* Ultra-aggressive button styles */
      .telegram-button {
        color: white !important;
        background-color: #4034B9 !important;
        border: none !important;
        z-index: 99999 !important;
        position: relative !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        height: 48px !important;
        width: 100% !important;
        padding: 10px 16px !important;
        margin: 0 !important;
        pointer-events: auto !important;
        font-size: 16px !important;
        font-weight: bold !important;
        border-radius: 6px !important;
        box-shadow: none !important;
        cursor: pointer !important;
        filter: none !important;
        transform: none !important;
        transition: none !important;
        text-shadow: none !important;
        outline: none !important;
      }
      
      /* Fixed container styles */
      .telegram-fixed-container {
        z-index: 99999 !important;
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        padding: 16px !important;
        background-color: black !important;
        width: 100% !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        border-top: 1px solid rgba(255,255,255,0.1) !important;
        box-shadow: 0 -4px 10px rgba(0,0,0,0.2) !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
      }
      
      /* Special overrides for Telegram's WebApp */
      html body.with-reactjs-ui div .telegram-fixed-container,
      html body.with-reactjs-ui div .telegram-button {
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
      }
    `;
    
    // Add it to the document head
    document.head.appendChild(style);
  };

  // Direct style application function
  const applyStyleDirectly = () => {
    // Select all telegram buttons
    const telegramButtons = document.querySelectorAll('.telegram-button');
    const telegramContainers = document.querySelectorAll('.telegram-fixed-container');
    
    // Fix buttons with direct style application
    telegramButtons.forEach(button => {
      if (button instanceof HTMLElement) {
        // Force all critical properties
        const buttonStyles = {
          'opacity': '1',
          'visibility': 'visible',
          'display': 'flex',
          'position': 'relative',
          'z-index': '99999',
          'color': 'white',
          'background-color': '#4034B9',
          'box-shadow': 'none',
          'border': 'none',
          'pointer-events': 'auto',
          'filter': 'none',
          'outline': 'none',
          'text-shadow': 'none',
          'transition': 'none',
          'transform': 'none',
          'height': '48px',
          'width': '100%',
          'font-size': '16px',
          'font-weight': 'bold',
          'justify-content': 'center',
          'align-items': 'center',
          'border-radius': '6px',
          'cursor': 'pointer',
          'margin': '0'
        };
        
        // Apply all styles with !important
        Object.entries(buttonStyles).forEach(([property, value]) => {
          button.style.setProperty(property, value, 'important');
        });
      }
    });

    // Fix containers with direct style application
    telegramContainers.forEach(container => {
      if (container instanceof HTMLElement) {
        // Force all critical properties
        const containerStyles = {
          'opacity': '1',
          'visibility': 'visible',
          'display': 'block',
          'position': 'fixed',
          'bottom': '0',
          'left': '0',
          'right': '0',
          'z-index': '99999',
          'width': '100%',
          'background-color': 'black',
          'pointer-events': 'auto',
          'padding': '16px',
          'border-top': '1px solid rgba(255,255,255,0.1)',
          'box-shadow': '0 -4px 10px rgba(0,0,0,0.2)',
          'transform': 'translateZ(0)',
          '-webkit-transform': 'translateZ(0)'
        };
        
        // Apply all styles with !important
        Object.entries(containerStyles).forEach(([property, value]) => {
          container.style.setProperty(property, value, 'important');
        });
      }
    });
  };

  // Execute both fixes when DOM is ready
  const initFixes = () => {
    // Apply CSS injection
    injectGlobalCSS();
    
    // Apply direct styles
    applyStyleDirectly();
    
    // Set up MutationObserver to detect new elements or style changes
    const observer = new MutationObserver(() => {
      applyStyleDirectly();
    });
    
    // Start observing the entire document
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Super aggressive interval to keep reapplying
    const intervalId = setInterval(() => {
      applyStyleDirectly();
      // Reapply CSS injection occasionally in case it got removed
      if (Math.random() < 0.2) { // 20% chance each time
        injectGlobalCSS();
      }
    }, 200); // More frequent than before
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      observer.disconnect();
      const styleElement = document.getElementById('telegram-button-fix-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  };

  // Immediately try to apply fixes
  initFixes();
  
  // Also apply when DOM is ready
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initFixes);
  }
  
  // Final fallback - apply after window load
  window.addEventListener('load', initFixes);
}