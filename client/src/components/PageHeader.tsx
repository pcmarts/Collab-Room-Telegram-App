import React from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backUrl?: string;
  showBackButton?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  action,
  backUrl,
  showBackButton = false,
}: PageHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (backUrl) {
      setLocation(backUrl);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/discover");
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-hairline bg-background px-4 py-3">
      {showBackButton && (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-sm text-text-muted transition-colors duration-fast ease-out hover:bg-surface hover:text-text active:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight text-text">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}
