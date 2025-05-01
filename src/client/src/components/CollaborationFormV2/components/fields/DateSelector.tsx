import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

interface DateSelectorProps {
  form: UseFormReturn<any>;
}

/**
 * Date selector component for collaboration forms
 * Allows selection between "Any Future Date" or a specific date
 */
export const DateSelector: React.FC<DateSelectorProps> = ({ form }) => {
  const dateType = form.watch("date_type");
  
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="date_type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Timing</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col space-y-1"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="any_future_date" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Any Future Date
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="specific_date" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Specific Date
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Show date input only when specific date is selected */}
      {dateType === "specific_date" && (
        <FormField
          control={form.control}
          name="specific_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  min={new Date().toISOString().split("T")[0]} // Ensure only future dates can be selected
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};