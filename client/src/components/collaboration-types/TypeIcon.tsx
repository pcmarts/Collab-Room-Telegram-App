import React from 'react';
import { getCollabTypeIcon } from '@/lib/collaboration-utils';

interface TypeIconProps {
  /** Collaboration type ID or legacy name */
  type: string | undefined;
  /** CSS classes for the icon */
  className?: string;
}

/**
 * Reusable collaboration type icon component
 * Provides consistent icon display across all collaboration type references
 */
export function TypeIcon({ type, className = "h-4 w-4" }: TypeIconProps) {
  return <>{getCollabTypeIcon(type, className)}</>;
}

export default TypeIcon;