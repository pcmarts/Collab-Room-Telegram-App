import React from 'react';
import { openTelegramLink } from '@/utils/TelegramHelper';

interface TelegramLinkProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  debugLog?: boolean;
}

/**
 * A special link component for Telegram WebApp that ensures
 * reliable link opening on all platforms including iOS and Android.
 * 
 * This component renders a full-overlay clickable area to avoid issues
 * with nested containers blocking clicks in Telegram WebApp.
 */
export function TelegramLink({
  url,
  children,
  className = '',
  style = {},
  debugLog = true
}: TelegramLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (debugLog) console.log(`[TelegramLink] Click triggered for ${url}`);
    e.stopPropagation();
    e.preventDefault();
    
    openTelegramLink(url, {
      useTimeout: false,
      forceWindowOpen: true,
      debugLog
    });
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (debugLog) console.log(`[TelegramLink] Touch start for ${url}`);
    e.stopPropagation();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (debugLog) console.log(`[TelegramLink] Touch end for ${url}`);
    e.stopPropagation();
    e.preventDefault();
    
    openTelegramLink(url, {
      useTimeout: false,
      forceWindowOpen: true,
      debugLog
    });
  };
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{
        cursor: 'pointer',
        ...style
      }}
    >
      {children}
      <button
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          zIndex: 9999,
          boxSizing: 'border-box',
          cursor: 'pointer',
          borderRadius: 'inherit'
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        type="button"
        aria-label={`Open ${url}`}
      />
    </div>
  );
}

/**
 * A higher-order component that wraps any component with TelegramLink functionality
 * 
 * @param Component The component to wrap
 * @param url The URL to open when clicked
 * @returns A wrapped component
 */
export function withTelegramLink<P>(
  Component: React.ComponentType<P>,
  url: string
): React.FC<P> {
  return (props: P) => (
    <TelegramLink url={url}>
      <Component {...props} />
    </TelegramLink>
  );
}

export default TelegramLink;