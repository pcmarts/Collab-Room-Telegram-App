import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useFormWizard } from "../../contexts/FormWizardContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface StepNavigationProps {
  form: UseFormReturn<any>;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

/**
 * Navigation buttons for the form wizard
 * Handles back/next and validation before progression
 */
export const StepNavigation: React.FC<StepNavigationProps> = ({
  form,
  onSubmit,
  isSubmitting = false,
}) => {
  const { 
    goToNextStep, 
    goToPrevStep, 
    isFirstStep, 
    isLastStep,
    currentStepId,
    validateCurrentStep 
  } = useFormWizard();
  
  const { toast } = useToast();

  /**
   * Validate the current step before proceeding to the next
   */
  const handleNextClick = async () => {
    // Validation is handled at two levels: 
    // 1. Form validation via React Hook Form
    // 2. Custom step validation via the wizard context
    
    console.log("Validating current step:", currentStepId);
    
    // Check if fields in current step are valid
    const isStepValid = await form.trigger();
    console.log("Form validation result:", isStepValid);
    
    if (!isStepValid) {
      // Log form errors to help debug the issue
      console.log("Form errors:", form.formState.errors);
      
      toast({
        title: "Invalid fields",
        description: "Please fix the errors before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    // Check custom step validation (if defined)
    if (!validateCurrentStep()) {
      toast({
        title: "Step validation failed",
        description: "Please complete all required information.",
        variant: "destructive",
      });
      return;
    }

    // Proceed to next step if both validations pass
    goToNextStep();
  };

  /**
   * Submit the form on the last step
   */
  const handleSubmitClick = () => {
    if (onSubmit) {
      onSubmit();
    } else {
      form.handleSubmit(() => {
        // Default submit behavior if no custom handler provided
        toast({
          title: "Form submitted",
          description: "Your form has been submitted successfully.",
        });
      })();
    }
  };

  return (
    <div className="flex justify-between pt-6 mt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={goToPrevStep}
        disabled={isFirstStep || isSubmitting}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      
      {isLastStep ? (
        <Button
          type="button"
          onClick={handleSubmitClick}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Submit
            </>
          )}
        </Button>
      ) : (
        <Button 
          type="button" 
          onClick={handleNextClick}
          disabled={isSubmitting}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};