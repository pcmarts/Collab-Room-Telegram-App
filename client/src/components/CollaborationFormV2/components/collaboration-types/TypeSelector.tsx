import React from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  CheckIcon, 
  Twitter, 
  Headphones, 
  FileText, 
  Video, 
  Mail, 
  BarChart,
  Megaphone 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCollaborationType } from "../../contexts/CollaborationTypeContext";
import { COLLAB_TYPES } from "@shared/schema";
import { getCollaborationType } from "../../utils/typeRegistry";

interface TypeSelectorProps {
  form: UseFormReturn<any>;
  onTypeSelected?: () => void;
}

/**
 * Component for selecting the collaboration type
 * Updates form context when type is selected
 */
/**
 * Helper function to get the appropriate icon for a collaboration type
 */
const getCollaborationTypeIcon = (type: string) => {
  if (!type) return Megaphone;
  
  const typeLower = type.toLowerCase();
  
  if (typeLower.includes('twitter') && (typeLower.includes('co-marketing') || typeLower.includes('comarketing'))) {
    return Twitter;
  } else if (typeLower.includes('twitter')) {
    return Twitter;
  } else if (typeLower.includes('podcast')) {
    return Headphones;
  } else if (typeLower.includes('blog')) {
    return FileText;
  } else if (typeLower.includes('livestream') || typeLower.includes('live stream')) {
    return Video;
  } else if (typeLower.includes('newsletter')) {
    return Mail;
  } else if (typeLower.includes('research') || typeLower.includes('report')) {
    return BarChart;
  }
  
  return Megaphone;
};

export const TypeSelector: React.FC<TypeSelectorProps> = ({ form, onTypeSelected }) => {
  const { availableTypes, selectType } = useCollaborationType();

  const handleTypeSelect = async (typeId: string) => {
    console.log("Selected collaboration type:", typeId);
    
    // Set the value and validate it
    form.setValue("collab_type", typeId, { shouldValidate: true });
    await form.trigger("collab_type");
    
    // Reset form fields when changing types to prevent field bleeding
    // We preserve only the type field to avoid complete form reset
    form.reset({ collab_type: typeId });
    
    // Update the selected type in context
    selectType(typeId);
    
    // Populate default values for the selected type
    const selectedType = availableTypes.find(type => type.id === typeId);
    if (selectedType && selectedType.defaultValues) {
      console.log("Applying default values for type:", typeId, selectedType.defaultValues);
      
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
            {COLLAB_TYPES
              .map((type) => {
                const isSelected = field.value === type;
                // Check availability using both the type name and any corresponding ID from registry
                const collabType = getCollaborationType(type);
                const isTypeAvailable = availableTypes.some(t => 
                  t.id === type || 
                  t.name === type || 
                  (collabType && (t.id === collabType.id || t.name === collabType.name))
                ) || true; // Temporarily set to true to make all types available
                
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
                    {isSelected ? (
                      <CheckIcon className="mr-2 h-4 w-4" />
                    ) : (
                      <div className="mr-2 h-4 w-4 flex items-center justify-center">
                        {React.createElement(getCollaborationTypeIcon(type), { size: 16 })}
                      </div>
                    )}
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