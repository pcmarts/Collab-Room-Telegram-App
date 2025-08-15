import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { FixedBottomButton } from "@/components/ui/FixedBottomButton";

export default function PersonalInfo() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  // Get Telegram username from WebApp data
  const telegramData = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const telegramUsername = telegramData?.username || 'Not available';

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    twitter_url: 'https://x.com/'
  });

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name || '',
        email: profileData.user.email || '',
        twitter_url: profileData.user.twitter_url || 'https://x.com/'
      });
    } else {
      const savedData = sessionStorage.getItem('userFormData');
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
    sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
  };

  const handleNext = () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
        duration: 2000
      });
      return;
    }

    // Get referral code from sessionStorage if it exists
    const referralCode = sessionStorage.getItem('referralCode');
    console.log('Retrieved referral code from sessionStorage:', referralCode);

    // Store all form data including social media info and referral code
    const completeFormData = {
      ...formData,
      linkedin_url: null, // LinkedIn URL removed from signup, set to null
      referralCode: referralCode || null, // Add referral code to form data
    };

    sessionStorage.setItem('userFormData', JSON.stringify(completeFormData));
    setLocation('/company-basics');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      <OnboardingHeader
        title="Tell Us About Yourself"
        subtitle=""
        step={1}
        totalSteps={2}
        backUrl="/welcome"
      />

      {/* Scrollable container */}
      <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        <div className="max-w-md mx-auto space-y-8 w-full">
          <div className="space-y-4 pb-32">
            {/* Name fields in a grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>



            <div>
              <Label htmlFor="email">My Company Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="twitter_url">My Personal Twitter URL</Label>
              <Input
                id="twitter_url"
                name="twitter_url"
                type="url"
                value={formData.twitter_url}
                onChange={handleInputChange}
              />
            </div>



            <div>
              <Label htmlFor="telegram_username">My Telegram Username</Label>
              <Input
                id="telegram_username"
                value={`@${telegramUsername}`}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Button container directly at the root level */}
      <FixedBottomButton
        type="button"
        onClick={(e) => { e.preventDefault(); handleNext(); }}
        isLoading={isSubmitting}
        loadingText="Saving..."
        text="Continue to Company Info"
        disabled={isSubmitting}
      />
    </div>
  );
}