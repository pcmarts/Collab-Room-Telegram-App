import React from 'react';
import { cn } from '@/lib/utils';

interface LetterAvatarProps {
  name: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const colors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-cyan-500',
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