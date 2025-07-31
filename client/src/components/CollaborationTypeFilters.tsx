import { useState } from "react";
import { Button } from "@/components/ui/button";
import { COLLAB_TYPE_IDS } from "@shared/collaboration-types/constants";
import { getCollabTypeIcon, getCollabTypeColors } from "@shared/collaboration-types";

export interface FilterOption {
  id: string;
  label: string;
  collabTypeId?: string;
}

interface CollaborationTypeFiltersProps {
  selectedFilter: string;
  onFilterChange: (filterId: string) => void;
  collaborationCount: number;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: "all", label: "All" },
  { id: "twitter_spaces", label: "Twitter Spaces", collabTypeId: COLLAB_TYPE_IDS.TWITTER_SPACES },
  { id: "podcasts", label: "Podcasts", collabTypeId: COLLAB_TYPE_IDS.PODCAST },
  { id: "live_streams", label: "Live Streams", collabTypeId: COLLAB_TYPE_IDS.LIVESTREAM },
  { id: "twitter_comarketing", label: "Twitter Co-marketing", collabTypeId: COLLAB_TYPE_IDS.TWITTER_COMARKETING },
  { id: "reports", label: "Reports", collabTypeId: COLLAB_TYPE_IDS.RESEARCH },
  { id: "blogs", label: "Blogs", collabTypeId: COLLAB_TYPE_IDS.BLOG_POST },
];

export function CollaborationTypeFilters({
  selectedFilter,
  onFilterChange,
  collaborationCount
}: CollaborationTypeFiltersProps) {
  return (
    <div className="w-full">
      {/* Filter Pills Container */}
      <div className="overflow-x-auto scrollbar-hide scroll-smooth">
        <div className="flex space-x-2 px-4 py-3 min-w-max">
          {FILTER_OPTIONS.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            const Icon = filter.collabTypeId ? getCollabTypeIcon(filter.collabTypeId) : null;
            const colors = filter.collabTypeId ? getCollabTypeColors(filter.collabTypeId) : null;

            return (
              <Button
                key={filter.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange(filter.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap transition-all duration-200
                  ${isSelected 
                    ? colors 
                      ? `${colors.bg} ${colors.text} hover:${colors.hover} border-transparent` 
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "hover:bg-accent hover:text-accent-foreground"
                  }
                `}

              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="font-medium">{filter.label}</span>
                {isSelected && (
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-full font-semibold
                    ${isSelected 
                      ? "bg-white/20 text-white" 
                      : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {collaborationCount}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Collaboration Count Summary */}
      <div className="px-4 pb-2">
        <div className="text-xs text-muted-foreground">
          {collaborationCount} {collaborationCount === 1 ? "collaboration" : "collaborations"}
          {selectedFilter !== "all" && (
            <span className="ml-1">
              for {FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label.toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { FILTER_OPTIONS };