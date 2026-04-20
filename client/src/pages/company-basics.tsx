import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { FixedBottomButton } from "@/components/ui/FixedBottomButton";

export default function CompanyBasics() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    website: "https://www.",
    twitter_url: "https://x.com/",
  });

  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        company_name: profileData.company.name || "",
        job_title: profileData.company.job_title || "",
        website: profileData.company.website || "https://www.",
        twitter_url: profileData.company.twitter_handle
          ? `https://x.com/${profileData.company.twitter_handle}`
          : "https://x.com/",
      });
    } else {
      const saved = sessionStorage.getItem("companyFormData");
      if (saved) setFormData(JSON.parse(saved));
    }
  }, [profileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.company_name ||
      !formData.job_title ||
      !formData.website ||
      !formData.twitter_url
    ) {
      toast({
        variant: "destructive",
        title: "A few fields to fill",
        description: "All fields are required.",
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userFormDataString = sessionStorage.getItem("userFormData");
      if (!userFormDataString) {
        throw new Error("Missing personal info. Start over.");
      }
      const userFormData = JSON.parse(userFormDataString);

      const applicationData = {
        first_name: userFormData.first_name,
        last_name: userFormData.last_name,
        linkedin_url: null,
        email: userFormData.email,
        twitter_url: userFormData.twitter_url,
        referral_code: userFormData.referralCode,

        company_name: formData.company_name.trim(),
        job_title: formData.job_title.trim(),
        company_website: formData.website.trim(),
        twitter_handle: formData.twitter_url
          .trim()
          .replace(/https?:\/\/(www\.)?(x\.com|twitter\.com)\//, ""),

        funding_stage: "Pre-seed",
        has_token: false,
        token_ticker: null,
        blockchain_networks: [],
        tags: [],
        company_linkedin_url: null,
        company_twitter_followers: null,
        twitter_followers: null,

        collabs_to_host: [],
        notification_frequency: "Daily",
        filtered_marketing_topics: [],
      };

      const telegramInitData = window.Telegram?.WebApp?.initData || "";
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": telegramInitData,
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      sessionStorage.removeItem("userFormData");
      sessionStorage.removeItem("companyFormData");
      setLocation("/application-status");

      toast({
        title: "Submitted",
        description: "We'll review and let you know — usually within a day.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't submit",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OnboardingHeader
        title="Your company"
        step={2}
        totalSteps={2}
        backUrl="/personal-info"
      />

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-xl font-semibold tracking-tight text-text leading-tight">
            Where do you work?
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            This is what hosts see when deciding to match. Be precise.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <Label htmlFor="company_name">Company name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="job_title">Your role</Label>
              <Input
                id="job_title"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
                required
                placeholder="Head of Marketing"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="twitter_url">Company Twitter</Label>
              <Input
                id="twitter_url"
                name="twitter_url"
                type="url"
                value={formData.twitter_url}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <FixedBottomButton
        type="button"
        onClick={handleSubmit}
        isLoading={isSubmitting}
        loadingText="Submitting…"
        text="Submit for review"
      />
    </div>
  );
}
