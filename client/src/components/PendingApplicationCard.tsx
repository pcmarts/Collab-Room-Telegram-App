import { formatDistanceToNow } from "date-fns";
import { LogoAvatar } from "@/components/ui/logo-avatar";

interface PendingApplicationCardProps {
  userFirstName?: string;
  companyName?: string;
  companyLogoUrl?: string;
  submissionDate?: string;
}

export function PendingApplicationCard({
  userFirstName,
  companyName,
  companyLogoUrl,
  submissionDate,
}: PendingApplicationCardProps) {
  const submittedAgo = (() => {
    if (!submissionDate) return null;
    try {
      return formatDistanceToNow(new Date(submissionDate), { addSuffix: true });
    } catch {
      return null;
    }
  })();

  return (
    <div className="flex items-center gap-3 py-4 px-4 -mx-4 border-y border-hairline bg-surface">
      <LogoAvatar
        name={companyName || userFirstName || "Pending"}
        logoUrl={companyLogoUrl}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate text-md font-semibold text-text">
            {companyName || userFirstName || "Application under review"}
          </h3>
          <span className="shrink-0 text-xs font-medium tabular text-text-muted">
            In review
          </span>
        </div>
        <p className="mt-0.5 text-sm text-text-muted">
          {userFirstName ? `${userFirstName} · ` : ""}We'll unlock posting once
          your profile is approved.
          {submittedAgo ? ` Submitted ${submittedAgo}.` : ""}
        </p>
      </div>
    </div>
  );
}
