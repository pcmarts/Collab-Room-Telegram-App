import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Shield, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

export default function OnboardingForm() {
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
    first_name: '',
    last_name: '',
    linkedin_url: '',
    email: '',
    share_last_name: false,
    share_linkedin: false,
    share_email: false
  });

  useEffect(() => {
    if (isEditMode && profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name || '',
        linkedin_url: profileData.user.linkedin_url || '',
        email: profileData.user.email || '',
        share_last_name: profileData.user.share_last_name || false,
        share_linkedin: profileData.user.share_linkedin || false,
        share_email: profileData.user.share_email || false
      });
    } else {
      const savedData = sessionStorage.getItem('userFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [isEditMode, profileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
  };

  const handlePrivacyToggle = (field: string) => {
    const newFormData = {
      ...formData,
      [`share_${field}`]: !formData[`share_${field}`]
    };
    setFormData(newFormData);
    sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "First name is required",
        duration: 2000
      });
      return;
    }

    if (isEditMode) {
      try {
        setIsSubmitting(true);
        const response = await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            handle: window.Telegram?.WebApp?.initData?.user?.username || '',
            initData: window.Telegram?.WebApp?.initData || ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        toast({
          title: "Success!",
          description: "Personal information updated successfully",
          duration: 2000
        });

        setLocation('/dashboard');
      } catch (error) {
        console.error('Form submission error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update profile"
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      sessionStorage.setItem('userFormData', JSON.stringify(formData));
      setLocation('/company-info');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {isEditMode ? (
          <div className="flex justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Personal Information' : 'Personal Information'}
          </h1>
          <p className="text-muted-foreground mt-2">Tell us about yourself</p>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your contact information is private by default. Use the toggles below to choose what information to share when you match with someone.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Field */}
          <div>
            <Label htmlFor="first_name" className="font-medium">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>

          {/* Optional Fields with Privacy Controls */}
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="last_name">Last Name</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="share_last_name" className="text-sm text-muted-foreground">
                    {formData.share_last_name ? 'Shared when matched' : 'Private'}
                  </Label>
                  <Switch
                    id="share_last_name"
                    checked={formData.share_last_name}
                    onCheckedChange={() => handlePrivacyToggle('last_name')}
                  />
                </div>
              </div>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="share_linkedin" className="text-sm text-muted-foreground">
                    {formData.share_linkedin ? 'Shared when matched' : 'Private'}
                  </Label>
                  <Switch
                    id="share_linkedin"
                    checked={formData.share_linkedin}
                    onCheckedChange={() => handlePrivacyToggle('linkedin')}
                  />
                </div>
              </div>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/..."
                className="mt-1"
              />
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="share_email" className="text-sm text-muted-foreground">
                    {formData.share_email ? 'Shared when matched' : 'Private'}
                  </Label>
                  <Switch
                    id="share_email"
                    checked={formData.share_email}
                    onCheckedChange={() => handlePrivacyToggle('email')}
                  />
                </div>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-8"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              isEditMode ? "Save Changes" : "Continue to Company Info"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}