import { COLLAB_TYPE_IDS, getCollabTypeId, getCollabTypeDisplayName, CollabTypeId } from './constants';
import { getCollaborationTypeRegistry } from './registry';

/**
 * Migration utilities for transitioning from display names to stable IDs
 */

/**
 * Converts a collaboration object from using display names to using stable IDs
 */
export function migrateCollaborationToIds(collaboration: any): any {
  if (!collaboration || !collaboration.collab_type) {
    return collaboration;
  }

  const typeId = getCollabTypeId(collaboration.collab_type);
  if (typeId) {
    return {
      ...collaboration,
      collab_type_id: typeId,
      collab_type: collaboration.collab_type // Keep display name for backward compatibility
    };
  }

  return collaboration;
}

/**
 * Converts a collaboration object from using IDs to using display names
 * Used for backward compatibility with existing code
 */
export function migrateCollaborationToDisplayNames(collaboration: any): any {
  if (!collaboration) {
    return collaboration;
  }

  // If it has collab_type_id, use that
  if (collaboration.collab_type_id) {
    const displayName = getCollabTypeDisplayName(collaboration.collab_type_id as CollabTypeId);
    return {
      ...collaboration,
      collab_type: displayName
    };
  }

  // If it only has collab_type, check if it's an ID
  if (collaboration.collab_type && Object.values(COLLAB_TYPE_IDS).includes(collaboration.collab_type)) {
    const displayName = getCollabTypeDisplayName(collaboration.collab_type as CollabTypeId);
    return {
      ...collaboration,
      collab_type: displayName
    };
  }

  return collaboration;
}

/**
 * Gets the appropriate value for a collaboration type field
 * Supports both IDs and display names
 */
export function getCollaborationTypeValue(value: string | undefined): string {
  if (!value) return '';
  
  // Check if it's already an ID
  if (Object.values(COLLAB_TYPE_IDS).includes(value as CollabTypeId)) {
    return value;
  }
  
  // Try to get ID from display name
  const id = getCollabTypeId(value);
  return id || value;
}

/**
 * Gets the display name for a collaboration type
 * Works with both IDs and display names
 */
export function getCollaborationTypeDisplay(value: string | undefined): string {
  if (!value) return '';
  
  // Check if it's an ID
  if (Object.values(COLLAB_TYPE_IDS).includes(value as CollabTypeId)) {
    return getCollabTypeDisplayName(value as CollabTypeId);
  }
  
  // Check registry for any registered type
  const registry = getCollaborationTypeRegistry();
  const name = registry.getName(value);
  
  return name || value;
}