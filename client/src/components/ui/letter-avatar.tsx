import React from 'react';
import { cn } from '@/lib/utils';

interface LetterAvatarProps {
  name: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// Brand-aligned avatar palette — all entries land at ~50% lightness / 0.15-0.18 chroma
// so white text stays legible and the set reads as a coherent family. Royal blue and
// burnt orange anchor the palette; the other hues fill out the deterministic spread.
const colors = [
  'bg-brand',
  'bg-brand-dark',
  'bg-warm-accent',
  'bg-success',
  'bg-[oklch(52%_0.16_200)]',
  'bg-[oklch(52%_0.16_320)]',
  'bg-[oklch(48%_0.15_140)]',
  'bg-[oklch(58%_0.18_25)]',
];

/**
 * LetterAvatar component creates a consistent colored avatar with the first letter
 * of a name when no image is available
 */
export function LetterAvatar({ name, className, size = 'md' }: LetterAvatarProps) {
  // Get first letter, or ? if name is empty
  const letter = (name?.charAt(0) || '?').toUpperCase();
  
  // Deterministic color based on name
  const colorIndex = name ? 
    name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length :
    0;
  
  const sizeClasses = {
    'xs': 'h-6 w-6 text-xs',
    'sm': 'h-8 w-8 text-sm',
    'md': 'h-10 w-10 text-base',
    'lg': 'h-12 w-12 text-lg',
    'xl': 'h-16 w-16 text-xl',
  };

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white",
        colors[colorIndex],
        sizeClasses[size],
        className
      )}
    >
      {letter}
    </div>
  );
}