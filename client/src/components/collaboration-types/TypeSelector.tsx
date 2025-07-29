import React from 'react';
import { getCollabTypeOptions } from '@/lib/collaboration-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TypePill } from './TypePill';

interface TypeSelectorProps {
  /** Currently selected type */
  value?: string;
  /** Callback when selection changes */
  onValueChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show icons in the dropdown */
  showIcons?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** CSS classes for the trigger */
  className?: string;
}

/**
 * Reusable collaboration type selector component
 * Provides consistent type selection interface with icons and proper styling
 */
export function TypeSelector({
  value,
  onValueChange,
  placeholder = "Select collaboration type",
  showIcons = true,
  disabled = false,
  className = ""
}: TypeSelectorProps) {
  const options = getCollabTypeOptions();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {value && <TypePill type={value} showIcon={showIcons} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <TypePill type={option.value} showIcon={showIcons} />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TypeSelector;