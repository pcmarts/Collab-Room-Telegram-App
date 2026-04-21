import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { cn } from "@/lib/utils";
import { AdminTabs } from "./AdminTabs";

interface AdminShellProps {
  /** Page title, e.g. "Applications". Renders bold on the top bar. */
  title: string;
  /** Optional count next to the title, e.g. "12 pending". Muted, tabular. */
  count?: ReactNode;
  /** Right-side page action (usually a single Button). */
  action?: ReactNode;
  /** Tab counts to show in the strip, per-route. Omit for no badge. */
  tabCounts?: {
    applications?: number;
    users?: number;
    referrals?: number;
  };
  children: ReactNode;
}

/**
 * AdminShell — the single frame wrapping every admin page.
 *
 * Owns:
 * - Page-scroll behavior (adds the project's existing .scrollable-page class
 *   on mount, removes on unmount — replaces the per-page document.body.style
 *   mutation hack that lived in applications/referrals).
 * - Admin auth gate (one /api/profile check, one "not authorized" view).
 * - Page header with typographic title, count eyebrow, and right-side action.
 * - Sticky tab strip (Applications · Users · Referrals).
 */
export function AdminShell({
  title,
  count,
  action,
  tabCounts,
  children,
}: AdminShellProps) {
  // Opt this page out of the main app's body-lock (see index.css .scrollable-page).
  // Toggling a class — no document.body.style mutation, no cleanup gymnastics.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("scrollable-page");
    body.classList.add("scrollable-page");
    return () => {
      html.classList.remove("scrollable-page");
      body.classList.remove("scrollable-page");
    };
  }, []);

  const { data: profile, isLoading } = useQuery<{
    user?: { is_admin?: boolean };
  } | null>({ queryKey: ["/api/profile"] });

  const isAdmin = Boolean(profile && "user" in profile && profile.user?.is_admin);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-4xl px-4 pt-8">
          <p className="text-sm text-text-muted">Checking access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <NotAuthorized />;
  }

  return (
    <div className="min-h-dvh bg-background pb-24">
      <PageHeaderBar title={title} count={count} action={action} />
      <AdminTabs counts={tabCounts} />
      <div className="mx-auto max-w-4xl px-4 pt-4">{children}</div>
    </div>
  );
}

interface PageHeaderBarProps {
  title: string;
  count?: ReactNode;
  action?: ReactNode;
}

function PageHeaderBar({ title, count, action }: PageHeaderBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-hairline bg-background/95 backdrop-blur",
      )}
    >
      <div className="mx-auto flex max-w-4xl items-baseline gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold leading-tight tracking-tight text-text">
            {title}
          </h1>
          {count != null ? (
            <p className="mt-0.5 text-sm tabular text-text-muted">{count}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

function NotAuthorized() {
  const [, navigate] = useLocation();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-[42ch] text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
          Restricted
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
          You don't have access to this area.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Admin tools are visible only to staff accounts.
        </p>
        <button
          type="button"
          onClick={() => navigate("/discover")}
          className="mt-4 inline-flex h-9 items-center rounded-md border border-border-strong bg-transparent px-3 text-sm text-text hover:bg-surface"
        >
          Back to Collab Room
        </button>
      </div>
    </div>
  );
}
