import { LucideIcon } from "lucide-react";

/**
 * Core collaboration type definition interface
 * This provides a stable, extensible structure for collaboration types
 */
export interface CollaborationType {
  /** Stable internal identifier (never changes) */
  id: string;
  /** Display name (can be updated easily) */
  name: string;
  /** Optional shorter name for pills/badges */
  shortName?: string;
  /** Icon component reference */
  icon: LucideIcon;
  /** Tailwind color scheme */
  color: string;
  /** Category for organization */
  category: CollaborationCategory;
  /** Enable/disable without removing */
  isActive: boolean;
  /** Additional metadata */
  metadata: {
    /** Help text for forms */
    description: string;
    /** For search/filtering */
    keywords: string[];
    /** Optional duration info */
    estimatedDuration?: string;
  };
}

/**
 * Collaboration categories for better organization
 */
export enum CollaborationCategory {
  SOCIAL_MEDIA = 'social_media',
  CONTENT = 'content',
  EVENTS = 'events',
  MARKETING = 'marketing'
}

/**
 * Legacy name mapping for backward compatibility during migration
 */
export interface LegacyNameMapping {
  /** Legacy string names that map to this type */
  legacyNames: string[];
  /** The stable ID this maps to */
  typeId: string;
}