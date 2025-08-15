import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { TelegramButton, TelegramFixedButtonContainer } from "@/components/ui/telegram-button";
import { applyButtonFix } from "@/App";

export default function CompanyBasics() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  // Fetch existing data
  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    website: 'https://www.',
    twitter_url: 'https://x.com/'
  });

  // Load data when available
  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        company_name: profileData.company.name || '',
        job_title: profileData.company.job_title || '',
        website: profileData.company.website || 'https://www.',
        twitter_url: profileData.company.twitter_handle ? `https://x.com/${profileData.company.twitter_handle}` : 'https://x.com/'
      });
    } else {
      const savedData = sessionStorage.getItem('companyFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [profileData]);
  
  // Apply button fix when component mounts and after any render
  useEffect(() => {
    // Apply immediately on mount
    applyButtonFix();
    
    // Set up interval to keep applying the fix
    const fixInterval = setInterval(() => {
      applyButtonFix();
    }, 300);
    
    // Cleanup on unmount
    return () => clearInterval(fixInterval);
  }, []);

  const handleNext = () => {
    // Validate only the required fields (removed linkedin, funding_stage, twitter_followers)
    if (!formData.company_name || !formData.job_title || !formData.website || !formData.twitter_url) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
        duration: 2000
      });
      return;
    }

    // Create complete form data object with trimming (removed removed fields)
    const completeFormData = {
      company_name: formData.company_name.trim(),
      job_title: formData.job_title.trim(),
      website: formData.website.trim(),
      twitter_url: formData.twitter_url.trim(),
      twitter_handle: formData.twitter_url.trim()
    };

    // Debug log
    console.log('Saving company form data:', completeFormData);

    // Save to session storage
    sessionStorage.setItem('companyFormData', JSON.stringify(completeFormData));

    // Navigate to preferences page instead of company-sector (which we're removing)
    setLocation('/collab-preferences');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      <OnboardingHeader
        title="Company Basics"
        subtitle=""
        step={0}
        totalSteps={0}
        backUrl="/personal-info"
      />

      {/* Scrollable container */}
      <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        <div className="max-w-md mx-auto space-y-8 w-full">
          <div className="space-y-4 pb-32">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="job_title">Your Job Title / Role *</Label>
              <Input
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="website">Company Website *</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="twitter_url">Company Twitter *</Label>
              <Input
                id="twitter_url"
                name="twitter_url"
                type="url"
                value={formData.twitter_url}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                required
              />
            </div>


          </div>
        </div>
      </div>
      
      {/* Button container directly at the root level */}
      <TelegramFixedButtonContainer>
        <TelegramButton
          type="button"
          onClick={handleNext}
          isLoading={isSubmitting}
          loadingText="Saving..."
          text="Continue to Collaboration Preferences"
          disabled={isSubmitting}
        />
      </TelegramFixedButtonContainer>
    </div>
  );
}