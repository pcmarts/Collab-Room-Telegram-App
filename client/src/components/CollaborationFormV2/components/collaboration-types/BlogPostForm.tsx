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
import { blogPostDefaults } from "../../schemas/blogPostSchema";
import { Eyebrow } from "@/components/brand";

/**
 * Step definitions for Blog Post Feature collaboration form
 */
export const blogPostSteps: Step[] = [
  {
    id: "blog_info",
    title: "Blog Information",
    description: "Tell us about the blog you're looking to feature in"
  },
  {
    id: "topics_and_date",
    title: "Topics & Date",
    description: "Select topics and preferred date for your feature"
  }
];

/**
 * Blog Post Feature collaboration form component
 * Renders different fields based on the current step
 */
export const BlogPostForm: React.FC<{ step: string }> = ({ step }) => {
  const form = useFormContext();
  
  switch (step) {
    case "blog_info":
      return (
        <div className="space-y-4" key={step}>
          <Eyebrow>Blog</Eyebrow>
          <FormField
            control={form.control}
            name="blog_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blog Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name of the blog" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="blog_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blog URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://your-blog-url.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="monthly_visitors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Visitors</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select monthly visitors" />
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
    
    case "topics_and_date":
      return (
        <div className="space-y-6" key={step}>
          <Eyebrow>Pitch</Eyebrow>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Description</FormLabel>
                  <span className="text-xs tabular text-text-subtle">
                    {field.value ? field.value.length : 0}/280
                  </span>
                </div>
                <FormControl>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-hairline bg-background px-3 py-2 text-sm text-text ring-offset-background placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Brief description of your blog post feature"
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
                label="Post Topics"
                maxSelections={3}
                form={form}
                options={COLLAB_TOPICS as unknown as string[]}
                required
                hideDetails={true}
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
export const blogPostCombinedDefaults = {
  ...baseCollabDefaults,
  ...blogPostDefaults
};