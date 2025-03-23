import { Button } from "@/components/ui/button";
import { SlidersVertical } from "lucide-react";
import { GlowEffect } from "@/components/ui/glow-effect";

interface GlowFilterButtonProps {
  onClick: () => void;
  className?: string;
}

export function GlowFilterButton({ onClick, className = "" }: GlowFilterButtonProps) {
  return (
    <div className="relative inline-flex">
      <GlowEffect
        colors={['#FF5733', '#33FF57', '#3357FF', '#F1C40F']}
        mode="colorShift"
        blur="soft"
        duration={3}
        scale={0.9}
      />
      <Button 
        onClick={onClick}
        className={`relative z-10 bg-zinc-950 text-zinc-50 hover:bg-zinc-900 flex items-center gap-2 outline outline-1 outline-[#fff2f21f] ${className}`}
      >
        <SlidersVertical className="h-5 w-5" />
        <span>Filters</span>
      </Button>
    </div>
  );
}