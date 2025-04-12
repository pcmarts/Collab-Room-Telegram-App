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
 * Uses pure HTML button with !important CSS classes to force visibility
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
  return (
    <button
      type={type as "button" | "submit" | "reset"}
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-center py-2 px-4 rounded font-bold telegram-button ${className}`}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        filter: "none",
        boxShadow: "none",
        outline: "none",
        textShadow: "none"
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
 * Container for fixed bottom buttons with enhanced visibility in Telegram
 * Uses !important CSS class to force visibility
 */
export function TelegramFixedButtonContainer({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="telegram-fixed-container">
      {children}
    </div>
  );
}