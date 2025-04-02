import React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface AuthenticationErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const AuthenticationError: React.FC<AuthenticationErrorProps> = ({
  message = "Authentication error",
  onRetry,
}) => {
  const handleReload = () => {
    // Try to reload the Telegram WebApp first
    if (window.Telegram?.WebApp) {
      console.log('[Auth] Attempting to refresh Telegram WebApp');
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      } catch (e) {
        console.error('[Auth] Error refreshing Telegram WebApp:', e);
      }
    }
    
    // If there's a custom retry function, call it
    if (onRetry) {
      onRetry();
    } else {
      // Otherwise reload the entire page
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {message || "Unable to authenticate with Telegram. Please try again."}
      </p>
      
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Button 
          onClick={handleReload}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Connection
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure you're opening this app through the Telegram app.
        </p>
        <div className="mt-4 p-4 bg-muted/50 rounded-md text-sm text-left">
          <p className="font-medium mb-1">How to access through Telegram:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open Telegram app</li>
            <li>Go to the CollabRoom bot</li>
            <li>Click on the "Discover" button</li>
          </ol>
        </div>
      </div>
    </div>
  );
};