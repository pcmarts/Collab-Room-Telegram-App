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
  const selections = form.watch(name) || [];
  const atMaxSelections = selections.length >= maxSelections;
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
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
              const isSelected = field.value?.includes(option);
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
                    if (isSelected) {
                      // Remove from selection
                      field.onChange(
                        field.value.filter((val: string) => val !== option)
                      );
                    } else if (!atMaxSelections) {
                      // Add to selection if not at max
                      field.onChange([...(field.value || []), option]);
                    } else {
                      // Show toast that max selections reached
                      toast({
                        title: `Maximum ${maxSelections} topics`,
                        description: `Please remove a selection before adding a new one.`,
                        variant: "destructive"
                      });
                    }
                  }}
                  disabled={!isSelected && atMaxSelections}
                >
                  {isSelected && <CheckIcon className="mr-2 h-4 w-4" />}
                  {option}
                </Button>
              );
            })}
          </div>
          {/* Only show error message if there's truly an error */}
          {form.formState.errors[name] && <FormMessage />}
        </FormItem>
      )}
    />
  );
};