import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { BLOCKCHAIN_NETWORKS } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function CompanyDetails() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    has_token: false,
    token_ticker: '',
    blockchain_networks: [] as string[]
  });

  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        has_token: profileData.company.has_token || false,
        token_ticker: profileData.company.token_ticker || '',
        blockchain_networks: profileData.company.blockchain_networks || []
      });
    } else {
      const savedData = sessionStorage.getItem('companyDetailsData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [profileData]);

  const toggleNetwork = (network: string) => {
    setFormData(prev => ({
      ...prev,
      blockchain_networks: prev.blockchain_networks.includes(network)
        ? prev.blockchain_networks.filter(n => n !== network)
        : [...prev.blockchain_networks, network]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Get required data from session storage
      const basicData = JSON.parse(sessionStorage.getItem('companyFormData') || '{}');
      const sectorData = JSON.parse(sessionStorage.getItem('companySectorData') || '{}');
      const userFormData = JSON.parse(sessionStorage.getItem('userFormData') || '{}');

      // Get Telegram username from the initData
      const telegramData = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const handle = telegramData?.username;

      if (!handle) {
        throw new Error('Telegram username is required');
      }

      if (!basicData.company_name || !basicData.website || !basicData.job_title || 
          !basicData.twitter_url || !basicData.linkedin_url || !basicData.funding_stage) {
        throw new Error('Please complete all company information fields');
      }

      if (!sectorData.company_tags?.length) {
        throw new Error('Please select at least one company sector');
      }

      if (formData.has_token) {
        if (!formData.token_ticker) {
          throw new Error('Token ticker is required when you have a token');
        }
        if (!formData.blockchain_networks.length) {
          throw new Error('Please select at least one blockchain network');
        }
      }

      const submitData = {
        // User Information
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        handle,
        linkedin_url: userFormData.linkedin_url,
        email: userFormData.email,

        // Company information
        company_name: basicData.company_name,
        company_website: basicData.website,
        twitter_handle: basicData.twitter_url.replace("https://x.com/", "").replace("@", ""),
        job_title: basicData.job_title,
        funding_stage: basicData.funding_stage,
        has_token: formData.has_token,
        token_ticker: formData.has_token ? formData.token_ticker : undefined,
        blockchain_networks: formData.has_token ? formData.blockchain_networks : [],
        tags: sectorData.company_tags,

        // Referral code
        referral_code: sessionStorage.getItem('referralCode') || '',

        // Telegram data
        initData: window.Telegram?.WebApp?.initData || ''
      };

      console.log('Submitting application data:', submitData);

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      // Clear session storage after successful submission
      sessionStorage.removeItem('userFormData');
      sessionStorage.removeItem('companyFormData');
      sessionStorage.removeItem('companySectorData');
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
          <Button variant="ghost" onClick={() => setLocation('/company-sector')} className="flex items-center">
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
          <h1 className="text-2xl font-bold">Token Information</h1>
          <p className="text-muted-foreground mt-2">Tell us about your company's token</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="has_token"
                checked={formData.has_token}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_token: checked }))}
              />
              <Label htmlFor="has_token">Does your company have a token?</Label>
            </div>
          </div>

          {formData.has_token && (
            <>
              <div>
                <Label htmlFor="token_ticker">Token Ticker *</Label>
                <Input
                  id="token_ticker"
                  value={formData.token_ticker}
                  onChange={(e) => setFormData(prev => ({ ...prev, token_ticker: e.target.value }))}
                  required={formData.has_token}
                />
              </div>

              <div className="space-y-2">
                <Label>Blockchain Networks *</Label>
                <div className="flex flex-wrap gap-2">
                  {BLOCKCHAIN_NETWORKS.map(network => (
                    <Badge
                      key={network}
                      variant={formData.blockchain_networks.includes(network) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleNetwork(network)}
                    >
                      {network}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

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