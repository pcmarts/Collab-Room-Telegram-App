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
import { AUDIENCE_SIZE_RANGES } from "@shared/schema";
import { useFormContext } from "react-hook-form";
import { LimitedTopicSelector } from "../fields/LimitedTopicSelector";
import { DateSelector } from "../fields/DateSelector";
import { Step } from "../../contexts/FormWizardContext";
import { baseCollabDefaults } from "../../schemas/baseSchema";
import { blogPostDefaults } from "../../schemas/blogPostSchema";

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
        <div className="space-y-4">
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
          
          <FormField
            control={form.control}
            name="post_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Post Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Guest Post", "Feature", "Interview", "Review", "Tutorial", "Other"].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
                    placeholder="Brief description of your blog post feature"
                    {...field}
                    maxLength={280}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <LimitedTopicSelector 
            name="topics"
            label="Blog Topics"
            maxTopics={3}
            helperText="Select 1-3 topics for your blog post"
          />
          
          <DateSelector 
            dateTypeName="date_type"
            specificDateName="specific_date"
          />
          
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
export const blogPostCombinedDefaults = {
  ...baseCollabDefaults,
  ...blogPostDefaults
};