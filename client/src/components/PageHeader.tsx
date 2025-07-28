import React from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backUrl?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * A consistent page header component for use across all main navigation tabs.
 * This ensures pixel-perfect positioning of headers throughout the app.
 */
export function PageHeader({ 
  title, 
  subtitle, 
  action, 
  backUrl = '/dashboard',
  showBackButton = false,
  onBack
}: PageHeaderProps) {
  const [_, setLocation] = useLocation();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      setLocation(backUrl);
    }
  };

  return (
    <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={handleBackClick}
            className="mr-3 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}