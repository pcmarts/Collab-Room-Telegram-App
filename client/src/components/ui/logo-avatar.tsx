import React, { useState } from 'react';
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
  
  // Size mappings for the container
  const sizeClasses = {
    'xs': 'h-6 w-6',
    'sm': 'h-8 w-8',
    'md': 'h-10 w-10',
    'lg': 'h-12 w-12',
    'xl': 'h-16 w-16',
  };

  // Special case for XBorg - custom SVG implementation based on the provided image
  if (name?.toLowerCase().includes('xborg')) {
    console.log('Using custom SVG XBorg logo');
    
    // Return a custom SVG-based XBorg logo (red X on black background)
    return (
      <div 
        className={cn(
          "rounded-full overflow-hidden flex-shrink-0 border border-border/40",
          sizeClasses[size],
          className
        )}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {/* Black background */}
          <rect width="100" height="100" fill="black" />
          
          {/* Red X shape - more accurate to the XBorg logo */}
          <g fill="#FF3B44">
            {/* Top arrow */}
            <polygon points="30,28 50,43 70,28 58,28 50,34 42,28" />
            
            {/* Bottom arrow */}
            <polygon points="30,72 50,57 70,72 58,72 50,66 42,72" />
          </g>
        </svg>
      </div>
    );
  }

  // Optimize Twitter URLs if applicable
  const optimizedUrl = logoUrl && logoUrl.includes('pbs.twimg.com') 
    ? logoUrl.replace('_normal', '_400x400') 
    : logoUrl;

  // If no logo URL or loading failed, use LetterAvatar
  if (!optimizedUrl || imageError) {
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
            src={optimizedUrl}
            alt={name || "Company"}
            className="h-full w-full object-contain"
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