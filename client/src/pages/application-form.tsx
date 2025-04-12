import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { TelegramButton, TelegramFixedButtonContainer } from "@/components/ui/telegram-button";

export default function ApplicationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const formRef = useRef<HTMLFormElement>(null);

  const { data: profileData, isLoading, error } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    retry: false 
  });

  useEffect(() => {
    if (!isLoading && !error && profileData?.user) {
      setLocation('/application-status');
    }
  }, [profileData, isLoading, error, setLocation]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    linkedin_url: 'https://linkedin.com/in/',
    email: '',
    twitter_followers: ''
  });

  const handleFieldFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      const input = e.target;
      const rect = input.getBoundingClientRect();
      const offset = rect.top + window.scrollY - 100; 
      window.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
    }, 300);
  };

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

    sessionStorage.setItem('userFormData', JSON.stringify(formData));
    setLocation('/company-basics');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (profileData?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Tell Us About Yourself</h1>
          <p className="text-muted-foreground mt-2">
            Share your details to help us know you better
          </p>
        </div>

        <form 
          ref={formRef}
          onSubmit={(e) => { e.preventDefault(); handleNext(); }} 
          className="space-y-4 pb-24"
        >
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              onFocus={handleFieldFocus}
              inputMode="text"
              autoComplete="given-name"
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
              onFocus={handleFieldFocus}
              inputMode="text"
              autoComplete="family-name"
              required
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL *</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              onFocus={handleFieldFocus}
              inputMode="url"
              autoComplete="url"
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
              onFocus={handleFieldFocus}
              inputMode="email"
              autoComplete="email"
              placeholder="your@company.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="twitter_followers">Your Twitter Follower Count</Label>
            <Select
              value={formData.twitter_followers}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, twitter_followers: value }));
                sessionStorage.setItem('userFormData', JSON.stringify({
                  ...formData,
                  twitter_followers: value
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your follower count" />
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
          
          {/* Floating Save Button */}
          <TelegramFixedButtonContainer>
            <TelegramButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Saving..."
              text="Continue to Company Info"
              disabled={isSubmitting}
            />
          </TelegramFixedButtonContainer>
        </form>
      </div>
    </div>
  );
}