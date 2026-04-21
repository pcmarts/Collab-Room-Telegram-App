import { Link, useLocation } from "wouter";

import { cn } from "@/lib/utils";

interface AdminTabsProps {
  counts?: {
    applications?: number;
    users?: number;
    referrals?: number;
  };
}

interface Tab {
  id: "applications" | "users" | "referrals";
  label: string;
  href: string;
  match: RegExp;
}

const TABS: Tab[] = [
  {
    id: "applications",
    label: "Applications",
    href: "/admin/applications",
    match: /^\/admin\/applications/,
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    match: /^\/admin\/users/,
  },
  {
    id: "referrals",
    label: "Referrals",
    href: "/admin/referrals",
    match: /^\/admin\/referrals/,
  },
];

/**
 * AdminTabs — the typographic tab strip under the page header. Sticky below
 * the header so tabs stay one-tap accessible as the page scrolls. Counts are
 * rendered inline as small muted numerals — only shown when a value is passed.
 */
export function AdminTabs({ counts }: AdminTabsProps) {
  const [location] = useLocation();

  return (
    <nav
      className={cn(
        "sticky top-[calc(env(safe-area-inset-top,0)+61px)] z-10",
        "border-b border-hairline bg-background/95 backdrop-blur",
      )}
      aria-label="Admin sections"
    >
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-2 py-1">
        {TABS.map((tab) => {
          const active = tab.match.test(location);
          const count = counts?.[tab.id];
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
                "transition-colors duration-fast ease-out",
                active
                  ? "text-text"
                  : "text-text-muted hover:bg-surface hover:text-text",
              )}
            >
              <span>{tab.label}</span>
              {typeof count === "number" && count > 0 ? (
                <span
                  className={cn(
                    "min-w-[1.25rem] rounded-sm px-1 text-center text-xs tabular leading-[1.25rem]",
                    active
                      ? "bg-brand text-brand-fg"
                      : "bg-surface text-text-muted",
                  )}
                >
                  {count}
                </span>
              ) : null}
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-text"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
