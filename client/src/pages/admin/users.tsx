import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import {
  AdminFilterBar,
  AdminListRow,
  AdminShell,
} from "@/components/admin";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  handle?: string;
  is_admin: boolean;
  is_approved: boolean;
  company?: {
    name: string;
    job_title: string;
    logo_url?: string;
  };
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const approvedUsers = useMemo(
    () => users.filter((u) => u.is_approved),
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return approvedUsers;
    return approvedUsers.filter((u) => {
      return (
        u.first_name.toLowerCase().includes(q) ||
        (u.last_name?.toLowerCase().includes(q) ?? false) ||
        (u.handle?.toLowerCase().includes(q) ?? false) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.company?.name?.toLowerCase().includes(q) ?? false) ||
        (u.company?.job_title?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [approvedUsers, search]);

  const handleMessage = (handle?: string) => {
    if (!handle) {
      toast({
        variant: "destructive",
        title: "No Telegram handle",
        description: "Can't open a chat with this user.",
      });
      return;
    }
    window.open(`https://t.me/${handle}`, "_blank");
  };

  return (
    <AdminShell
      title="Users"
      count={
        approvedUsers.length > 0
          ? `${approvedUsers.length} approved`
          : undefined
      }
      tabCounts={{ users: approvedUsers.length }}
    >
      <AdminFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, company, handle, email"
      />

      {isLoading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={Boolean(search.trim())} />
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
                <>
                  {user.first_name} {user.last_name || ""}
                  {user.is_admin ? (
                    <span className="ml-2 inline-flex items-center rounded-sm bg-brand-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand">
                      Admin
                    </span>
                  ) : null}
                </>
              }
              subtitle={
                <>
                  {user.company?.name || "—"}
                  {user.company?.job_title ? ` · ${user.company.job_title}` : ""}
                </>
              }
              meta={user.handle ? `@${user.handle}` : user.email || undefined}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMessage(user.handle)}
                  disabled={!user.handle}
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
              }
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function ListSkeleton() {
  return (
    <div className="py-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-hairline px-2 py-3 last:border-b-0"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-48 animate-pulse rounded bg-surface" />
            <div className="h-3 w-64 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-text-muted">
        {hasSearch ? "No users match that search." : "No approved users yet."}
      </p>
    </div>
  );
}
