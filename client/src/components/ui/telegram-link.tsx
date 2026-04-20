import React from 'react';

interface TelegramLinkProps {
  url: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  debugLog?: boolean;
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

export default TelegramLink;