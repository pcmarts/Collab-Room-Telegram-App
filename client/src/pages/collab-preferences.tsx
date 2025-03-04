import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLLAB_TYPES, NOTIFICATION_FREQUENCIES, COMPANY_TAG_CATEGORIES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    collabs_to_discover: [] as string[],
    collabs_to_host: [] as string[],
    notification_frequency: '',
    excluded_tags: [] as string[]
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (isEditMode && profileData?.preferences) {
      setFormData({
        collabs_to_discover: profileData.preferences.collabs_to_discover || [],
        collabs_to_host: profileData.preferences.collabs_to_host || [],
        notification_frequency: profileData.preferences.notification_frequency || '',
        excluded_tags: profileData.preferences.excluded_tags || []
      });
    } else {
      const savedData = sessionStorage.getItem('preferencesFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [isEditMode, profileData]);

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

    if (!isEditMode) {
      sessionStorage.setItem('preferencesFormData', JSON.stringify({
        ...formData,
        [key]: updated
      }));
    }
  };

  const handleFrequencyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      notification_frequency: value
    }));

    if (!isEditMode) {
      sessionStorage.setItem('preferencesFormData', JSON.stringify({
        ...formData,
        notification_frequency: value
      }));
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleExcludedTag = (tag: string) => {
    const tags = formData.excluded_tags.includes(tag)
      ? formData.excluded_tags.filter(t => t !== tag)
      : [...formData.excluded_tags, tag];

    const newFormData = {
      ...formData,
      excluded_tags: tags
    };
    setFormData(newFormData);
    if (!isEditMode) {
      sessionStorage.setItem('preferencesFormData', JSON.stringify(newFormData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (!formData.notification_frequency || formData.collabs_to_discover.length === 0 || formData.collabs_to_host.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      if (isEditMode) {
        // In edit mode, just update preferences
        const response = await apiRequest('POST', '/api/preferences', formData);
        await response.json();

        toast({
          title: "Success!",
          description: "Your collaboration preferences have been updated."
        });

        setLocation('/dashboard');
      } else {
        // In onboarding mode, submit all form data
        const userFormData = JSON.parse(sessionStorage.getItem('userFormData') || '{}');
        const companyFormData = JSON.parse(sessionStorage.getItem('companyFormData') || '{}');

        // Submit user data first
        const userResponse = await apiRequest('POST', '/api/onboarding', {
          ...userFormData,
          initData: window.Telegram?.WebApp?.initData || ''
        });
        await userResponse.json();

        // Then submit company data
        const companyResponse = await apiRequest('POST', '/api/company', {
          ...companyFormData,
          initData: window.Telegram?.WebApp?.initData || ''
        });
        await companyResponse.json();

        // Finally submit preferences
        const prefResponse = await apiRequest('POST', '/api/preferences', formData);
        await prefResponse.json();

        toast({
          title: "Application Submitted!",
          description: "Thanks for applying. We'll review your application and notify you through Telegram once approved."
        });

        // Clear all stored form data
        sessionStorage.removeItem('preferencesFormData');
        sessionStorage.removeItem('companyFormData');
        sessionStorage.removeItem('userFormData');

        // Close Telegram WebApp after short delay to show toast
        setTimeout(() => {
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
          }
        }, 2000);
      }

    } catch (error) {
      console.error('Failed to submit form:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isEditMode) {
      setLocation('/dashboard');
    } else {
      setLocation('/company-info');
    }
  };

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center -ml-3"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditMode ? 'Edit Preferences' : 'Collaboration Preferences'}
          </h1>
          <div className="w-12" /> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!isEditMode && (
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary"></div>
          </div>
        )}

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
                onValueChange={handleFrequencyChange}
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

            <div className="space-y-4 pt-4">
              <Label className="text-lg">Company Tag Preferences</Label>
              <p className="text-sm text-muted-foreground mb-4">
                By default, you'll discover collaborations from all company types. Select tags below to exclude specific types of companies from your discovery feed.
              </p>

              {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full flex justify-between items-center p-4"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="font-medium">{category}</span>
                    {expandedCategories.includes(category) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {expandedCategories.includes(category) && (
                    <div className="p-4 pt-0 grid grid-cols-1 gap-2">
                      {tags.map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant={formData.excluded_tags.includes(tag) ? "destructive" : "outline"}
                          className="justify-start h-auto py-3 px-4"
                          onClick={() => toggleExcludedTag(tag)}
                        >
                          <span className="text-left">{tag}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
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
                {isEditMode ? 'Saving Changes...' : 'Complete Setup'}
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