import React from "react";
import {
  getCollabTypeIcon,
  getCollabTypeShortName,
} from "@shared/collaboration-types";

interface CollaborationTypePillProps {
  typeId: string;
  className?: string;
}

export const CollaborationTypePill: React.FC<CollaborationTypePillProps> = ({
  typeId,
  className = "",
}) => {
  const Icon = getCollabTypeIcon(typeId);
  const shortName = getCollabTypeShortName(typeId);

  if (!Icon || !shortName) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-hairline px-2 py-0.5 text-xs font-medium text-text-muted ${className}`}
    >
      <Icon size={12} />
      <span>{shortName}</span>
    </span>
  );
};
