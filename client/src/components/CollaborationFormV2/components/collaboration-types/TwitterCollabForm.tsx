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
import { COLLAB_TOPICS, TWITTER_COLLAB_TYPES, TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { useCollaborationType } from "../../contexts/CollaborationTypeContext";
import { Step } from "../../contexts/FormWizardContext";
import { Eyebrow } from "@/components/brand";
import { cn } from "@/lib/utils";

// Convert readonly arrays to regular arrays for form usage
const TOPICS = [...COLLAB_TOPICS];
const COLLAB_TYPES = [...TWITTER_COLLAB_TYPES];

// Define the steps for Twitter collaboration form
export const twitterCollabSteps: Step[] = [
  {
    id: "twitter_collab_types",
    title: "Collaboration Types",
    description: "What type of Twitter collaboration?",
  },
  {
    id: "twitter_topics",
    title: "Topics",
    description: "What topics will this collaboration cover?",
  },
  {
    id: "twitter_handle",
    title: "Twitter Handle",
    description: "What's the X profile hosting the collab?",
  },
  {
    id: "twitter_followers",
    title: "Follower Count",
    description: "How many followers does the account have?",
  },
  {
    id: "twitter_description",
    title: "Description",
    description: "Add a short description (max 280 characters)",
  },
  {
    id: "twitter_date",
    title: "Timing",
    description: "When would you like to collaborate?",
  }
];

interface TwitterCollabFormProps {
  step: string;
}

/**
 * Twitter Co-Marketing collaboration form component
 * Implements the 3 topics and 3 Twitter collab types limit
 */
export const TwitterCollabForm: React.FC<TwitterCollabFormProps> = ({ step }) => {
  const form = useFormContext();
  const { currentStepId } = useFormWizard();
  const currentStep = step || currentStepId;
  
  // Initialize all form values on component mount
  useEffect(() => {
    if (!form) return;
    
    console.log("Initializing Twitter collaboration form with default values");
    
    // Get current form values
    const currentValues = form.getValues();
    
    // Create a complete default values object
    const completeDefaults = {
      collab_type: "Co-Marketing on Twitter",
      topics: currentValues.topics || [],
      twitter_handle: currentValues.twitter_handle || "https://x.com/",
      twitter_collab_types: currentValues.twitter_collab_types || [],
      follower_count: currentValues.follower_count || TWITTER_FOLLOWER_COUNTS[0],
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
    if (!form) return;
    
    console.log("Current step ID:", currentStep);
    
    // Wait a short moment to ensure fields are set before validating
    setTimeout(() => {
      // Then validate only the current field
      if (currentStep === "twitter_topics") {
        form.trigger("topics");
      } else if (currentStep === "twitter_handle") {
        form.trigger("twitter_handle");
      } else if (currentStep === "twitter_collab_types") {
        form.trigger("twitter_collab_types");
      } else if (currentStep === "twitter_followers") {
        form.trigger("follower_count");
      } else if (currentStep === "twitter_description") {
        form.trigger("description");
      } else if (currentStep === "twitter_date") {
        form.trigger("date_type");
        if (form.getValues("date_type") === "specific_date") {
          form.trigger("specific_date");
        }
      }
    }, 100);
  }, [currentStep, form]);

  // Render the current step content
  const renderStepContent = () => {
    if (!form) return null;
    
    switch (currentStep) {
      case "twitter_topics":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Topics</Eyebrow>
            <FormField
              control={form.control}
              name="topics"
              render={() => (
                <LimitedTopicSelector
                  name="topics"
                  label="Topics your audience cares about"
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

      case "twitter_handle":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Profile</Eyebrow>
            <FormField
              control={form.control}
              name="twitter_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    What's the X profile hosting the collab?
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://x.com/username"
                      className="h-9 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Include the full URL (https://x.com/username)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "twitter_collab_types":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Format</Eyebrow>
            <FormField
              control={form.control}
              name="twitter_collab_types"
              render={() => (
                <LimitedTopicSelector
                  name="twitter_collab_types"
                  label="Collaboration types"
                  maxSelections={3}
                  form={form}
                  options={TWITTER_COLLAB_TYPES as unknown as string[]}
                  required
                  hideDetails={true}
                />
              )}
            />
          </div>
        );

      case "twitter_followers":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Reach</Eyebrow>
            <FormField
              control={form.control}
              name="follower_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">
                    How many followers does the account have?
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {TWITTER_FOLLOWER_COUNTS.map((count) => {
                      const isSelected = field.value === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          className={cn(
                            "flex items-center justify-center rounded-md border px-3 py-2 text-xs font-medium tabular transition-colors duration-fast ease-out",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            isSelected
                              ? "border-brand bg-brand text-brand-fg"
                              : "border-hairline bg-surface text-text hover:border-border-strong hover:bg-surface-raised"
                          )}
                          onClick={() => field.onChange(count)}
                        >
                          {count}
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

      case "twitter_description":
        return (
          <div className="space-y-4" key={currentStep}>
            <Eyebrow>Pitch</Eyebrow>
            <CharLimitedTextarea
              name="description"
              label="Short Description"
              placeholder="Describe your collaboration idea"
              maxLength={280}
              form={form}
              description="Explain what you're looking for in this collaboration"
              required
            />
          </div>
        );

      case "twitter_date":
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