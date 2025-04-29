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
import { AUDIENCE_SIZE_RANGES, COLLAB_TOPICS } from "@shared/schema";
import { useFormContext } from "react-hook-form";
import { LimitedTopicSelector } from "../fields/LimitedTopicSelector";
import { DateSelector } from "../fields/DateSelector";
import { Step } from "../../contexts/FormWizardContext";
import { baseCollabDefaults } from "../../schemas/baseSchema";
import { newsletterDefaults } from "../../schemas/newsletterSchema";

/**
 * Step definitions for Newsletter Feature collaboration form
 */
export const newsletterSteps: Step[] = [
  {
    id: "newsletter_info",
    title: "Newsletter Information",
    description: "Tell us about the newsletter you're looking to feature in"
  },
  {
    id: "topics_and_date",
    title: "Topics & Date",
    description: "Select topics and preferred date for your feature"
  }
];

/**
 * Newsletter Feature collaboration form component
 * Renders different fields based on the current step
 */
export const NewsletterForm: React.FC<{ step: string }> = ({ step }) => {
  const form = useFormContext();
  
  switch (step) {
    case "newsletter_info":
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="newsletter_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Newsletter Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name of the newsletter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="subscriber_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscriber Count</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscriber count" />
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
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feature Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select feature format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["feature", "interview", "review", "guest post", "other"].map((format) => (
                      <SelectItem key={format} value={format}>
                        {format.charAt(0).toUpperCase() + format.slice(1)}
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
    
    case "topics_and_date":
      return (
        <div className="space-y-4">
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
                    placeholder="Brief description of your newsletter feature"
                    {...field}
                    maxLength={280}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="topics"
            render={() => (
              <LimitedTopicSelector 
                name="topics"
                label="Newsletter Topics"
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
export const newsletterCombinedDefaults = {
  ...baseCollabDefaults,
  ...newsletterDefaults
};