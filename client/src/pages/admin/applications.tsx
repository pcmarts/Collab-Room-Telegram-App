import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  Linkedin,
  MessageCircle,
  Twitter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import {
  AdminFilterBar,
  AdminListRow,
  AdminShell,
  type AdminSegment,
} from "@/components/admin";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  handle?: string;
  is_admin: boolean;
  is_approved: boolean;
  is_hidden?: boolean;
  applied_at: string;
  created_at: string;
  linkedin_url?: string;
  twitter_url?: string;
  twitter_followers?: string;
  referral_code?: string;
  company?: {
    name: string;
    short_description?: string;
    long_description?: string;
    website?: string;
    job_title: string;
    twitter_handle?: string;
    twitter_followers?: string | number;
    linkedin_url?: string;
    funding_stage?: string;
    has_token?: boolean;
    token_ticker?: string;
    blockchain_networks?: string[];
    tags?: string[];
    logo_url?: string;
  };
}

type Segment = "pending" | "approved" | "all";

const SEGMENTS: AdminSegment<Segment>[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "all", label: "All" },
];

export default function AdminApplications() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("pending");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest("/api/admin/approve-user", "POST", { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Approved", description: "Applicant has been approved." });
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Couldn't approve",
        description: "Try again in a moment.",
      });
    },
  });

  const hideMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/admin/users/${userId}/hide`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      toast({ title: "Hidden", description: "Applicant removed from the list." });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Couldn't hide",
        description: "Try again in a moment.",
      });
    },
  });

  const handleHide = (userId: string) => {
    hideMutation.mutate(userId);
  };

  const handleMessage = (handle?: string) => {
    if (!handle) {
      toast({
        variant: "destructive",
        title: "No Telegram handle",
        description: "Can't open a chat with this applicant.",
      });
      return;
    }
    window.open(`https://t.me/${handle}`, "_blank");
  };

  // Segment counts for the filter pills.
  const { pendingCount, approvedCount, allCount } = useMemo(() => {
    return {
      pendingCount: users.filter((u) => !u.is_approved).length,
      approvedCount: users.filter((u) => u.is_approved).length,
      allCount: users.length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => {
        if (segment === "pending") return !u.is_approved;
        if (segment === "approved") return u.is_approved;
        return true;
      })
      .filter((u) => {
        if (!q) return true;
        return (
          u.first_name.toLowerCase().includes(q) ||
          (u.last_name?.toLowerCase().includes(q) ?? false) ||
          (u.handle?.toLowerCase().includes(q) ?? false) ||
          (u.email?.toLowerCase().includes(q) ?? false) ||
          (u.company?.name?.toLowerCase().includes(q) ?? false) ||
          (u.company?.job_title?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime(),
      );
  }, [users, segment, search]);

  const segments = SEGMENTS.map((s) => ({
    ...s,
    count:
      s.id === "pending"
        ? pendingCount
        : s.id === "approved"
          ? approvedCount
          : allCount,
  }));

  return (
    <AdminShell
      title="Applications"
      count={
        pendingCount > 0
          ? `${pendingCount} pending`
          : users.length > 0
            ? `${users.length} total`
            : undefined
      }
      tabCounts={{ applications: pendingCount }}
    >
      <AdminFilterBar<Segment>
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search applicants, companies, handles"
        segments={segments}
        currentSegment={segment}
        onSegmentChange={setSegment}
      />

      {isLoading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState segment={segment} hasSearch={Boolean(search.trim())} />
      ) : (
        <div>
          {filtered.map((user) => (
            <AdminListRow
              key={user.id}
              avatar={
                <LogoAvatar
                  name={user.company?.name || user.first_name}
                  logoUrl={user.company?.logo_url}
                  size="md"
                  className="h-10 w-10"
                />
              }
              title={
                user.company?.name ||
                `${user.first_name} ${user.last_name || ""}`.trim()
              }
              subtitle={
                <>
                  {user.first_name} {user.last_name || ""}
                  {user.company?.job_title ? ` · ${user.company.job_title}` : ""}
                </>
              }
              meta={
                <>
                  applied{" "}
                  {formatDistanceToNow(new Date(user.applied_at), {
                    addSuffix: true,
                  })}
                  {user.handle ? ` · @${user.handle}` : ""}
                </>
              }
              status={
                user.is_approved
                  ? { tone: "success", label: "Approved" }
                  : { tone: "brand", label: "Pending" }
              }
              onClick={() => setSelectedUser(user)}
            />
          ))}
        </div>
      )}

      <ApplicationReviewSheet
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onApprove={(id) => approveMutation.mutate(id)}
        onHide={handleHide}
        onMessage={handleMessage}
        approving={approveMutation.isPending}
        hiding={hideMutation.isPending}
      />
    </AdminShell>
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
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-40 animate-pulse rounded bg-surface" />
            <div className="h-3 w-56 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  segment,
  hasSearch,
}: {
  segment: Segment;
  hasSearch: boolean;
}) {
  if (hasSearch) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-text-muted">No matches for that search.</p>
      </div>
    );
  }
  const message =
    segment === "pending"
      ? "Nothing pending. You're caught up."
      : segment === "approved"
        ? "No approved applicants yet."
        : "No applications yet.";
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

