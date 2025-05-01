import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
}

export function PageHeader({ title, subtitle, backUrl = '/dashboard' }: PageHeaderProps) {
  const [_, setLocation] = useLocation();

  return (
    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
      <div className="flex items-center">
        <button 
          onClick={() => setLocation(backUrl)}
          className="mr-2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}