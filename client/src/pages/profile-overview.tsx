import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type {
  User,
  Company,
  NotificationPreferences,
  MarketingPreferences,
  ConferencePreferences
} from "@shared/schema";
import { TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";

interface ProfileData {
  user: User;
  company: Company;
  // Keep preferences for backward compatibility
  preferences: any;
  notificationPreferences: NotificationPreferences;
  marketingPreferences: MarketingPreferences;
  conferencePreferences: ConferencePreferences;
}

export default function ProfileOverview() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Add scrolling functionality
  useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    // Modify for this page to allow scrolling
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
    
    // Add scrollable-page class to html and body
    document.documentElement.classList.add('scrollable-page');
    document.body.classList.add('scrollable-page');
    
    // Also fix the root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.overflow = 'auto';
      rootElement.style.height = 'auto';
      rootElement.style.position = 'static';
      rootElement.style.width = '100%';
    }
    
    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove('scrollable-page');
      document.body.classList.remove('scrollable-page');
      
      if (rootElement) {
        rootElement.style.overflow = '';
        rootElement.style.height = '';
        rootElement.style.position = '';
        rootElement.style.width = '';
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
    setIsSubmitting(true);

    try {
      if (!formData.first_name) {
        throw new Error("First name is required");
      }

      const submitData = {
        ...formData,
        telegram_id: profile.user.telegram_id,
        handle: profile.user.handle,
      };

      // The apiRequest function already returns the parsed JSON response
      const responseData = await apiRequest("/api/onboarding", "POST", submitData);
      
      // Log the response to see what we're getting back
      console.log("Profile update response:", responseData);
      
      if (responseData.success) {
        // Update the cache with current profile data to avoid refetching
        // We'll use the existing profile data since the server doesn't return the updated profile
        const currentProfileData = queryClient.getQueryData<ProfileData>(["/api/profile"]);
        if (currentProfileData) {
          // Update the user data with the submitted form data
          const updatedProfileData = {
            ...currentProfileData,
            user: {
              ...currentProfileData.user,
              ...formData
            }
          };
          // Update the cache directly
          queryClient.setQueryData(["/api/profile"], updatedProfileData);
        }
        
        toast({
          title: "Success!",
          description: responseData.message || "Profile updated successfully",
        });
        
        setLocation("/dashboard");
      } else {
        // Handle case where server returns success: false
        throw new Error(responseData.error || "Failed to update profile");
      }
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
        backUrl="/dashboard"
      />

      <div className="p-4 space-y-6">
        {/* Privacy Notice moved to top */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium mb-1">🔒 Privacy Protected</h3>
                <p className="text-sm text-muted-foreground">
                  Your personal information is <b><u>hidden</u></b> to others when matching, and is only shared after a successful mutual match. Only your company details are visible to others.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
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
                <Label htmlFor="twitter_url">Your Personal Twitter URL</Label>
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

              {/* Added space to account for fixed bottom button */}
              <div className="h-16"></div>
            </form>
          </CardContent>
        </Card>

        {/* Fixed position Save button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg z-50">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}