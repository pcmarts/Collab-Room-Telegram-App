import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/brand";

interface SignupPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignup: () => void;
  title?: string;
  description?: string;
}

export function SignupPromptDialog({
  open,
  onOpenChange,
  onSignup,
  title = "Sign up required",
  description = "To post a collab for others to join, sign up first."
}: SignupPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left space-y-2">
          <Eyebrow tone="brand" dot>Members only</Eyebrow>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-text-muted">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onSignup}
            className="w-full bg-brand text-brand-fg hover:bg-brand-hover h-11"
          >
            Sign up
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-text-muted hover:text-text h-11"
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
