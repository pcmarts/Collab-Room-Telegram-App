import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo, DisplayHeading, Eyebrow } from "@/components/brand";

interface AuthenticationErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const AuthenticationError: React.FC<AuthenticationErrorProps> = ({
  message = "Authentication error",
  onRetry,
}) => {
  const [isAttemptingReconnect, setIsAttemptingReconnect] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    console.log('[Auth] Auto-reconnect on mount has been disabled');
  }, []);

  const handleReconnect = () => {
    setIsAttemptingReconnect(true);
    setAttemptCount(prev => prev + 1);

    const attemptSequence = async () => {
      if (window.Telegram?.WebApp) {
        console.log('[Auth] Attempting to refresh Telegram WebApp connection');
        try {
          for (let i = 0; i < 3; i++) {
            console.log(`[Auth] Reconnection attempt ${i + 1}/3`);
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            const initDataAvailable = !!window.Telegram.WebApp.initData;
            if (initDataAvailable) {
              console.log('[Auth] Successfully reconnected to Telegram WebApp');
              if (onRetry) {
                onRetry();
                await new Promise(resolve => setTimeout(resolve, 1000));
                setIsAttemptingReconnect(false);
                return;
              }
            }
          }
          console.warn('[Auth] Failed to reconnect after multiple attempts');
        } catch (e) {
          console.error('[Auth] Error refreshing Telegram WebApp:', e);
        }
      } else {
        console.warn('[Auth] Telegram WebApp not available - make sure you\'re opening this app from Telegram');
      }
      setIsAttemptingReconnect(false);
    };

    attemptSequence();
  };

  const handleFullReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="px-6 pt-8">
        <Logo size={48} variant="dark" withWordmark />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md flex flex-col items-start gap-6">
          <Eyebrow tone="muted">Authentication required</Eyebrow>
          <DisplayHeading size="xl" accent="through Telegram.">
            Open this app
          </DisplayHeading>
          <p className="text-text-muted text-base">
            {message || "Unable to authenticate with Telegram. The app must be opened from inside Telegram to function."}
          </p>

          <Button
            onClick={handleFullReload}
            className="bg-brand text-brand-fg hover:bg-brand-hover h-11 px-5"
          >
            Reload
          </Button>

          <div className="w-full mt-2 rounded-md border border-hairline bg-surface p-4">
            <Eyebrow tone="muted" className="mb-3">How to access</Eyebrow>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-text">
              <li>Open the Telegram app</li>
              <li>Go to the CollabRoom bot</li>
              <li>Tap the Discover button</li>
            </ol>
          </div>

          {attemptCount > 2 && (
            <div className="w-full rounded-md border border-warm-accent/30 bg-warm-surface p-4">
              <Eyebrow tone="warm" className="mb-2">Still having trouble?</Eyebrow>
              <ul className="list-disc pl-5 space-y-1 text-sm text-text">
                <li>Use the official Telegram app</li>
                <li>Close and reopen Telegram</li>
                <li>Check your internet connection</li>
                <li>Open the app again from the bot menu</li>
                <li>iOS: try Safari instead of in-app browser</li>
                <li>Android: set Chrome as default browser</li>
              </ul>
            </div>
          )}

          {attemptCount > 4 && (
            <div className="w-full rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <Eyebrow tone="muted" className="mb-2 text-destructive">Connection issue detected</Eyebrow>
              <p className="text-sm text-text mb-2">
                We can't reach Telegram. Try this:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-text">
                <li>Quit Telegram completely</li>
                <li>Reopen Telegram and wait a few seconds</li>
                <li>Go to @CollabRoomBot and start a new session</li>
                <li>Open the app again from the bot menu</li>
              </ol>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
