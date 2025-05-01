import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useFormWizard } from "../contexts/FormWizardContext";
import { useCollaborationType } from "../contexts/CollaborationTypeContext";
import { useFormPersistence } from "../contexts/FormPersistenceContext";

/**
 * Custom hook for collaboration form operations
 */
export const useCollaborationForm = <T extends Record<string, any>>(
  formId: string = "collaboration_form"
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getSelectedType } = useCollaborationType();
  const { loadFormState, saveFormState, clearFormState } = useFormPersistence();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get the currently selected type's schema and default values
  const selectedType = getSelectedType();
  const schema = selectedType?.schema;
  const defaultValues = selectedType?.defaultValues || {};
  
  // Load persisted form data or use defaults
  const savedFormData = loadFormState<T>(formId, defaultValues as T);
  
  // Initialize the form
  const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: savedFormData as any,
  });
  
  // Watch for form changes to persist state
  const formValues = form.watch();
  useEffect(() => {
    saveFormState(formId, formValues);
  }, [formValues, formId, saveFormState]);
  
  // Handle form submission
  const handleSubmit = async (onSuccess?: (data: T) => void) => {
    if (!selectedType) {
      toast({
        title: "Error",
        description: "Please select a collaboration type",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Validate the form data against the schema
      const values = form.getValues();
      
      // Create a copy of the values for transformation
      const submissionData = { ...values };
      
      // Extract fields that should be in the details object
      // Fields that are part of the base schema should stay at the root level
      const baseFields = ['topics', 'description', 'date_type', 'specific_date', 'is_free_collab', 'collab_type'];
      const filterFields = [
        'filter_company_sectors_enabled', 'filter_company_followers_enabled', 
        'filter_user_followers_enabled', 'filter_funding_stages_enabled', 
        'filter_token_status_enabled', 'filter_blockchain_networks_enabled',
        'required_company_sectors', 'required_funding_stages', 'required_token_status',
        'required_blockchain_networks', 'min_company_followers', 'min_user_followers'
      ];
      
      // Initialize details object if it doesn't exist
      if (!submissionData.details) {
        submissionData.details = {};
      }
      
      // Move all non-base, non-filter fields to the details object
      Object.keys(values).forEach(key => {
        if (!baseFields.includes(key) && !filterFields.includes(key) && key !== 'details') {
          submissionData.details[key] = values[key];
        }
      });
      
      // Add type-specific required fields to details
      // This ensures backwards compatibility with the backend API
      switch (values.collab_type) {
        case "Twitter Spaces Guest":
          submissionData.details.title = submissionData.description || "";
          submissionData.details.date_selection = submissionData.date_type || "specific_date";
          submissionData.details.expected_audience_size = "100-500"; // Default value
          break;
        case "Podcast Guest Appearance":
          submissionData.details.podcast_name = submissionData.podcast_name || "";
          submissionData.details.podcast_link = submissionData.podcast_link || "";
          break;
        case "Co-Marketing on Twitter":
          submissionData.details.twittercomarketing_type = submissionData.twitter_collab_types || [];
          submissionData.details.host_twitter_handle = submissionData.twitter_handle || "";
          submissionData.details.host_follower_count = submissionData.follower_count || "";
          break;
        default:
          break;
      }
      
      console.log("Submitting collaboration data:", submissionData);
      
      // Make API request to create the collaboration
      const response = await fetch("/api/collaborations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create collaboration");
      }
      
      const data = await response.json();
      
      // Clear the form after successful submission
      clearFormState(formId);
      form.reset(defaultValues as T);
      
      // Show success toast
      toast({
        title: "Success!",
        description: "Your collaboration was created successfully",
      });
      
      // Invalidate collaboration queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/collaborations"] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(data);
      } else {
        // Navigate to collaborations page
        setLocation("/collaborations");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create collaboration",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    form,
    isSubmitting,
    handleSubmit,
    selectedType,
  };
};