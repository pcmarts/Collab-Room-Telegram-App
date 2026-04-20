import { useState } from "react";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { SignupToCollaborateDialog } from "@/components/SignupToCollaborateDialog";

interface CollaborationListItemProps {
  collaboration: {
    id: string;
    title?: string;
    type?: string;
    collab_type?: string;
    creator_company_name?: string;
    company_logo_url?: string;
    short_description?: string;
    description?: string;
    topics?: string[];
    creator_id?: string;
  };
  isAuthenticated: boolean;
  onViewDetails: () => void;
  onRequestCollaboration?: () => void;
  isPotentialMatch?: boolean;
  collaborationStatus?: "pending" | "matched";
  onNavigateToMatches?: () => void;
  currentUserId?: string;
  isApplicationPending?: boolean;
}

type StatusKind = "own" | "pending" | "matched" | "incoming" | null;

function StatusLabel({ kind }: { kind: StatusKind }) {
  if (!kind) return null;

  const map: Record<Exclude<StatusKind, null>, { text: string; className: string }> = {
    own: { text: "Yours", className: "text-text-subtle" },
    pending: { text: "Requested", className: "text-text-muted" },
    matched: { text: "Matched", className: "text-brand" },
    incoming: { text: "Incoming", className: "text-brand" },
  };

  const { text, className } = map[kind];
  return (
    <span className={`shrink-0 text-xs font-medium tabular ${className}`}>
      {text}
    </span>
  );
}

export function CollaborationListItem({
  collaboration,
  isAuthenticated,
  onViewDetails,
  isPotentialMatch = false,
  collaborationStatus,
  currentUserId,
}: CollaborationListItemProps) {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  const collabType =
    collaboration.type || collaboration.collab_type || "Collaboration";
  const description =
    collaboration.short_description || collaboration.description;
  const isOwnCollaboration =
    isAuthenticated && currentUserId && collaboration.creator_id === currentUserId;

  const status: StatusKind = isOwnCollaboration
    ? "own"
    : isPotentialMatch
    ? "incoming"
    : collaborationStatus === "matched"
    ? "matched"
    : collaborationStatus === "pending"
    ? "pending"
    : null;

  const handleClick = () => {
    if (isAuthenticated) onViewDetails();
    else setShowSignupDialog(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="group w-full text-left flex items-start gap-3 py-4 px-4 -mx-4 border-b border-hairline active:bg-surface transition-colors duration-fast ease-out"
      >
        <LogoAvatar
          name={collaboration.creator_company_name || "Company"}
          logoUrl={collaboration.company_logo_url}
          size="md"
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-md font-semibold text-text">
              {collaboration.creator_company_name || "Unknown Company"}
            </h3>
            <StatusLabel kind={status} />
          </div>

          <p className="mt-0.5 truncate text-sm text-text-muted">
            Looking for <span className="text-text">{collabType}</span>
          </p>

          {description && (
            <p className="mt-2 text-sm text-text-subtle line-clamp-2 leading-snug">
              {description}
            </p>
          )}
        </div>
      </button>

      <SignupToCollaborateDialog
        open={showSignupDialog}
        onOpenChange={setShowSignupDialog}
        companyName={collaboration.creator_company_name || "Unknown Company"}
        companyLogoUrl={collaboration.company_logo_url}
        collaborationType={collabType}
      />
    </>
  );
}
