import React, { useEffect, useRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { triggerHapticFeedback } from "@/lib/haptics";

interface TelegramButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  text: string;
}

/**
 * Special button component with ultra-aggressive styling to ensure visibility 
 * in Telegram mobile browser under all circumstances
 */
export function TelegramButton({
  isLoading = false,
  loadingText = "Loading...",
  text,
  className = "",
  type = "button",
  disabled = false,
  onClick,
  ...props
}: TelegramButtonProps) {
  // Reference to the button element
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Function to force button styles
  const forceButtonStyles = () => {
    if (buttonRef.current) {
      const styles = {
        'opacity': '1',
        'visibility': 'visible',
        'display': 'flex',
        'position': 'relative',
        'z-index': '99999',
        'color': 'white',
        'background-color': '#4034B9',
        'cursor': disabled ? 'not-allowed' : 'pointer',
        'box-shadow': 'none',
        'border': 'none',
        'border-radius': '6px',
        'pointer-events': 'auto',
        'filter': 'none',
        'outline': 'none',
        'text-shadow': 'none',
        'transition': 'none',
        'transform': 'none',
        'height': '48px',
        'min-height': '48px',
        'width': '100%',
        'font-size': '16px',
        'font-weight': 'bold',
        'justify-content': 'center',
        'align-items': 'center',
        'margin': '0',
        'padding': '10px 16px'
      };
      
      // Apply each style with !important
      Object.entries(styles).forEach(([property, value]) => {
        buttonRef.current?.style.setProperty(property, value, 'important');
      });
    }
  };
  
  // Apply styles on mount and with an interval
  useEffect(() => {
    // Apply immediately
    forceButtonStyles();
    
    // Set timeout to apply again after a short delay instead of continuous interval
    const timeout = setTimeout(forceButtonStyles, 300);
    
    // Clean up on unmount
    return () => clearTimeout(timeout);
  }, [disabled]);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger light haptic feedback on button press
    triggerHapticFeedback('light')
    
    // Call the original onClick handler if provided
    if (onClick) {
      onClick(event)
    }
  }

  return (
    <button
      ref={buttonRef}
      type={type as "button" | "submit" | "reset"}
      disabled={disabled}
      onClick={handleClick}
      className={`w-full text-center py-3 px-4 rounded font-bold telegram-button ${className}`}
      style={{
        // Initial inline styles - will be reinforced by the useEffect
        cursor: disabled ? "not-allowed" : "pointer",
        filter: "none",
        boxShadow: "none",
        outline: "none",
        textShadow: "none",
        backgroundColor: "#4034B9",
        color: "white",
        border: "none",
        fontSize: "16px",
        fontWeight: "bold",
        height: "48px",
        minHeight: "48px",
        opacity: "1",
        visibility: "visible",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        zIndex: "99999",
        width: "100%",
        margin: "0",
        padding: "10px 16px",
        borderRadius: "6px",
        pointerEvents: "auto",
        transform: "none",
        transition: "none"
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  );
}

/**
 * Ultra-aggressive container for fixed bottom buttons with enhanced visibility in Telegram
 * Uses ref-based direct style application to force visibility
 */
export function TelegramFixedButtonContainer({
  children
}: {
  children: React.ReactNode;
}) {
  // Reference to the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Function to force container styles
  const forceContainerStyles = () => {
    if (containerRef.current) {
      const styles = {
        'opacity': '1',
        'visibility': 'visible',
        'display': 'block',
        'position': 'fixed',
        'bottom': '0',
        'left': '0',
        'right': '0',
        'z-index': '99999',
        'width': '100%',
        'background-color': '#ffffff',
        'pointer-events': 'auto',
        'padding': '20px 16px 28px 16px',
        'border-top': '1px solid rgba(0,0,0,0.1)',
        'box-shadow': '0 -4px 10px rgba(0,0,0,0.2)',
        'transform': 'translateZ(0)',
        '-webkit-transform': 'translateZ(0)',
        'min-height': '92px'
      };
      
      // Apply each style with !important
      Object.entries(styles).forEach(([property, value]) => {
        containerRef.current?.style.setProperty(property, value, 'important');
      });
    }
  };
  
  // Apply styles on mount and with an interval
  useEffect(() => {
    // Apply immediately
    forceContainerStyles();
    
    // Set timeout to apply again after a short delay instead of continuous interval
    const timeout = setTimeout(forceContainerStyles, 300);
    
    // Clean up on unmount
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="telegram-fixed-container"
      style={{
        // Initial inline styles - will be reinforced by the useEffect
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        zIndex: "99999",
        padding: "20px 16px 28px 16px",
        backgroundColor: "#ffffff",
        borderTop: "1px solid rgba(0,0,0,0.1)",
        opacity: "1",
        visibility: "visible",
        display: "block",
        width: "100%",
        minHeight: "92px",
        pointerEvents: "auto",
        boxShadow: "0 -4px 10px rgba(0,0,0,0.2)",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)"
      }}
    >
      {children}
    </div>
  );
}