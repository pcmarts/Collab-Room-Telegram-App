import { z } from 'zod';
import { COLLAB_TYPE_IDS, getCollabTypeId, getCollabTypeDisplayName, CollabTypeId } from '@shared/collaboration-types';

/**
 * Creates a Zod schema that accepts both collaboration type IDs and display names
 * This allows the form to work with either format while maintaining backward compatibility
 */
export function createFlexibleCollabTypeSchema(typeId: CollabTypeId, acceptedDisplayNames: string[] = []) {
  // Get the current display name for this ID
  const currentDisplayName = getCollabTypeDisplayName(typeId);
  
  // Build array of accepted values: ID + current display name + any legacy names
  const acceptedValues = [
    typeId,
    currentDisplayName,
    ...acceptedDisplayNames
  ];
  
  // Create a union of literals for all accepted values
  const literals = acceptedValues.map(value => z.literal(value));
  
  // Return a schema that accepts any of these values
  return literals.length === 1 ? literals[0] : z.union(literals as [z.ZodLiteral<string>, z.ZodLiteral<string>, ...z.ZodLiteral<string>[]]);
}

/**
 * Transform function that normalizes collaboration type to ID
 * Use this in schemas to ensure consistent storage
 */
export function normalizeToCollabTypeId(value: string): string {
  const id = getCollabTypeId(value);
  return id || value;
}

/**
 * Transform function that converts collaboration type to display name
 * Use this for displaying values in the UI
 */
export function normalizeToDisplayName(value: string): string {
  // Check if it's an ID
  if (Object.values(COLLAB_TYPE_IDS).includes(value as CollabTypeId)) {
    return getCollabTypeDisplayName(value as CollabTypeId);
  }
  return value;
}