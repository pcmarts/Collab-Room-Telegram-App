import React from 'react';
import { getCollabTypeIcon, getCollabTypeColors, getCollabTypeName, getCollabTypeShortName } from '@/lib/collaboration-utils';

interface TypePillProps {
  /** Collaboration type ID or legacy name */
  type: string | undefined;
  /** Show icon alongside text */
  showIcon?: boolean;
  /** Use short name instead of full name */
  useShortName?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Icon size classes */
  iconClassName?: string;
  /** Text size classes */
  textClassName?: string;
}

/**
 * Reusable collaboration type pill component
 * Provides consistent styling and behavior across all collaboration type displays
 */
export function TypePill({
  type,
  showIcon = true,
  useShortName = false,
  className = "",
  iconClassName = "h-3 w-3",
  textClassName = ""
}: TypePillProps) {
  if (!type) return null;

  const colors = getCollabTypeColors(type);
  const name = useShortName ? getCollabTypeShortName(type) : getCollabTypeName(type);
  const icon = showIcon ? getCollabTypeIcon(type, iconClassName) : null;

  const baseClasses = "px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1";
  const colorClasses = `${colors.bg} ${colors.text}`;
  const allClasses = `${baseClasses} ${colorClasses} ${className}`;

  return (
    <span className={allClasses}>
      {icon}
      <span className={textClassName}>{name}</span>
    </span>
  );
}

export default TypePill;