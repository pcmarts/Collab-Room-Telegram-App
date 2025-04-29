import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}) => {
  const { toast } = useToast();
  
  // Make sure we get a proper array or initialize an empty one
  const fieldValue = form.watch(name);
  const selections = Array.isArray(fieldValue) ? fieldValue : [];
  
  // Calculate if max selections is reached
  const atMaxSelections = selections.length >= maxSelections;
  
  // Add debugging to help troubleshoot
  console.log(`LimitedTopicSelector for field "${name}"`, {
    currentValue: selections,
    rawValue: fieldValue,
    valueType: typeof fieldValue,
    isArray: Array.isArray(fieldValue),
    selectionsLength: selections.length,
    maxSelections,
    atMaxSelections,
    formValues: form.getValues(),
    hasError: !!form.formState.errors[name],
    error: form.formState.errors[name]
  });
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        // Log field value in render
        console.log(`Rendering field "${name}"`, {
          fieldValue: field.value,
          isArray: Array.isArray(field.value)
        });
        
        return (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm">
                {label} <span className="text-muted-foreground font-normal">(min 1, max {maxSelections})</span>
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
              <span 
                className={`text-xs ${
                  atMaxSelections 
                    ? 'text-destructive font-medium' 
                    : selections.length > 0 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                }`}
              >
                {selections.length}/{maxSelections}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              {options.map(option => {
                // Make sure field.value is an array before checking includes
                const isSelected = Array.isArray(field.value) && field.value.includes(option);
                
                return (
                  <Button
                    key={option}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto py-2 text-xs justify-start text-left ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent/20'
                    }`}
                    onClick={() => {
                      console.log(`Button clicked for option "${option}"`, {
                        isSelected,
                        currentValue: field.value,
                        isArray: Array.isArray(field.value)
                      });
                      
                      if (isSelected) {
                        // Remove from selection
                        const newValue = field.value.filter((val: string) => val !== option);
                        console.log("Removing option, new value:", newValue);
                        field.onChange(newValue);
                      } else if (!atMaxSelections) {
                        // Add to selection if not at max
                        // Ensure we're starting with an array
                        const baseArray = Array.isArray(field.value) ? field.value : [];
                        const newValue = [...baseArray, option];
                        console.log("Adding option, new value:", newValue);
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
                    disabled={false} // Removed disabled state to ensure buttons are always clickable
                  >
                    {isSelected && <CheckIcon className="mr-2 h-4 w-4" />}
                    {option}
                  </Button>
                );
              })}
            </div>
            
            {/* Only show error message for exceeded max count */}
            {form.formState.errors[name]?.message && 
             form.formState.errors[name]?.message !== " " && 
             <FormMessage />}
          </FormItem>
        );
      }}
    />
  );
};