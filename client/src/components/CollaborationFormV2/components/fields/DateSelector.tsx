import React from "react";
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DateSelectorProps {
  form: UseFormReturn<any>;
  step?: string;
}

/**
 * Date selector component for collaboration forms
 * Allows selection between "Any Future Date" or a specific date
 * Uses a user-friendly calendar picker that works well on mobile
 */
export const DateSelector: React.FC<DateSelectorProps> = ({ form, step }) => {
  const dateType = form.watch("date_type");
  
  // Get today's date to use as the minimum selectable date
  const today = new Date();
  
  return (
    <div className="space-y-4" key={step}>
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
      
      {/* Show date picker only when specific date is selected */}
      {dateType === "specific_date" && (
        <FormField
          control={form.control}
          name="specific_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(typeof field.value === 'string' ? new Date(field.value) : field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? (typeof field.value === 'string' ? new Date(field.value) : field.value) : undefined}
                    onSelect={(date) => {
                      // Convert date to string in ISO format before setting in form
                      if (date) {
                        field.onChange(date.toISOString().split('T')[0]);
                      } else {
                        field.onChange(null);
                      }
                    }}
                    disabled={(date) => date < today}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};