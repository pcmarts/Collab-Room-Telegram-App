import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  /** Optional dot prefix — used on "live" labels (Live Marketplace pattern from collabroom.xyz). */
  dot?: boolean;
  /** Visual treatment. `default` = naked label, `pill` = tinted background pill. */
  variant?: "default" | "pill" | "warm";
  /** Color emphasis. */
  tone?: "muted" | "brand" | "warm" | "success";
  className?: string;
  as?: "span" | "div" | "p";
}

/**
 * Eyebrow — the 10–11px uppercase tracking-widest label used across collabroom.xyz
 * for section labels, status pips ("LIVE MARKETPLACE"), and metadata ("FOUNDER").
 *
 * Pair sparingly: one eyebrow per section is plenty.
 */
export function Eyebrow({
  children,
  dot = false,
  variant = "default",
  tone = "muted",
  className,
  as: Tag = "span",
}: EyebrowProps) {
  const toneClass = {
    muted: "text-text-muted",
    brand: "text-brand",
    warm: "text-warm-accent",
    success: "text-success",
  }[tone];

  const dotClass = {
    muted: "bg-text-muted",
    brand: "bg-brand",
    warm: "bg-warm-accent",
    success: "bg-success",
  }[tone];

  const variantClass =
    variant === "pill"
      ? "inline-flex items-center gap-1.5 rounded-md border border-brand/20 bg-brand-subtle px-2.5 py-1"
      : variant === "warm"
      ? "inline-flex items-center gap-1.5 rounded-md border border-warm-accent/20 bg-warm-surface px-2.5 py-1"
      : "inline-flex items-center gap-1.5";

  return (
    <Tag className={cn("eyebrow", variantClass, toneClass, className)}>
      {dot && (
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
            dotClass,
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </Tag>
  );
}
