import React from "react";
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
    <Button
      className={`w-full font-bold ${className}`}
      variant="default"
      // Important: these inline styles ensure visibility in Telegram mobile browser
      style={{ 
        color: "white", 
        backgroundColor: "#4034B9",
        boxShadow: "none",
        border: "1px solid rgba(255,255,255,0.1)",
        position: "relative",
        zIndex: 999,
        // Extra visibility insurance
        opacity: 1,
        visibility: "visible",
        display: "flex"
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
    </Button>
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
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-border shadow-lg"
      style={{
        zIndex: 999,
        visibility: "visible",
        opacity: 1,
        // Additional positioning safeguards
        position: "fixed",
        bottom: 0,
        display: "block",
        width: "100%"
      }}
    >
      {children}
    </div>
  );
}