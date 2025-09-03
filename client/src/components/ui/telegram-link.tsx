import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TelegramLinkProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  debugLog?: boolean;
}

interface TelegramButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  loadingText?: string;
  text: string;
  disabled?: boolean;
  className?: string;
}

interface TelegramFixedButtonContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A simple link component for Telegram WebApp that uses direct href changes
 * instead of JavaScript to handle link navigation. This is more reliable
 * on mobile Telegram WebApp which often has issues with JavaScript-based navigation.
 */
export function TelegramLink({
  url,
  children,
  className = '',
  style = {},
  debugLog = true
}: TelegramLinkProps) {
  // We'll create a direct handler that just forces location change
  const handleClick = (e: React.MouseEvent) => {
    if (debugLog) console.log(`[TelegramLink] Click triggered for ${url}`);
    e.stopPropagation();
    e.preventDefault();
    
    // Force direct href change for maximum compatibility
    window.location.href = url;
  };
  
  return (
    <a 
      href={url}
      className={`inline-block ${className}`}
      style={{
        cursor: 'pointer',
        position: 'relative',
        zIndex: 9999,
        ...style
      }}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

/**
 * A higher-order component that wraps any component with TelegramLink functionality
 * 
 * @param Component The component to wrap
 * @param url The URL to open when clicked
 * @returns A wrapped component
 */
export function withTelegramLink<P extends object>(
  Component: React.ComponentType<P>,
  url: string
): React.FC<P> {
  return (props: P) => (
    <TelegramLink url={url}>
      <Component {...props} />
    </TelegramLink>
  );
}

/**
 * A button component optimized for Telegram WebApp functionality
 */
export function TelegramButton({
  type = 'button',
  onClick,
  isLoading = false,
  loadingText = 'Loading...',
  text,
  disabled = false,
  className = ''
}: TelegramButtonProps) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full ${className}`}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : text}
    </Button>
  );
}

/**
 * A fixed position container for buttons in Telegram WebApp
 * This ensures buttons remain visible even when virtual keyboard is open
 */
export function TelegramFixedButtonContainer({
  children,
  className = ''
}: TelegramFixedButtonContainerProps) {
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export default TelegramLink;