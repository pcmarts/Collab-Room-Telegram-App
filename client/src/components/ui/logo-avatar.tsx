import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LetterAvatar } from './letter-avatar';

interface LogoAvatarProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * LogoAvatar component tries to load a logo image first 
 * but falls back to a LetterAvatar if the image fails to load
 */
export function LogoAvatar({ name, logoUrl, className, size = 'md' }: LogoAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  
  // Size mappings for the container
  const sizeClasses = {
    'xs': 'h-6 w-6',
    'sm': 'h-8 w-8',
    'md': 'h-10 w-10',
    'lg': 'h-12 w-12',
    'xl': 'h-16 w-16',
  };

  // Process the logo URL to get the best possible version
  useEffect(() => {
    if (!logoUrl) {
      setImageError(true);
      return;
    }
    
    // Reset states when logoUrl changes
    setImageLoaded(false);
    setImageError(false);
    
    // Priority order:
    // 1. Local URLs (starting with /)
    // 2. Twitter URLs (optimize size)
    // 3. Other external URLs (as-is)
    
    // Check if logo is already a local URL
    if (logoUrl.startsWith('/')) {
      console.log(`[LogoAvatar] Using local logo URL: ${logoUrl}`);
      setFinalUrl(logoUrl);
    }
    // Handle Twitter URLs specifically
    else if (logoUrl.includes('pbs.twimg.com')) {
      // Optimize Twitter image quality
      const optimizedUrl = logoUrl.replace('_normal', '_400x400');
      console.log(`[LogoAvatar] Using optimized Twitter URL: ${optimizedUrl}`);
      setFinalUrl(optimizedUrl);
      
      // Special case for XBorg (update once, not every render)
      if (name?.toLowerCase().includes('xborg') && !finalUrl) {
        console.log('[LogoAvatar] Setting XBorg Twitter URL');
        // This is the same URL that's provided in the API, just making sure we have the right size
        setFinalUrl('https://pbs.twimg.com/profile_images/1701203495284518912/Ujc9Oow6_400x400.jpg');
      }
    } else {
      // For other URLs, use as is
      console.log(`[LogoAvatar] Using original logo URL: ${logoUrl}`);
      setFinalUrl(logoUrl);
    }
  }, [logoUrl, name]);

  // If no URL or loading failed, use LetterAvatar
  if (!finalUrl || imageError) {
    return <LetterAvatar name={name} size={size} className={className} />;
  }

  return (
    <div className="relative">
      {/* Only show image if we're not in error state */}
      {!imageError && (
        <div 
          className={cn(
            "rounded-full overflow-hidden flex-shrink-0 border border-border/40 bg-background",
            sizeClasses[size],
            !imageLoaded && 'opacity-0',  // Hide until loaded
            className
          )}
        >
          <img 
            src={finalUrl}
            alt={name || "Company"}
            className="h-full w-full object-cover" // Changed to object-cover for better fit
            // Only use crossOrigin for external URLs
            {...(!finalUrl.startsWith('/') ? { crossOrigin: "anonymous" } : {})}
            onLoad={() => {
              console.log(`[LogoAvatar] Logo loaded successfully for ${name}`);
              setImageLoaded(true);
            }}
            onError={(e) => {
              console.log(`[LogoAvatar] Logo failed to load for ${name}, falling back to LetterAvatar`);
              setImageError(true);
            }}
          />
        </div>
      )}
      
      {/* Show LetterAvatar during load or on error */}
      {(!imageLoaded || imageError) && (
        <div className={cn("absolute top-0 left-0", imageLoaded ? "hidden" : "")}>
          <LetterAvatar name={name} size={size} className={className} />
        </div>
      )}
    </div>
  );
}