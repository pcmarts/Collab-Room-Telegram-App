import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { ChevronLeft, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/brand";

type BottomSheetSize = "auto" | "tall" | "full";

const SIZE_CLASS: Record<BottomSheetSize, string> = {
  auto: "max-h-[90dvh]",
  tall: "h-[85dvh]",
  full: "h-[95dvh]",
};

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: BottomSheetSize;

  /** Required for accessibility. Pass a plain string or React node. Set `titleHidden` to visually hide it. */
  title: React.ReactNode;
  titleHidden?: boolean;
  /** Small uppercase label above the title. String → auto-wrapped in <Eyebrow>. Node → rendered as-is. */
  eyebrow?: React.ReactNode;
  /** Supporting line below the title. */
  subtitle?: React.ReactNode;
  /** Optional left-side back chevron handler. */
  onBack?: () => void;
  /** Optional right-side action (e.g. share button) rendered next to the close button. */
  headerAction?: React.ReactNode;
  /** If false, hides the close button and disables backdrop/swipe dismissal. */
  dismissible?: boolean;

  /** Scrollable body content. */
  children: React.ReactNode;
  /** Sticky footer region. Respects iOS safe-area-inset-bottom. */
  footer?: React.ReactNode;

  /** Forwarded to the content container. */
  contentClassName?: string;
  /** Forwarded to the scrollable body. Use to override default padding. */
  bodyClassName?: string;
}

/**
 * BottomSheet — the app-wide slide-up tray pattern. Wraps the vaul Drawer
 * primitive with brand defaults (grab handle, sticky header w/ eyebrow + title + subtitle,
 * scrollable body, safe-area-aware sticky footer). Prefer this over the centered Dialog
 * primitive for every modal on this project — mobile-native, thumb-reach, Telegram-friendly.
 */
export function BottomSheet({
  open,
  onOpenChange,
  size = "auto",
  title,
  titleHidden = false,
  eyebrow,
  subtitle,
  onBack,
  headerAction,
  dismissible = true,
  children,
  footer,
  contentClassName,
  bodyClassName,
}: BottomSheetProps) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      shouldScaleBackground
    >
      <DrawerPrimitive.Portal>
        {/*
          Overlay opacity is managed natively by vaul — on open/close it
          transitions smoothly, and during a swipe-to-dismiss drag it tracks
          the drawer's position 1:1 (fades down as you pull down, fades back
          up if you release without dismissing). Don't add CSS `animate-*`
          classes here or they'll fight vaul's inline opacity writes.

          bg-overlay reads --overlay (alpha baked in). Don't use
          bg-brand-dark/70 — Tailwind's opacity modifier silently drops the
          alpha on oklch() CSS vars, leaving the overlay invisible.
        */}
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex flex-col",
            "bg-background border-t border-border",
            "rounded-t-2xl outline-none",
            // On larger viewports the sheet caps its width and centers — still bottom-anchored.
            "sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-xl sm:w-full",
            SIZE_CLASS[size],
            contentClassName,
          )}
        >
          {/* Grab handle — pure affordance, not decoration */}
          <div
            className="flex shrink-0 justify-center pt-2 pb-1"
            aria-hidden="true"
          >
            <div className="h-1 w-10 rounded-full bg-border-strong" />
          </div>

          {/* Header */}
          <BottomSheetHeader
            eyebrow={eyebrow}
            title={title}
            titleHidden={titleHidden}
            subtitle={subtitle}
            onBack={onBack}
            headerAction={headerAction}
            dismissible={dismissible}
          />

          {/* Body */}
          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain",
              "px-5 py-5",
              bodyClassName,
            )}
          >
            <div className="mx-auto max-w-[65ch]">{children}</div>
          </div>

          {/* Footer */}
          {footer ? (
            <div
              className={cn(
                "shrink-0 border-t border-border bg-background",
                "px-5 pt-3",
                "pb-[max(12px,env(safe-area-inset-bottom))]",
              )}
            >
              {footer}
            </div>
          ) : null}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

interface BottomSheetHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  titleHidden?: boolean;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  headerAction?: React.ReactNode;
  dismissible: boolean;
}

function BottomSheetHeader({
  eyebrow,
  title,
  titleHidden,
  subtitle,
  onBack,
  headerAction,
  dismissible,
}: BottomSheetHeaderProps) {
  const hasLeft = Boolean(onBack);
  const hasRight = Boolean(headerAction) || dismissible;

  return (
    <div
      className={cn(
        "sticky top-0 z-10 shrink-0",
        "border-b border-border bg-background",
        "px-5 pt-2 pb-4",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex shrink-0 items-start", hasLeft ? "w-9" : "w-0")}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md",
                "text-text-muted transition-colors hover:bg-muted hover:text-text",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="mb-1.5">
              {typeof eyebrow === "string" ? (
                <Eyebrow>{eyebrow}</Eyebrow>
              ) : (
                eyebrow
              )}
            </div>
          ) : null}

          <DrawerPrimitive.Title
            className={cn(
              "text-xl font-extrabold leading-tight tracking-tight text-text",
              titleHidden && "sr-only",
            )}
          >
            {title}
          </DrawerPrimitive.Title>

          {subtitle ? (
            <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          ) : null}
        </div>

        <div
          className={cn(
            "flex shrink-0 items-start gap-1",
            hasRight ? "" : "w-0",
          )}
        >
          {headerAction}
          {dismissible ? (
            <DrawerPrimitive.Close
              className={cn(
                "-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md",
                "text-text-muted transition-colors hover:bg-muted hover:text-text",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DrawerPrimitive.Close>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface BottomSheetSectionProps {
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * BottomSheet.Section — a standardized section inside the scrollable body.
 * Eyebrow label on top (muted tracking-widest), content below, 4pt rhythm. No card boundaries.
 * Reach for a Card only when something like a logo+name block genuinely benefits from containment.
 */
function BottomSheetSection({
  eyebrow,
  children,
  className,
}: BottomSheetSectionProps) {
  return (
    <section className={cn("py-3 first:pt-0 last:pb-0", className)}>
      {eyebrow ? (
        <div className="mb-2">
          {typeof eyebrow === "string" ? (
            <Eyebrow>{eyebrow}</Eyebrow>
          ) : (
            eyebrow
          )}
        </div>
      ) : null}
      <div className="text-[0.9375rem] leading-snug text-text">{children}</div>
    </section>
  );
}

interface BottomSheetActionBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * BottomSheet.ActionBar — footer layout helper. Two side-by-side buttons on mobile,
 * primary always rightmost (thumb-nearest on LTR). Pass <Button> children directly.
 */
function BottomSheetActionBar({
  children,
  className,
}: BottomSheetActionBarProps) {
  return (
    <div className={cn("flex items-center gap-2 [&>*]:flex-1", className)}>
      {children}
    </div>
  );
}

BottomSheet.Section = BottomSheetSection;
BottomSheet.ActionBar = BottomSheetActionBar;

export { BottomSheetSection, BottomSheetActionBar };
