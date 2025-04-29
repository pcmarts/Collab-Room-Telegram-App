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
import { DateSelector } from "../fields/DateSelector";
import { COLLAB_TOPICS, TWITTER_COLLAB_TYPES, TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { useCollaborationType } from "../../contexts/CollaborationTypeContext";
import { Step } from "../../contexts/FormWizardContext";

// Convert readonly arrays to regular arrays for form usage
const TOPICS = [...COLLAB_TOPICS];
const COLLAB_TYPES = [...TWITTER_COLLAB_TYPES];

// Define the steps for Twitter collaboration form
export const twitterCollabSteps: Step[] = [
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
    id: "twitter_collab_types",
    title: "Collaboration Types",
    description: "What type of Twitter collaboration?",
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
  form: UseFormReturn<any>;
}

/**
 * Twitter Co-Marketing collaboration form component
 * Implements the 3 topics and 3 Twitter collab types limit
 */
export const TwitterCollabForm: React.FC<TwitterCollabFormProps> = ({ form }) => {
  const { currentStepId } = useFormWizard();
  
  // Initialize all form values on component mount
  useEffect(() => {
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
    console.log("Current step ID:", currentStepId);
    
    // Wait a short moment to ensure fields are set before validating
    setTimeout(() => {
      // Then validate only the current field
      if (currentStepId === "twitter_topics") {
        form.trigger("topics");
      } else if (currentStepId === "twitter_handle") {
        form.trigger("twitter_handle");
      } else if (currentStepId === "twitter_collab_types") {
        form.trigger("twitter_collab_types");
      } else if (currentStepId === "twitter_followers") {
        form.trigger("follower_count");
      } else if (currentStepId === "twitter_description") {
        form.trigger("description");
      }
    }, 100);
  }, [currentStepId, form]);

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStepId) {
      case "twitter_topics":
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
        
      case "twitter_handle":
        return (
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
        );
        
      case "twitter_collab_types":
        return (
          <LimitedTopicSelector
            options={COLLAB_TYPES}
            name="twitter_collab_types"
            label="Type of Twitter Collaboration"
            maxSelections={3}
            form={form}
            required
          />
        );
        
      case "twitter_followers":
        return (
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
                        className={`
                          flex items-center justify-center px-3 py-2 rounded-md text-xs font-medium
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                          }
                        `}
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
        );
        
      case "twitter_description":
        return (
          <CharLimitedTextarea
            name="description"
            label="Short Description"
            placeholder="Describe your collaboration idea"
            maxLength={280}
            form={form}
            description="Explain what you're looking for in this collaboration"
            required
          />
        );
        
      case "twitter_date":
        return <DateSelector form={form} />;
        
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