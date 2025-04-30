import React, { useEffect } from "react";
import { Form } from "@/components/ui/form";
import { FormWizardProvider, useFormWizard } from "./contexts/FormWizardContext";
import { CollaborationTypeProvider, useCollaborationType } from "./contexts/CollaborationTypeContext";
import { FormPersistenceProvider } from "./contexts/FormPersistenceContext";
import { StepIndicator } from "./components/FormWizard/StepIndicator";
import { StepContainer } from "./components/FormWizard/StepContainer";
import { StepNavigation } from "./components/FormWizard/StepNavigation";
import { TypeSelector } from "./components/collaboration-types/TypeSelector";
import { TwitterCollabForm } from "./components/collaboration-types/TwitterCollabForm";
import { PodcastCollabForm } from "./components/collaboration-types/PodcastCollabForm";
import { TwitterSpacesForm } from "./components/collaboration-types/TwitterSpacesForm";
import { LiveStreamForm } from "./components/collaboration-types/LiveStreamForm";
import { ReportForm } from "./components/collaboration-types/ReportForm";
import { NewsletterForm } from "./components/collaboration-types/NewsletterForm";
import { BlogPostForm } from "./components/collaboration-types/BlogPostForm";
import { useCollaborationForm } from "./hooks/useCollaborationForm";
import { collaborationTypes } from "./utils/typeRegistry";

/**
 * The type selector step shown first
 */
const InitialStep = {
  id: "collab_type",
  title: "Collaboration Type",
  description: "", // Removed duplicate text
};

/**
 * Main form content component
 * Handles rendering type-specific forms based on the selected type
 */
