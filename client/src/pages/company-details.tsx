import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { BLOCKCHAIN_NETWORKS, COMPANY_TAG_CATEGORIES } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

export default function CompanyDetails() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch existing data
  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    twitter_url: '',
    linkedin_url: '',
    has_token: false,
    token_ticker: '$',
    blockchain_networks: [] as string[],
    tags: [] as string[]
  });

  // Load data when available
  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        twitter_url: profileData.company.twitter_handle ? `https://x.com/${profileData.company.twitter_handle}` : '',
        linkedin_url: profileData.company.linkedin_url || '',
        has_token: profileData.company.has_token || false,
        token_ticker: profileData.company.token_ticker || '$',
        blockchain_networks: profileData.company.blockchain_networks || [],
        tags: profileData.company.tags || []
      });
    } else {
      const savedData = sessionStorage.getItem('companyDetailsData');
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
    sessionStorage.setItem('companyDetailsData', JSON.stringify(newFormData));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleBlockchain = (network: string) => {
    setFormData(prev => ({
      ...prev,
      blockchain_networks: prev.blockchain_networks.includes(network)
        ? prev.blockchain_networks.filter(n => n !== network)
        : [...prev.blockchain_networks, network]
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Get basic company data from session storage
      const basicData = JSON.parse(sessionStorage.getItem('companyFormData') || '{}');
      const userFormData = JSON.parse(sessionStorage.getItem('userFormData') || '{}');

      const submitData = {
        // User information
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        handle: window.Telegram?.WebApp?.initData?.user?.username || '',
        linkedin_url: userFormData.linkedin_url,
        email: userFormData.email,

        // Company information
        company_name: basicData.company_name,
        website: basicData.website,
        twitter_handle: formData.twitter_url?.replace("https://x.com/", "").replace("@", ""),
        job_title: basicData.job_title,
        funding_stage: basicData.funding_stage,
        has_token: formData.has_token,
        token_ticker: formData.has_token ? formData.token_ticker : null,
        blockchain_networks: formData.has_token ? formData.blockchain_networks : [],
        tags: formData.tags,
        short_description: basicData.short_description,
        long_description: basicData.long_description,

        // Referral code
        referral_code: sessionStorage.getItem('referralCode') || '',

        // Telegram data
        initData: window.Telegram?.WebApp?.initData || '',
      };

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      // Clear session storage after successful submission
      sessionStorage.removeItem('userFormData');
      sessionStorage.removeItem('companyFormData');
      sessionStorage.removeItem('companyDetailsData');
      sessionStorage.removeItem('referralCode');

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and notify you through Telegram.",
        duration: 2000
      });

      setLocation('/application-status');

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => setLocation('/company-basics')} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Company Details</h1>
          <p className="text-muted-foreground mt-2">Tell us more about your company's blockchain presence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="twitter_url">Twitter URL</Label>
            <Input
              id="twitter_url"
              name="twitter_url"
              value={formData.twitter_url}
              onChange={handleInputChange}
              placeholder="https://x.com/..."
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
              placeholder="https://linkedin.com/company/..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="has_token"
                checked={formData.has_token}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_token: checked }))}
              />
              <Label htmlFor="has_token">Live Token?</Label>
            </div>
          </div>

          {formData.has_token && (
            <>
              <div>
                <Label htmlFor="token_ticker">Token Ticker</Label>
                <Input
                  id="token_ticker"
                  name="token_ticker"
                  value={formData.token_ticker}
                  onChange={handleInputChange}
                  required={formData.has_token}
                />
              </div>

              <div className="space-y-2">
                <Label>Blockchain Networks</Label>
                <div className="grid grid-cols-1 gap-2">
                  {BLOCKCHAIN_NETWORKS.map(network => (
                    <Button
                      key={network}
                      type="button"
                      variant={formData.blockchain_networks.includes(network) ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => toggleBlockchain(network)}
                    >
                      {network}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-4 pt-4">
            <Label className="text-lg">Your Company Sector</Label>
            <p className="text-sm text-muted-foreground">
              Select tags that best describe your company's focus areas in web3.
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
                        variant={formData.tags.includes(tag) ? "default" : "outline"}
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => toggleTag(tag)}
                      >
                        <span className="text-left">{tag}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
