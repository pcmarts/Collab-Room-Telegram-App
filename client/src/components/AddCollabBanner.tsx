import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

interface AddCollabBannerProps {
  isAuthenticated: boolean;
  isApproved: boolean;
  onSignIn?: () => void;
  className?: string;
}

export function AddCollabBanner({ 
  isAuthenticated, 
  isApproved, 
  onSignIn, 
  className = "" 
}: AddCollabBannerProps) {
  const [, setLocation] = useLocation();

  // If user is authenticated but not approved, don't show the banner
  if (isAuthenticated && !isApproved) {
    return null;
  }

  const handleAddCollab = () => {
    setLocation('/create-collaboration-v2');
  };

  const handleSignUp = () => {
    if (onSignIn) {
      onSignIn();
    }
  };

  return (
    <Card className={`border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors ${className}`}>
      <div className="px-4 py-6 text-center">
        {isAuthenticated && isApproved ? (
          // Signed in and approved user
          <div className="space-y-3">
            <div className="flex items-center justify-center mb-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Plus className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Add your collab
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Share your collaboration opportunity with the community
              </p>
              <Button 
                onClick={handleAddCollab}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your Collab
              </Button>
            </div>
          </div>
        ) : (
          // Non-signed in user
          <div className="space-y-3">
            <div className="flex items-center justify-center mb-2">
              <div className="rounded-full bg-primary/10 p-2">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Sign up to add your collab here
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Join the community and share your collaboration opportunities
              </p>
              <Button 
                onClick={handleSignUp}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}