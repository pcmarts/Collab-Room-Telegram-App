import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FUNDING_STAGES, TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";

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
    twitter_url: 'https://x.com/',
    linkedin_url: 'https://linkedin.com/company/',
    funding_stage: '',
    twitter_followers: ''
  });

  // Load data when available
  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        company_name: profileData.company.name || '',
        job_title: profileData.company.job_title || '',
        website: profileData.company.website || 'https://www.',
        twitter_url: profileData.company.twitter_url || 'https://x.com/',
        linkedin_url: profileData.company.linkedin_url || 'https://linkedin.com/company/',
        funding_stage: profileData.company.funding_stage || '',
        twitter_followers: profileData.company.twitter_followers || ''
      });
    } else {
      const savedData = sessionStorage.getItem('companyFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [profileData]);

  const handleNext = () => {
    // Validate all required fields
    if (!formData.company_name || !formData.job_title || !formData.website || 
        !formData.twitter_url || !formData.linkedin_url || !formData.funding_stage || 
        !formData.twitter_followers) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
        duration: 2000
      });
      return;
    }

    // Create complete form data object with trimming
    const completeFormData = {
      company_name: formData.company_name.trim(),
      job_title: formData.job_title.trim(),
      website: formData.website.trim(),
      twitter_url: formData.twitter_url.trim(),
      twitter_handle: formData.twitter_url.trim(), 
      linkedin_url: formData.linkedin_url.trim(),
      company_linkedin_url: formData.linkedin_url.trim(), 
      funding_stage: formData.funding_stage,
      twitter_followers: formData.twitter_followers,
      company_twitter_followers: formData.twitter_followers 
    };

    // Debug log
    console.log('Saving company form data:', completeFormData);

    // Save to session storage
    sessionStorage.setItem('companyFormData', JSON.stringify(completeFormData));

    // Navigate to next page
    setLocation('/company-sector');
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader
        title="Company Basics"
        subtitle=""
        step={0}
        totalSteps={0}
        backUrl="/personal-info"
      />

      <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4 pb-32">
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

          <div>
            <Label htmlFor="twitter_followers">Company Twitter Follower Count *</Label>
            <Select
              value={formData.twitter_followers}
              onValueChange={(value) => setFormData(prev => ({ ...prev, twitter_followers: value }))}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select follower count" />
              </SelectTrigger>
              <SelectContent>
                {TWITTER_FOLLOWER_COUNTS.map(count => (
                  <SelectItem key={count} value={count}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="linkedin_url">Company LinkedIn *</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="funding_stage">Company Funding Stage *</Label>
            <Select
              value={formData.funding_stage}
              onValueChange={(value) => setFormData(prev => ({ ...prev, funding_stage: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funding stage" />
              </SelectTrigger>
              <SelectContent>
                {FUNDING_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Floating Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-border shadow-lg">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to Company Sector"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}