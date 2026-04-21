import React from "react";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

interface LimitedTopicSelectorProps {
  options: string[];
  name: string;
  label: string;
  maxSelections: number;
  form: UseFormReturn<any>;
  required?: boolean;
  hideDetails?: boolean;
}

/**
 * Selection component with built-in maximum selection limit
 * Shows count of selected items vs maximum allowed
 */
export const LimitedTopicSelector: React.FC<LimitedTopicSelectorProps> = ({
  options,
  name,
  label,
  maxSelections,
  form,
  required = false,
  hideDetails = false,
}) => {
  const { toast } = useToast();
  
  // Make sure we get a proper array or initialize an empty one
  const fieldValue = form.watch(name);
  const selections = Array.isArray(fieldValue) ? fieldValue : [];
  
  // Ensure the field is an array in the form
  React.useEffect(() => {
    // If field value is not an array, initialize it
    if (!Array.isArray(fieldValue)) {
      form.setValue(name, [], { shouldValidate: false });
    }
  }, [name, fieldValue, form]);
  
  // Calculate if max selections is reached
  const atMaxSelections = selections.length >= maxSelections;
  
  // Add debugging to help troubleshoot

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        // Log field value in render

        return (
          <FormItem>
            {/* Conditionally render the label and count */}
            {!hideDetails && (
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm">
                  {label} <span className="text-text-subtle font-normal">(min 1, max {maxSelections})</span>
                  {required && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <span
                  className={cn(
                    "text-xs tabular",
                    atMaxSelections
                      ? "text-destructive font-medium"
                      : selections.length > 0
                      ? "text-brand"
                      : "text-text-subtle"
                  )}
                >
                  {selections.length}/{maxSelections}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              {options.map(option => {
                // Make sure field.value is an array before checking includes
                const isSelected = Array.isArray(field.value) && field.value.includes(option);
                // Determine if the button should be disabled
                const isDisabled = atMaxSelections && !isSelected;

                return (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "flex h-auto items-center justify-start rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors duration-fast ease-out",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-brand bg-brand text-brand-fg"
                        : isDisabled
                        ? "border-hairline bg-surface text-text-subtle opacity-50 cursor-not-allowed"
                        : "border-hairline bg-surface text-text hover:border-border-strong hover:bg-surface-raised"
                    )}
                    onClick={() => {
                      // Prevent click action if disabled
                      if (isDisabled) return;

                      if (isSelected) {
                        // Remove from selection
                        const newValue = field.value.filter((val: string) => val !== option);
                        field.onChange(newValue);
                      } else if (!atMaxSelections) {
                        // Add to selection if not at max
                        // Ensure we're starting with an array
                        const baseArray = Array.isArray(field.value) ? field.value : [];
                        const newValue = [...baseArray, option];
                        field.onChange(newValue);
                      } else {
                        // Show toast that max selections reached
                        toast({
                          title: `Maximum ${maxSelections} topics`,
                          description: `Please remove a selection before adding a new one.`,
                          variant: "destructive"
                        });
                      }
                    }}
                    disabled={isDisabled}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            
            {/* Only show error message for exceeded max count when hideDetails is false */}
            {!hideDetails && form.formState.errors[name]?.message && 
             form.formState.errors[name]?.message !== " " && 
             <FormMessage />}
          </FormItem>
        );
      }}
    />
  );
};