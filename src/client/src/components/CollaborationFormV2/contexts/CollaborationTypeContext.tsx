import React, { createContext, useContext, useState, ReactNode } from "react";
import { COLLAB_TYPES } from "@shared/schema";
import { ZodType } from "zod";
import { Step } from "./FormWizardContext";

/**
 * Definition for a collaboration type including its schema,
 * default values and steps
 */
export interface CollaborationTypeDefinition {
  id: string;
  name: string;
  schema: ZodType<any>;
  defaultValues: Record<string, any>;
  steps: Step[];
}

/**
 * Collaboration type context state and methods
 */
interface CollaborationTypeContextType {
  availableTypes: CollaborationTypeDefinition[];
  selectedTypeId: string | null;
  registerType: (type: CollaborationTypeDefinition) => void;
  selectType: (typeId: string) => void;
  getSelectedType: () => CollaborationTypeDefinition | null;
  getTypeById: (typeId: string) => CollaborationTypeDefinition | null;
}

const CollaborationTypeContext = createContext<CollaborationTypeContextType | null>(null);

/**
 * Provider component for collaboration type functionality
 */
export const CollaborationTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [types, setTypes] = useState<CollaborationTypeDefinition[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  /**
   * Register a new collaboration type
   */
  const registerType = (type: CollaborationTypeDefinition) => {
    setTypes(prevTypes => {
      // Replace if already exists, add if new
      const existingIndex = prevTypes.findIndex(t => t.id === type.id);
      if (existingIndex >= 0) {
        const updatedTypes = [...prevTypes];
        updatedTypes[existingIndex] = type;
        return updatedTypes;
      }
      return [...prevTypes, type];
    });
  };

  /**
   * Select a collaboration type by ID
   */
  const selectType = (typeId: string) => {
    if (types.some(type => type.id === typeId)) {
      setSelectedTypeId(typeId);
    } else {
      console.warn(`Collaboration type '${typeId}' not found`);
    }
  };

  /**
   * Get the currently selected collaboration type
   */
  const getSelectedType = (): CollaborationTypeDefinition | null => {
    if (!selectedTypeId) return null;
    return types.find(type => type.id === selectedTypeId) || null;
  };

  /**
   * Get a collaboration type by ID
   */
  const getTypeById = (typeId: string): CollaborationTypeDefinition | null => {
    return types.find(type => type.id === typeId) || null;
  };

  const value = {
    availableTypes: types,
    selectedTypeId,
    registerType,
    selectType,
    getSelectedType,
    getTypeById
  };

  return (
    <CollaborationTypeContext.Provider value={value}>
      {children}
    </CollaborationTypeContext.Provider>
  );
};

/**
 * Hook to use collaboration type context
 */
export const useCollaborationType = () => {
  const context = useContext(CollaborationTypeContext);
  if (!context) {
    throw new Error("useCollaborationType must be used within a CollaborationTypeProvider");
  }
  return context;
};