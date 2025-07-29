/**
 * Legacy collaboration utilities - now powered by the collaboration types registry
 * 
 * This file maintains backward compatibility while using the new centralized
 * collaboration types management system. All hardcoded logic has been replaced
 * with registry-based lookups.
 */

import React from "react";
import { 
  getCollabTypeIcon as getRegistryIcon,
  getCollabTypeColors,
  getCollabTypeName
} from './collaboration-utils';

/**
 * Returns the appropriate icon component for a collaboration type
 * @deprecated Use getCollabTypeIcon from './collaboration-utils' instead
 */
export function getCollabTypeIcon(type: string | undefined, className: string = "h-4 w-4"): React.ReactNode {
  return getRegistryIcon(type, className);
}

/**
 * Get color classes for a collaboration type
 * @param type - Collaboration type ID or name
 * @returns CSS classes for styling
 */
export function getCollabTypeColorClasses(type: string | undefined): string {
  if (!type) return "bg-gray-100 text-gray-800";
  
  const colors = getCollabTypeColors(type);
  return `${colors.bg} ${colors.text}`;
}

/**
 * Get display name for a collaboration type
 * @param type - Collaboration type ID or name
 * @returns Display name
 */
export function getCollabTypeDisplayName(type: string | undefined): string {
  return getCollabTypeName(type);
}