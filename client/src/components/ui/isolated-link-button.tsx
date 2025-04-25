import React from 'react';
import { Twitter, Link as LinkIcon, FileText, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define allowed link types and their corresponding colors and icons
type LinkType = 'twitter' | 'podcast' | 'blog' | 'generic';

const typeConfig = {
  twitter: {
    icon: Twitter,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'rgba(29, 161, 242, 0.3)'
  },
  podcast: {
    icon: Mic,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  blog: {
    icon: FileText,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  generic: {
    icon: LinkIcon,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'rgba(107, 114, 128, 0.3)'
  }
};

export interface IsolatedLinkButtonProps {
  url: string;
  label: string;
  type?: LinkType;
  className?: string;
}

/**
 * IsolatedLinkButton - A button component specifically designed to 
 * work reliably in Telegram WebApp environment on both desktop and mobile.
 * 
 * This component isolates itself from parent touch/click handlers by:
 * 1. Using position:relative and high z-index
 * 2. Explicitly stopping event propagation
 * 3. Using direct window.location.href navigation
 * 4. Providing large touch targets with clear visual feedback
 */
export function IsolatedLinkButton({
  url,
  label,
  type = 'generic',
  className
}: IsolatedLinkButtonProps) {
  // Get config for this button type
  const config = typeConfig[type];
  const Icon = config.icon;

  // Define click handler that prevents event propagation and navigates
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default behavior and stop propagation to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`[IsolatedLinkButton] Opening ${type} link: ${url}`);
    
    // Try multiple approaches for maximum compatibility
    try {
      // Try Telegram WebApp API first if available
      if (window.Telegram?.WebApp?.openLink) {
        console.log("[IsolatedLinkButton] Using Telegram.WebApp.openLink");
        window.Telegram.WebApp.openLink(url);
      } 
      // Fall back to direct location change
      else {
        console.log("[IsolatedLinkButton] Using window.location.href");
        window.location.href = url;
      }
    } catch (error) {
      console.error("[IsolatedLinkButton] Error opening link:", error);
      // Final fallback
      window.open(url, '_blank');
    }
  };

  return (
    <button
      className={cn(
        `isolated-link-button telegram-direct-link ${config.bgColor} ${config.textColor}`,
        className
      )}
      style={{
        position: 'relative',
        zIndex: 9999,
        border: `1px solid ${config.borderColor}`,
        WebkitTapHighlightColor: 'rgba(0,0,0,0)',
        cursor: 'pointer'
      }}
      onClick={handleClick}
      onTouchStart={(e) => {
        console.log("[IsolatedLinkButton] Button touchstart");
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        console.log("[IsolatedLinkButton] Button touchend");
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        // Prevent touch move events from affecting parent components
        e.stopPropagation();
      }}
    >
      <Icon className="w-4 h-4 mr-2" />
      <span>{label}</span>
    </button>
  );
}

// For TypeScript
interface TelegramWebApp {
  openLink: (url: string) => void;
  // Include other WebApp methods as needed
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}