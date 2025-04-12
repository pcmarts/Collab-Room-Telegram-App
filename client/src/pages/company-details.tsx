import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { BLOCKCHAIN_NETWORKS, BLOCKCHAIN_NETWORK_CATEGORIES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { TelegramButton, TelegramFixedButtonContainer } from "@/components/ui/telegram-button";
import { applyButtonFix } from "@/App";

// Type helper to extract network strings from the const object
type NetworkString = string;

export default function CompanyDetails() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Get all required data from session storage
      const basicData = JSON.parse(sessionStorage.getItem('companyFormData') || '{}');
      const sectorData = JSON.parse(sessionStorage.getItem('companySectorData') || '{}');
      const userFormData = JSON.parse(sessionStorage.getItem('userFormData') || '{}');
      const referralCode = sessionStorage.getItem('referralCode');

      console.log('Company basic data:', basicData); // Debug log
      console.log('User form data:', userFormData); // Debug log
      console.log('Referral code:', referralCode); // Debug log

      // Get Telegram username from the initData
      const telegramData = window.Telegram?.WebApp?.initDataUnsafe?.user;
      // Create a user handle - either use Telegram username or generate one from ID
      const handle = telegramData?.username || (telegramData?.id ? `user_${telegramData.id.toString().substring(0, 8)}` : undefined);

      // We no longer require handle - removed validation check here
      // Fallback is provided above to generate a handle if not available

      if (!basicData.company_name || !basicData.website || !basicData.job_title ||
          !basicData.twitter_url || !basicData.funding_stage) {
        throw new Error('Please complete all company information fields');
      }

      if (!sectorData.company_tags?.length) {
        throw new Error('Please select at least one company sector');
      }

      const submitData = {
        // User information
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        handle,
        linkedin_url: userFormData.linkedin_url, // Personal LinkedIn URL
        email: userFormData.email,
        twitter_url: userFormData.twitter_url,
        twitter_followers: userFormData.twitter_followers,
        referral_code: referralCode, // Include referral code for user

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
        company_linkedin_url: basicData.linkedin_url, // Company LinkedIn URL
        company_twitter_followers: basicData.twitter_followers, // Company Twitter followers

        // Telegram data
        initData: window.Telegram?.WebApp?.initData || ''
      };

      console.log('Final submission data:', submitData); // Debug log

      // Get the Telegram initData
      const telegramInitData = window.Telegram?.WebApp?.initData || '';
      
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': telegramInitData, // Add Telegram data in the header
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
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

  const toggleNetwork = (network: string) => {
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

  const clearCategorySelections = (category: string) => {
    const networks = BLOCKCHAIN_NETWORK_CATEGORIES[category] as readonly string[];
    setFormData(prev => ({
      ...prev,
      blockchain_networks: prev.blockchain_networks.filter(network =>
        !networks.includes(network)
      )
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader
        title="Token Information"
        subtitle=""
        step={0}
        totalSteps={0}
        backUrl="/company-sector"
      />

      <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        <form onSubmit={handleSubmit} className="space-y-4 pb-32">
          <div className="space-y-2">
            <div className="flex items-center justify-between border rounded-lg p-4">
              <Label htmlFor="has_token" className="text-sm font-medium">
                Does your company have a token?
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">No</span>
                <Switch
                  id="has_token"
                  checked={formData.has_token}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_token: checked }))}
                />
                <span className="text-sm text-muted-foreground">Yes</span>
              </div>
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

              <div className="space-y-4">
                <div>
                  <Label>Blockchain Networks *</Label>
                  {formData.blockchain_networks.length > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {formData.blockchain_networks.length} {formData.blockchain_networks.length === 1 ? 'network' : 'networks'} selected
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, blockchain_networks: [] }))}
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => (
                    <Card key={category} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-accent"
                        onClick={() => toggleCategory(category)}
                      >
                        <div className="font-medium">{category}</div>
                        <div className="flex items-center gap-2">
                          {formData.blockchain_networks.filter(network => (networks as readonly string[]).includes(network)).length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {formData.blockchain_networks.filter(network => (networks as readonly string[]).includes(network)).length}
                            </Badge>
                          )}
                          {expandedCategories.includes(category) ?
                            <ChevronUp className="h-4 w-4" /> :
                            <ChevronDown className="h-4 w-4" />
                          }
                        </div>
                      </div>

                      {expandedCategories.includes(category) && (
                        <CardContent className="pt-2">
                          {formData.blockchain_networks.some(network => (networks as readonly string[]).includes(network)) && (
                            <div className="flex justify-end mb-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => clearCategorySelections(category)}
                              >
                                Clear
                              </Button>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-2">
                            {(networks as readonly string[]).map((network) => (
                              <Button
                                key={network}
                                type="button"
                                variant={formData.blockchain_networks.includes(network) ? "default" : "outline"}
                                className="h-auto py-2 px-3 justify-start text-left font-normal"
                                onClick={() => toggleNetwork(network)}
                              >
                                {network}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Floating Save Button */}
          <TelegramFixedButtonContainer>
            <TelegramButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Submitting..."
              text="Submit Application"
              disabled={isSubmitting}
            />
          </TelegramFixedButtonContainer>
        </form>
      </div>
    </div>
  );
}