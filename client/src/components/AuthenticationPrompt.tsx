import { Button } from "@/components/ui/button";
import { Logo, DisplayHeading, Eyebrow } from "@/components/brand";
import { Lock } from "lucide-react";

interface AuthenticationPromptProps {
  title?: string;
  message?: string;
  onSignIn?: () => void;
  compact?: boolean;
  pending?: boolean;
}

export function AuthenticationPrompt({
  title = "Sign up to continue",
  message = "Sign up through Telegram to request collaborations and unlock the full marketplace.",
  onSignIn,
  compact = false,
  pending = false
}: AuthenticationPromptProps) {
  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      window.location.href = "/welcome";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-md border border-hairline bg-surface">
        <Lock className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-muted flex-1">
          {pending ? "Application pending" : "Sign up to request"}
        </span>
        {!pending && (
          <Button
            size="sm"
            onClick={handleSignIn}
            className="bg-brand text-brand-fg hover:bg-brand-hover"
          >
            Sign up
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="px-6 pt-8">
        <Logo size={48} variant="dark" withWordmark />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md flex flex-col items-start gap-6">
          <Eyebrow tone="brand" dot>Members only</Eyebrow>
          <DisplayHeading size="xl" accent="to collaborate.">
            {title.replace(/\.$/, "") || "Sign up"}
          </DisplayHeading>
          <p className="text-text-muted text-base">
            {message}
          </p>

          <Button
            onClick={handleSignIn}
            className="bg-brand text-brand-fg hover:bg-brand-hover h-11 px-5"
          >
            Sign up with Telegram
          </Button>

          <p className="text-xs text-text-subtle">
            You can browse the marketplace without signing up.
          </p>
        </div>
      </main>
    </div>
  );
}
