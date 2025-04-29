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
  
  // Validate current field when step changes
  useEffect(() => {
    console.log("Current step ID:", currentStepId);
    console.log("Current form values:", form.getValues());
    
    // Ensure we have default values for all fields when each step loads
    const ensureDefaultValues = () => {
      // For topics step
      if (currentStepId === "twitter_topics" && (!form.getValues("topics") || form.getValues("topics").length === 0)) {
        form.setValue("topics", [], { shouldValidate: false });
      }
      
      // For Twitter handle step
      if (currentStepId === "twitter_handle" && !form.getValues("twitter_handle")) {
        form.setValue("twitter_handle", "https://x.com/", { shouldValidate: false });
      }
      
      // For Twitter collab types step
      if (currentStepId === "twitter_collab_types" && (!form.getValues("twitter_collab_types") || form.getValues("twitter_collab_types").length === 0)) {
        form.setValue("twitter_collab_types", [], { shouldValidate: false });
      }
      
      // For followers step
      if (currentStepId === "twitter_followers" && !form.getValues("follower_count")) {
        form.setValue("follower_count", TWITTER_FOLLOWER_COUNTS[0], { shouldValidate: false });
      }
      
      // For description step
      if (currentStepId === "twitter_description" && !form.getValues("description")) {
        form.setValue("description", "", { shouldValidate: false });
      }
    };
    
    // Set default values first
    ensureDefaultValues();
    
    // Then validate the current field
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