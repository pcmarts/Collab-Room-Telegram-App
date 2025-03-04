import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

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
    email: ''
  });

  // Load saved data from API or session storage
  useEffect(() => {
    if (isEditMode && profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name,
        linkedin_url: profileData.user.linkedin_url || '',
        email: profileData.user.email || ''
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
    if (!isEditMode) {
      sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('============ DEBUG: Form Submit Started ============');

    try {
      setIsSubmitting(true);
      console.log('Form data:', formData);

      if (!formData.first_name || !formData.last_name) {
        throw new Error('Please fill in all required fields');
      }

      const submitData = {
        ...formData,
        handle: window.Telegram?.WebApp?.initData?.user?.username || '',
        initData: window.Telegram?.WebApp?.initData || ''
      };

      console.log('Submitting data:', submitData);

      const response = await fetch('/api/onboarding', {
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
        description: responseData.message || "Personal information saved successfully",
        duration: 2000, // 2 seconds
      });

      // Navigate to next step or back to dashboard
      if (isEditMode) {
        setLocation('/dashboard');
      } else {
        setLocation('/company-info');
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
      console.log('============ DEBUG: Form Submit Ended ============');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between mb-8">
          {isEditMode && (
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center"
            >
              Cancel
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Personal Information' : 'Personal Information'}
          </h1>
          <p className="text-muted-foreground mt-2">Tell us about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Saving...' : 'Next'}
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