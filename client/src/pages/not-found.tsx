import { Logo, DisplayHeading, Eyebrow } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="px-6 pt-8">
        <Logo size={48} variant="dark" withWordmark />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md flex flex-col items-start gap-6">
          <Eyebrow tone="muted">Error 404</Eyebrow>
          <DisplayHeading size="xl" accent="not found.">
            This page is
          </DisplayHeading>
          <p className="text-text-muted text-base">
            The route you're looking for doesn't exist. Head back to the marketplace.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-brand text-brand-fg hover:bg-brand-hover h-11 px-5"
          >
            Back to marketplace
          </Button>
        </div>
      </main>
    </div>
  );
}
