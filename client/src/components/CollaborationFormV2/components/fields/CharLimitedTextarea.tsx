import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface CharLimitedTextareaProps {
  name: string;
  label: string;
  placeholder: string;
  description?: string;
  maxLength: number;
  form: UseFormReturn<any>;
  required?: boolean;
}

/**
 * Textarea component with built-in character limit
 * Shows character count with color-coding as limit is approached
 */
export const CharLimitedTextarea: React.FC<CharLimitedTextareaProps> = ({
  name,
  label,
  placeholder,
  description,
  maxLength,
  form,
  required = false,
}) => {
  const [charCount, setCharCount] = useState(0);
  const value = form.watch(name) || "";
  
  // Update character count when value changes
  useEffect(() => {
    if (typeof value === 'string') {
      setCharCount(value.length);
    }
  }, [value]);
  
  // Determine color based on character count
  const getCountColor = () => {
    const percentage = (charCount / maxLength) * 100;
    if (percentage >= 100) return "text-destructive font-bold";
    if (percentage >= 80) return "text-warning font-medium";
    if (percentage > 0) return "text-text-muted";
    return "text-text-subtle";
  };
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className="min-h-[120px] text-sm resize-y"
              maxLength={maxLength}
              {...field}
              onChange={(e) => {
                // Use substring to enforce the character limit in case maxLength doesn't work
                const limitedValue = e.target.value.substring(0, maxLength);
                field.onChange(limitedValue);
                setCharCount(limitedValue.length);
              }}
            />
          </FormControl>
          {/* Display character count below the description if it exists, otherwise above the input */}
          <div className="text-right">
            <span className={`text-xs tabular ${getCountColor()}`}>
              {charCount}/{maxLength}
            </span>
          </div>
          {description && (
            <FormDescription className="text-xs">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};