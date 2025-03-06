import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { COLLAB_TYPES } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MarketingCollabs() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch existing data
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    collabs_to_host: [] as string[],
    collabs_to_discover: [] as string[]
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (profileData?.preferences) {
      setFormData({
        collabs_to_host: profileData.preferences.collabs_to_host || [],
        collabs_to_discover: profileData.preferences.collabs_to_discover || []
      });
    }
  }, [profileData]);

  const handleMultiSelect = (type: 'host' | 'discover', collab: string) => {
    setFormData(prev => ({
      ...prev,
      [type === 'host' ? 'collabs_to_host' : 'collabs_to_discover']: 
        prev[type === 'host' ? 'collabs_to_host' : 'collabs_to_discover'].includes(collab)
          ? prev[type === 'host' ? 'collabs_to_host' : 'collabs_to_discover'].filter(item => item !== collab)
          : [...prev[type === 'host' ? 'collabs_to_host' : 'collabs_to_discover'], collab]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (formData.collabs_to_host.length === 0 && formData.collabs_to_discover.length === 0) {
        throw new Error("Please select at least one type of collaboration");
      }

      const submitData = {
        ...profileData?.preferences,
        collabs_to_host: formData.collabs_to_host,
        collabs_to_discover: formData.collabs_to_discover
      };

      const response = await apiRequest('POST', '/api/preferences', submitData);

      if (!response.ok) {
        throw new Error('Failed to update collaborations');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Success!",
        description: "Your collaboration preferences have been updated",
        duration: 2000
      });

      setLocation('/dashboard');

    } catch (error) {
      console.error('Failed to update collaborations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update collaborations"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center -ml-3"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <h1 className="text-lg font-semibold">Marketing Collabs</h1>
          <div className="w-12" /> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="hosting" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hosting" className="text-sm">I'm Hosting</TabsTrigger>
            <TabsTrigger value="discovering" className="text-sm">I'm Looking For</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-8 mt-4">
            <TabsContent value="hosting" className="space-y-4">
              <div>
                <Label className="text-lg">Collaborations I Can Host</Label>
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
                      onClick={() => handleMultiSelect('host', type)}
                    >
                      <span className="text-left">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="discovering" className="space-y-4">
              <div>
                <Label className="text-lg">Collaborations I'm Looking For</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the types of collaborations you'd like to discover
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {COLLAB_TYPES.map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={formData.collabs_to_discover.includes(type) ? "default" : "outline"}
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => handleMultiSelect('discover', type)}
                    >
                      <span className="text-left">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </form>
        </Tabs>
      </div>
    </div>
  );
}
