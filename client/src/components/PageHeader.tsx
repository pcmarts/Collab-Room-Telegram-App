import React from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backUrl?: string;
  showBackButton?: boolean;
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
  showBackButton = false
}: PageHeaderProps) {
  const [_, setLocation] = useLocation();

  return (
    <div className="px-6 py-6 flex flex-row justify-between items-center border-b">
      <div className="flex items-center">
        {showBackButton && (
          <button 
            onClick={() => setLocation(backUrl)}
            className="mr-3 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
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