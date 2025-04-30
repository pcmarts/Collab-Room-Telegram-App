import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * Form persistence context state and methods
 */
interface FormPersistenceContextType {
  saveFormState: <T>(formId: string, state: T) => void;
  loadFormState: <T>(formId: string, defaultState: T) => T;
  clearFormState: (formId: string) => void;
  clearAllFormStates: () => void;
}

const FormPersistenceContext = createContext<FormPersistenceContextType | null>(null);

const STORAGE_PREFIX = "collab_form_v2_";

/**
 * Creates a unique form ID for each form type to prevent state bleeding
 * @param collabType The collaboration type (e.g., "Twitter Spaces Guest")
 * @returns A unique ID for the form
 */
export const createFormId = (collabType: string): string => {
  return `${collabType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
};

/**
 * Provider component for form persistence functionality
 */
export const FormPersistenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  // Initialize when component mounts
  useEffect(() => {
    setIsReady(true);
  }, []);

  /**
   * Save form state to localStorage
   */
  const saveFormState = <T,>(formId: string, state: T) => {
    if (!isReady) return;
    try {
      const key = `${STORAGE_PREFIX}${formId}`;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save form state:", error);
    }
  };

  /**
   * Load form state from localStorage
   */
  const loadFormState = <T,>(formId: string, defaultState: T): T => {
    if (!isReady) return defaultState;
    try {
      const key = `${STORAGE_PREFIX}${formId}`;
      const storedState = localStorage.getItem(key);
      if (!storedState) return defaultState;
      return JSON.parse(storedState) as T;
    } catch (error) {
      console.error("Failed to load form state:", error);
      return defaultState;
    }
  };

  /**
   * Clear form state for a specific form
   */
  const clearFormState = (formId: string) => {
    if (!isReady) return;
    try {
      const key = `${STORAGE_PREFIX}${formId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear form state:", error);
    }
  };

  /**
   * Clear all form states
   */
  const clearAllFormStates = () => {
    if (!isReady) return;
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Failed to clear all form states:", error);
    }
  };

  const value = {
    saveFormState,
    loadFormState,
    clearFormState,
    clearAllFormStates
  };

  return (
    <FormPersistenceContext.Provider value={value}>
      {children}
    </FormPersistenceContext.Provider>
  );
};

/**
 * Hook to use form persistence context
 */
export const useFormPersistence = () => {
  const context = useContext(FormPersistenceContext);
  if (!context) {
    throw new Error("useFormPersistence must be used within a FormPersistenceProvider");
  }
  return context;
};