import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { TelegramButton, TelegramFixedButtonContainer } from "@/components/ui/telegram-button";

export default function ReferralCodeForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const [referralCode, setReferralCode] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');

  // Function to check if profile exists
  const checkProfileExists = async (maxAttempts = 30) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data?.user) {
            console.log('Profile found:', data);
            return true;
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Profile check attempt ${attempt + 1}/${maxAttempts}`);
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setProcessingMessage('Submitting your application...');

      // Store the referral code in session storage
      sessionStorage.setItem('referralCode', referralCode);

      // Collect all form data
      const userFormData = JSON.parse(sessionStorage.getItem('userFormData') || '{}');
      const companyFormData = JSON.parse(sessionStorage.getItem('companyFormData') || '{}');

      const submitData = {
        // User information
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        // Create a user handle - either use Telegram username or generate one from ID
        handle: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 
                (window.Telegram?.WebApp?.initDataUnsafe?.user?.id ? 
                 `user_${window.Telegram?.WebApp?.initDataUnsafe?.user?.id.toString().substring(0, 8)}` : 
                 undefined),
        linkedin_url: userFormData.linkedin_url,
        email: userFormData.email,
        twitter_url: userFormData.twitter_url,
        twitter_followers: userFormData.twitter_followers,
        referral_code: referralCode,

        // Company information
        company_name: companyFormData.company_name,
        company_website: companyFormData.website,
        twitter_handle: companyFormData.twitter_url, // Store full URL
        job_title: companyFormData.job_title,
        funding_stage: companyFormData.funding_stage,
        has_token: companyFormData.has_token,
        token_ticker: companyFormData.token_ticker,
        blockchain_networks: companyFormData.blockchain_networks,
        company_tags: companyFormData.tags,
        company_linkedin_url: companyFormData.linkedin_url,
        company_twitter_followers: companyFormData.twitter_followers,

        // Telegram data
        initData: window.Telegram?.WebApp?.initData || '',
      };

      console.log('Starting application submission...', submitData);
      setProcessingMessage('Processing your application...');

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit application');
      }

      // Wait for the response data
      const data = await response.json();
      console.log('Application submission successful:', data);

      // Clear session storage after successful submission
      sessionStorage.removeItem('userFormData');
      sessionStorage.removeItem('companyFormData');
      sessionStorage.removeItem('referralCode');

      // Check if user was auto-approved
      if (data.autoApproved && data.isSpecialCode) {
        toast({
          title: "🎉 Auto-Approved!",
          description: `You've been automatically approved using referral code: ${data.referralCode}`,
          duration: 8000
        });
        
        // Wait for profile to be available
        setProcessingMessage('Finalizing your approval...');
        console.log('Auto-approved user, waiting for profile data...');
        const profileExists = await checkProfileExists();

        if (profileExists) {
          console.log('Profile data confirmed, redirecting to discover page...');
          setLocation('/discover');
        } else {
          console.log('Profile data not found, redirecting to discover anyway...');
          setLocation('/discover');
        }
      } else {
        toast({
          title: "Application Submitted!",
          description: "We'll review your application and notify you through Telegram.",
          duration: 5000
        });

        // Wait for profile to be available
        setProcessingMessage('Finalizing your application...');
        console.log('Waiting for profile data to be available...');
        const profileExists = await checkProfileExists();

        if (profileExists) {
          console.log('Profile data confirmed, proceeding to application status page...');
          setLocation('/application-status');
        } else {
          console.log('Profile data not found after maximum attempts');
          toast({
            variant: "destructive",
            title: "Processing Delay",
            description: "Please wait a moment and try refreshing the application status page."
          });
          setLocation('/application-status');
        }
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application"
      });
    } finally {
      setIsSubmitting(false);
      setProcessingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 80px)" }}>
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
              <Label htmlFor="referral-code">Referral Code (Optional)</Label>
              <Input
                id="referral-code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter your referral code"
              />
            </div>

            {/* Processing message */}
            {processingMessage && (
              <div className="text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                {processingMessage}
              </div>
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
    </div>
  );
}