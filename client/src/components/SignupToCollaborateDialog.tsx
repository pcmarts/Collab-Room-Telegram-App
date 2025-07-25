import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";
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
        <DialogHeader>
          <DialogTitle className="text-center">Sign up to collaborate</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Company Logo */}
          <LogoAvatar 
            name={companyName}
            logoUrl={companyLogoUrl} 
            className="w-16 h-16"
            size="lg"
          />
          
          {/* Company Info */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{companyName}</h3>
            <p className="text-sm text-muted-foreground">
              {collaborationType}
            </p>
          </div>
          
          {/* Message */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              To request this collaboration, you need to sign up first.
            </p>
            
            <Button 
              onClick={handleSignupClick}
              className="w-full"
              size="lg"
            >
              Signup to collaborate with {companyName}
            </Button>
          </div>
          
          {/* Cancel option */}
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-sm text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}