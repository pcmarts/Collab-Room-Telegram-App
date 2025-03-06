import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { COLLAB_TYPES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

export default function MyCollabsForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  // Check if we're in edit mode
  const isEditMode = window.location.search.includes('edit=true');

  // Fetch existing data if in edit mode
  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    enabled: isEditMode
  });

  const [formData, setFormData] = useState({
    collabs_to_host: [] as string[]
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (isEditMode && profileData?.preferences) {
      setFormData({
        collabs_to_host: profileData.preferences.collabs_to_host || []
      });
    } else {
      const savedData = sessionStorage.getItem('collabsFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [isEditMode, profileData]);

  const handleMultiSelect = (collab: string) => {
    const current = formData.collabs_to_host;
    const updated = current.includes(collab)
      ? current.filter(item => item !== collab)
      : [...current, collab];

    const newFormData = {
      ...formData,
      collabs_to_host: updated
    };
    setFormData(newFormData);
    if (!isEditMode) {
      sessionStorage.setItem('collabsFormData', JSON.stringify(newFormData));
    }
  };

  const handleNext = () => {
    if (formData.collabs_to_host.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one collaboration type to host",
        duration: 2000
      });
      return;
    }

    // Store the form data in session storage
    sessionStorage.setItem('collabsFormData', JSON.stringify(formData));

    // Navigate to next step
    setLocation('/collab-preferences');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      try {
        setIsSubmitting(true);

        const response = await apiRequest('POST', '/api/preferences', {
          ...profileData?.preferences,
          collabs_to_host: formData.collabs_to_host
        });

        if (!response.ok) {
          throw new Error('Failed to update collaborations');
        }

        toast({
          title: "Success!",
          description: "Your collaboration offerings have been updated",
          duration: 2000
        });

        setLocation('/dashboard');

      } catch (error) {
        console.error('Failed to update my collabs:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update collaborations"
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      handleNext();
    }
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center -ml-3"
            onClick={() => setLocation(isEditMode ? '/dashboard' : '/company-info')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <h1 className="text-lg font-semibold">My Collaborations</h1>
          <div className="w-12" /> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!isEditMode && (
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label className="text-lg">Collaborations to Host</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select the types of collaborations your company can offer
            </p>
            <div className="grid grid-cols-1 gap-2">
              {COLLAB_TYPES.map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.collabs_to_host.includes(type) ? "default" : "outline"}
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleMultiSelect(type)}
                >
                  <span className="text-left">{type}</span>
                </Button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Submitting...' : 'Saving...'}
              </>
            ) : (
              isEditMode ? "Submit" : "Continue to Discovery"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}