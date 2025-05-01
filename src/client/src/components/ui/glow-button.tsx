import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface GlowButtonProps {
  onClick: () => void;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  glowColor?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlowButton({
  onClick,
  className,
  children,
  icon,
  variant = "default",
  size = "default",
  disabled = false,
  type = "button",
  glowColor = "rgba(var(--primary-rgb), 0.5)",
  intensity = "medium"
}: GlowButtonProps) {
  // Determine glow intensity
  const glowIntensity = {
    low: "shadow-[0_0_15px_-3px_var(--glow-color)]",
    medium: "shadow-[0_0_20px_-1px_var(--glow-color)]",
    high: "shadow-[0_0_25px_var(--glow-color)]"
  }[intensity];
  
  // Check if variant is default to apply the glow effect
  const shouldGlow = variant === "default";
  
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        // Base styles
        "relative overflow-hidden transition-all duration-300",
        // Apply glow conditionally
        shouldGlow && glowIntensity,
        // Allow custom styles to override
        className
      )}
      style={
        shouldGlow
          ? {
              "--glow-color": glowColor
            } as React.CSSProperties
          : undefined
      }
    >
      {/* Optional icon */}
      {icon && <span className="mr-2">{icon}</span>}
      
      {/* Button content */}
      {children}
      
      {/* Subtle shine effect on hover */}
      <span className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Button>
  );
}