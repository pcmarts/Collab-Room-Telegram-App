import React, { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useFormWizard } from "../../contexts/FormWizardContext";
import { LimitedTopicSelector } from "../fields/LimitedTopicSelector";
import { CharLimitedTextarea } from "../fields/CharLimitedTextarea";
import { COLLAB_TOPICS, AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { Step } from "../../contexts/FormWizardContext";

// Convert readonly arrays to regular arrays for form usage
const TOPICS = [...COLLAB_TOPICS];
const AUDIENCE_SIZES = [...AUDIENCE_SIZE_RANGES];

// Define the steps for Podcast collaboration form
export const podcastCollabSteps: Step[] = [
  {
    id: "podcast_topics",
    title: "Topics",
    description: "What topics will this podcast cover?",
  },
  {
    id: "podcast_details",
    title: "Podcast Details",
    description: "Tell us about your podcast",
  },
  {
    id: "podcast_audience",
    title: "Audience Size",
    description: "How many listeners does the podcast have?",
  },
  {
    id: "podcast_description",
    title: "Description",
    description: "Add a short description (max 280 characters)",
  }
];

interface PodcastCollabFormProps {
  form: UseFormReturn<any>;
}

/**
 * Podcast Guest Appearance collaboration form component
 * Implements the topic selection and podcast details forms
 */
export const PodcastCollabForm: React.FC<PodcastCollabFormProps> = ({ form }) => {
  const { currentStepId } = useFormWizard();
  
  // Initialize all form values on component mount
  useEffect(() => {
    console.log("Initializing Podcast collaboration form with default values");
    
    // Get current form values
    const currentValues = form.getValues();
    
    // Create a complete default values object
    const completeDefaults = {
      collab_type: "Podcast Guest Appearance",
      topics: currentValues.topics || [],
      podcast_name: currentValues.podcast_name || "",
      podcast_link: currentValues.podcast_link || "",
      estimated_reach: currentValues.estimated_reach || AUDIENCE_SIZES[0],
      description: currentValues.description || "",
      date_type: currentValues.date_type || "specific_date",
      specific_date: currentValues.specific_date || new Date().toISOString().split("T")[0],
      is_free_collab: currentValues.is_free_collab !== undefined ? currentValues.is_free_collab : true,
      details: currentValues.details || {}
    };
    
    // Set defaults all at once to ensure all required fields exist
    Object.entries(completeDefaults).forEach(([key, value]) => {
      if (form.getValues(key as any) === undefined) {
        form.setValue(key as any, value, { shouldValidate: false });
      }
    });
    
    console.log("Form initialized with:", completeDefaults);
  }, [form]);
  
  // Validate only the current field whenever the step changes
  useEffect(() => {
    console.log("Current step ID:", currentStepId);
    
    // Wait a short moment to ensure fields are set before validating
    setTimeout(() => {
      // Then validate only the current field
      if (currentStepId === "podcast_topics") {
        form.trigger("topics");
      } else if (currentStepId === "podcast_details") {
        form.trigger("podcast_name");
        form.trigger("podcast_link");
      } else if (currentStepId === "podcast_audience") {
        form.trigger("estimated_reach");
      } else if (currentStepId === "podcast_description") {
        form.trigger("description");
      }
    }, 100);
  }, [currentStepId, form]);

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStepId) {
      case "podcast_topics":
        return (
          <LimitedTopicSelector
            options={TOPICS}
            name="topics"
            label="Select Topics"
            maxSelections={3}
            form={form}
            required
          />
        );
        
      case "podcast_details":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="podcast_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Podcast Name
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your podcast name"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="podcast_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    Podcast Link
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://mypodcast.com"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Link to your podcast site or hosting platform
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case "podcast_audience":
        return (
          <FormField
            control={form.control}
            name="estimated_reach"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">
                  How many listeners does your podcast have?
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AUDIENCE_SIZES.map((size) => {
                    const isSelected = field.value === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        className={`
                          flex items-center justify-center px-3 py-2 rounded-md text-xs font-medium
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                          }
                        `}
                        onClick={() => field.onChange(size)}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
        
      case "podcast_description":
        return (
          <CharLimitedTextarea
            name="description"
            label="Short Description"
            placeholder="Describe what topics or questions you'd like to cover"
            maxLength={280}
            form={form}
            description="Explain what you're looking for in this collaboration"
            required
          />
        );
        
      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            This step is not configured.
          </div>
        );
    }
  };

  return <>{renderStepContent()}</>;
};