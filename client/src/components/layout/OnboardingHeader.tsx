import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Progress } from "@/components/ui/progress";

interface OnboardingHeaderProps {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  backUrl: string;
}

export function OnboardingHeader({ 
  title, 
  subtitle, 
  step, 
  totalSteps,
  backUrl 
}: OnboardingHeaderProps) {
  const [_, setLocation] = useLocation();
  const progress = (step / totalSteps) * 100;

  return (
    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10">
      {/* Progress bar */}
      <Progress value={progress} className="h-1 rounded-none" />
      
      {/* Header content */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLocation(backUrl)}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-medium leading-none">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </div>
        </div>
      </div>
    </div>
  );
}
