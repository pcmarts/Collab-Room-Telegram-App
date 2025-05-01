import React, { createContext, useContext, useState, ReactNode } from "react";

/**
 * Step definition for form wizard
 */
export interface Step {
  id: string;
  title: string;
  description: string;
  isValid?: boolean;
  shouldShow?: () => boolean;
}

/**
 * Form wizard context state and methods
 */
interface FormWizardContextType {
  currentStep: number;
  steps: Step[];
  visibleSteps: Step[];
  totalSteps: number;
  setSteps: (steps: Step[]) => void;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (stepIndex: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStepId: string | null;
  validateCurrentStep: () => boolean;
  setStepValidity: (stepId: string, isValid: boolean) => void;
}

const FormWizardContext = createContext<FormWizardContextType | null>(null);

/**
 * Provider component for form wizard functionality
 */
export const FormWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepValidityMap, setStepValidityMap] = useState<Record<string, boolean>>({});

  // Calculate visible steps based on shouldShow condition
  const visibleSteps = steps.filter(step => !step.shouldShow || step.shouldShow());
  
  // Get current step ID
  const currentStepId = visibleSteps[currentStep]?.id || null;
  
  // Navigation guards
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === visibleSteps.length - 1;

  /**
   * Navigate to the next step if available
   */
  const goToNextStep = () => {
    if (!isLastStep) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };

  /**
   * Navigate to the previous step if available
   */
  const goToPrevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  /**
   * Navigate to a specific step by index
   */
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < visibleSteps.length) {
      setCurrentStep(stepIndex);
    }
  };

  /**
   * Check if the current step is valid
   * Each step must be validated before proceeding
   */
  const validateCurrentStep = (): boolean => {
    const currentStepObj = visibleSteps[currentStep];
    if (!currentStepObj) return false;
    
    // If step has explicit validity state, use it
    if (currentStepObj.id in stepValidityMap) {
      return stepValidityMap[currentStepObj.id];
    }
    
    // Default to true if no validation state exists
    return true;
  };

  /**
   * Set the validity state for a specific step
   */
  const setStepValidity = (stepId: string, isValid: boolean) => {
    setStepValidityMap(prev => ({
      ...prev,
      [stepId]: isValid
    }));
  };

  const value = {
    currentStep,
    steps,
    visibleSteps,
    totalSteps: visibleSteps.length,
    setSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    isFirstStep,
    isLastStep,
    currentStepId,
    validateCurrentStep,
    setStepValidity
  };

  return (
    <FormWizardContext.Provider value={value}>
      {children}
    </FormWizardContext.Provider>
  );
};

/**
 * Hook to use form wizard context
 */
export const useFormWizard = () => {
  const context = useContext(FormWizardContext);
  if (!context) {
    throw new Error("useFormWizard must be used within a FormWizardProvider");
  }
  return context;
};