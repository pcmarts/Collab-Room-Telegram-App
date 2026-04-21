import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AdminFilterBar,
  AdminShell,
  AdminStatStrip,
  type AdminSegment,
} from "@/components/admin";

interface ReferralEvent {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: "pending" | "completed" | "expired";
  created_at: string;
  completed_at: string | null;
  referrer: {
    first_name: string;
    last_name: string | null;
    handle: string;
  };
  referred_user: {
    first_name: string;
    last_name: string | null;
    handle: string;
  };
}

type Status = "all" | "pending" | "completed" | "expired";

const STATUS_SEGMENTS: AdminSegment<Status>[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "expired", label: "Expired" },
];

const STATUS_TONE: Record<
  ReferralEvent["status"],
  { tone: string; dot: string; label: string }
> = {
  completed: { tone: "text-success", dot: "bg-success", label: "Completed" },
  pending: { tone: "text-brand", dot: "bg-brand", label: "Pending" },
  expired: { tone: "text-text-subtle", dot: "bg-text-subtle", label: "Expired" },
};

export default function AdminReferralsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");

  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = useQuery<ReferralEvent[]>({
    queryKey: ["/api/referrals/admin/events"],
    staleTime: 60 * 1000,
    retry: 1,
  });

  const stats = useMemo(
    () => ({
      total: events?.length ?? 0,
      completed: events?.filter((e) => e.status === "completed").length ?? 0,
      pending: events?.filter((e) => e.status === "pending").length ?? 0,
    }),
    [events],
  );

  const filtered = useMemo(() => {
    if (!events) return [];
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (!q) return true;
      const referrerName = `${e.referrer.first_name} ${e.referrer.last_name || ""}`.toLowerCase();
      const referredName = `${e.referred_user.first_name} ${e.referred_user.last_name || ""}`.toLowerCase();
      return (
        referrerName.includes(q) ||
        referredName.includes(q) ||
        e.referrer.handle.toLowerCase().includes(q) ||
        e.referred_user.handle.toLowerCase().includes(q)
      );
    });
  }, [events, search, status]);

  const exportCSV = () => {
    if (!events || events.length === 0) return;
    const headers = [
      "ID",
      "Referrer Name",
      "Referrer Handle",
      "Referred User Name",
      "Referred User Handle",
      "Status",
      "Created",
      "Completed",
    ].join(",");
    const rows = events.map((e) =>
      [
        e.id,
        `${e.referrer.first_name} ${e.referrer.last_name || ""}`,
        e.referrer.handle,
        `${e.referred_user.first_name} ${e.referred_user.last_name || ""}`,
        e.referred_user.handle,
        e.status,
        new Date(e.created_at).toLocaleString(),
        e.completed_at ? new Date(e.completed_at).toLocaleString() : "-",
      ].join(","),
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const segments: AdminSegment<Status>[] = STATUS_SEGMENTS.map((s) => ({
    ...s,
    count:
      s.id === "all"
        ? stats.total
        : s.id === "pending"
          ? stats.pending
          : s.id === "completed"
            ? stats.completed
            : (events?.filter((e) => e.status === "expired").length ?? 0),
  }));

  return (
    <AdminShell
      title="Referrals"
      count={stats.total > 0 ? `${stats.total} total` : undefined}
      tabCounts={{ referrals: stats.total }}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={!events || events.length === 0}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      }
    >
      <div className="mb-4">
        <AdminStatStrip
          stats={[
            { value: stats.total, label: "Referrals" },
            { value: stats.completed, label: "Completed", tone: "success" },
            { value: stats.pending, label: "Pending", tone: "brand" },
          ]}
        />
      </div>

      <AdminFilterBar<Status>
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search referrer or referred"
        segments={segments}
        currentSegment={status}
        onSegmentChange={setStatus}
        rightSlot={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <div className="py-10 text-center">
          <p className="text-sm text-destructive">Couldn't load referrals.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted">
            {search.trim() || status !== "all"
              ? "No referrals match the filters."
              : "No referrals yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: single-line summary rows */}
          <div className="sm:hidden">
            {filtered.map((e) => (
              <ReferralRowMobile key={e.id} event={e} />
            ))}
          </div>

          {/* Desktop: proper table */}
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Referrer
                  </th>
                  <th className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Referred
                  </th>
                  <th className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Status
                  </th>
                  <th className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Created
                  </th>
                  <th className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <ReferralRowDesktop key={e.id} event={e} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function ReferralRowMobile({ event }: { event: ReferralEvent }) {
  const tone = STATUS_TONE[event.status];
  const referrerName = `${event.referrer.first_name} ${event.referrer.last_name || ""}`.trim();
  const referredName = `${event.referred_user.first_name} ${event.referred_user.last_name || ""}`.trim();

  return (
    <div className="border-b border-hairline px-2 py-3 last:border-b-0">
      <p className="text-[0.9375rem] text-text">
        <span className="font-medium">{referrerName}</span>
        <span className="text-text-subtle"> → </span>
        <span className="font-medium">{referredName}</span>
      </p>
      <div className="mt-0.5 flex items-center gap-2 text-xs tabular text-text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          <span>{tone.label}</span>
        </span>
        <span className="text-text-subtle/60">·</span>
        <span>
          {new Date(event.created_at).toLocaleDateString()}
          {event.completed_at
            ? ` — ${new Date(event.completed_at).toLocaleDateString()}`
            : null}
        </span>
      </div>
    </div>
  );
}

function ReferralRowDesktop({ event }: { event: ReferralEvent }) {
  const tone = STATUS_TONE[event.status];
  return (
    <tr className="border-b border-hairline last:border-b-0 hover:bg-surface">
      <td className="px-2 py-3">
        <div className="font-medium text-text">
          {event.referrer.first_name} {event.referrer.last_name || ""}
        </div>
        <div className="text-xs text-text-subtle">
          @{event.referrer.handle}
        </div>
      </td>
      <td className="px-2 py-3">
        <div className="font-medium text-text">
          {event.referred_user.first_name} {event.referred_user.last_name || ""}
        </div>
        <div className="text-xs text-text-subtle">
          @{event.referred_user.handle}
        </div>
      </td>
      <td className="px-2 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          <span className={tone.tone}>{tone.label}</span>
        </span>
      </td>
      <td className="px-2 py-3 text-sm tabular text-text-muted">
        {new Date(event.created_at).toLocaleDateString()}
      </td>
      <td className="px-2 py-3 text-sm tabular text-text-muted">
        {event.completed_at
          ? new Date(event.completed_at).toLocaleDateString()
          : "—"}
      </td>
    </tr>
  );
}

function ListSkeleton() {
  return (
    <div className="py-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-hairline px-2 py-3 last:border-b-0"
        >
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-64 animate-pulse rounded bg-surface" />
            <div className="h-3 w-40 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}
