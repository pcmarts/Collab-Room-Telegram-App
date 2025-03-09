import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function ReferralCodeForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Store the referral code in session storage
      sessionStorage.setItem('referralCode', referralCode);

      // Collect all form data
      const userFormData = JSON.parse(sessionStorage.getItem('userFormData') || '{}');
      const companyFormData = JSON.parse(sessionStorage.getItem('companyFormData') || '{}');

      const submitData = {
        // User information
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        handle: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '',
        linkedin_url: userFormData.linkedin_url,
        email: userFormData.email,

        // Company information
        company_name: companyFormData.company_name,
        company_website: companyFormData.website,
        twitter_handle: companyFormData.twitter_url?.replace("https://x.com/", "").replace("@", ""),
        job_title: companyFormData.job_title,
        funding_stage: companyFormData.funding_stage,
        has_token: companyFormData.has_token,
        token_ticker: companyFormData.token_ticker,
        blockchain_networks: companyFormData.blockchain_networks,
        company_tags: companyFormData.tags,
        short_description: companyFormData.short_description,
        long_description: companyFormData.long_description,

        // Referral code
        referral_code: referralCode,

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
          <Button
            variant="ghost"
            onClick={() => setLocation('/company-info')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Referral Code</h1>
          <p className="text-muted-foreground mt-2">Enter your referral code if you have one</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-24">
          <div>
            <Label htmlFor="referral_code">Referral Code (Optional)</Label>
            <Input
              id="referral_code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter your referral code"
            />
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
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
