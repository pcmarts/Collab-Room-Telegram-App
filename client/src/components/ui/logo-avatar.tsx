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

  // Special case for XBorg
  if (name?.toLowerCase().includes('xborg')) {
    // Use img.shields.io which usually works with CORS policies
    const shieldsIOUrl = "https://img.shields.io/badge/X-Borg-blue?style=for-the-badge&logo=twitter&labelColor=1D9BF0&color=1D9BF0";
    console.log('Using shields.io XBorg badge');

    // In this case, just return a colored letter avatar with XBorg's color scheme
    return (
      <div 
        className={cn(
          "rounded-full overflow-hidden flex-shrink-0 border border-border/40",
          sizeClasses[size],
          className,
          "bg-[#1D9BF0] flex items-center justify-center font-bold text-white"
        )}
      >
        X
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