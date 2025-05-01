import { Button } from "@/components/ui/button";
import { GlowEffect } from "@/components/ui/glow-effect";
import { LucideIcon } from "lucide-react";

interface GlowButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactElement;
  variant?: "default" | "outline";
}

export function GlowButton({ 
  onClick, 
  className = "", 
  children, 
  icon, 
  variant = "default" 
}: GlowButtonProps) {
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
        variant={variant}
        className={`relative z-10 bg-zinc-950 text-zinc-50 hover:bg-zinc-900 flex items-center gap-2 outline outline-1 outline-[#fff2f21f] ${className}`}
      >
        {icon && icon}
        <span>{children}</span>
      </Button>
    </div>
  );
}