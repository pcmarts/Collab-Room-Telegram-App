import React from "react";
import { Card } from "@/components/ui/card";
import "./glowing-border.css";

interface GlowingBorderCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Allow custom glow color
}

export function GlowingBorderCard({ 
  children, 
  className = "", 
  glowColor = "var(--primary)"
}: GlowingBorderCardProps) {
  return (
    <div className={`glow-card-container ${className}`} style={{ "--glow-color": glowColor } as React.CSSProperties}>
      <Card className="glow-card w-full h-full">
        {children}
      </Card>
    </div>
  );
}