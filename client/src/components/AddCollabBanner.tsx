import { Button } from "@/components/ui/button";
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
  className = "",
}: AddCollabBannerProps) {
  const [, setLocation] = useLocation();

  if (isAuthenticated && !isApproved) return null;

  const approved = isAuthenticated && isApproved;

  return (
    <div
      className={`flex items-center justify-between gap-4 py-5 px-4 -mx-4 border-y border-hairline ${className}`}
    >
      <div className="min-w-0">
        <h3 className="text-md font-semibold text-text">
          {approved ? "Post a collab" : "Post your own collab"}
        </h3>
        <p className="mt-0.5 text-sm text-text-muted">
          {approved
            ? "Share what you're looking for — inbound requests in hours, not weeks."
            : "Sign up to list what you're looking for."}
        </p>
      </div>
      <Button
        size="sm"
        variant={approved ? "default" : "secondary"}
        onClick={() =>
          approved ? setLocation("/create-collaboration-v2") : onSignIn?.()
        }
      >
        {approved ? "Post" : "Sign up"}
      </Button>
    </div>
  );
}
