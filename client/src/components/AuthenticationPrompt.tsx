import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Lock, ArrowRight } from "lucide-react";

interface AuthenticationPromptProps {
  title?: string;
  message?: string;
  onSignIn?: () => void;
  compact?: boolean;
}

export function AuthenticationPrompt({
  title = "Sign up to continue",
  message = "You need to sign up through Telegram to request collaborations and access all features.",
  onSignIn,
  compact = false
}: AuthenticationPromptProps) {
  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      // Default behavior - redirect to welcome/signup page
      window.location.href = "/welcome";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground flex-1">
          Sign up to request
        </span>
        <Button size="sm" onClick={handleSignIn}>
          Sign Up
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm max-w-md">
            {message}
          </p>
        </div>

        <Button onClick={handleSignIn} className="flex items-center gap-2">
          Sign up with Telegram
          <ArrowRight className="w-4 h-4" />
        </Button>

        <div className="text-xs text-muted-foreground">
          You can browse collaborations without signing up
        </div>
      </div>
    </Card>
  );
}