interface ApplicationReviewSheetProps {
  user: User | null;
  onClose: () => void;
  onApprove: (userId: string) => void;
  onHide: (userId: string) => void;
  onMessage: (handle?: string) => void;
  approving: boolean;
  hiding: boolean;
}

function ApplicationReviewSheet({
  user,
  onClose,
  onApprove,
  onHide,
  onMessage,
  approving,
  hiding,
}: ApplicationReviewSheetProps) {
  const companyName =
    user?.company?.name ||
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "Application";

  return (
    <BottomSheet
      open={!!user}
      onOpenChange={(open) => !open && onClose()}
      size="tall"
      eyebrow={user?.is_approved ? "APPROVED" : "PENDING"}
      title={companyName}
      subtitle={
        user
          ? `${user.first_name} ${user.last_name || ""}${
              user.company?.job_title ? ` · ${user.company.job_title}` : ""
            }`.trim()
          : undefined
      }
      footer={
        user ? (
          <div className="flex items-center gap-2 [&>button]:flex-1">
            <Button
              variant="ghost"
              onClick={() => onHide(user.id)}
              disabled={user.is_approved || hiding}
            >
              {hiding ? "Hiding…" : "Hide"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onMessage(user.handle)}
              disabled={!user.handle}
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
            <Button
              onClick={() => onApprove(user.id)}
              disabled={approving || user.is_approved}
            >
              {user.is_approved ? "Approved" : approving ? "Approving…" : "Approve"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {user ? <ApplicationDetails user={user} /> : null}
    </BottomSheet>
  );
}

function ApplicationDetails({ user }: { user: User }) {
  const company = user.company;
  const companyTwitterHref = company?.twitter_handle
    ? `https://twitter.com/${company.twitter_handle.replace(/^@/, "")}`
    : undefined;
  const personalTwitterHref = user.twitter_url;

  return (
    <>
      {/* Identity card — one boundary, earns its place */}
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
        <LogoAvatar
          name={company?.name || user.first_name}
          logoUrl={company?.logo_url}
          size="md"
          className="h-12 w-12 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-tight text-text">
            {company?.name || `${user.first_name} ${user.last_name || ""}`}
          </p>
          {user.handle ? (
            <p className="mt-0.5 text-sm text-text-muted">
              {user.first_name} {user.last_name || ""} · @{user.handle}
            </p>
          ) : null}
          {user.email ? (
            <p className="mt-0.5 truncate text-xs tabular text-text-subtle">
              {user.email}
            </p>
          ) : null}
        </div>
      </div>

      {company?.short_description ? (
        <BottomSheet.Section eyebrow="What they do">
          <p className="text-[0.9375rem] leading-snug text-text">
            {company.short_description}
          </p>
        </BottomSheet.Section>
      ) : null}

      {company?.long_description ? (
        <BottomSheet.Section eyebrow="Details">
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-snug text-text">
            {company.long_description}
          </p>
        </BottomSheet.Section>
      ) : null}

      {user.referral_code ? (
        <BottomSheet.Section eyebrow="Referred with code">
          <code className="font-mono text-sm tabular text-text">
            {user.referral_code}
          </code>
        </BottomSheet.Section>
      ) : null}

      {(companyTwitterHref ||
        personalTwitterHref ||
        user.linkedin_url ||
        company?.website ||
        company?.linkedin_url) && (
        <BottomSheet.Section eyebrow="Links">
          <div className="flex flex-wrap gap-2">
            {company?.website ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              </Button>
            ) : null}
            {companyTwitterHref ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={companyTwitterHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-3 w-3" />
                  {company?.twitter_handle
                    ? `@${company.twitter_handle.replace(/^@/, "")}`
                    : "Company"}
                </a>
              </Button>
            ) : null}
            {personalTwitterHref ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={personalTwitterHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-3 w-3" />
                  Personal
                </a>
              </Button>
            ) : null}
            {company?.linkedin_url ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={company.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-3 w-3" />
                  Company
                </a>
              </Button>
            ) : null}
            {user.linkedin_url ? (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={user.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-3 w-3" />
                  Personal
                </a>
              </Button>
            ) : null}
          </div>
        </BottomSheet.Section>
      )}

      {(company?.funding_stage || company?.twitter_followers || user.twitter_followers) && (
        <BottomSheet.Section eyebrow="Signals">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.9375rem]">
            {company?.funding_stage ? (
              <>
                <dt className="text-sm text-text-muted">Funding</dt>
                <dd className="text-text">{company.funding_stage}</dd>
              </>
            ) : null}
            {company?.twitter_followers ? (
              <>
                <dt className="text-sm text-text-muted">Company Twitter</dt>
                <dd className="tabular text-text">
                  {company.twitter_followers}
                </dd>
              </>
            ) : null}
            {user.twitter_followers ? (
              <>
                <dt className="text-sm text-text-muted">Personal Twitter</dt>
                <dd className="tabular text-text">{user.twitter_followers}</dd>
              </>
            ) : null}
          </dl>
        </BottomSheet.Section>
      )}

      {company?.has_token ? (
        <BottomSheet.Section eyebrow="Token">
          {company.token_ticker ? (
            <p className="font-mono text-base tabular text-text">
              ${company.token_ticker}
            </p>
          ) : (
            <p className="text-[0.9375rem] text-text">Has token</p>
          )}
          {company.blockchain_networks && company.blockchain_networks.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {company.blockchain_networks.map((n) => (
                <Badge
                  key={n}
                  variant="outline"
                  className="px-2 py-0.5 text-xs"
                >
                  {n}
                </Badge>
              ))}
            </div>
          ) : null}
        </BottomSheet.Section>
      ) : null}

      {company?.tags && company.tags.length > 0 ? (
        <BottomSheet.Section eyebrow="Tags">
          <div className="flex flex-wrap gap-1.5">
            {company.tags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="px-2 py-0.5 text-xs"
              >
                {t}
              </Badge>
            ))}
          </div>
        </BottomSheet.Section>
      ) : null}

      <BottomSheet.Section eyebrow="Timeline">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-text-muted">Applied</dt>
          <dd className="tabular text-text">
            {new Date(user.applied_at).toLocaleString()}
          </dd>
          <dt className="text-text-muted">Created</dt>
          <dd className="tabular text-text">
            {new Date(user.created_at).toLocaleString()}
          </dd>
        </dl>
      </BottomSheet.Section>
    </>
  );
}
