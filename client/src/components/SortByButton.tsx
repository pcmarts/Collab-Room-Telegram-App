import { useState } from "react";
import { ArrowUpDown, Calendar, CalendarDays, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = "newest" | "oldest" | "collab_type";

export interface SortByButtonProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

const sortOptions = [
  {
    value: "newest" as const,
    label: "Newest first",
    icon: Calendar,
    description: "Most recently created"
  },
  {
    value: "oldest" as const,
    label: "Oldest first", 
    icon: CalendarDays,
    description: "Oldest collaborations first"
  },
  {
    value: "collab_type" as const,
    label: "Collab Type",
    icon: Tag,
    description: "Grouped by collaboration type"
  }
];

export function SortByButton({ currentSort, onSortChange, className = "" }: SortByButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentOption = sortOptions.find(option => option.value === currentSort);
  const CurrentIcon = currentOption?.icon || ArrowUpDown;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-2 ${className}`}
        >
          <ArrowUpDown className="h-4 w-4" />
          {currentOption && (
            <span className="hidden md:inline text-muted-foreground">
              {currentOption.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {sortOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = currentSort === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 cursor-pointer ${
                isSelected ? "bg-accent" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
              {isSelected && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}