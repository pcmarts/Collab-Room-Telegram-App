import { type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusTone = "brand" | "success" | "muted" | "warm" | "destructive";

interface StatusDot {
  tone: StatusTone;
  label: string;
}

interface AdminListRowProps {
  /** Left identity slot — typically a <LogoAvatar />. */
  avatar?: ReactNode;
  /** Primary identity line — name, company, whatever leads the row. */
  title: ReactNode;
  /** Secondary identity — @handle, job title, company name. */
  subtitle?: ReactNode;
  /** Tertiary metadata — "applied 2h ago", "joined Jan 12". Muted + tabular. */
  meta?: ReactNode;
  /** Small dot-labelled status shown inline with meta. Omit for no indicator. */
  status?: StatusDot;
  /** Right-aligned action slot — typically a ghost Button or compact row of text buttons. */
  actions?: ReactNode;
  /** Makes the whole row clickable (keyboard-accessible). */
  onClick?: () => void;
}

const DOT_CLASS: Record<StatusTone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  muted: "bg-text-subtle",
  warm: "bg-warm-accent",
  destructive: "bg-destructive",
};

/**
 * AdminListRow — dense text row, the atomic unit across admin lists.
 * Avatar-left (optional), identity-middle, actions-right. 56px tall.
 * Hairline divider beneath is owned by the consumer (e.g. on the list container)
 * — keeps rows lightweight and prevents divider-on-last-row cases.
 */
export function AdminListRow({
  avatar,
  title,
  subtitle,
  meta,
  status,
  actions,
  onClick,
}: AdminListRowProps) {
  const interactive = Boolean(onClick);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex items-center gap-3 px-2 py-3",
        "border-b border-hairline last:border-b-0",
        interactive &&
          "cursor-pointer rounded-sm transition-colors duration-fast ease-out hover:bg-surface focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {avatar ? <div className="shrink-0">{avatar}</div> : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-[0.9375rem] font-medium leading-tight text-text">
            {title}
          </p>
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-text-muted">{subtitle}</p>
        ) : null}
        {(meta || status) && (
          <div className="mt-0.5 flex items-center gap-2 text-xs tabular text-text-subtle">
            {status ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn("inline-block h-1.5 w-1.5 rounded-full", DOT_CLASS[status.tone])}
                />
                <span>{status.label}</span>
              </span>
            ) : null}
            {meta && status ? (
              <span aria-hidden="true" className="text-text-subtle/60">
                ·
              </span>
            ) : null}
            {meta ? <span className="truncate">{meta}</span> : null}
          </div>
        )}
      </div>

      {actions ? (
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
