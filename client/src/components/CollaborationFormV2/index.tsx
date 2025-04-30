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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { form, isSubmitting, handleSubmit } = useCollaborationForm();
  
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
    
    switch (selectedTypeId) {
      case "Co-Marketing on Twitter":
        return <TwitterCollabForm step={stepId} />;
      case "Podcast Guest Appearance":
        return <PodcastCollabForm step={stepId} />;
      case "Twitter Spaces Guest":
        return <TwitterSpacesForm step={stepId} />;
      case "Live Stream Guest Appearance":
        return <LiveStreamForm step={stepId} />;
      case "Report & Research Feature":
        return <ReportForm step={stepId} />;
      case "Newsletter Feature":
        return <NewsletterForm step={stepId} />;
      case "Blog Post Feature":
        return <BlogPostForm step={stepId} />;
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
          <ScrollArea className="h-full max-h-[60vh]">
            <StepContainer
              title={currentStep === 0 ? InitialStep.title : getStepTitle()}
              description={currentStep === 0 ? InitialStep.description : getStepDescription()}
            >
              {renderStepContent()}
            </StepContainer>
          </ScrollArea>
          
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
 */
export const CollaborationFormV2: React.FC = () => {
  return (
    <FormPersistenceProvider>
      <CollaborationTypeProvider>
        <FormWizardProvider>
          <CollaborationFormContent />
        </FormWizardProvider>
      </CollaborationTypeProvider>
    </FormPersistenceProvider>
  );
};