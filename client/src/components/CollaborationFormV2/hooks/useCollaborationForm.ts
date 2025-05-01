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
      
      // Make API request to create the collaboration
      const response = await fetch("/api/collaborations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
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