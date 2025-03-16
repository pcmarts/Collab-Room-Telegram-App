import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
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
        const response = await fetch('/api/profile');
        const data = await response.json();
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

  if (!isImpersonating) return null;

  return (
    <div className="sticky top-0 z-50 bg-yellow-500 text-black py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          <div>
            <span className="font-semibold">
              Viewing as: {impersonatedUser?.first_name} {impersonatedUser?.last_name}
            </span>
            {impersonatedUser?.company_name && (
              <span className="text-sm block">
                {impersonatedUser.company_name} • {impersonatedUser.role}
              </span>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleStopImpersonation}
          className="bg-white hover:bg-white/90"
        >
          <X className="h-4 w-4 mr-2" />
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
}