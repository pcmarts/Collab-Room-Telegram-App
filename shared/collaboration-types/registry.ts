import { LucideIcon } from "lucide-react";
import { CollaborationType, CollaborationCategory } from "./types";
import { 
  COLLABORATION_TYPE_DEFINITIONS, 
  LEGACY_NAME_MAPPINGS, 
  COLOR_SCHEMES 
} from "./definitions";

/**
 * Centralized collaboration type registry
 * Provides a single source of truth for all collaboration type operations
 */
export class CollaborationTypeRegistry {
  private static instance: CollaborationTypeRegistry;
  private typesMap: Map<string, CollaborationType> = new Map();
  private nameToIdMap: Map<string, string> = new Map();

  private constructor() {
    this.initializeRegistry();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CollaborationTypeRegistry {
    if (!CollaborationTypeRegistry.instance) {
      CollaborationTypeRegistry.instance = new CollaborationTypeRegistry();
    }
    return CollaborationTypeRegistry.instance;
  }

  /**
   * Initialize the registry with all type definitions and legacy mappings
   */
  private initializeRegistry(): void {
    // Add all type definitions to the registry
    COLLABORATION_TYPE_DEFINITIONS.forEach(type => {
      this.typesMap.set(type.id, type);
      // Map the canonical name to the ID
      this.nameToIdMap.set(type.name.toLowerCase(), type.id);
    });

    // Add legacy name mappings for backward compatibility
    LEGACY_NAME_MAPPINGS.forEach(mapping => {
      mapping.legacyNames.forEach(legacyName => {
        this.nameToIdMap.set(legacyName.toLowerCase(), mapping.typeId);
      });
    });
  }

  /**
   * Get collaboration type by stable ID
   */
  public getById(id: string): CollaborationType | undefined {
    return this.typesMap.get(id);
  }

  /**
   * Get collaboration type by name (supports legacy names)
   */
  public getByName(name: string): CollaborationType | undefined {
    const id = this.nameToIdMap.get(name.toLowerCase());
    return id ? this.typesMap.get(id) : undefined;
  }

  /**
   * Get all active collaboration types
   */
  public getAllActive(): CollaborationType[] {
    return Array.from(this.typesMap.values()).filter(type => type.isActive);
  }

  /**
   * Get all collaboration types (including inactive)
   */
  public getAll(): CollaborationType[] {
    return Array.from(this.typesMap.values());
  }

  /**
   * Get collaboration types by category
   */
  public getByCategory(category: CollaborationCategory): CollaborationType[] {
    return Array.from(this.typesMap.values()).filter(
      type => type.category === category && type.isActive
    );
  }

  /**
   * Get icon for a collaboration type
   */
  public getIcon(identifier: string): LucideIcon {
    const type = this.getByIdOrName(identifier);
    return type?.icon || this.getDefaultIcon();
  }

  /**
   * Get color scheme for a collaboration type
   */
  public getColorScheme(identifier: string): typeof COLOR_SCHEMES[keyof typeof COLOR_SCHEMES] {
    const type = this.getByIdOrName(identifier);
    const colorKey = type?.color || 'gray';
    return COLOR_SCHEMES[colorKey as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.gray;
  }

  /**
   * Get display name for a collaboration type
   */
  public getName(identifier: string): string {
    const type = this.getByIdOrName(identifier);
    return type?.name || identifier;
  }

  /**
   * Get short name for a collaboration type
   */
  public getShortName(identifier: string): string {
    const type = this.getByIdOrName(identifier);
    return type?.shortName || type?.name || identifier;
  }

  /**
   * Get stable ID for a collaboration type (useful for legacy name conversion)
   */
  public getId(identifier: string): string {
    const type = this.getByIdOrName(identifier);
    return type?.id || identifier;
  }

  /**
   * Check if a collaboration type exists
   */
  public exists(identifier: string): boolean {
    return this.getByIdOrName(identifier) !== undefined;
  }

  /**
   * Get metadata for a collaboration type
   */
  public getMetadata(identifier: string): CollaborationType['metadata'] | undefined {
    const type = this.getByIdOrName(identifier);
    return type?.metadata;
  }

  /**
   * Search collaboration types by keyword
   */
  public searchByKeyword(keyword: string): CollaborationType[] {
    const searchTerm = keyword.toLowerCase();
    return Array.from(this.typesMap.values()).filter(type => 
      type.isActive && (
        type.name.toLowerCase().includes(searchTerm) ||
        type.metadata.keywords.some(k => k.toLowerCase().includes(searchTerm))
      )
    );
  }

  /**
   * Get all collaboration type names (for backward compatibility)
   */
  public getAllNames(): string[] {
    return this.getAllActive().map(type => type.name);
  }

  /**
   * Get all collaboration type IDs
   */
  public getAllIds(): string[] {
    return this.getAllActive().map(type => type.id);
  }

  /**
   * Helper method to get type by ID or name
   */
  private getByIdOrName(identifier: string): CollaborationType | undefined {
    // First try by ID
    let type = this.getById(identifier);
    if (!type) {
      // Then try by name (including legacy names)
      type = this.getByName(identifier);
    }
    return type;
  }

  /**
   * Get default icon when type is not found
   */
  private getDefaultIcon(): LucideIcon {
    // Import default icon dynamically to avoid circular imports
    return require('lucide-react').Megaphone;
  }
}

/**
 * Convenience function to get registry instance
 */
export const getCollaborationTypeRegistry = (): CollaborationTypeRegistry => {
  return CollaborationTypeRegistry.getInstance();
};