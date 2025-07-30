import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Sparkles } from "lucide-react";

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
  title = "Sign Up Required",
  description = "To post a collab for others to join, please sign up."
}: SignupPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button onClick={onSignup} className="w-full">
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}