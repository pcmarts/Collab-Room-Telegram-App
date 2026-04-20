export function CollaborationListItemSkeleton() {
  return (
    <div className="flex items-start gap-3 py-4 px-4 -mx-4 border-b border-hairline">
      <div className="h-10 w-10 shrink-0 rounded-full bg-surface animate-pulse" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="h-4 w-40 rounded-sm bg-surface animate-pulse" />
          <div className="h-3 w-14 rounded-sm bg-surface animate-pulse" />
        </div>
        <div className="h-3 w-52 rounded-sm bg-surface animate-pulse" />
        <div className="h-3 w-full max-w-[280px] rounded-sm bg-surface animate-pulse" />
      </div>
    </div>
  );
}

export function CollaborationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <CollaborationListItemSkeleton key={i} />
      ))}
    </div>
  );
}
