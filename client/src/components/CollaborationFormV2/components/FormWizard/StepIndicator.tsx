import React from "react";
import { useFormWizard } from "../../contexts/FormWizardContext";

/**
 * Minimalist visual indicator for form steps progress
 * Shows current step and completed steps with just a progress line
 */
export const StepIndicator: React.FC = () => {
  const { currentStep, visibleSteps } = useFormWizard();
  
  // Calculate progress percentage
  const progressPercentage = (currentStep / (visibleSteps.length - 1)) * 100;
  
  return (
    <div className="w-full">
      <div className="relative h-[3px] w-full bg-surface rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-brand transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};