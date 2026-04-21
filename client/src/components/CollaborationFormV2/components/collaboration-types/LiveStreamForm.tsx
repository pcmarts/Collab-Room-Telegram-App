import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
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
import { liveStreamDefaults } from "../../schemas/liveStreamSchema";
import { Eyebrow } from "@/components/brand";

/**
 * Step definitions for Live Stream Guest Appearance collaboration form
 */
export const liveStreamSteps: Step[] = [
  {
    id: "stream_info",
    title: "Stream Information",
    description: "Tell us about the livestream you're looking to host"
  },
  {
    id: "description",
    title: "Description",
    description: "Provide a brief description of your livestream"
  },
  {
    id: "topics",
    title: "Topics",
    description: "Select topics for your livestream"
  },
  {
    id: "date",
    title: "Date",
    description: "Select your preferred date for the livestream"
  }
];

/**
 * Live Stream Guest Appearance collaboration form component
 * Renders different fields based on the current step
 */
export const LiveStreamForm: React.FC<{ step: string }> = ({ step }) => {
  const form = useFormContext();
  
  switch (step) {
    case "stream_info":
      return (
        <div className="space-y-4" key={step}>
          <Eyebrow>Stream</Eyebrow>
          <FormField
            control={form.control}
            name="platform_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform Name</FormLabel>
                <FormControl>
                  <Input placeholder="YouTube, Twitch, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stream_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Previous Stream Link{" "}
                  <span className="text-xs text-text-subtle">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://www.youtube.com/watch?v=" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  Share a link to a previous livestream you've hosted (if available)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="audience_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience Size</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience size" />
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
        </div>
      );
    
    case "description":
      return (
        <div className="space-y-4" key={step}>
          <Eyebrow>Pitch</Eyebrow>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Provide a brief description of your livestream</FormLabel>
                  <span className="text-xs tabular text-text-subtle">
                    {field.value ? field.value.length : 0}/280
                  </span>
                </div>
                <FormControl>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-hairline bg-background px-3 py-2 text-sm text-text ring-offset-background placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="What would you like to discuss in this livestream?"
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
      return (
        <div className="space-y-4" key={step}>
          <Eyebrow>Topics</Eyebrow>
          <FormField
            control={form.control}
            name="topics"
            render={() => (
              <LimitedTopicSelector
                name="topics"
                label="Stream Topics"
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

    case "date":
      return (
        <div className="space-y-4" key={step}>
          <Eyebrow>Timing</Eyebrow>
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
                  className="h-4 w-4 rounded border-hairline text-brand focus:ring-brand"
                />
                <label htmlFor="is_free_collab" className="text-sm font-medium text-text">
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
export const liveStreamCombinedDefaults = {
  ...baseCollabDefaults,
  ...liveStreamDefaults
};