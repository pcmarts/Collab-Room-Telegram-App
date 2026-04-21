import { useLocation } from "wouter";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";

interface SignupToCollaborateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  companyLogoUrl?: string;
  collaborationType: string;
}

export function SignupToCollaborateDialog({
  open,
  onOpenChange,
  companyName,
  companyLogoUrl,
  collaborationType,
}: SignupToCollaborateDialogProps) {
  const [, setLocation] = useLocation();

  const handleSignupClick = () => {
    onOpenChange(false);
    setLocation("/welcome");
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Sign up to continue"
      title={`Connect with ${companyName}`}
      footer={
        <BottomSheet.ActionBar>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSignupClick}>Sign up</Button>
        </BottomSheet.ActionBar>
      }
    >
      <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-3">
        <LogoAvatar
          name={companyName}
          logoUrl={companyLogoUrl}
          className="h-10 w-10 shrink-0"
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{companyName}</p>
          <p className="truncate text-xs text-text-muted">{collaborationType}</p>
        </div>
      </div>
      <p className="mt-4 text-[0.9375rem] leading-relaxed text-text-muted">
        You need a Collab Room account to request this. Takes a minute.
      </p>
    </BottomSheet>
  );
}
