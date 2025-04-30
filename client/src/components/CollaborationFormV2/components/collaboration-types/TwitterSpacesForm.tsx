import React from "react";
import { FormField } from "@/components/ui/form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TWITTER_FOLLOWER_COUNTS, COLLAB_TOPICS } from "@shared/schema";
import { useFormContext } from "react-hook-form";
import { LimitedTopicSelector } from "../fields/LimitedTopicSelector";
import { DateSelector } from "../fields/DateSelector";
import { Step } from "../../contexts/FormWizardContext";
import { baseCollabDefaults } from "../../schemas/baseSchema";
import { twitterSpacesDefaults } from "../../schemas/twitterSpacesSchema";

/**
 * Step definitions for Twitter Spaces Guest collaboration form
 */
export const twitterSpacesSteps: Step[] = [
  {
    id: "basic_info",
    title: "Basic Information",
    description: "Tell us about your Twitter Spaces collaboration"
  },
  {
    id: "description",
    title: "Description",
    description: "Provide a brief description of your Twitter Space"
  },
  {
    id: "topics",
    title: "Topics",
    description: "Select topics for your Twitter Space"
  },
  {
    id: "date_selection",
    title: "Date",
    description: "Select your preferred date for the Space"
  }
];

/**
 * Twitter Spaces Guest collaboration form component
 * Renders different fields based on the current step
 */
export const TwitterSpacesForm: React.FC<{ step: string }> = ({ step }) => {
  const form = useFormContext();
  
  // Initialize topics if needed
  React.useEffect(() => {
    // Check if we're on the topics step
    if (step === "topics" && !form.getValues().topics) {
      form.setValue("topics", [], { shouldValidate: false, shouldDirty: false });
      console.log("Initialized topics array for Twitter Spaces form:", form.getValues());
    }
  }, [step, form]);
  
  switch (step) {
    case "basic_info":
      return (
        <div className="space-y-4" key={step}>
          <FormField
            control={form.control}
            name="twitter_handle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://x.com/yourhandle" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="host_follower_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter Follower Count</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select follower count" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TWITTER_FOLLOWER_COUNTS.map((count) => (
                      <SelectItem key={count} value={count}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
      
    case "description":
      return (
        <div className="space-y-4" key={step}>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description{" "}
                  <span className="text-xs text-muted-foreground">
                    ({field.value ? field.value.length : 0}/280)
                  </span>
                </FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Brief description of your Twitter Space"
                    {...field}
                    maxLength={280}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );
    
    case "topics":
      // Log current values for debugging
      console.log("Rendering topics step with current values:", {
        topics: form.getValues().topics,
        formValues: form.getValues()
      });
      
      return (
        <div className="space-y-4" key={step}>
          <FormField
            control={form.control}
            name="topics"
            render={() => (
              <LimitedTopicSelector 
                name="topics"
                label="Space Topics"
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
      
    case "date_selection":
      return (
        <div className="space-y-4" key={step}>
          <DateSelector form={form} />
          
          <FormField
            control={form.control}
            name="is_free_collab"
            render={({ field }) => (
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="is_free_collab"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_free_collab" className="text-sm font-medium">
                  I confirm this is a free collaboration with no payments involved
                </label>
                <FormMessage />
              </div>
            )}
          />
        </div>
      );
      
    default:
      return null;
  }
};

// Combined default values for this form
export const twitterSpacesCombinedDefaults = {
  ...baseCollabDefaults,
  ...twitterSpacesDefaults
};