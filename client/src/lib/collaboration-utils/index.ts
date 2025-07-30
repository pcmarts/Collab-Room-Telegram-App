/**
 * Frontend utilities for collaboration types
 * 
 * This module provides React-friendly utilities for working with collaboration types
 * in the frontend. It wraps the core registry system with additional frontend-specific
 * functionality.
 */

import React from 'react';
import { 
  getCollabTypeIcon as getCoreIcon,
  getCollabTypeColors as getCoreColors,
  getCollabTypeName as getCoreName,
  getCollabTypeShortName as getCoreShortName,
  getAllActiveCollabTypes,
  collabTypeExists
} from '@shared/collaboration-types';

/**
 * Get React icon component for a collaboration type
 * @param identifier - Type ID or legacy name
 * @param className - Optional CSS classes for the icon
 * @returns React icon element
 */
export function getCollabTypeIcon(identifier: string | undefined, className: string = "h-4 w-4"): React.ReactNode {
  if (!identifier) {
    return null;
  }
  
  const IconComponent = getCoreIcon(identifier);
  if (!IconComponent) {
    return null;
  }
  
  return React.createElement(IconComponent, { className });
}

/**
 * Get Tailwind color classes for a collaboration type
 * @param identifier - Type ID or legacy name
 * @returns Combined CSS classes string for badges/pills
 */
export function getCollabTypeColorClasses(identifier: string | undefined): string {
  if (!identifier) {
    return "bg-gray-100 text-gray-800";
  }
  
  const colors = getCoreColors(identifier);
  return `${colors.bg} ${colors.text}`;
}

/**
 * Get full color scheme object for a collaboration type
 * @param identifier - Type ID or legacy name
 * @returns Object with bg, text, border, and hover classes
 */
export function getCollabTypeColors(identifier: string | undefined) {
  return getCoreColors(identifier || 'default');
}

/**
 * Get display name for a collaboration type
 * @param identifier - Type ID or legacy name
 * @returns Display name
 */
export function getCollabTypeName(identifier: string | undefined): string {
  if (!identifier) return 'Unknown Type';
  return getCoreName(identifier);
}

/**
 * Get short name for a collaboration type (for pills/badges)
 * @param identifier - Type ID or legacy name
 * @returns Short display name
 */
export function getCollabTypeShortName(identifier: string | undefined): string {
  if (!identifier) return 'Unknown';
  return getCoreShortName(identifier);
}

/**
 * Check if a collaboration type is valid
 * @param identifier - Type ID or legacy name
 * @returns True if the type exists
 */
export function isValidCollabType(identifier: string | undefined): boolean {
  if (!identifier) return false;
  return collabTypeExists(identifier);
}

/**
 * Get all collaboration types formatted for form selects
 * @returns Array of {value, label} objects
 */
export function getCollabTypeOptions() {
  return getAllActiveCollabTypes().map(type => ({
    value: type.name, // Use name for backward compatibility
    label: type.name,
    id: type.id
  }));
}

/**
 * Get all collaboration type names (for backward compatibility)
 * @returns Array of collaboration type names
 */
export function getCollabTypeNames(): string[] {
  return getAllActiveCollabTypes().map(type => type.name);
}

/**
 * Create a reusable collaboration type pill component
 * @param identifier - Type ID or legacy name
 * @param options - Styling and display options
 * @returns React element for the pill
 */
export function createCollabTypePill(
  identifier: string | undefined,
  options: {
    showIcon?: boolean;
    useShortName?: boolean;
    className?: string;
    iconClassName?: string;
  } = {}
): React.ReactNode {
  const {
    showIcon = true,
    useShortName = false,
    className = "px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1",
    iconClassName = "h-3 w-3"
  } = options;

  if (!identifier) return null;

  const colorClasses = getCollabTypeColorClasses(identifier);
  const name = useShortName ? getCollabTypeShortName(identifier) : getCollabTypeName(identifier);
  const icon = showIcon ? getCollabTypeIcon(identifier, iconClassName) : null;

  return React.createElement(
    'span',
    { className: `${className} ${colorClasses}` },
    icon,
    name
  );
}