import React from 'react';
import { Twitter, Link as LinkIcon, FileText, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define button types and their styling
type ButtonType = 'twitter' | 'podcast' | 'blog' | 'generic';

// Style configs for different button types
const typeStyles = {
  twitter: {
    icon: Twitter,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-300'
  },
  podcast: {
    icon: Mic,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-300'
  },
  blog: {
    icon: FileText,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-300'
  },
  generic: {
    icon: LinkIcon,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300'
  }
};

interface DirectButtonProps {
  url: string;
  label: string;
  type?: ButtonType;
  className?: string;
}

/**
 * DirectButton - A button specifically designed to work on Telegram WebApp
 * This component bypasses the entire React event system and uses direct DOM methods
 * to ensure maximum compatibility with Telegram WebApp on mobile.
 */
export default function DirectButton({
  url,
  label,
  type = 'generic',
  className
}: DirectButtonProps) {
  // Get the style config for this button type
  const style = typeStyles[type];
  const Icon = style.icon;

  // Instead of using React events, we'll attach a direct DOM click event
  const buttonRef = React.useRef<HTMLAnchorElement>(null);
  
  React.useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    
    // This is a special hack to make links work in Telegram WebApp on mobile
    // It bypasses the React event system entirely
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      console.log(`[DirectButton] Clicked: ${url}`);
      
      try {
        // Try Telegram WebApp API first
        if (window.Telegram?.WebApp?.openLink) {
          console.log("[DirectButton] Using Telegram.WebApp.openLink");
          window.Telegram.WebApp.openLink(url);
        } else {
          // Fallback to direct window location
          console.log("[DirectButton] Falling back to window.location");
          window.location.href = url;
        }
      } catch (error) {
        console.error("[DirectButton] Error opening link:", error);
        window.open(url, '_blank');
      }
      
      return false;
    };
    
    // Add raw DOM event listeners for maximum compatibility
    button.addEventListener('click', handleClick);
    
    // Add touch events for mobile
    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleClick(new MouseEvent('click'));
    });
    
    // Cleanup on unmount
    return () => {
      button.removeEventListener('click', handleClick);
      button.removeEventListener('touchend', handleClick as any);
    };
  }, [url]);
  
  return (
    <a
      ref={buttonRef}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
      className={cn(
        `direct-button ${style.bgColor} ${style.textColor} ${style.borderColor} border
        flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm
        min-h-10 w-full my-2`,
        className
      )}
      // We add these but they'll likely be overridden by our direct DOM event listeners
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  );
}

// For TypeScript
interface TelegramWebApp {
  openLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}