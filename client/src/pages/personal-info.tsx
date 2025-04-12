import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TWITTER_FOLLOWER_COUNTS } from "../../../shared/schema";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { TelegramButton, TelegramFixedButtonContainer } from "@/components/ui/telegram-button";
import { applyButtonFix } from "@/App";

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
    linkedin_url: 'https://linkedin.com/in/',
    email: '',
    twitter_url: 'https://x.com/',
    twitter_followers: ''
  });

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name || '',
        linkedin_url: profileData.user.linkedin_url || 'https://linkedin.com/in/',
        email: profileData.user.email || '',
        twitter_url: profileData.user.twitter_url || 'https://x.com/',
        twitter_followers: profileData.user.twitter_followers || ''
      });
    } else {
      const savedData = sessionStorage.getItem('userFormData');
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
    }, 500);
    
    // Cleanup on unmount
    return () => clearInterval(fixInterval);
  }, []);

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
    if (!formData.first_name || !formData.last_name || !formData.linkedin_url || !formData.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
        duration: 2000
      });
      return;
    }

    // Store all form data including social media info
    const completeFormData = {
      ...formData,
      twitter_followers: formData.twitter_followers || '',  // Ensure this is never undefined
      linkedin_url: formData.linkedin_url || 'https://linkedin.com/in/',  // Ensure this is never undefined
    };

    sessionStorage.setItem('userFormData', JSON.stringify(completeFormData));
    setLocation('/company-basics');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 p-4">
      <OnboardingHeader
        title="Tell Us About Yourself"
        subtitle=""
        step={0}
        totalSteps={0}
        backUrl="/welcome"
      />

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
            <Label htmlFor="linkedin_url">LinkedIn URL *</Label>
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
            <Label htmlFor="email">Company Email Address *</Label>
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
            <Label htmlFor="twitter_followers">My Twitter Follower Count</Label>
            <Select
              value={formData.twitter_followers}
              onValueChange={(value) => {
                const newFormData = {
                  ...formData,
                  twitter_followers: value
                };
                setFormData(newFormData);
                sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select follower count" />
              </SelectTrigger>
              <SelectContent>
                {TWITTER_FOLLOWER_COUNTS.map((count) => (
                  <SelectItem key={count} value={count}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      
      {/* Button container directly at the root level */}
      <TelegramFixedButtonContainer>
        <TelegramButton
          type="button"
          onClick={(e) => { e.preventDefault(); handleNext(); }}
          isLoading={isSubmitting}
          loadingText="Saving..."
          text="Continue to Company Info"
          disabled={isSubmitting}
        />
      </TelegramFixedButtonContainer>
    </div>
  );
}