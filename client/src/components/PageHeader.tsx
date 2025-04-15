import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * A consistent page header component for use across all main navigation tabs.
 * This ensures pixel-perfect positioning of headers throughout the app.
 */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="px-6 py-6 flex flex-row justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}