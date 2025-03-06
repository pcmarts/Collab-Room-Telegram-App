import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FUNDING_STAGES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";

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
    website: '',
    twitter_url: '',
    linkedin_url: '',
    funding_stage: '',
    short_description: '',
    long_description: ''
  });

  // Load data when available
  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        company_name: profileData.company.name,
        job_title: profileData.company.job_title,
        website: profileData.company.website,
        twitter_url: profileData.company.twitter_handle ? `https://x.com/${profileData.company.twitter_handle}` : '',
        linkedin_url: profileData.company.linkedin_url || '',
        funding_stage: profileData.company.funding_stage,
        short_description: profileData.company.short_description || '',
        long_description: profileData.company.long_description || ''
      });
    } else {
      const savedData = sessionStorage.getItem('companyFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [profileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    sessionStorage.setItem('companyFormData', JSON.stringify(newFormData));
  };

  const handleNext = () => {
    if (!formData.company_name || !formData.job_title || !formData.website) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
        duration: 2000
      });
      return;
    }

    // Store form data and proceed to next step
    sessionStorage.setItem('companyFormData', JSON.stringify(formData));
    setLocation('/company-details');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => setLocation('/personal-info')} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Company Basics</h1>
          <p className="text-muted-foreground mt-2">Tell us about your company</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
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
            <Label htmlFor="short_description">Short Description</Label>
            <div className="mt-1.5">
              <Textarea
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="A brief tagline or elevator pitch for your company"
                className="resize-none"
                maxLength={150}
              />
              <div className="text-sm text-muted-foreground text-right mt-1">
                {formData.short_description.length}/150
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="long_description">Long Description</Label>
            <div className="mt-1.5">
              <Textarea
                id="long_description"
                name="long_description"
                value={formData.long_description}
                onChange={handleInputChange}
                placeholder="A detailed description of your company, its mission, and what makes it unique"
                className="resize-none"
                rows={5}
                maxLength={1000}
              />
              <div className="text-sm text-muted-foreground text-right mt-1">
                {formData.long_description.length}/1000
              </div>
            </div>
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
            <Label htmlFor="funding_stage">Company Funding Stage</Label>
            <Select
              value={formData.funding_stage}
              onValueChange={(value) => setFormData(prev => ({ ...prev, funding_stage: value }))}
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

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Company Details"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
