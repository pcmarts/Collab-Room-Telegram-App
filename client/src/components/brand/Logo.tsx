import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  /** When true, renders the navy "brand-dark" tile (used on cream surfaces, headers) instead of the blue tile. Default false = blue tile. */
  variant?: "blue" | "dark";
}

/**
 * Brand mark — two stacked rounded squares on a tinted tile.
 * Mirrors the logo on collabroom.xyz so the Telegram surface reads as the same product.
 */
export function Logo({
  size = 28,
  className,
  withWordmark = false,
  variant = "blue",
}: LogoProps) {
  const tileBg = variant === "dark" ? "bg-brand-dark" : "bg-brand";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md shadow-sm",
          tileBg,
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width="60%"
          height="60%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="5"
            y="5"
            width="9"
            height="9"
            rx="2"
            stroke="white"
            strokeWidth="2"
            opacity="0.9"
          />
          <rect
            x="10"
            y="10"
            width="9"
            height="9"
            rx="2"
            fill="white"
            fillOpacity="0.3"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>
      {withWordmark && (
        <span className="font-semibold tracking-tight text-text">
          The Collab Room
        </span>
      )}
    </div>
  );
}
