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
    id: "topics_and_date",
    title: "Topics & Date",
    description: "Select topics and preferred date for your Space"
  }
];

/**
 * Twitter Spaces Guest collaboration form component
 * Renders different fields based on the current step
 */
export const TwitterSpacesForm: React.FC<{ step: string }> = ({ step }) => {
  const form = useFormContext();
  
  switch (step) {
    case "basic_info":
      return (
        <div className="space-y-4">
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
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description{" "}
                  <span className="text-xs text-muted-foreground">
                    ({field.value.length}/280)
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
    
    case "topics_and_date":
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="space_topic"
            render={() => (
              <LimitedTopicSelector 
                name="space_topic"
                label="Space Topics"
                maxSelections={3}
                form={form}
                options={COLLAB_TOPICS as unknown as string[]}
              />
            )}
          />
          
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