import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type {
  User,
  Company,
  NotificationPreferences,
  MarketingPreferences,
} from "@shared/schema";
import { TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { PageHeader } from "@/components/PageHeader";
import { FixedBottomButton } from "@/components/ui/FixedBottomButton";
import { Eyebrow } from "@/components/brand";

interface ProfileData {
  user: User;
  company: Company;
  preferences: any;
  notificationPreferences: NotificationPreferences;
  marketingPreferences: MarketingPreferences;
}

export default function ProfileOverview() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.width = "auto";
    document.body.style.height = "auto";
    document.documentElement.classList.add("scrollable-page");
    document.body.classList.add("scrollable-page");

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.overflow = "auto";
      rootElement.style.height = "auto";
      rootElement.style.position = "static";
      rootElement.style.width = "100%";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove("scrollable-page");
      document.body.classList.remove("scrollable-page");
      if (rootElement) {
        rootElement.style.overflow = "";
        rootElement.style.height = "";
        rootElement.style.position = "";
        rootElement.style.width = "";
      }
    };
  }, []);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    linkedin_url: "",
    email: "",
    twitter_url: "",
    twitter_followers: "",
  });

  useEffect(() => {
    if (profile?.user) {
      setFormData({
        first_name: profile.user.first_name,
        last_name: profile.user.last_name || "",
        linkedin_url: profile.user.linkedin_url || "",
        email: profile.user.email || "",
        twitter_url: profile.user.twitter_url || "",
        twitter_followers: profile.user.twitter_followers || "",
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-6 pt-14">
        <h1 className="text-xl font-semibold tracking-tight text-text">
          Profile not found
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Finish the signup flow to continue.
        </p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.first_name) throw new Error("First name is required");

      const submitData = {
        ...formData,
        telegram_id: profile.user.telegram_id,
        handle: profile.user.handle,
      };

      const responseData = await apiRequest(
        "/api/onboarding",
        "POST",
        submitData
      );

      if (responseData.success) {
        const current = queryClient.getQueryData<ProfileData>(["/api/profile"]);
        if (current) {
          queryClient.setQueryData(["/api/profile"], {
            ...current,
            user: { ...current.user, ...formData },
          });
        }
        toast({
          title: "Saved",
          description: responseData.message || "Profile updated.",
        });
        setLocation("/discover");
      } else {
        throw new Error(responseData.error || "Failed to update profile");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-background pb-28">
      <PageHeader title="Your profile" showBackButton backUrl="/dashboard" />

      <form onSubmit={handleSubmit} className="mx-auto max-w-md px-6 pt-6">
        <div className="flex items-start gap-3 rounded-md border border-hairline bg-surface px-3 py-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
          <p className="text-sm text-text-muted leading-snug">
            Your contact info is only shared after a mutual match. Until then
            hosts only see your company profile.
          </p>
        </div>

        <div className="mt-8">
          <Eyebrow tone="muted">Identity</Eyebrow>
        </div>

        <div className="mt-3 space-y-5">
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/…"
            />
          </div>

          <div>
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@company.com"
            />
          </div>

          <div className="pt-4">
            <Eyebrow tone="muted" className="mb-3">Reach</Eyebrow>
            <Label htmlFor="twitter_url">Personal Twitter</Label>
            <Input
              id="twitter_url"
              name="twitter_url"
              type="url"
              value={formData.twitter_url}
              onChange={handleInputChange}
              placeholder="https://x.com/username"
            />
          </div>

          <div>
            <Label htmlFor="twitter_followers">Personal Twitter followers</Label>
            <Select
              value={formData.twitter_followers}
              onValueChange={(value) =>
                handleSelectChange("twitter_followers", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
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
            <Label>Telegram handle</Label>
            <p className="text-sm text-text-muted tabular">
              @{profile.user.handle}
            </p>
          </div>
        </div>
      </form>

      <FixedBottomButton
        type="button"
        onClick={() => handleSubmit()}
        isLoading={isSubmitting}
        loadingText="Saving…"
        text="Save changes"
      />
    </div>
  );
}
