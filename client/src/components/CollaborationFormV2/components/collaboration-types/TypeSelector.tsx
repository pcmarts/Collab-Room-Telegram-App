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
import { useCollaborationType } from "../../contexts/CollaborationTypeContext";
import { COLLAB_TYPES } from "@shared/schema";

interface TypeSelectorProps {
  form: UseFormReturn<any>;
  onTypeSelected?: () => void;
}

/**
 * Component for selecting the collaboration type
 * Updates form context when type is selected
 */
export const TypeSelector: React.FC<TypeSelectorProps> = ({ form, onTypeSelected }) => {
  const { availableTypes, selectType } = useCollaborationType();

  const handleTypeSelect = (typeId: string) => {
    form.setValue("collab_type", typeId);
    
    // Reset form fields when changing types to prevent field bleeding
    // We preserve only the type field to avoid complete form reset
    const currentValue = form.getValues("collab_type");
    form.reset({ collab_type: currentValue });
    
    // Update the selected type in context
    selectType(typeId);
    
    // Populate default values for the selected type
    const selectedType = availableTypes.find(type => type.id === typeId);
    if (selectedType && selectedType.defaultValues) {
      // Apply default values for this type
      form.reset({ 
        collab_type: typeId,
        ...selectedType.defaultValues 
      });
      
      // Call the callback if provided to move to next step
      if (onTypeSelected) {
        onTypeSelected();
      }
    }
  };

  return (
    <FormField
      control={form.control}
      name="collab_type"
      render={({ field }) => (
        <FormItem className="space-y-1 pt-1">
          <FormLabel className="mb-1 text-sm">
            What type of collaboration are you looking to host?
            <span className="text-destructive ml-1">*</span>
          </FormLabel>
          <div className="flex flex-col gap-2">
            {COLLAB_TYPES.map((type) => {
              const isSelected = field.value === type;
              const isTypeAvailable = availableTypes.some(t => t.id === type);
              
              return (
                <Button
                  key={type}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    w-full h-auto py-3 px-3 text-sm justify-start
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-card'}
                    ${!isTypeAvailable && !isSelected ? 'opacity-60' : ''}
                  `}
                  onClick={() => handleTypeSelect(type)}
                  disabled={!isTypeAvailable && !isSelected}
                >
                  {isSelected && <CheckIcon className="mr-2 h-4 w-4" />}
                  {type}
                  {!isTypeAvailable && !isSelected && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};