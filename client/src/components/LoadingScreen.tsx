import { useState, useEffect } from "react";
import { Logo } from "@/components/brand";

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  // Smooth deterministic ramp up to 90% — never reach 100% until app actually mounts.
  useEffect(() => {
    const startValue = Math.floor(Math.random() * 20) + 10;
    setProgress(startValue);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.max(1, 10 - Math.floor(prev / 10));
        return Math.min(90, prev + increment);
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="animate-fadeIn flex w-full max-w-xs flex-col items-center gap-6 px-8">
        <div className="relative">
          <span
            className="absolute inset-0 -m-1 rounded-lg bg-brand opacity-20"
            style={{ animation: "ping 1.6s var(--ease-out) infinite" }}
            aria-hidden="true"
          />
          <Logo size={48} />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="font-semibold tracking-tight text-text">
            The Collab Room
          </span>
          <span className="eyebrow">Loading workspace</span>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-hairline">
          <div
            className="h-full bg-brand transition-[width] duration-base ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
