import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
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
import { DateSelector } from "../fields/DateSelector";
import { COLLAB_TOPICS, AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { Step } from "../../contexts/FormWizardContext";
import { Eyebrow } from "@/components/brand";
import { cn } from "@/lib/utils";

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
  },
  {
    id: "podcast_date",
    title: "Timing",
    description: "When would you like to collaborate?",
  }
];

interface PodcastCollabFormProps {
  step: string;
}

/**
 * Podcast Guest Appearance collaboration form component
 * Implements the topic selection and podcast details forms
 */
export const PodcastCollabForm: React.FC<PodcastCollabFormProps> = ({ step }) => {
  const form = useFormContext();
  const { currentStepId } = useFormWizard();
  const currentStep = step || currentStepId;
  
  // Initialize all form values on component mount
  useEffect(() => {
    if (!form) return;

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
  }, [form]);
  
  // Modify the validation effect to avoid pre-emptive validation
  useEffect(() => {
    if (!form) return;

    // Don't immediately validate fields when step changes
    // Instead, only set up the form for the current step
    
    // For fields that should have default values, we can set them here
    if (currentStep === "podcast_audience" && !form.getValues("estimated_reach")) {
      form.setValue("estimated_reach", AUDIENCE_SIZES[0], { shouldValidate: false });
    } else if (currentStep === "podcast_date" && !form.getValues("date_type")) {
      form.setValue("date_type", "specific_date", { shouldValidate: false });
      if (!form.getValues("specific_date")) {
        form.setValue("specific_date", new Date().toISOString().split("T")[0], { shouldValidate: false });
      }
    }
    
    // Don't trigger validation on step change - validation will happen on blur, change, or when Next is clicked
  }, [currentStep, form]);

  // Render the current step content
  const renderStepContent = () => {
    if (!form) return null;
    
    switch (currentStep) {
      case "podcast_topics":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Topics</Eyebrow>
            <FormField
              control={form.control}
              name="topics"
              render={() => (
                <LimitedTopicSelector
                  name="topics"
                  label="Podcast Topics"
                  maxSelections={3}
                  form={form}
                  options={COLLAB_TOPICS as unknown as string[]}
                  required
                  hideDetails={true}
                />
              )}
            />
          </div>
        );

      case "podcast_details":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Podcast</Eyebrow>
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
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Audience</Eyebrow>
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
                          className={cn(
                            "flex items-center justify-center rounded-md border px-3 py-2 text-xs font-medium transition-colors duration-fast ease-out",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            isSelected
                              ? "border-brand bg-brand text-brand-fg"
                              : "border-hairline bg-surface text-text hover:border-border-strong hover:bg-surface-raised"
                          )}
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
          </div>
        );

      case "podcast_description":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Pitch</Eyebrow>
            <CharLimitedTextarea
              name="description"
              label="Short Description"
              placeholder="Describe what topics or questions you'd like to cover"
              maxLength={280}
              form={form}
              description="Explain what you're looking for in this collaboration"
              required
            />
          </div>
        );

      case "podcast_date":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Timing</Eyebrow>
            <DateSelector form={form} />
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-text-muted">
            This step is not configured.
          </div>
        );
    }
  };

  return <>{renderStepContent()}</>;
};