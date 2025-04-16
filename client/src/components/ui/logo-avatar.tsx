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
    // Use a direct image URL from a reliable CDN
    // Different CDN options to try - we'll use Imgur which has good CORS support
    // Original URL was: https://pbs.twimg.com/profile_images/1701203495284518912/Ujc9Oow6_400x400.jpg
    const xborgLogoUrl = "https://i.imgur.com/PFGqlxf.jpg"; // Imgur hosted XBorg logo
    console.log('Using Imgur hosted XBorg logo');

    return (
      <div 
        className={cn(
          "rounded-full overflow-hidden flex-shrink-0 border border-border/40 bg-background",
          sizeClasses[size],
          className
        )}
      >
        <img 
          src={xborgLogoUrl}
          alt="XBorg"
          className="h-full w-full object-contain"
          onError={(e) => {
            console.error('Imgur XBorg logo failed to load, falling back to text avatar');
            // If this image fails too, render a letter avatar with XBorg's color scheme
            const target = e.target as HTMLImageElement;
            if (target) {
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add('bg-[#1D9BF0]', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-white');
                parent.textContent = 'X';
              }
            }
          }}
        />
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