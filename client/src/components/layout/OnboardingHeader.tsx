import { ChevronLeft, X } from "lucide-react";
import { useLocation } from "wouter";

interface OnboardingHeaderProps {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  backUrl: string;
}

export function OnboardingHeader({
  title,
  subtitle,
  step,
  totalSteps,
  backUrl,
}: OnboardingHeaderProps) {
  const [, setLocation] = useLocation();
  const showsProgress = totalSteps > 0;
  const pct = showsProgress ? Math.max(0, Math.min(100, (step / totalSteps) * 100)) : 0;

  const isDismiss = backUrl === "/discover" || step <= 1;
  const BackIcon = isDismiss ? X : ChevronLeft;

  return (
    <header className="sticky top-0 z-10 bg-background">
      {showsProgress && (
        <div className="h-0.5 w-full bg-hairline">
          <div
            className="h-full bg-brand transition-[width] duration-base ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <button
          type="button"
          onClick={() => setLocation(backUrl)}
          aria-label={isDismiss ? "Close" : "Back"}
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-sm text-text-muted transition-colors duration-fast ease-out hover:bg-surface hover:text-text active:bg-accent"
        >
          <BackIcon className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight text-text">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-text-muted">{subtitle}</p>
          )}
        </div>

        {showsProgress && (
          <span className="shrink-0 text-xs font-medium tabular text-text-subtle">
            {step}/{totalSteps}
          </span>
        )}
      </div>
    </header>
  );
}
