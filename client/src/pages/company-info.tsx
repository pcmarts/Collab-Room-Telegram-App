import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

export default function CompanyInfoForm() {
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
    company_name: '',
    job_title: '',
    website: 'https://www.',
    twitter_url: 'https://x.com/',
    linkedin_url: ''
  });

  // Load saved data from API or session storage
  useEffect(() => {
    if (isEditMode && profileData?.company) {
      setFormData({
        company_name: profileData.company.name,
        job_title: profileData.company.job_title,
        website: profileData.company.website,
        twitter_url: profileData.company.twitter_handle ? `https://x.com/${profileData.company.twitter_handle}` : 'https://x.com/',
        linkedin_url: profileData.company.linkedin_url || ''
      });
    } else {
      const savedData = sessionStorage.getItem('companyFormData');
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
      sessionStorage.setItem('companyFormData', JSON.stringify(newFormData));
    }
  };

  const handleNext = async () => {
    if (!formData.company_name || !formData.job_title || !formData.website) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    // Store the form data in session storage
    sessionStorage.setItem('companyFormData', JSON.stringify({
      ...formData,
      // Extract handle from twitter URL if present
      twitter_handle: formData.twitter_url.replace('https://x.com/', '').replace('@', '')
    }));

    // Navigate to next step
    setLocation('/collab-preferences');
  };

  const handleBack = () => {
    if (isEditMode) {
      setLocation('/profile-overview');
    } else {
      setLocation('/onboarding');
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
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Company Information' : 'Company Information'}
          </h1>
          <p className="text-muted-foreground mt-2">Tell us about your company</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="job_title">Your Job Title / Role</Label>
            <Input
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="website">Company Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="twitter_url">Company Twitter URL</Label>
            <Input
              id="twitter_url"
              name="twitter_url"
              value={formData.twitter_url}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">Company LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/company/..."
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            onClick={isEditMode ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Saving...' : 'Next'}
              </>
            ) : (
              isEditMode ? "Save Changes" : "Continue to Preferences"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}