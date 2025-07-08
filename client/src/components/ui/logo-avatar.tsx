import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LetterAvatar } from './letter-avatar';
import { getSupabaseImageUrl, getOptimizedImageUrl } from '@shared/utils/image-url';

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
      console.log(`[LogoAvatar] No logo URL provided for ${name}`);
      setImageError(true);
      return;
    }
    
    // Reset states when logoUrl changes
    setImageLoaded(false);
    setImageError(false);
    
    try {
      console.log(`[LogoAvatar] Processing logo URL for ${name}: ${logoUrl}`);
      
      // Priority order:
      // 1. Local URLs (starting with /)
      // 2. Twitter URLs (optimize size)
      // 3. Supabase storage URLs
      // 4. Other external URLs (as-is)
      
      // Check if logo is already a full external URL (including Supabase)
      if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        // For Twitter URLs, optimize size
        if (logoUrl.includes('pbs.twimg.com')) {
          const optimizedUrl = logoUrl.replace('_normal', '_400x400');
          console.log(`[LogoAvatar] Using optimized Twitter URL: ${optimizedUrl}`);
          setFinalUrl(optimizedUrl);
        } else {
          console.log(`[LogoAvatar] Using external URL: ${logoUrl}`);
          setFinalUrl(logoUrl);
        }
      }
      // Check if it's a local path that should be converted to Supabase URL
      else if (logoUrl.startsWith('/company-logos/') || logoUrl.startsWith('/')) {
        // Convert to Supabase storage URL
        const supabaseUrl = getSupabaseImageUrl(logoUrl);
        if (supabaseUrl) {
          console.log(`[LogoAvatar] Converting local path to Supabase URL: ${logoUrl} -> ${supabaseUrl}`);
          setFinalUrl(supabaseUrl);
        } else {
          console.log(`[LogoAvatar] Failed to convert to Supabase URL, using local: ${logoUrl}`);
          setFinalUrl(logoUrl);
        }
      } else {
        // Try to treat it as a filename and convert to Supabase URL
        const supabaseUrl = getSupabaseImageUrl(logoUrl);
        if (supabaseUrl) {
          console.log(`[LogoAvatar] Converting filename to Supabase URL: ${logoUrl} -> ${supabaseUrl}`);
          setFinalUrl(supabaseUrl);
        } else {
          console.log(`[LogoAvatar] Failed to convert filename to Supabase URL, using original: ${logoUrl}`);
          setFinalUrl(logoUrl);
        }
      }
    } catch (error) {
      console.error(`[LogoAvatar] Error processing logo URL for ${name}:`, error);
      setImageError(true);
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
              console.log(`[LogoAvatar] ✅ Logo loaded successfully for ${name}: ${finalUrl}`);
              setImageLoaded(true);
            }}
            onError={(e) => {
              console.error(`[LogoAvatar] ❌ Logo failed to load for ${name}: ${finalUrl}`);
              console.error(`[LogoAvatar] Error event:`, e);
              
              // Try to fetch the URL manually to get more details
              fetch(finalUrl, { method: 'HEAD', mode: 'no-cors' })
                .then(() => {
                  console.log(`[LogoAvatar] HEAD request successful for ${finalUrl}`);
                })
                .catch(fetchError => {
                  console.error(`[LogoAvatar] HEAD request failed for ${finalUrl}:`, fetchError);
                });
              
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