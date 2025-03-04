import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLLAB_TYPES, NOTIFICATION_FREQUENCIES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

export default function PreferencesEditor() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  // Fetch existing preferences
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    collabs_to_discover: [] as string[],
    collabs_to_host: [] as string[],
    notification_frequency: ''
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (profile?.preferences) {
      setFormData({
        collabs_to_discover: profile.preferences.collabs_to_discover || [],
        collabs_to_host: profile.preferences.collabs_to_host || [],
        notification_frequency: profile.preferences.notification_frequency || ''
      });
    }
  }, [profile]);

  const handleMultiSelect = (type: 'discover' | 'host', collab: string) => {
    const key = type === 'discover' ? 'collabs_to_discover' : 'collabs_to_host';
    const current = formData[key];
    const updated = current.includes(collab)
      ? current.filter(item => item !== collab)
      : [...current, collab];

    setFormData(prev => ({
      ...prev,
      [key]: updated
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (!formData.notification_frequency || formData.collabs_to_discover.length === 0 || formData.collabs_to_host.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      // Use apiRequest which handles Telegram headers automatically
      const response = await apiRequest('POST', '/api/preferences', formData);
      const data = await response.json();

      toast({
        title: "Success!",
        description: "Your collaboration preferences have been updated."
      });

      setLocation('/dashboard');

    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update preferences"
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
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center -ml-3"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Edit Preferences</h1>
          <div className="w-12" /> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <Label className="text-lg">Collaborations to Discover</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select the types of collaboration opportunities you'd like to be notified about
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
                    onClick={() => handleMultiSelect('host', type)}
                  >
                    <span className="text-left">{type}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-lg">Notification Frequency</Label>
              <p className="text-sm text-muted-foreground mb-4">
                How often would you like to receive notifications about new opportunities?
              </p>
              <Select
                value={formData.notification_frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, notification_frequency: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_FREQUENCIES.map(frequency => (
                    <SelectItem key={frequency} value={frequency}>
                      {frequency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}