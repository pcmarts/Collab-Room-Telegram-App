import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Crown, X } from 'lucide-react';

export function ImpersonationBanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<{
    first_name: string;
    last_name?: string;
    company_name?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    // Check if we're impersonating by looking at session
    const checkImpersonation = async () => {
      try {
        console.log('Checking impersonation status...');
        const response = await fetch('/api/profile');
        const data = await response.json();
        console.log('Profile data:', data);

        setIsImpersonating(!!data.impersonating);
        if (data.impersonating) {
          setImpersonatedUser({
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            company_name: data.company?.name,
            role: data.company?.job_title
          });
        }
      } catch (error) {
        console.error('Error checking impersonation status:', error);
      }
    };

    checkImpersonation();
  }, []);

  const handleStopImpersonation = async () => {
    try {
      const response = await fetch('/api/admin/stop-impersonation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to stop impersonation');
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Impersonation Ended",
        description: "Returned to admin account"
      });

      // Redirect to admin page
      setLocation('/admin/users');
    } catch (error) {
      console.error('Error ending impersonation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end impersonation"
      });
    }
  };

  if (!isImpersonating) {
    console.log('Not impersonating, hiding banner');
    return null;
  }

  console.log('Rendering impersonation banner with user:', impersonatedUser);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warm-surface-strong text-warm-accent border-b border-warm-accent/30 py-2.5 px-4">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Crown className="h-4 w-4 shrink-0" />
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-eyebrow font-semibold shrink-0">
              Admin
            </span>
            <span className="text-sm font-medium truncate text-text">
              Viewing as {impersonatedUser?.first_name} {impersonatedUser?.last_name}
              {impersonatedUser?.company_name && (
                <span className="text-text-muted">
                  {" "}— {impersonatedUser.company_name}
                  {impersonatedUser.role ? ` • ${impersonatedUser.role}` : ""}
                </span>
              )}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonation}
          className="border-warm-accent/40 text-warm-accent hover:bg-warm-surface bg-transparent shrink-0 h-8"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Exit
        </Button>
      </div>
    </div>
  );
}