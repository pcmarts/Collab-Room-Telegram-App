import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useFormWizard } from "../../contexts/FormWizardContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { TWITTER_COLLAB_TYPES } from "@shared/schema";
import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();

  /**
   * Validate the current step before proceeding to the next
   */
  const handleNextClick = async () => {
    // Validation is handled at two levels: 
    // 1. Form validation via React Hook Form
    // 2. Custom step validation via the wizard context
    
    console.log("Validating current step:", currentStepId);
    
    // Only validate the field(s) for the current step to avoid cross-step validation issues
    let isStepValid = true;
    
    // For Twitter Spaces specific steps
    if (currentStepId === "basic_info") {
      // Validate Twitter handle and follower count
      const handleValid = await form.trigger("twitter_handle");
      const followerValid = await form.trigger("host_follower_count");
      isStepValid = handleValid && followerValid;
    } 
    // When topics are on a separate page (works for all collaboration types)
    else if (currentStepId === "topics") {
      // Validate only topics on this step
      isStepValid = await form.trigger("topics");
      console.log("Topics validation result:", isStepValid, "Topics value:", form.getValues("topics"));
    }
    // When date is on a separate page
    else if (currentStepId === "date_selection") {
      // Validate date and free collab confirmation
      const dateTypeValid = await form.trigger("date_type");
      const freeCollabValid = await form.trigger("is_free_collab");
      
      // If specific date is selected, also validate that field
      let specificDateValid = true;
      if (form.getValues("date_type") === "specific_date") {
        specificDateValid = await form.trigger("specific_date");
      }
      
      isStepValid = dateTypeValid && specificDateValid && freeCollabValid;
    }
    // Report form steps
    else if (currentStepId === "report_info") {
      // Validate report name, type, and audience reach (report link is optional)
      const nameValid = await form.trigger("report_name");
      const typeValid = await form.trigger("report_type");
      const audienceValid = await form.trigger("audience_reach");
      isStepValid = nameValid && typeValid && audienceValid;
      
      // Skip link validation if empty (optional field)
      if (form.getValues("report_link")) {
        isStepValid = await form.trigger("report_link") && isStepValid;
      }
    }
    else if (currentStepId === "description") {
      // For form's description page (works for all collaboration types)
      isStepValid = await form.trigger("description");
      console.log("Description validation:", isStepValid);
    }
    else if (currentStepId === "date") {
      // For any form's date page
      const dateTypeValid = await form.trigger("date_type");
      const freeCollabValid = await form.trigger("is_free_collab");
      
      // If specific date is selected, also validate that field
      let specificDateValid = true;
      if (form.getValues("date_type") === "specific_date") {
        specificDateValid = await form.trigger("specific_date");
      }
      
      isStepValid = dateTypeValid && specificDateValid && freeCollabValid;
      console.log("Date validation:", {
        dateType: dateTypeValid,
        specificDate: specificDateValid,
        freeCollab: freeCollabValid,
        overall: isStepValid
      });
    }
    // For Twitter collaboration type steps, validate only the relevant fields
    else if (currentStepId === "twitter_topics" || currentStepId === "podcast_topics") {
      isStepValid = await form.trigger("topics");
    } else if (currentStepId === "twitter_handle") {
      isStepValid = await form.trigger("twitter_handle");
    } else if (currentStepId === "twitter_collab_types") {
      isStepValid = await form.trigger("twitter_collab_types");
      console.log("Twitter collab types validation:", isStepValid);
      console.log("Twitter collab types value:", form.getValues("twitter_collab_types"));
      console.log("Twitter collab types field state:", form.getFieldState("twitter_collab_types"));
      console.log("TWITTER_COLLAB_TYPES schema values:", TWITTER_COLLAB_TYPES);
      
      // Show the exact validation schema zod is using
      const selectedType = form.getValues("collab_type");
      console.log("Selected collaboration type:", selectedType);
    } else if (currentStepId === "twitter_followers") {
      isStepValid = await form.trigger("follower_count");
    } else if (currentStepId === "twitter_description" || currentStepId === "podcast_description") {
      isStepValid = await form.trigger("description");
    } else if (currentStepId === "twitter_date" || currentStepId === "podcast_date") {
      // Validate date fields
      isStepValid = await form.trigger("date_type");
      if (form.getValues("date_type") === "specific_date") {
        isStepValid = await form.trigger("specific_date") && isStepValid;
      }
    } else if (currentStepId === "collab_type") {
      isStepValid = await form.trigger("collab_type");
    } else if (currentStepId === "podcast_details") {
      // For podcast details step, validate both podcast name and link
      const nameValid = await form.trigger("podcast_name");
      const linkValid = await form.trigger("podcast_link");
      isStepValid = nameValid && linkValid;
    } else if (currentStepId === "podcast_audience") {
      isStepValid = await form.trigger("estimated_reach");
    }
    // For Newsletter newsletter_info step
    else if (currentStepId === "newsletter_info") {
      // Validate newsletter name and subscriber count (URL is optional)
      const nameValid = await form.trigger("newsletter_name");
      const subscriberValid = await form.trigger("subscriber_count");
      
      // Newsletter URL is optional, only validate if non-empty
      let urlValid = true;
      const newsletterUrl = form.getValues("newsletter_url");
      if (newsletterUrl && newsletterUrl.length > 0) {
        urlValid = await form.trigger("newsletter_url");
      }
      
      isStepValid = nameValid && subscriberValid && urlValid;
      console.log("Newsletter info validation:", {
        name: nameValid,
        subscriber: subscriberValid,
        url: urlValid,
        overall: isStepValid
      });
    }
    // For LiveStream stream_info step
    else if (currentStepId === "stream_info") {
      const platformNameValid = await form.trigger("platform_name");
      const audienceSizeValid = await form.trigger("audience_size");
      
      // Stream link is optional, so only validate if there's a value
      let streamLinkValid = true;
      const streamLink = form.getValues("stream_link");
      if (streamLink && streamLink.length > 0) {
        streamLinkValid = await form.trigger("stream_link");
      }
      
      isStepValid = platformNameValid && audienceSizeValid && streamLinkValid;
      console.log("LiveStream info validation:", {
        platformName: platformNameValid,
        streamLink: streamLinkValid,
        audienceSize: audienceSizeValid,
        overall: isStepValid
      });
    } else {
      // If we don't recognize the step, do a general validation
      isStepValid = await form.trigger();
    }
    
    console.log("Step-specific validation result:", isStepValid);
    console.log("Current form values:", form.getValues());
    
    if (!isStepValid) {
      // Log form errors to help debug the issue
      console.log("Form errors:", form.formState.errors);
      console.log("Field states:", Object.keys(form.getFieldState));
      
      // Log specific field validations for forms with topics_and_date step
      if (currentStepId === "topics_and_date") {
        console.log("Topics field validation:", form.getFieldState("topics"));
        console.log("Date type validation:", form.getFieldState("date_type"));
        console.log("Is free collab validation:", form.getFieldState("is_free_collab"));
        console.log("Description validation:", form.getFieldState("description"));
        if (form.getValues("date_type") === "specific_date") {
          console.log("Specific date validation:", form.getFieldState("specific_date"));
        }
        
        // Check if this is the newsletter form by testing for newsletter fields
        if (form.getValues("newsletter_name") !== undefined) {
          // Add specific validation for the newsletter form's topics_and_date step
          const topicsValid = await form.trigger("topics");
          const descriptionValid = await form.trigger("description");
          const dateTypeValid = await form.trigger("date_type");
          const freeCollabValid = await form.trigger("is_free_collab");
          
          let specificDateValid = true;
          if (form.getValues("date_type") === "specific_date") {
            specificDateValid = await form.trigger("specific_date");
          }
          
          isStepValid = topicsValid && descriptionValid && dateTypeValid && freeCollabValid && specificDateValid;
          console.log("Newsletter topics_and_date validation:", {
            topics: topicsValid,
            description: descriptionValid,
            dateType: dateTypeValid,
            specificDate: specificDateValid,
            freeCollab: freeCollabValid,
            overall: isStepValid
          });
        }
      }
      
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

  // Get current collab_type value to determine if a type is selected
  const collabTypeSelected = form.watch("collab_type");
  
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-5">
      {isFirstStep ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/my-collaborations")}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
          My collabs
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={goToPrevStep}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      )}

      {currentStepId === "collab_type" ? (
        <Button
          type="button"
          size="sm"
          onClick={handleNextClick}
          disabled={isSubmitting || !collabTypeSelected}
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : isLastStep ? (
        <Button
          type="button"
          size="sm"
          onClick={handleSubmitClick}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Publishing
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Publish collab
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={handleNextClick}
          disabled={isSubmitting}
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};