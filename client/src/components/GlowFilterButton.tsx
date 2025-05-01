import { SlidersVertical } from "lucide-react";
import { GlowButton } from "./GlowButton";

interface GlowFilterButtonProps {
  onClick: () => void;
  className?: string;
}

export function GlowFilterButton({ onClick, className = "" }: GlowFilterButtonProps) {
  return (
    <GlowButton
      onClick={onClick}
      className={className}
      icon={<SlidersVertical className="h-5 w-5" />}
    >
      Filters
    </GlowButton>
  );
}