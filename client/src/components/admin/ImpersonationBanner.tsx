import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function ImpersonationBanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isImpersonating, setIsImpersonating] = useState(false);
  
  useEffect(() => {
    // Check if we're impersonating by looking at session
    const checkImpersonation = async () => {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        setIsImpersonating(!!data.impersonating);
      } catch (error) {
        console.error('Error checking impersonation status:', error);
      }
    };
    
    checkImpersonation();
  }, []);

  const handleStopImpersonation = async () => {
    try {
      await apiRequest('/api/admin/stop-impersonation', {
        method: 'POST'
      });

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
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 z-50 flex justify-between items-center">
      <span className="font-semibold">⚠️ Impersonation Mode Active</span>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleStopImpersonation}
      >
        Return to Admin
      </Button>
    </div>
  );
}