const CollaborationFormContent: React.FC = () => {
  const { currentStepId, setSteps, currentStep, goToNextStep, visibleSteps } = useFormWizard();
  const { availableTypes, selectedTypeId, registerType, selectType } = useCollaborationType();
  
  // Create a unique form ID for each form instance - this is crucial to prevent form bleeding
  const [formInstanceId] = React.useState(() => `form_instance_${Date.now()}`);
  const { form, isSubmitting, handleSubmit } = useCollaborationForm(formInstanceId);
  
  // Register all available collaboration types
  useEffect(() => {
    collaborationTypes.forEach(type => {
      registerType(type);
    });
  }, [registerType]);
  
  // Set up the initial step
  useEffect(() => {
    setSteps([InitialStep]);
  }, [setSteps]);
  
  // Handle form submission
  const onSubmit = () => {
    handleSubmit();
  };
  
  // Helper functions to get step information
  const getStepTitle = () => {
    if (!currentStepId || currentStepId === "collab_type") return InitialStep.title;
    
    // Find selected type
    const selectedType = availableTypes.find(type => type.id === selectedTypeId);
    if (!selectedType) return selectedTypeId || "";
    
    // Find step in type's steps
    const step = selectedType.steps.find(s => s.id === currentStepId);
    return step?.title || selectedTypeId || "";
  };
  
  const getStepDescription = () => {
    if (!currentStepId || currentStepId === "collab_type") return InitialStep.description;
    
    // Find selected type
    const selectedType = availableTypes.find(type => type.id === selectedTypeId);
    if (!selectedType) return "";
    
    // Find step in type's steps
    const step = selectedType.steps.find(s => s.id === currentStepId);
    return step?.description || "";
  };
  
  // Handle collaboration type selection
  const handleTypeSelected = () => {
    // Get the selected type and set its steps
    const selectedType = availableTypes.find(type => type.id === form.getValues("collab_type"));
    if (selectedType && selectedType.steps) {
      console.log("Selected type:", selectedType.id);
      console.log("Setting steps:", selectedType.steps);
      
      // Set steps to type-specific steps
      setSteps([
        InitialStep,  // Keep the initial step 
        ...selectedType.steps // Add the type-specific steps
      ]);
      
      // Select the collaboration type in the context to trigger form state isolation
      selectType(selectedType.id);
      
      // MUCH MORE CAREFUL APPROACH: Only set default values for fields that don't exist yet
      // This preserves any existing user input while still initializing required fields
      const currentValues = form.getValues();
      const defaultsToApply = { ...selectedType.defaultValues };
      
      // Apply defaults while preserving any existing values
      // This prevents wiping out user input accidentally
      const preservedValues: Record<string, any> = {
        collab_type: currentValues.collab_type
      };
      
      // Apply defaults for only fields that don't have values yet
      Object.keys(defaultsToApply).forEach(key => {
        // Check if the field already has a value that should be preserved
        if (currentValues[key] !== undefined && currentValues[key] !== null && 
            currentValues[key] !== '') {
          // Preserve existing user input
          preservedValues[key] = currentValues[key];
          console.log(`Preserving existing value for ${key}:`, currentValues[key]);
        } else {
          // Set default value for this field
          preservedValues[key] = defaultsToApply[key];
        }
      });
      
      // Apply our carefully crafted mix of preserved values and defaults
      form.reset(preservedValues, {
        keepDirty: true,         // Keep fields marked as dirty  
        keepTouched: true,       // Keep track of which fields user has interacted with
        keepIsValid: false,      // Re-validate all fields
        keepErrors: false,       // Clear any existing errors
        keepDefaultValues: false // Don't keep previous default values
      });
      
      // Move to next step
      setTimeout(() => goToNextStep(), 0);
    }
  };
  
  // Render the current step content
  const renderStepContent = () => {
    // First step is always the collaboration type selector
    if (currentStepId === "collab_type") {
      return <TypeSelector form={form} onTypeSelected={handleTypeSelected} />;
    }
    
    // For other steps, render the appropriate type-specific form based on selected type
    const stepId = currentStepId || "";
    
    // ANTI-BLEEDING: Create a completely unique instance key on EVERY render
    // This forces React to create a new component instance each time,
    // completely isolating state and preventing any value bleeding
    const timestampKey = Date.now();
    const formInstanceKey = `${selectedTypeId || "unknown"}_${timestampKey}`;
    
    // Cache buster component to fully reset before rendering any form
    const TypeWrapper = ({ children }: { children: React.ReactNode }) => {
      // Use a useEffect to reset any potential field bleeding when the wrapper mounts
      React.useEffect(() => {
        // Safety: Get current form type to preserve
        const currentType = form.getValues("collab_type");
        
        // Get values we want to preserve by type
        const preserveByType: Record<string, string[]> = {
          "Twitter Spaces Guest": ["twitter_handle", "host_follower_count"],
          "Co-Marketing on Twitter": ["twitter_collaboration_types", "handle_url"],
          "Live Stream Guest Appearance": ["previous_stream_link", "expected_audience_size"],
          "Podcast Guest Appearance": ["podcast_name", "podcast_link"],
          "Report & Research Feature": ["report_link"],
          // Add more fields to preserve for other types as needed
        };
        
        const fieldsToPreserve = ["collab_type"];
        
        // Add type-specific fields to preserve
        if (selectedTypeId && preserveByType[selectedTypeId]) {
          fieldsToPreserve.push(...preserveByType[selectedTypeId]);
        }
        
        console.log(`TypeWrapper preserving fields for ${selectedTypeId}:`, fieldsToPreserve);
        
        // MUCH LESS AGGRESSIVE - Only unregister fields we don't want to preserve
        // This prevents accidental deletion of field values
        const allFields = Object.keys(form.getValues());
        allFields.forEach(field => {
          if (!fieldsToPreserve.includes(field)) {
            // Only clear fields that we don't want to preserve
            form.setValue(field, undefined, { shouldValidate: false });
          }
        });
        
        // Ensure collab_type is still set
        form.setValue("collab_type", currentType, { shouldValidate: false });
        
        console.log(`TypeWrapper mounted for ${selectedTypeId} with unique key ${formInstanceKey}`);
      }, []);
      
      return <>{children}</>;
    };
    
    // Render the appropriate form type with a TypeWrapper to ensure clean state
    switch (selectedTypeId) {
      case "Co-Marketing on Twitter":
        return (
          <TypeWrapper key={formInstanceKey}>
            <TwitterCollabForm step={stepId} />
          </TypeWrapper>
        );
      case "Podcast Guest Appearance":
        return (
          <TypeWrapper key={formInstanceKey}>
            <PodcastCollabForm step={stepId} />
          </TypeWrapper>
        );
      case "Twitter Spaces Guest":
        return (
          <TypeWrapper key={formInstanceKey}>
            <TwitterSpacesForm step={stepId} />
          </TypeWrapper>
        );
      case "Live Stream Guest Appearance":
        return (
          <TypeWrapper key={formInstanceKey}>
            <LiveStreamForm step={stepId} />
          </TypeWrapper>
        );
      case "Report & Research Feature":
        return (
          <TypeWrapper key={formInstanceKey}>
            <ReportForm step={stepId} />
          </TypeWrapper>
        );
      case "Newsletter Feature":
        return (
          <TypeWrapper key={formInstanceKey}>
            <NewsletterForm step={stepId} />
          </TypeWrapper>
        );
      case "Blog Post Feature":
        return (
          <TypeWrapper key={formInstanceKey}>
            <BlogPostForm step={stepId} />
          </TypeWrapper>
        );
      default:
        // Fallback when no collaboration type is selected or supported
        return (
          <div className="p-4 text-center text-muted-foreground">
            Please select a collaboration type first or go back to the previous step.
          </div>
        );
    }
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <StepContainer
            title={currentStep === 0 ? InitialStep.title : getStepTitle()}
            description={currentStep === 0 ? InitialStep.description : getStepDescription()}
          >
            {renderStepContent()}
          </StepContainer>
          
          <StepNavigation 
            form={form} 
            onSubmit={onSubmit}
            isSubmitting={isSubmitting} 
          />
          
          {/* Progress indicator moved to bottom of form */}
          <div className="mt-3">
            <StepIndicator />
          </div>
        </form>
      </Form>
    </div>
  );
};

/**
 * Main Collaboration Form V2 component
 * Wraps all necessary providers for form functionality
 * 
 * We use a key on the FormWizardProvider to force a complete
 * re-render and state reset whenever the page is loaded
 * This ensures no form state bleeds between page visits
 */
export const CollaborationFormV2: React.FC = () => {
  // Generate a unique key when this component mounts
  // This forces a complete reset of all child components and their state
  const [instanceKey] = React.useState(() => `form_wizard_${Date.now()}`);
  
  return (
    <FormPersistenceProvider>
      <CollaborationTypeProvider>
        <FormWizardProvider key={instanceKey}>
          <CollaborationFormContent />
        </FormWizardProvider>
      </CollaborationTypeProvider>
    </FormPersistenceProvider>
  );
};