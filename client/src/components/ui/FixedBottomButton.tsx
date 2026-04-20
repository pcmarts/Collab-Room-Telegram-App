import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/haptics";

interface FixedBottomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary";
}

export function FixedBottomButton({
  text,
  isLoading = false,
  loadingText = "Loading...",
  variant = "primary",
  className,
  onClick,
  ...props
}: FixedBottomButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHapticFeedback("light");
    onClick?.(e);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-background px-4 pt-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <button
        {...props}
        onClick={handleClick}
        disabled={isLoading || props.disabled}
        className={cn(
          "flex w-full h-12 items-center justify-center gap-2 rounded-md",
          "text-base font-medium tracking-[-0.005em] select-none",
          "transition-[background-color,transform,opacity] duration-fast ease-out",
          "active:translate-y-px",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-40",
          variant === "primary"
            ? "bg-brand text-brand-fg hover:bg-brand-hover"
            : "bg-surface text-text border border-hairline hover:bg-accent",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          text
        )}
      </button>
    </div>
  );
}
