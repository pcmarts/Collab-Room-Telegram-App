import { type ReactNode, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AdminSegment<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

interface AdminFilterBarProps<T extends string = string> {
  /** Search input value (controlled). */
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  /** Primary filter: mutually exclusive segments rendered as pills. Omit for search-only. */
  segments?: AdminSegment<T>[];
  currentSegment?: T;
  onSegmentChange?: (id: T) => void;

  /** Right-side action slot — typically a single Button (Export, Refresh). */
  rightSlot?: ReactNode;

  className?: string;
}

/**
 * AdminFilterBar — the single filter pattern across admin surfaces.
 * Search on the left, segments as pills, optional right-side action.
 * Cmd/Ctrl+K focuses the search input.
 */
export function AdminFilterBar<T extends string = string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  segments,
  currentSegment,
  onSegmentChange,
  rightSlot,
  className,
}: AdminFilterBarProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K focuses the search — the console-style "find anything" shortcut.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
    >
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle"
        />
        <input
          ref={inputRef}
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            "h-10 w-full rounded-md border border-hairline bg-surface pl-9 pr-9 text-sm text-text",
            "placeholder:text-text-subtle",
            "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          )}
          aria-label={searchPlaceholder}
        />
        {searchValue ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-sm text-text-muted hover:bg-accent hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {rightSlot ? <div className="flex shrink-0 items-center gap-2">{rightSlot}</div> : null}

      {segments && segments.length > 0 ? (
        <div
          role="tablist"
          aria-label="Filter"
          className="-mx-4 flex shrink-0 items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          {segments.map((seg) => {
            const active = seg.id === currentSegment;
            return (
              <button
                key={seg.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSegmentChange?.(seg.id)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm px-3 text-sm",
                  "transition-colors duration-fast ease-out",
                  active
                    ? "bg-text text-background"
                    : "bg-transparent text-text-muted hover:bg-surface hover:text-text",
                )}
              >
                <span>{seg.label}</span>
                {typeof seg.count === "number" ? (
                  <span
                    className={cn(
                      "min-w-[1.25rem] rounded-sm px-1 text-center text-xs tabular leading-[1.25rem]",
                      active
                        ? "bg-background/15 text-background"
                        : "bg-surface text-text-subtle",
                    )}
                  >
                    {seg.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
