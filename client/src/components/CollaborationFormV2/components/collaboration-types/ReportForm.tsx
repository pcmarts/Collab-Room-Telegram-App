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
import { reportDefaults } from "../../schemas/reportSchema";
import { Eyebrow } from "@/components/brand";

/**
 * Step definitions for Report & Research Feature collaboration form
 */
export const reportSteps: Step[] = [
  {
    id: "report_info",
    title: "Report Information",
    description: "Tell us about the report or research you're looking to feature"
  },
  {
    id: "description",
    title: "Description",
    description: "Provide a brief description of your report"
  },
  {
    id: "topics",
    title: "Topics",
    description: "Select topics for your report feature"
  },
  {
    id: "date",
    title: "Date",
    description: "Select your preferred date for the feature"
  }
];

/**
 * Report & Research Feature collaboration form component
 * Renders different fields based on the current step
 */
export const ReportForm: React.FC<{ step: string }> = ({ step }) => {
  const form = useFormContext();
  
  // Initialize topics if needed
  React.useEffect(() => {
    // Check if we're on the topics step
    if (step === "topics" && !form.getValues().topics) {
      form.setValue("topics", [], { shouldValidate: false, shouldDirty: false });
      console.log("Initialized topics array for Report form:", form.getValues());
    }
  }, [step, form]);
  
  switch (step) {
    case "report_info":
      return (
        <div className="space-y-4" key={step}>
          <Eyebrow variant="warm" tone="warm" dot>
            Research
          </Eyebrow>
          <FormField
            control={form.control}
            name="report_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report/Research Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name of your report or research" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="report_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Report Link{" "}
                  <span className="text-xs text-text-subtle">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://your-report-link.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="report_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Report Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["Market Report", "Technical Analysis", "Industry Research", "Company Insights", "Other"].map((type) => (
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
          
          <FormField
            control={form.control}
            name="audience_reach"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Audience Reach</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audience reach" />
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
          <Eyebrow variant="warm" tone="warm" dot>
            Research
          </Eyebrow>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Provide a brief description of your report</FormLabel>
                  <span className="text-xs tabular text-text-subtle">
                    {field.value ? field.value.length : 0}/280
                  </span>
                </div>
                <FormControl>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-hairline bg-background px-3 py-2 text-sm text-text ring-offset-background placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="What does your research cover?"
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
          <Eyebrow variant="warm" tone="warm" dot>
            Research
          </Eyebrow>
          <FormField
            control={form.control}
            name="topics"
            render={() => (
              <LimitedTopicSelector
                name="topics"
                label="Relevant Topics"
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
          <Eyebrow variant="warm" tone="warm" dot>
            Research
          </Eyebrow>
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
                  className="h-4 w-4 rounded border-hairline text-warm-accent focus:ring-warm-accent"
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
export const reportCombinedDefaults = {
  ...baseCollabDefaults,
  ...reportDefaults
};