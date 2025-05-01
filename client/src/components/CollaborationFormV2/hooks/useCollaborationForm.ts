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
      
      // Create a properly formatted object that matches what the API expects
      // This is critical for backward compatibility with the original form
      const formattedData = {
        ...values,
        // These fields should always be present
        collab_type: values.collab_type,
        description: values.description || "",
        topics: Array.isArray(values.topics) ? values.topics : [],
        date_type: values.date_type || "specific_date",
        specific_date: values.specific_date,
        is_free_collab: values.is_free_collab !== undefined ? values.is_free_collab : true,
        
        // Fields for filtering
        required_company_sectors: values.required_company_sectors || [],
        required_funding_stages: values.required_funding_stages || [],
        required_blockchain_networks: values.required_blockchain_networks || [],
        required_token_status: values.required_token_status || false,
        min_company_followers: values.min_company_followers || "0-1K",
        min_user_followers: values.min_user_followers || "0-1K",
        
        // Filter toggle states
        filter_company_sectors_enabled: values.filter_company_sectors_enabled || false,
        filter_company_followers_enabled: values.filter_company_followers_enabled || false,
        filter_user_followers_enabled: values.filter_user_followers_enabled || false,
        filter_funding_stages_enabled: values.filter_funding_stages_enabled || false,
        filter_token_status_enabled: values.filter_token_status_enabled || false,
        filter_blockchain_networks_enabled: values.filter_blockchain_networks_enabled || false,
        
        // Standardized fields for matching
        company_tags: values.required_company_sectors || [],
        company_twitter_followers: values.min_company_followers || "0-1K",
        twitter_followers: values.min_user_followers || "0-1K",
        funding_stage: values.required_funding_stages && values.required_funding_stages.length > 0
          ? values.required_funding_stages[0] : "Not Applicable",
        company_has_token: values.required_token_status || false,
        company_blockchain_networks: values.required_blockchain_networks || [],
        
        // Important: Create a details object that contains type-specific data
        // Different structure per collaboration type
        details: formatDetailsForType(values.collab_type, values)
      };
      
      console.log("Formatted data for API:", formattedData);
      
      // Make API request to create the collaboration
      const response = await fetch("/api/collaborations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": window.Telegram?.WebApp?.initData || "",
        },
        body: JSON.stringify(formattedData),
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
        setLocation("/my-collaborations");
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
  
  /**
   * Helper function to format type-specific details for the API
   */
  const formatDetailsForType = (collabType: string, values: any): any => {
    switch (collabType) {
      case "Twitter Spaces Guest":
        return {
          twitter_handle: values.twitter_handle || "https://x.com/",
          host_follower_count: values.follower_count || "0-1K",
          // No longer include short_description in details as it's moved to the common field
        };
        
      case "Co-Marketing on Twitter":
        return {
          twittercomarketing_type: Array.isArray(values.twitter_collab_types) 
            ? values.twitter_collab_types 
            : ["Thread Collab"],
          host_twitter_handle: values.twitter_handle || "https://x.com/",
          host_follower_count: values.follower_count || "0-1K",
          // No longer include short_description in details
        };
        
      case "Podcast Guest Appearance":
        return {
          podcast_name: values.podcast_name || "",
          podcast_link: values.podcast_link || "",
          estimated_reach: values.audience_size || "Under 100",
        };
        
      case "Live Stream Guest Appearance":
        return {
          // Map the fields correctly based on the LiveStreamForm component field names
          title: values.platform_name || "", // Using platform_name from form as title
          date_selection: values.date_type || "any_future_date",
          specific_date: values.specific_date || "",
          previous_stream_link: values.stream_link || "", // stream_link from form as previous_stream_link
          expected_audience_size: values.audience_size || "Under 100",
          // Add any additional fields that might be needed for the API
          topics: Array.isArray(values.topics) ? values.topics : []
        };
        
      case "Report & Research Feature":
        return {
          // Map fields correctly based on the ReportForm component field names
          research_topic: Array.isArray(values.topics) ? values.topics : [],
          target_audience: values.report_type || "Market Report", // Using report_type as target_audience
          estimated_release_date: values.date_type === "specific_date" ? values.specific_date : "",
          // Additional fields from the form
          report_name: values.report_name || "",
          report_link: values.report_link || "",
          audience_reach: values.audience_reach || "Under 100"
        };
        
      case "Newsletter Feature":
        return {
          // Map fields correctly based on the NewsletterForm component field names
          newsletter_name: values.newsletter_name || "",
          newsletter_url: values.newsletter_url || "", // The newsletter URL field is not present in the form
          audience_reach: values.audience_reach || values.subscriber_count || "Under 100",
          total_subscribers: values.subscriber_count || "Under 100"
        };
        
      case "Blog Post Feature":
        return {
          // Map fields correctly based on the BlogPostForm component field names
          blog_topic: values.topics ? (Array.isArray(values.topics) ? values.topics[0] : values.topics) : "",
          blog_link: values.blog_url || "",
          blog_name: values.blog_name || "",
          est_readers: values.monthly_visitors || "Under 100",
          estimated_release_date: values.date_type === "specific_date" ? values.specific_date : "",
          // Additional fields from the form
          post_type: values.post_type || "Feature"
        };
        
      default:
        // Fallback for unknown types
        return {};
    }
  };
  
  return {
    form,
    isSubmitting,
    handleSubmit,
    selectedType,
  };
};