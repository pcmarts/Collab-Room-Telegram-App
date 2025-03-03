import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLLAB_TYPES, NOTIFICATION_FREQUENCIES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

export default function CollabPreferencesForm() {
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
    collabs_to_discover: [] as string[],
    collabs_to_host: [] as string[],
    notification_frequency: ''
  });

  // Load saved data from API or session storage
  useEffect(() => {
    if (isEditMode && profileData?.preferences) {
      setFormData({
        collabs_to_discover: profileData.preferences.collabs_to_discover || [],
        collabs_to_host: profileData.preferences.collabs_to_host || [],
        notification_frequency: profileData.preferences.notification_frequency || ''
      });
    } else {
      const savedData = sessionStorage.getItem('preferencesFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [isEditMode, profileData]);

  const handleMultiSelect = (type: 'discover' | 'host', value: string) => {
    const key = type === 'discover' ? 'collabs_to_discover' : 'collabs_to_host';
    const current = formData[key];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];

    const newFormData = {
      ...formData,
      [key]: updated
    };
    setFormData(newFormData);
    if (!isEditMode) {
      sessionStorage.setItem('preferencesFormData', JSON.stringify(newFormData));
    }
  };

  const handleFrequencyChange = (value: string) => {
    const newFormData = {
      ...formData,
      notification_frequency: value
    };
    setFormData(newFormData);
    if (!isEditMode) {
      sessionStorage.setItem('preferencesFormData', JSON.stringify(newFormData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('============ DEBUG: Preferences Form Submit Started ============');

    try {
      setIsSubmitting(true);
      console.log('Form data:', formData);

      if (!formData.notification_frequency || formData.collabs_to_discover.length === 0 || formData.collabs_to_host.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      const submitData = {
        ...formData,
        initData: window.Telegram?.WebApp?.initData || ''
      };

      console.log('Submitting data:', submitData);

      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit form');
      }

      toast({
        title: "Success!",
        description: responseData.message || "Preferences saved successfully"
      });

      if (isEditMode) {
        setLocation('/profile-overview');
      } else {
        // Clear all stored form data
        sessionStorage.removeItem('preferencesFormData');
        sessionStorage.removeItem('companyFormData');
        sessionStorage.removeItem('userFormData');

        // Close Telegram WebApp after short delay to show toast
        setTimeout(() => {
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
          }
        }, 1500);
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form"
      });
    } finally {
      setIsSubmitting(false);
      console.log('============ DEBUG: Preferences Form Submit Ended ============');
    }
  };

  const handleBack = () => {
    if (isEditMode) {
      setLocation('/profile-overview');
    } else {
      setLocation('/company-info');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={handleBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isEditMode ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary"></div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Collaboration Preferences' : 'Collaboration Preferences'}</h1>
          <p className="text-muted-foreground mt-2">Tell us about your collaboration interests</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Collaborations to Discover</Label>
            <p className="text-sm text-muted-foreground mb-2">
              What collaboration opportunities would you like to be notified about?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {COLLAB_TYPES.map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.collabs_to_discover.includes(type) ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => handleMultiSelect('discover', type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Collaborations to Host</Label>
            <p className="text-sm text-muted-foreground mb-2">
              What collaboration opportunities can your company offer?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {COLLAB_TYPES.map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={formData.collabs_to_host.includes(type) ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => handleMultiSelect('host', type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Notification Frequency</Label>
            <Select
              value={formData.notification_frequency}
              onValueChange={handleFrequencyChange}
            >
              <SelectTrigger>
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

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Saving...' : 'Complete Setup'}
              </>
            ) : (
              isEditMode ? "Save Changes" : "Complete Setup"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}