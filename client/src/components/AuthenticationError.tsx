import React, { useState, useEffect } from "react";
import { RefreshCw, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface AuthenticationErrorProps {
  message?: string;
  onRetry?: () => void;
}

// Session authentication status keys
const SESSION_AUTH_KEY = 'sessionAuthEstablished';
const SESSION_TIME_KEY = 'lastSessionTime';

// Helper to check if we have a valid session
const checkSessionValidity = (): boolean => {
  const sessionAuthStatus = localStorage.getItem(SESSION_AUTH_KEY);
  const hasEstablishedSession = sessionAuthStatus === 'true';
  
  if (hasEstablishedSession) {
    // Check if session is still likely valid (less than 24 hours old)
    const lastSessionTime = parseInt(localStorage.getItem(SESSION_TIME_KEY) || '0', 10);
    const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - lastSessionTime < SESSION_MAX_AGE;
  }
  
  return false;
};

export const AuthenticationError: React.FC<AuthenticationErrorProps> = ({
  message = "Authentication error",
  onRetry,
}) => {
  const [isAttemptingReconnect, setIsAttemptingReconnect] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasValidSession, setHasValidSession] = useState(checkSessionValidity());
  
  useEffect(() => {
    // Auto-retry once on component mount
    if (attemptCount === 0) {
      handleReconnect();
    }
  }, []);

  // Clear session
  const handleClearSession = () => {
    console.log('[Auth] Clearing session authentication data');
    localStorage.removeItem(SESSION_AUTH_KEY);
    localStorage.removeItem(SESSION_TIME_KEY);
    setHasValidSession(false);
    
    // After clearing session, try to reconnect
    setTimeout(handleReconnect, 500);
  };

  const handleReconnect = () => {
    setIsAttemptingReconnect(true);
    setAttemptCount(prev => prev + 1);
    
    // Create a sequence of attempts with increasing delays
    const attemptSequence = async () => {
      // First check if we have a valid session, if so try to use that
      const sessionValid = checkSessionValidity();
      setHasValidSession(sessionValid);
      
      if (sessionValid) {
        console.log('[Auth] Attempting to use existing session');
        // If we have a session, just try the retry function
        if (onRetry) {
          onRetry();
          await new Promise(resolve => setTimeout(resolve, 1000));
          setIsAttemptingReconnect(false);
          return;
        }
      }
      
      // No valid session, try with Telegram WebApp
      if (window.Telegram?.WebApp) {
        console.log('[Auth] Attempting to refresh Telegram WebApp connection');
        try {
          // Try multiple times with increasing delays
          for (let i = 0; i < 3; i++) {
            console.log(`[Auth] Reconnection attempt ${i + 1}/3`);
            
            // Reset any Telegram WebApp state
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            
            // Small delay to let initialization complete (increasing with each attempt)
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            
            // Check if we have init data now
            const initDataAvailable = !!window.Telegram.WebApp.initData;
            if (initDataAvailable) {
              console.log('[Auth] Successfully reconnected to Telegram WebApp');
              
              // Mark that we now have a valid session
              localStorage.setItem(SESSION_AUTH_KEY, 'true');
              localStorage.setItem(SESSION_TIME_KEY, Date.now().toString());
              setHasValidSession(true);
              
              // If there's a custom retry function, call it
              if (onRetry) {
                onRetry();
                // Wait to see if the retry worked before returning
                await new Promise(resolve => setTimeout(resolve, 1000));
                setIsAttemptingReconnect(false);
                return; // Exit early on success
              }
            }
          }
          
          console.warn('[Auth] Failed to reconnect after multiple attempts');
        } catch (e) {
          console.error('[Auth] Error refreshing Telegram WebApp:', e);
        }
      } else {
        console.warn('[Auth] Telegram WebApp not available for reconnection attempt');
      }
      
      // Reset the attempting state regardless of outcome
      setIsAttemptingReconnect(false);
    };
    
    attemptSequence();
  };
  
  const handleFullReload = () => {
    // This performs a complete page reload
    window.location.reload();
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
          onClick={handleReconnect}
          className="flex items-center gap-2"
          disabled={isAttemptingReconnect}
        >
          {isAttemptingReconnect ? (
            <RotateCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isAttemptingReconnect ? "Reconnecting..." : "Reconnect"}
        </Button>
        
        <Button 
          onClick={handleFullReload}
          variant="outline"
          className="mt-2"
          disabled={isAttemptingReconnect}
        >
          Reload Page
        </Button>
        
        {hasValidSession && (
          <Button 
            onClick={handleClearSession}
            variant="destructive"
            className="mt-2 flex items-center gap-2"
            disabled={isAttemptingReconnect}
          >
            <XCircle className="h-4 w-4" />
            Reset Session
          </Button>
        )}
        
        <p className="text-sm text-muted-foreground mt-3">
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
        
        {attemptCount > 2 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-md text-sm text-left">
            <p className="font-medium mb-1 text-yellow-800 dark:text-yellow-400">Still having trouble?</p>
            <ul className="list-disc pl-5 space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>Make sure you're using the official Telegram app</li>
              <li>Try closing and reopening Telegram</li>
              <li>Check your internet connection</li>
              <li>Try accessing through the CollabRoom bot again</li>
              <li>If using iOS, try using Safari instead of in-app browser</li>
              <li>On Android, make sure Chrome is set as default browser</li>
            </ul>
          </div>
        )}
        
        {hasValidSession && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md text-sm text-left">
            <p className="font-medium mb-1 text-blue-800 dark:text-blue-400">Session information</p>
            <p className="mb-2 text-blue-700 dark:text-blue-300">
              A previous session was detected, but we're having trouble with authentication. 
              Try using the "Reset Session" button above to clear your existing session and establish a new one.
            </p>
          </div>
        )}
        
        {attemptCount > 4 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md text-sm text-left">
            <p className="font-medium mb-1 text-red-800 dark:text-red-400">Session issue detected</p>
            <p className="mb-2 text-red-700 dark:text-red-300">
              It looks like your session may have expired or is invalid. Try these steps:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-red-700 dark:text-red-300">
              <li>Exit Telegram completely (close the app)</li>
              <li>Reopen Telegram and wait a few seconds</li>
              <li>Go to @CollabRoomBot and start a new session</li>
              <li>Try accessing the app again from the bot menu</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};