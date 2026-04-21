import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eyebrow } from "@/components/brand";
import { Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getCollabTypeIcon } from "@/lib/collaboration-utils";

interface RequestsSummaryCardProps {
  recentRequests: Array<{
    id: string;
    collaboration_id: string;
    collaboration_type: string;
    collaboration_title: string;
    requester: {
      id: string;
      first_name: string;
      last_name?: string;
      avatar_url?: string;
    };
    company: {
      name: string;
      twitter_handle?: string;
    };
    note?: string;
    created_at: string;
  }>;
  totalPendingCount: number;
  onViewAllRequests: () => void;
}

export function RequestsSummaryCard({
  recentRequests,
  totalPendingCount,
  onViewAllRequests,
}: RequestsSummaryCardProps) {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <Eyebrow tone="brand" dot>
          Inbound
        </Eyebrow>
        <span className="text-xs font-medium tabular text-text-muted">
          {totalPendingCount} pending
        </span>
      </div>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-text">
        New collab requests
      </h2>

      <div className="mt-4 divide-y divide-hairline">
        {recentRequests.slice(0, 4).map((request) => (
          <div key={request.id} className="flex items-center gap-3 py-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-sm">
                {request.requester.first_name.charAt(0)}
                {request.requester.last_name?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {getCollabTypeIcon(request.collaboration_type)}
                <p className="truncate text-sm font-medium text-text">
                  {request.collaboration_title}
                </p>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-text-muted">
                  {request.requester.first_name} {request.requester.last_name || ''}
                  {request.company.name && (
                    <span className="text-text-subtle"> · {request.company.name}</span>
                  )}
                </p>
                <div className="flex shrink-0 items-center gap-1 text-xs tabular text-text-subtle">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={onViewAllRequests}
        className="mt-4 w-full"
        variant="outline"
        size="sm"
      >
        View all ({totalPendingCount})
        <ArrowRight className="h-4 w-4" />
      </Button>
    </section>
  );
}