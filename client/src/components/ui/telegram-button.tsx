import React, { useEffect } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TelegramButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  text: string;
}

/**
 * Special button component with explicit styling to ensure visibility in Telegram mobile browser
 */
export function TelegramButton({
  isLoading = false,
  loadingText = "Loading...",
  text,
  className = "",
  ...props
}: TelegramButtonProps) {
  return (
    <button
      className={`w-full font-bold py-3 px-4 rounded-md ${className}`}
      type={props.type || "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      // Extremely explicit inline styles to force visibility in Telegram mobile
      style={{ 
        color: "white", 
        backgroundColor: "#4034B9",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 9999,
        fontWeight: "bold",
        fontSize: "16px",
        height: "48px",
        margin: "0",
        cursor: "pointer",
        // Super aggressive visibility settings
        opacity: 1,
        visibility: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        WebkitAppearance: "none",
        MozAppearance: "none",
        appearance: "none"
      }}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" style={{ display: "inline-block" }} />
          {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  );
}

/**
 * Container for fixed bottom buttons with enhanced visibility in Telegram
 */
export function TelegramFixedButtonContainer({
  children
}: {
  children: React.ReactNode;
}) {
  // Use effect to ensure body has enough padding at the bottom
  useEffect(() => {
    // Add padding to body to account for fixed button
    document.body.style.paddingBottom = "80px";
    
    return () => {
      // Cleanup
      document.body.style.paddingBottom = "";
    };
  }, []);
  
  return (
    <div 
      className="telegram-button-container"
      style={{
        zIndex: 9999,
        visibility: "visible",
        opacity: 1,
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100%",
        padding: "16px",
        backgroundColor: "#000000",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.2)",
        display: "block",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)"
      }}
    >
      {children}
    </div>
  );
}