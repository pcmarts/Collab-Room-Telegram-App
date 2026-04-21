import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

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
  description = "To post a collab for others to join, sign up first.",
}: SignupPromptDialogProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Members only"
      title={title}
      footer={
        <BottomSheet.ActionBar>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Later
          </Button>
          <Button onClick={onSignup}>Sign up</Button>
        </BottomSheet.ActionBar>
      }
    >
      <p className="text-[0.9375rem] leading-relaxed text-text-muted">
        {description}
      </p>
    </BottomSheet>
  );
}
