import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { FixedBottomButton } from "@/components/ui/FixedBottomButton";
import { Eyebrow } from "@/components/brand";

export default function PersonalInfo() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const telegramData = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const telegramUsername = telegramData?.username || "Not available";

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    twitter_url: "https://x.com/",
  });

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name || "",
        email: profileData.user.email || "",
        twitter_url: profileData.user.twitter_url || "https://x.com/",
      });
    } else {
      const saved = sessionStorage.getItem("userFormData");
      if (saved) setFormData(JSON.parse(saved));
    }
  }, [profileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    sessionStorage.setItem("userFormData", JSON.stringify(next));
  };

  const handleNext = () => {
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        variant: "destructive",
        title: "A few fields to fill",
        description: "Name and email are required.",
        duration: 2000,
      });
      return;
    }

    const referralCode = sessionStorage.getItem("referralCode");
    const complete = {
      ...formData,
      linkedin_url: null,
      referralCode: referralCode || null,
    };
    sessionStorage.setItem("userFormData", JSON.stringify(complete));
    setLocation("/company-basics");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OnboardingHeader
        title="Your details"
        step={1}
        totalSteps={2}
        backUrl="/welcome"
      />

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32">
        <div className="mx-auto w-full max-w-md">
          <Eyebrow tone="muted">About you</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text leading-tight">
            Who are you?
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            We'll show this to hosts after a match — never before.
          </p>

          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <Label htmlFor="twitter_url">Personal Twitter</Label>
              <Input
                id="twitter_url"
                name="twitter_url"
                type="url"
                value={formData.twitter_url}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="telegram_username">Telegram handle</Label>
              <Input
                id="telegram_username"
                value={`@${telegramUsername}`}
                disabled
                readOnly
              />
              <p className="mt-1.5 text-xs text-text-subtle">
                Pulled from Telegram. Can't be edited here.
              </p>
            </div>
          </div>
        </div>
      </div>

      <FixedBottomButton
        type="button"
        onClick={(e) => {
          e.preventDefault();
          handleNext();
        }}
        text="Continue"
      />
    </div>
  );
}
