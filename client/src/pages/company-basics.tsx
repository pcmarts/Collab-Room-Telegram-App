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
        company_name: profileData.company.name,
        job_title: profileData.company.job_title,
        website: profileData.company.website,
        twitter_url: profileData.company.twitter_handle ? `https://x.com/${profileData.company.twitter_handle}` : 'https://x.com/',
        linkedin_url: profileData.company.linkedin_url || 'https://linkedin.com/company/',
        funding_stage: profileData.company.funding_stage,
        twitter_followers: profileData.company.twitter_followers || ''
      });
    } else {
      const savedData = sessionStorage.getItem('companyFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [profileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    sessionStorage.setItem('companyFormData', JSON.stringify(newFormData));
  };

  const handleNext = () => {
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

    sessionStorage.setItem('companyFormData', JSON.stringify(formData));
    setLocation('/company-sector');
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader
        title="Company Basics"
        subtitle="Tell us about your company"
        step={2}
        totalSteps={4}
        backUrl="/personal-info"
      />

      <div className="p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4 pb-24">
          <div>
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="job_title">Your Job Title / Role *</Label>
            <Input
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
              onChange={handleInputChange}
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
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg">
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