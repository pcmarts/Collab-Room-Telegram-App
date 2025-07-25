/**
 * Mobile keyboard detection and bottom navigation management
 */
import { useState, useEffect } from 'react';

class MobileKeyboardManager {
  private initialViewportHeight: number;
  private currentViewportHeight: number;
  private keyboardThreshold: number = 150; // Minimum height change to consider keyboard open
  private isKeyboardOpen: boolean = false;
  private callbacks: Array<(isOpen: boolean) => void> = [];
  
  constructor() {
    this.initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    this.currentViewportHeight = this.initialViewportHeight;
    this.init();
  }
  
  private init() {
    // Use Visual Viewport API if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleViewportChange.bind(this));
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', this.handleViewportChange.bind(this));
    }
    
    // Handle input focus/blur events
    document.addEventListener('focusin', this.handleInputFocus.bind(this));
    document.addEventListener('focusout', this.handleInputBlur.bind(this));
  }
  
  private handleViewportChange() {
    const currentHeight = window.visualViewport?.height || window.innerHeight;
    const heightDifference = this.initialViewportHeight - currentHeight;
    
    this.currentViewportHeight = currentHeight;
    
    const wasKeyboardOpen = this.isKeyboardOpen;
    this.isKeyboardOpen = heightDifference > this.keyboardThreshold;
    
    if (wasKeyboardOpen !== this.isKeyboardOpen) {
      this.updateBodyState();
      this.notifyCallbacks();
    }
  }
  
  private handleInputFocus(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (this.isFormInput(target)) {
      // Small delay to allow viewport change to register
      setTimeout(() => {
        if (!this.isKeyboardOpen) {
          this.isKeyboardOpen = true;
          this.updateBodyState();
          this.notifyCallbacks();
        }
      }, 300);
    }
  }
  
  private handleInputBlur() {
    // Delay check to allow for rapid input switching
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (!activeElement || !this.isFormInput(activeElement as HTMLElement)) {
        if (this.isKeyboardOpen) {
          this.isKeyboardOpen = false;
          this.updateBodyState();
          this.notifyCallbacks();
        }
      }
    }, 300);
  }
  
  private isFormInput(element: HTMLElement): boolean {
    const inputTypes = ['input', 'textarea', 'select'];
    const tagName = element.tagName.toLowerCase();
    const isContentEditable = element.contentEditable === 'true';
    
    return inputTypes.includes(tagName) || isContentEditable;
  }
  
  private updateBodyState() {
    document.body.setAttribute('data-keyboard-open', this.isKeyboardOpen.toString());
    
    // Option 1: Hide bottom navigation when keyboard is open
    this.hideBottomNavigation(this.isKeyboardOpen);
  }
  
  private hideBottomNavigation(hide: boolean) {
    const bottomNav = document.querySelector('nav[class*="fixed"][class*="bottom-0"]') as HTMLElement;
    if (bottomNav) {
      if (hide) {
        bottomNav.style.transform = 'translateY(100%)';
        bottomNav.style.transition = 'transform 0.3s ease';
      } else {
        bottomNav.style.transform = 'translateY(0)';
        bottomNav.style.transition = 'transform 0.3s ease';
      }
    }
  }
  
  public onKeyboardToggle(callback: (isOpen: boolean) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  
  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.isKeyboardOpen));
  }
  
  public getKeyboardState() {
    return {
      isOpen: this.isKeyboardOpen,
      viewportHeight: this.currentViewportHeight,
      heightDifference: this.initialViewportHeight - this.currentViewportHeight
    };
  }
  
  public destroy() {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleViewportChange.bind(this));
    } else {
      window.removeEventListener('resize', this.handleViewportChange.bind(this));
    }
    
    document.removeEventListener('focusin', this.handleInputFocus.bind(this));
    document.removeEventListener('focusout', this.handleInputBlur.bind(this));
    
    this.callbacks = [];
  }
}

// Create a singleton instance
export const mobileKeyboardManager = new MobileKeyboardManager();

// React hook for using the keyboard state
export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  useEffect(() => {
    const unsubscribe = mobileKeyboardManager.onKeyboardToggle(setIsKeyboardOpen);
    
    // Set initial state
    setIsKeyboardOpen(mobileKeyboardManager.getKeyboardState().isOpen);
    
    return unsubscribe;
  }, []);
  
  return {
    isKeyboardOpen,
    keyboardState: mobileKeyboardManager.getKeyboardState()
  };
}