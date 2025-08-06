import React from "react";
import { Badge } from "@/components/ui/badge";
import { getCollabTypeIcon, getCollabTypeColors, getCollabTypeShortName } from "@shared/collaboration-types";

interface CollaborationTypePillProps {
  typeId: string;
  className?: string;
}

/**
 * Display pill showing selected collaboration type with icon and color
 */
export const CollaborationTypePill: React.FC<CollaborationTypePillProps> = ({ 
  typeId, 
  className = "" 
}) => {
  // Get collaboration type data
  const Icon = getCollabTypeIcon(typeId);
  const colors = getCollabTypeColors(typeId);
  const shortName = getCollabTypeShortName(typeId);
  
  if (!Icon || !shortName) {
    return null; // Don't render if we can't find the type
  }

  return (
    <Badge 
      variant="secondary" 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
    >
      <Icon size={12} />
      <span>{shortName}</span>
    </Badge>
  );
};