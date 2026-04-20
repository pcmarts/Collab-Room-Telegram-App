import { COLLAB_TYPE_IDS } from "@shared/collaboration-types/constants";

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
  { id: "twitter_spaces", label: "Spaces", collabTypeId: COLLAB_TYPE_IDS.TWITTER_SPACES },
  { id: "podcasts", label: "Podcasts", collabTypeId: COLLAB_TYPE_IDS.PODCAST },
  { id: "live_streams", label: "Streams", collabTypeId: COLLAB_TYPE_IDS.LIVESTREAM },
  { id: "twitter_comarketing", label: "Co-marketing", collabTypeId: COLLAB_TYPE_IDS.TWITTER_COMARKETING },
  { id: "reports", label: "Reports", collabTypeId: COLLAB_TYPE_IDS.RESEARCH },
  { id: "blogs", label: "Blogs", collabTypeId: COLLAB_TYPE_IDS.BLOG_POST },
];

export function CollaborationTypeFilters({
  selectedFilter,
  onFilterChange,
  collaborationCount,
}: CollaborationTypeFiltersProps) {
  return (
    <div className="border-b border-hairline">
      <div
        className="scrollbar-hide flex items-center gap-2 overflow-x-auto px-4 py-3"
        role="tablist"
      >
        {FILTER_OPTIONS.map((filter) => {
          const isSelected = selectedFilter === filter.id;
          return (
            <button
              key={filter.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onFilterChange(filter.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-fast ease-out ${
                isSelected
                  ? "bg-brand text-brand-fg"
                  : "text-text-muted hover:text-text active:bg-surface"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <div className="px-4 pb-3">
        <p className="text-xs tabular text-text-subtle">
          {collaborationCount.toLocaleString()}{" "}
          {collaborationCount === 1 ? "opportunity" : "opportunities"}
          {selectedFilter !== "all" &&
            ` · ${FILTER_OPTIONS.find((f) => f.id === selectedFilter)?.label.toLowerCase()}`}
        </p>
      </div>
    </div>
  );
}

export { FILTER_OPTIONS };
