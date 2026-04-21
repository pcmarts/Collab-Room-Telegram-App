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
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useCollaborationType } from "../../contexts/CollaborationTypeContext";
import { COLLAB_TYPES } from "@shared/schema";
import { getCollaborationType, collaborationTypes } from "../../utils/typeRegistry";
import { COLLAB_TYPE_IDS } from "@shared/collaboration-types";

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
    // Set the value and validate it
    form.setValue("collab_type", typeId, { shouldValidate: true });
    await form.trigger("collab_type");
    
    // Reset form fields when changing types to prevent field bleeding
    // We preserve only the type field to avoid complete form reset
    form.reset({ collab_type: typeId });
    
    // Update the selected type in context using the ID
    selectType(typeId);
    
    // Get the collaboration type definition from the registry
    const selectedType = getCollaborationType(typeId);
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
    } else {
      // If no specific defaults found, still call the callback to proceed
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

          <div className="flex flex-col gap-2">
            {collaborationTypes
              .map((type) => {
                // Use the display name for consistency with the old system
                const typeName = type.name;
                const isSelected = field.value === type.id || field.value === typeName;
                const isTypeAvailable = true; // All registered types are available
                const isWarm = type.id === COLLAB_TYPE_IDS.RESEARCH;

                const base =
                  "flex w-full items-center gap-2.5 rounded-md border px-3 py-3 text-sm font-medium text-left transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background";
                const selectedClasses = isWarm
                  ? "border-warm-accent/40 bg-warm-surface text-text"
                  : "border-brand bg-brand text-brand-fg";
                const idleClasses = isWarm
                  ? "border-hairline bg-surface text-text hover:border-warm-accent/40 hover:bg-warm-surface"
                  : "border-hairline bg-surface text-text hover:border-border-strong hover:bg-surface-raised";

                return (
                  <button
                    key={type.id}
                    type="button"
                    className={cn(
                      base,
                      isSelected ? selectedClasses : idleClasses,
                      !isTypeAvailable && !isSelected && "opacity-60"
                    )}
                    onClick={() => handleTypeSelect(type.id)}
                    disabled={!isTypeAvailable && !isSelected}
                  >
                    {isSelected ? (
                      <CheckIcon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isWarm ? "text-warm-accent" : "text-brand-fg"
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center",
                          isWarm ? "text-warm-accent" : "text-brand"
                        )}
                      >
                        {React.createElement(getCollaborationTypeIcon(typeName), { size: 16 })}
                      </span>
                    )}
                    <span className="flex-1">{typeName}</span>
                    {!isTypeAvailable && !isSelected && (
                      <span className="ml-auto text-xs text-text-subtle">
                        Coming soon
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};