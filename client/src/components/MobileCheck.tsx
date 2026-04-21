import { useEffect, useState } from "react";
import { Logo, DisplayHeading, Eyebrow } from "@/components/brand";

interface MobileCheckProps {
  children: React.ReactNode;
}

export function MobileCheck({ children }: MobileCheckProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.matchMedia("(max-width: 768px) and (pointer: coarse)").matches;
      setIsMobile(isMobileDevice);
      setChecked(true);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!checked) {
    return null;
  }

  // Allow all devices to access the app
  return <>{children}</>;
}

/**
 * Branded desktop-block surface. Not currently routed (MobileCheck allows all
 * devices) but kept here so the edge-state visual is ready when the gate
 * is enabled.
 */
export function DesktopBlockedScreen() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="px-6 pt-8">
        <Logo size={48} variant="dark" withWordmark />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md flex flex-col items-start gap-6">
          <Eyebrow variant="warm" tone="warm">Open on mobile</Eyebrow>
          <DisplayHeading size="xl" accent="on your phone.">
            This works best
          </DisplayHeading>
          <p className="text-text-muted text-base">
            The Collab Room runs inside Telegram. Open the CollabRoom bot on your phone and tap Discover to get started.
          </p>
        </div>
      </main>
    </div>
  );
}
