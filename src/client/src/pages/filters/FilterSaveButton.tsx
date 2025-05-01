import { useState } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { SaveIcon, Loader2 } from "lucide-react";

interface FilterSaveButtonProps {
  formValues: any;
  returnUrl?: string;
}

export function FilterSaveButton({ formValues, returnUrl = "/filters" }: FilterSaveButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const savePreferences = async () => {
    try {
      setLoading(true);
      
      // Send data to API
      await apiRequest('/api/marketing-preferences', 'POST', formValues);
      
      // Invalidate cache to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/marketing-preferences'] });
      
      toast({
        title: "Preferences saved",
        description: "Your discovery filters have been updated"
      });
      
      // Navigate back to filters dashboard after a short delay
      setTimeout(() => {
        navigate(returnUrl);
      }, 500);
    } catch (error) {
      console.error("Error saving preferences:", error);
      
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-background border-t p-4 flex justify-center">
      <Button 
        onClick={savePreferences} 
        disabled={loading} 
        className="w-full max-w-md"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <SaveIcon className="mr-2 h-4 w-4" />
            Save Preferences
          </>
        )}
      </Button>
    </div>
  );
}