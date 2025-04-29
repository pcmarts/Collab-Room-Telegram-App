import React from "react";
import { useFormWizard } from "../../contexts/FormWizardContext";
import { CheckIcon } from "lucide-react";

/**
 * Visual indicator for form steps progress
 * Shows current step and completed steps
 */
export const StepIndicator: React.FC = () => {
  const { currentStep, visibleSteps, goToStep } = useFormWizard();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div 
                className={`
                  relative flex h-8 w-8 items-center justify-center rounded-full
                  text-xs font-semibold transition-colors
                  ${isCompleted 
                    ? 'bg-primary text-primary-foreground cursor-pointer' 
                    : isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }
                `}
                onClick={() => isCompleted && goToStep(index)}
                title={step.title}
              >
                {isCompleted 
                  ? <CheckIcon className="h-4 w-4" /> 
                  : index + 1
                }
              </div>
              
              {/* Connector line */}
              {index < visibleSteps.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 md:mx-4">
                  <div 
                    className={`
                      h-full
                      ${index < currentStep 
                        ? 'bg-primary' 
                        : 'bg-muted'
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step titles */}
      <div className="flex items-center justify-between mt-2">
        {visibleSteps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div 
              key={`title-${step.id}`}
              className={`
                text-xs font-medium text-center
                ${isCompleted
                  ? 'text-primary cursor-pointer'
                  : isCurrent
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }
              `}
              style={{ 
                width: `${100 / visibleSteps.length}%`,
                // Add slight offset to align with circles
                transform: 'translateX(-50%)',
                marginLeft: '50%'
              }}
              onClick={() => isCompleted && goToStep(index)}
            >
              {step.title}
            </div>
          );
        })}
      </div>
    </div>
  );
};