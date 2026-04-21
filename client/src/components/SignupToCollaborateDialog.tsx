import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { Eyebrow } from "@/components/brand";
import { useLocation } from "wouter";

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
  collaborationType
}: SignupToCollaborateDialogProps) {
  const [_, setLocation] = useLocation();

  const handleSignupClick = () => {
    onOpenChange(false);
    setLocation('/welcome');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left space-y-2">
          <Eyebrow tone="brand" dot>Sign up to request</Eyebrow>
          <DialogTitle className="text-lg font-semibold">
            Collaborate with {companyName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <LogoAvatar
            name={companyName}
            logoUrl={companyLogoUrl}
            className="w-12 h-12"
            size="md"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">{companyName}</p>
            <p className="text-xs text-text-muted truncate">{collaborationType}</p>
          </div>
        </div>

        <p className="text-sm text-text-muted">
          You need a Collab Room account to request this opportunity. It takes a minute.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleSignupClick}
            className="w-full bg-brand text-brand-fg hover:bg-brand-hover h-11"
          >
            Sign up to collaborate
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-text-muted hover:text-text h-11"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
