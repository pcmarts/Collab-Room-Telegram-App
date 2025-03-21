import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { LoadingScreen } from "@/components/LoadingScreen";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/layout/PageHeader";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

import {
  AUDIENCE_SIZE_RANGES,
  COLLAB_TYPES,
  COLLAB_TOPICS,
  COMPANY_CATEGORIES,
  COMPANY_TAG_CATEGORIES,
  ALL_COMPANY_TAGS,
  FUNDING_STAGES,
  TWITTER_FOLLOWER_COUNTS,
  TWITTER_COLLAB_TYPES,
  BLOCKCHAIN_NETWORKS,
  BLOCKCHAIN_NETWORK_CATEGORIES,
  createCollaborationSchema,
  type CreateCollaboration,
} from "@shared/schema";

interface CreateCollaborationProps {
  id?: string;
}

export default function CreateCollaborationSteps({
  id,
}: CreateCollaborationProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCollabType, setSelectedCollabType] = useState<string>(
    COLLAB_TYPES[0],
  );
  
  // Add reference to track previous step
  const prevStepRef = useRef(currentStep);

  // Initialize with basic form data
  const form = useForm<CreateCollaboration>({
    resolver: zodResolver(createCollaborationSchema),
    defaultValues: {
      collab_type: COLLAB_TYPES[0],
      description: "", // Common description field for all collaboration types
      date_type: "specific_date",
      specific_date: new Date().toISOString().split("T")[0],
      topics: [],
      is_free_collab: true,
      filter_company_sectors_enabled: false,
      filter_company_followers_enabled: false,
      filter_user_followers_enabled: false,
      filter_funding_stages_enabled: false,
      filter_token_status_enabled: false,
      filter_blockchain_networks_enabled: false,
      required_company_sectors: [],
      required_funding_stages: [],
      required_token_status: false,
      required_blockchain_networks: [],
      min_company_followers: TWITTER_FOLLOWER_COUNTS[0],
      min_user_followers: TWITTER_FOLLOWER_COUNTS[0],
      details: {
        // Default values for different collaboration types to prevent field bleeding
        // Twitter spaces defaults
        short_description: "", // Will be removed in favor of common description field
        topic: "",
        host_twitter_handle: "",
        host_follower_count: "",
        
        // Twitter co-marketing defaults
        twitter_description: "",
        twittercomarketing_type: [],
        
        // Podcast defaults 
        podcast_name: "",
        podcast_description: "",
        // Each collaboration type should have its own description
        estimated_reach: "",
        podcast_link: "",
      },
    },
  });

  // Monitor step changes to handle field resets
  useEffect(() => {
    // Don't run on first render
    if (prevStepRef.current === currentStep) {
      return;
    }
    
    // Store the current step for next comparison
    prevStepRef.current = currentStep;
    
    // Get all active form steps
    const activeSteps = getActiveSteps();
    if (currentStep >= activeSteps.length) {
      return;
    }
    
    // Get current step ID
    const currentStepId = activeSteps[currentStep].id;
    
    // Clear the root-level description field when entering a description step
    // to prevent bleeding from previous fields (especially follower count)
    if (currentStepId.includes('description')) {
      // Reset the description field to empty to prevent bleeding from other fields
      form.setValue("description", "");
    }
    
    // Handle Twitter co-marketing field resets
    if (selectedCollabType === "Co-Marketing on Twitter") {
      if (currentStepId === "twitter_comarketing_type") {
        // Reset the Twitter marketing type field
        const twitterDetails = form.getValues("details") as Record<string, any>;
        form.setValue("details.twittercomarketing_type", twitterDetails.twittercomarketing_type || ["Thread Collab"]);
      }
      else if (currentStepId === "twitter_comarketing_handle") {
        // Ensure the Twitter handle field has proper value
        form.setValue("details.host_twitter_handle", "https://x.com/");
      }
      else if (currentStepId === "twitter_comarketing_followers") {
        // Ensure follower count has a default value
        form.setValue("details.host_follower_count", TWITTER_FOLLOWER_COUNTS[0]);
      }
      else if (currentStepId === "twitter_comarketing_description") {
        // Clear description field to prevent bleeding
        form.setValue("description", "");
      }
    }
  }, [currentStep, selectedCollabType, form]);

  // When collaboration type changes
  const handleCollabTypeChange = (value: string) => {
    setSelectedCollabType(value);
    form.setValue("collab_type", value as (typeof COLLAB_TYPES)[number]);

    // IMPORTANT: COMPLETELY reset the form details field to prevent field bleeding
    form.setValue("details", {});
    
    // Use setTimeout to ensure that the form details reset happens first
    setTimeout(() => {
      // Then set type-specific defaults with a clean slate
      const newDetails: Record<string, any> = {};
      
      // Add type-specific fields
      switch (value) {
        case "Podcast Guest Appearance":
          newDetails.podcast_name = "";
          newDetails.short_description = "";
          newDetails.podcast_description = "";
          newDetails.podcast_link = "";
          newDetails.estimated_reach = AUDIENCE_SIZE_RANGES[0];
          break;
          
        case "Twitter Spaces Guest":
          // Use consistent field names for Twitter Spaces
          newDetails.twitter_handle = "https://x.com/";
          newDetails.host_follower_count = TWITTER_FOLLOWER_COUNTS[0];
          newDetails.short_description = ""; // Single field for topic description - ensure this field is present from the start
          break;
          
        case "Live Stream Guest Appearance":
          newDetails.title = "";
          newDetails.short_description = "";
          newDetails.date_selection = "any_future_date";
          newDetails.specific_date = "";
          newDetails.previous_stream_link = "";
          newDetails.expected_audience_size = AUDIENCE_SIZE_RANGES[0];
          newDetails.topics = [];
          break;
          
        case "Report & Research Feature":
          newDetails.research_topic = [];
          newDetails.short_description = "";
          newDetails.target_audience = "";
          newDetails.estimated_release_date = "";
          break;
          
        case "Newsletter Feature":
          newDetails.newsletter_name = "";
          newDetails.topics = [];
          newDetails.audience_reach = AUDIENCE_SIZE_RANGES[0];
          newDetails.short_description = "";
          // Removed newsletter_description field in favor of short_description
          newDetails.newsletter_url = "";
          newDetails.total_subscribers = AUDIENCE_SIZE_RANGES[0];
          break;
          
        case "Blog Post Feature":
          newDetails.blog_topic = "";
          newDetails.blog_link = "";
          newDetails.blog_name = "";
          newDetails.blog_url = "";
          newDetails.est_readers = AUDIENCE_SIZE_RANGES[0];
          newDetails.short_description = "";
          newDetails.estimated_release_date = "";
          break;
          
        case "Co-Marketing on Twitter":
          newDetails.twittercomarketing_type = ["Thread Collab"];
          newDetails.host_twitter_handle = "https://x.com/";
          newDetails.host_follower_count = TWITTER_FOLLOWER_COUNTS[0];
          newDetails.short_description = "";
          break;
      }

      // Apply the new details after reset
      form.setValue("details", newDetails);
    }, 10); // Small delay to ensure reset happens first
  };

  // Function to preserve form data between steps instead of clearing it
  // This ensures Twitter Co-Marketing type selections and other multi-step fields work correctly
  const clearFormFieldsExcept = (currentFieldName: string) => {
    // We no longer clear fields as it causes data loss between steps
    // The form bleeding issues have been fixed in other ways
    
    // If we need to initialize a blank field, we can do it here
    if (currentFieldName.startsWith('details.')) {
      const details = form.getValues('details') as Record<string, any>;
      const fieldKey = currentFieldName.split('.')[1];
      
      // Only initialize the field if it doesn't exist
      if (details && details[fieldKey] === undefined) {
        const updatedDetails = { ...details };
        
        // Initialize empty fields based on type
        if (fieldKey === 'short_description') {
          updatedDetails[fieldKey] = "";
        }
        
        form.setValue('details', updatedDetails);
      }
    }
  };
  
  // Move to next step
  const nextStep = () => {
    // Validate current step
    const stepValid = validateCurrentStep();
    
    if (!stepValid) {
      return;
    }

    const activeSteps = getActiveSteps();
    
    // If we're on the last step, submit the form
    if (currentStep >= activeSteps.length - 1) {
      // Submit the form if on the last step
      handleSubmit();
    } else {
      // Get the current field name
      const currentStepId = activeSteps[currentStep].id;
      
      // Find the next step
      const nextStepId = activeSteps[currentStep + 1].id;
      
      // Clear any potential field bleeding
      if (currentStepId.includes('follower') && nextStepId.includes('description')) {
        // If going from a follower count field to a description field, explicitly clear the description
        // to prevent follower count from being copied over
        form.setValue("description", "");
      }
      
      // Move to the next step
      setCurrentStep(currentStep + 1);
    }
  };

  // Validation for the current step
  const validateCurrentStep = () => {
    const activeSteps = getActiveSteps();
    if (currentStep < 0 || currentStep >= activeSteps.length) {
      return false;
    }
    
    const currentStepId = activeSteps[currentStep].id;
    
    // Validate based on the field ID
    switch (currentStepId) {
      case "collab_type":
        const type = form.getValues("collab_type");
        if (!type) {
          toast({
            title: "Please select a collaboration type",
            variant: "destructive",
          });
          return false;
        }
        break;
        
      case "topics":
        const topics = form.getValues("topics");
        if (!topics || !Array.isArray(topics) || topics.length === 0) {
          toast({
            title: "Please select at least one topic",
            variant: "destructive",
          });
          return false;
        }
        break;
      
      // Type-specific validations
      case "podcast_name":
        const podcastName = form.getValues("details.podcast_name");
        if (!podcastName || podcastName.trim() === "") {
          toast({
            title: "Please enter a podcast name",
            variant: "destructive",
          });
          return false;
        }
        break;
        
      case "podcast_short_description":
        const podcastDescription = form.getValues("description");
        if (!podcastDescription || podcastDescription.trim() === "") {
          toast({
            title: "Please enter a short description for your podcast",
            variant: "destructive",
          });
          return false;
        }
        break;
        
      case "podcast_link":
        const podcastLink = form.getValues("details.podcast_link");
        if (!podcastLink || podcastLink.trim() === "") {
          toast({
            title: "Please enter a podcast link",
            variant: "destructive",
          });
          return false;
        }
        break;
      
      // Add more validation as needed for other fields
    }

    return true;
  };

  // Go back to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Get the form data
      const data = form.getValues();
      console.log("Form data being submitted:", data);

      // Ensure that details has all required fields based on collaboration type
      // This prevents validation errors when submitting the form
      // Using a type assertion to ensure the details field is properly typed for each collab type
      const rawDetails = data.details as Record<string, any>;
      
      // Log full raw details for debugging
      console.log("Raw form details:", rawDetails);
      
      // We're now using the root-level description field directly, so we don't need to extract it
      // from the details.short_description field anymore. This makes short_description optional in details.
      console.log("Description from form:", data.description);
      
      // Ensure description is always a string
      if (typeof data.description !== 'string') {
        data.description = "";
      }
      
      // Log the extracted common description
      console.log("Common description field:", data.description);
      
      if (data.collab_type === "Podcast Guest Appearance") {
        data.details = {
          podcast_name: typeof rawDetails?.podcast_name === 'string' ? rawDetails.podcast_name : "",
          // No longer need to include short_description in details as it's moved to the common field
          podcast_link: typeof rawDetails?.podcast_link === 'string' ? rawDetails.podcast_link : "",
          estimated_reach: AUDIENCE_SIZE_RANGES.includes(rawDetails?.estimated_reach) ? rawDetails.estimated_reach : AUDIENCE_SIZE_RANGES[0],
        };
      } else if (data.collab_type === "Twitter Spaces Guest") {
        // Enhanced debugging for Twitter Spaces Guest
        console.log("Twitter Spaces Guest BEFORE formatting:", rawDetails);
        
        // Note: Using only standard fields for Twitter spaces, description is now at root level
        data.details = {
          twitter_handle: typeof rawDetails?.twitter_handle === 'string' ? rawDetails.twitter_handle : "https://x.com/",
          host_follower_count: TWITTER_FOLLOWER_COUNTS.includes(rawDetails?.host_follower_count) ? rawDetails.host_follower_count : TWITTER_FOLLOWER_COUNTS[0],
          // Remove short_description from details as it's moved to the common field
        };
        
        console.log("Twitter Spaces Guest AFTER formatting:", data.details);
        console.log("  - Extracted description moved to common field:", data.description);
      } else if (data.collab_type === "Live Stream Guest Appearance") {
        // Using the root-level description field, ensure it's a string
        if (typeof data.description !== 'string') {
          data.description = "";
        }
        
        data.details = {
          title: typeof rawDetails?.title === 'string' ? rawDetails.title : "",
          // No longer include short_description in details object
          date_selection: typeof rawDetails?.date_selection === 'string' ? rawDetails.date_selection : "any_future_date",
          specific_date: typeof rawDetails?.specific_date === 'string' ? rawDetails.specific_date : "",
          previous_stream_link: typeof rawDetails?.previous_stream_link === 'string' ? rawDetails.previous_stream_link : "",
          expected_audience_size: AUDIENCE_SIZE_RANGES.includes(rawDetails?.expected_audience_size) ? rawDetails.expected_audience_size : AUDIENCE_SIZE_RANGES[0],
          topics: Array.isArray(rawDetails?.topics) ? rawDetails.topics : [],
        };
      } else if (data.collab_type === "Report & Research Feature") {
        // Using the root-level description field, ensure it's a string
        if (typeof data.description !== 'string') {
          data.description = "";
        }
        
        data.details = {
          research_topic: Array.isArray(rawDetails?.research_topic) ? rawDetails.research_topic : [],
          target_audience: typeof rawDetails?.target_audience === 'string' ? rawDetails.target_audience : "",
          // No longer include short_description in details object
          estimated_release_date: typeof rawDetails?.estimated_release_date === 'string' ? rawDetails.estimated_release_date : "",
        };
      } else if (data.collab_type === "Newsletter Feature") {
        // Using the root-level description field, ensure it's a string
        if (typeof data.description !== 'string') {
          data.description = "";
        }
        
        data.details = {
          newsletter_name: typeof rawDetails?.newsletter_name === 'string' ? rawDetails.newsletter_name : "",
          // No longer include short_description in details object
          newsletter_url: typeof rawDetails?.newsletter_url === 'string' ? rawDetails.newsletter_url : "",
          audience_reach: AUDIENCE_SIZE_RANGES.includes(rawDetails?.audience_reach) ? rawDetails.audience_reach : AUDIENCE_SIZE_RANGES[0],
          total_subscribers: AUDIENCE_SIZE_RANGES.includes(rawDetails?.total_subscribers) ? rawDetails.total_subscribers : AUDIENCE_SIZE_RANGES[0],
          topics: Array.isArray(rawDetails?.topics) ? rawDetails.topics : [],
        };
      } else if (data.collab_type === "Blog Post Feature") {
        // Using the root-level description field, ensure it's a string
        if (typeof data.description !== 'string') {
          data.description = "";
        }
        
        data.details = {
          blog_topic: typeof rawDetails?.blog_topic === 'string' ? rawDetails.blog_topic : "",
          blog_link: typeof rawDetails?.blog_link === 'string' ? rawDetails.blog_link : "",
          blog_name: typeof rawDetails?.blog_name === 'string' ? rawDetails.blog_name : "",
          blog_url: typeof rawDetails?.blog_url === 'string' ? rawDetails.blog_url : "",
          // No longer include short_description in details object
          est_readers: AUDIENCE_SIZE_RANGES.includes(rawDetails?.est_readers) ? rawDetails.est_readers : AUDIENCE_SIZE_RANGES[0],
          estimated_release_date: typeof rawDetails?.estimated_release_date === 'string' ? rawDetails.estimated_release_date : "",
        };
      } else if (data.collab_type === "Co-Marketing on Twitter") {
        console.log("Co-Marketing on Twitter BEFORE formatting:", rawDetails);
        
        // Using the root-level description field, ensure it's a string
        if (typeof data.description !== 'string') {
          data.description = "";
        }
        
        console.log("Using root-level description for Twitter co-marketing:", data.description);

        data.details = {
          twittercomarketing_type: Array.isArray(rawDetails?.twittercomarketing_type) ? rawDetails.twittercomarketing_type : ["Thread Collab"],
          host_twitter_handle: typeof rawDetails?.host_twitter_handle === 'string' ? rawDetails.host_twitter_handle : "https://x.com/",
          host_follower_count: TWITTER_FOLLOWER_COUNTS.includes(rawDetails?.host_follower_count) 
            ? rawDetails.host_follower_count 
            : TWITTER_FOLLOWER_COUNTS[0],
          // No longer include short_description in details as it's moved to the common field
        };
        
        console.log("Co-Marketing on Twitter AFTER formatting:", data.details);
        console.log("  - Extracted description moved to common field:", data.description);
      }

      // Format the data
      const formattedData = {
        ...data,
        required_company_sectors: data.required_company_sectors || [],
        required_funding_stages: data.required_funding_stages || [],
        required_blockchain_networks: data.required_blockchain_networks || [],
        company_tags: data.required_company_sectors || [],
        company_twitter_followers: data.min_company_followers,
        twitter_followers: data.min_user_followers,
        funding_stage:
          data.required_funding_stages &&
          data.required_funding_stages.length > 0
            ? data.required_funding_stages[0]
            : "Not Applicable",
        company_has_token: data.required_token_status || false,
        company_blockchain_networks: data.required_blockchain_networks || [],
      };

      // Remove specific_date if not needed
      if (data.date_type !== "specific_date") {
        delete formattedData.specific_date;
      }

      // Get Telegram init data
      const telegramInitData = window.Telegram?.WebApp?.initData || "";

      // Complete detailed debugging of all form data right before submission
      // Detailed debugging info for the description field extraction
      console.log("DESCRIPTION MIGRATION DEBUG INFO:", {
        collaborationType: data.collab_type,
        rawFormDescription: form.getValues("details.short_description"),
        extractedDescription: data.description,
        descriptionLength: typeof data.description === 'string' ? data.description.length : 0,
        validationMaxLength: data.collab_type === "Twitter Spaces Guest" ? 180 : 200
      });
      
      // Complete detailed debugging of all form data right before submission
      console.log("FINAL FORM DATA BEING SUBMITTED:", {
        rawFormData: form.getValues(),
        processedData: formattedData,
        commonDescription: formattedData.description,
        descriptionSourceInfo: {
          collaborationType: data.collab_type,
          shortDescriptionField: form.getValues("details.short_description"),
          extractedToCommonField: true,
          commonDescriptionLength: typeof formattedData.description === 'string' ? formattedData.description.length : 0
        }
      });
      
      const response = await fetch("/api/collaborations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": telegramInitData,
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        // Invalidate queries to refresh collaboration lists
        queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });

        toast({
          title: "Success!",
          description: "Your collaboration has been created successfully.",
          duration: 2000, // Auto-dismiss after 2 seconds
        });
        // Redirect to My Collaborations page
        setLocation("/my-collaborations");
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create: ${errorText}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define all the possible steps with their associated fields
  const allSteps = [
    {
      id: "collab_type",
      title: "Collaboration Type",
      description: "What type of collaboration are you looking for?",
      render: () => (
        <FormField
          control={form.control}
          name="collab_type"
          render={({ field }) => (
            <FormItem className="space-y-1 pt-1">
              <FormLabel className="mb-1 text-sm">What type of collaboration are you looking for?</FormLabel>
              <div className="flex flex-col gap-1">
                {COLLAB_TYPES.map((type) => {
                  const isSelected = field.value === type;
                  return (
                    <Button
                      key={type}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full h-auto py-2 px-2 text-xs justify-start normal-case ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/20'}`}
                      onClick={() => {
                        field.onChange(type);
                        handleCollabTypeChange(type);
                      }}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      {type}
                    </Button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    },
    {
      id: "topics",
      title: "Topics",
      description: "What topics will this collaboration cover?",
      render: () => (
        <FormField
          control={form.control}
          name="topics"
          render={() => (
            <FormItem className="space-y-1 pt-0">
              <div className="mb-1">
                <FormLabel className="mb-0 text-sm">Select Topics (pick at least one)</FormLabel>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {COLLAB_TOPICS.map((topic) => (
                  <FormField
                    key={topic}
                    control={form.control}
                    name="topics"
                    render={({ field }) => {
                      const isSelected = field.value?.includes(topic);
                      return (
                        <FormItem key={topic} className="flex-1">
                          <FormControl>
                            <Button
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={`w-full h-auto py-1 px-1 text-[10px] justify-start normal-case ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/20'}`}
                              onClick={() => {
                                const currentValue = field.value || [];
                                const updatedTopics = isSelected
                                  ? currentValue.filter((t) => t !== topic)
                                  : [...currentValue, topic];
                                field.onChange(updatedTopics);
                              }}
                            >
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-2 w-2">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                              {topic}
                            </Button>
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    },
    {
      id: "date_type",
      title: "Date Preference",
      description: "Do you have a specific date in mind?",
      render: () => (
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="date_type"
            render={({ field }) => (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">Date Preference</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear specific date if selecting "any_future_date"
                    if (value === "any_future_date") {
                      form.setValue("specific_date", "");
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select a date preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="specific_date">
                      Specific Date
                    </SelectItem>
                    <SelectItem value="any_future_date">
                      Any Future Date
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch("date_type") === "specific_date" && (
            <FormField
              control={form.control}
              name="specific_date"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Select Date</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-8 text-xs" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )
    },
    {
      id: "podcast_name",
      title: "Podcast Name",
      description: "What's your podcast called?",
      render: () => (
        <FormField
          control={form.control}
          name="details.podcast_name"
          render={({ field }) => {
            // Ensure field value is always a string
            const displayValue = Array.isArray(field.value) ? "" : (typeof field.value === 'string' ? field.value : "");
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">What's your podcast name?</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter podcast name" 
                    className="h-8 text-xs"
                    value={displayValue}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "podcast_short_description",
      title: "Short Description",
      description: "Briefly describe your podcast",
      render: () => (
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => {
            // Ensure field value is always a string
            const displayValue = Array.isArray(field.value) ? "" : (typeof field.value === 'string' ? field.value : "");
            
            // Add an effect to make sure the field gets properly updated
            useEffect(() => {
              // This ensures the field gets properly registered with the form
              form.register("description");
              
              // Debug the field value
              console.log("Podcast description field:", field.value);
            }, [field.value, form]);
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">Short Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What is your podcast about? Briefly describe it." 
                    className="min-h-[60px] text-xs"
                    maxLength={200}
                    value={displayValue}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      console.log("Description updated:", e.target.value);
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {displayValue?.length || 0}/200 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "podcast_link",
      title: "Podcast Link",
      description: "Link to your podcast",
      render: () => (
        <FormField
          control={form.control}
          name="details.podcast_link"
          render={({ field }) => {
            // Ensure field value is always a string
            const displayValue = Array.isArray(field.value) ? "" : (typeof field.value === 'string' ? field.value : "");
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">Link to your podcast</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://your-podcast-url.com"
                    className="h-8 text-xs"
                    value={displayValue}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "podcast_reach",
      title: "Podcast Audience",
      description: "How many listeners do you have?",
      render: () => (
        <FormField
          control={form.control}
          name="details.estimated_reach"
          render={({ field }) => (
            <FormItem className="space-y-1 pt-0">
              <FormLabel className="mb-0 text-sm">How many listeners do you have?</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select podcast reach" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AUDIENCE_SIZE_RANGES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "twitter_handle",
      title: "Twitter Handle",
      description: "What's your Twitter/X handle?",
      render: () => (
        <FormField
          control={form.control}
          name="details.twitter_handle"
          render={({ field }) => {
            // Ensure field value is always a string
            const displayValue = Array.isArray(field.value) ? "https://x.com/" : (typeof field.value === 'string' ? field.value : "https://x.com/");
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">What's your Twitter/X handle?</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://x.com/username"
                    className="h-8 text-xs"
                    value={displayValue}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Include the full URL
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Twitter Spaces Guest"
    },
    {
      id: "twitter_followers",
      title: "Twitter Followers",
      description: "How many followers do you have?",
      render: () => (
        <FormField
          control={form.control}
          name="details.host_follower_count"
          render={({ field }) => {
            // Ensure the field value is a string
            const currentValue = Array.isArray(field.value) ? "" : (typeof field.value === 'string' ? field.value : "");
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">How many followers do you have?</FormLabel>
                <div className="grid grid-cols-2 gap-1">
                  {TWITTER_FOLLOWER_COUNTS.map((count) => {
                    const isSelected = currentValue === count;
                    return (
                      <Button
                        key={count}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full h-8 py-1 px-2 text-xs justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/20'}`}
                        onClick={() => field.onChange(count)}
                      >
                        {count}
                      </Button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Twitter Spaces Guest"
    },
    {
      id: "twitter_space_info",
      title: "Twitter Space Information",
      description: "Tell us about your Twitter Space",
      render: () => (
        <div className="space-y-4">
          {/* Twitter Space Topic Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => {
              // Ensure field value is always a string
              const displayValue = Array.isArray(field.value) ? "" : (typeof field.value === 'string' ? field.value : "");
              
              // Add an effect to make sure the field gets properly updated
              useEffect(() => {
                // This ensures the field gets properly registered with the form
                form.register("description");
                
                // Debug the field value
                console.log("Twitter Spaces description field:", field.value);
              }, [field.value, form]);
              
              return (
                <FormItem className="space-y-1 pt-0">
                  <FormLabel className="mb-0 text-sm">Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your Twitter Space in a short summary"
                      className="resize-none text-xs"
                      maxLength={180}
                      value={displayValue}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        console.log("Description updated:", e.target.value);
                      }}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {displayValue?.length || 0}/180 characters - Briefly describe your Twitter Space to attract the right audience
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
      ),
      shouldShow: () => selectedCollabType === "Twitter Spaces Guest"
    },
    {
      id: "twitter_comarketing_type",
      title: "Co-Marketing Type",
      description: "What type of co-marketing do you want to do?",
      render: () => (
        <FormField
          control={form.control}
          name="details.twittercomarketing_type"
          render={({ field }) => {
            // Normalize field value to ensure it's always an array
            let currentValue: string[] = [];
            
            // Handle different possible value types
            if (Array.isArray(field.value)) {
              // Already an array, use it
              currentValue = field.value;
            } else if (typeof field.value === 'string') {
              // Single string value, convert to array
              currentValue = [field.value];
            } else {
              // Default to empty array - will select Thread Collab if needed via newValue on line 958
              currentValue = [];
            }
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">Co-Marketing Type</FormLabel>
                <div className="grid grid-cols-2 gap-1">
                  {TWITTER_COLLAB_TYPES.map((type) => {
                    const isSelected = currentValue.includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full h-auto py-1 px-1 text-[10px] justify-start normal-case ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/20'}`}
                        onClick={() => {
                          const updatedTypes = isSelected
                            ? currentValue.filter((t) => t !== type)
                            : [...currentValue, type];
                          // Ensure at least one value is selected
                          const newValue = updatedTypes.length > 0 ? updatedTypes : ["Thread Collab"];
                          field.onChange(newValue);
                        }}
                      >
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-2 w-2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                        {type}
                      </Button>
                    );
                  })}
                </div>
                <FormDescription className="text-xs">
                  Select at least one type of Twitter content
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "twitter_comarketing_handle",
      title: "Twitter Handle",
      description: "What's your Twitter/X handle?",
      render: () => (
        <FormField
          control={form.control}
          name="details.host_twitter_handle"
          render={({ field }) => {
            // Ensure the correct type of value is shown and preserve user-entered value
            const displayValue = Array.isArray(field.value) 
              ? "https://x.com/" 
              : (typeof field.value === 'string' && field.value.trim() ? field.value : "https://x.com/");
            
            // Removed useEffect to prevent hook ordering issues
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">What's your Twitter/X handle?</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://x.com/username"
                    className="h-8 text-xs"
                    value={displayValue}
                    onChange={(e) => {
                      // Make sure we only set string values
                      field.onChange(e.target.value);
                    }}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Include the full URL
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "twitter_comarketing_followers",
      title: "Twitter Followers",
      description: "How many followers do you have?",
      render: () => (
        <FormField
          control={form.control}
          name="details.host_follower_count"
          render={({ field }) => {
            // Ensure the field value is a string
            const currentValue = Array.isArray(field.value) ? "" : (typeof field.value === 'string' ? field.value : "");
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">How many followers do you have?</FormLabel>
                <div className="grid grid-cols-2 gap-1">
                  {TWITTER_FOLLOWER_COUNTS.map((count) => {
                    const isSelected = currentValue === count;
                    return (
                      <Button
                        key={count}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full h-8 py-1 px-2 text-xs justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/20'}`}
                        onClick={() => {
                          field.onChange(count);
                        }}
                      >
                        {count}
                      </Button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "twitter_comarketing_description",
      title: "Short Description",
      description: "Add a short description (max 180 characters)",
      render: () => (
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => {
            // Ensure field value is always a string, and explicitly initialize it with empty string
            // if it's not a string or if it appears to be a follower count (numeric values or standard patterns)
            let displayValue = "";
            
            if (typeof field.value === 'string') {
              // Check if the field value looks like a follower count (matches a pattern like "0-1K", "500K+", etc.)
              const isFollowerCount = TWITTER_FOLLOWER_COUNTS.includes(field.value as any) || 
                                      /^\d+(\.\d+)?[KM]?[-+]?$/.test(field.value);
              
              if (!isFollowerCount) {
                displayValue = field.value;
              }
            }
            
            return (
              <FormItem className="space-y-1 pt-0">
                <FormLabel className="mb-0 text-sm">Short Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Content ideas and goals"
                    className="min-h-[80px] text-xs"
                    value={displayValue}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    name={field.name}
                    maxLength={180}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Max 180 characters ({displayValue ? 180 - displayValue.length : 180} remaining)
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "free_collab",
      title: "Free Collaboration",
      description: "Verify that this is a free collaboration",
      render: () => (
        <FormField
          control={form.control}
          name="is_free_collab"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-2 space-y-0 pt-0">
              <FormControl>
                <Checkbox
                  checked={true}
                  onCheckedChange={(checked) => {
                    field.onChange(true);
                    if (!checked) {
                      toast({
                        title: "Free collaborations only",
                        description: "Only free collaborations are allowed.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={true}
                />
              </FormControl>
              <div className="leading-none">
                <FormLabel className="mb-0 text-sm">Free Collaboration Confirmation</FormLabel>
                <FormDescription className="text-xs">
                  I confirm this is a 100% free collaboration with no payments or fees involved.
                  Our platform only supports non-commercial collaborations.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      )
    }
  ];

  // Get the active steps based on current form values
  const getActiveSteps = () => {
    return allSteps.filter(step => {
      if (step.shouldShow) {
        return step.shouldShow();
      }
      return true;
    });
  };

  // Render step content based on current step
  const renderStepContent = () => {
    const activeSteps = getActiveSteps();
    if (currentStep < 0 || currentStep >= activeSteps.length) {
      return null;
    }
    
    const step = activeSteps[currentStep];
    return (
      <div className="space-y-6">
        {step.render()}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Compact header with back button and progress bar */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 mr-2" 
          onClick={() => setLocation("/my-collaborations")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          <span className="sr-only">Back</span>
        </Button>
        
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary rounded-full h-1 transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / getActiveSteps().length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>
          
          <div className="flex justify-between pt-4">
            {currentStep > 0 ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/my-collaborations')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={isSubmitting}
            >
              {(() => {
                const activeSteps = getActiveSteps();
                const isLastStep = currentStep === activeSteps.length - 1;
                
                if (isSubmitting) {
                  return (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLastStep ? 'Creating...' : 'Next...'}
                    </>
                  );
                } else {
                  return isLastStep ? 'Create Collaboration' : 'Next';
                }
              })()}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}