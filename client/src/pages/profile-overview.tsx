import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { User, Company, Preferences } from "@shared/schema";
import { TWITTER_FOLLOWER_COUNTS, TIMEZONES } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";

interface ProfileData {
  user: User;
  company: Company;
  preferences: Preferences;
}

export default function ProfileOverview() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

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
    timezone: "",
  });

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile?.user) {
      setFormData({
        first_name: profile.user.first_name,
        last_name: profile.user.last_name || "",
        linkedin_url: profile.user.linkedin_url || "",
        email: profile.user.email || "",
        twitter_url: profile.user.twitter_url || "",
        twitter_followers: profile.user.twitter_followers || "",
        timezone: profile.user.timezone || "",
      });
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground">
          Please complete the onboarding process.
        </p>
        <Button className="mt-4" onClick={() => setLocation("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (!formData.first_name) {
        throw new Error("First name is required");
      }

      const submitData = {
        ...formData,
        handle: profile.user.handle,
        initData: window.Telegram?.WebApp?.initData || "",
      };

      const response = await apiRequest("/api/onboarding", "POST", submitData);

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });

      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });

      setLocation("/dashboard");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="My Profile"
        subtitle="Edit your profile details"
        backUrl="/dashboard"
      />

      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <Label htmlFor="email">Work Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="twitter_url">Your Peronal Twitter URL</Label>
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
                <Label htmlFor="twitter_followers">Personal Twitter Followers</Label>
                <Select
                  value={formData.twitter_followers}
                  onValueChange={(value) => handleSelectChange("twitter_followers", value)}
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
                <Label>Telegram Handle</Label>
                <p className="text-sm text-muted-foreground">
                  @{profile.user.handle}
                </p>
              </div>

              <div>
                <Label htmlFor="timezone" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Your Timezone
                </Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleSelectChange("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Your timezone helps us better match you for coffee meetings and collaboration opportunities
                </p>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy Notice moved to bottom */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">Privacy Protected</h3>
                <p className="text-sm text-muted-foreground">
                  When matching, only your company details are visible to others. Your personal information hidden, and is only shared after a successful mutual match.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}