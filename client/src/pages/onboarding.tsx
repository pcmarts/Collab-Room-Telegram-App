import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OnboardingForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  // Check if we're in edit mode
  const isEditMode = window.location.search.includes('edit=true');

  // Fetch existing data if in edit mode or to check if user has already applied
  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  // Check if user has already applied and redirect if necessary
  useEffect(() => {
    if (!isEditMode && profileData?.user) {
      // If the user has already applied, redirect them to application status
      setLocation('/application-status');
      return;
    }

    if (isEditMode && profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name || '',
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

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    linkedin_url: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
  };

  const handleNext = () => {
    if (!formData.first_name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "First name is required",
        duration: 2000
      });
      return;
    }

    // Store the form data in session storage and proceed to next step
    sessionStorage.setItem('userFormData', JSON.stringify(formData));
    setLocation('/company-info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode) {
      try {
        setIsSubmitting(true);

        if (!formData.first_name) {
          throw new Error('First name is required');
        }

        const submitData = {
          ...formData,
          handle: window.Telegram?.WebApp?.initData?.user?.username || '',
          initData: window.Telegram?.WebApp?.initData || ''
        };

        const response = await fetch('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData)
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
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
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
            Your contact information remains private and will only be shared with matches after both parties agree to connect.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="last_name" className="text-muted-foreground">Last Name</Label>
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </div>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="linkedin_url" className="text-muted-foreground">LinkedIn URL</Label>
              <span className="text-xs text-muted-foreground">(Optional)</span>
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

          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
              <span className="text-xs text-muted-foreground">(Optional)</span>
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
              isEditMode ? "Submit" : "Continue to Company Info"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}