/**
 * Collaboration Types Management System
 * 
 * This module provides a centralized, robust system for managing collaboration types
 * throughout the application. It replaces hardcoded string literals with a registry-based
 * approach that provides:
 * 
 * - Stable internal IDs that don't change when display names are updated
 * - Consistent icon and color mappings
 * - Easy extensibility for new collaboration types
 * - Backward compatibility with legacy string names
 * - Type safety throughout the application
 */

// Core types and interfaces
export type { CollaborationType, LegacyNameMapping } from './types';
export { CollaborationCategory } from './types';
import { CollaborationCategory } from './types';

// Registry implementation
export { CollaborationTypeRegistry, getCollaborationTypeRegistry } from './registry';

// Type definitions and mappings
export { 
  COLLABORATION_TYPE_DEFINITIONS, 
  LEGACY_NAME_MAPPINGS, 
  COLOR_SCHEMES 
} from './definitions';

// Export constants for ID-based system
export * from './constants';

// Convenience functions for common operations
import { getCollaborationTypeRegistry } from './registry';

const registry = getCollaborationTypeRegistry();

/**
 * Get React icon component for a collaboration type
 * @param identifier - Type ID or legacy name
 * @returns Icon component class
 */
export const getCollabTypeIcon = (identifier: string) => {
  return registry.getIcon(identifier);
};

/**
 * Get Tailwind color classes for a collaboration type
 * @param identifier - Type ID or legacy name
 * @returns Object with bg, text, border, and hover classes
 */
export const getCollabTypeColors = (identifier: string) => {
  return registry.getColorScheme(identifier);
};

/**
 * Get display name for a collaboration type
 * @param identifier - Type ID or legacy name
 * @returns Display name
 */
export const getCollabTypeName = (identifier: string) => {
  return registry.getName(identifier);
};

/**
 * Get short name for a collaboration type (for pills/badges)
 * @param identifier - Type ID or legacy name
 * @returns Short display name
 */
export const getCollabTypeShortName = (identifier: string) => {
  return registry.getShortName(identifier);
};

/**
 * Get stable ID for a collaboration type
 * @param identifier - Type ID or legacy name
 * @returns Stable type ID
 */
export const getCollabTypeId = (identifier: string) => {
  return registry.getId(identifier);
};

/**
 * Check if a collaboration type exists
 * @param identifier - Type ID or legacy name
 * @returns True if the type exists
 */
export const collabTypeExists = (identifier: string) => {
  return registry.exists(identifier);
};

/**
 * Get all active collaboration types
 * @returns Array of all active collaboration types
 */
export const getAllActiveCollabTypes = () => {
  return registry.getAllActive();
};

/**
 * Get all collaboration type names (for backward compatibility)
 * @returns Array of all active collaboration type names
 */
export const getAllCollabTypeNames = () => {
  return registry.getAllNames();
};

/**
 * Get all collaboration type IDs
 * @returns Array of all active collaboration type IDs
 */
export const getAllCollabTypeIds = () => {
  return registry.getAllIds();
};

/**
 * Search collaboration types by keyword
 * @param keyword - Search term
 * @returns Array of matching collaboration types
 */
export const searchCollabTypes = (keyword: string) => {
  return registry.searchByKeyword(keyword);
};

/**
 * Get collaboration types by category
 * @param category - Collaboration category
 * @returns Array of collaboration types in the category
 */
export const getCollabTypesByCategory = (category: CollaborationCategory) => {
  return registry.getByCategory(category);
};