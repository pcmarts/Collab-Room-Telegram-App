import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COLLAB_TYPES,
  NOTIFICATION_FREQUENCIES,
  COMPANY_TAG_CATEGORIES,
} from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CollabPreferencesForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Check if we're in edit mode
  const isEditMode = window.location.search.includes("edit=true");

  // Fetch existing data if in edit mode
  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    enabled: isEditMode,
  });

  const [formData, setFormData] = useState({
    collabs_to_discover: [] as string[],
    notification_frequency: "",
    filtered_marketing_topics: [] as string[],
    twitter_collabs: [] as string[],
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (isEditMode && profileData) {
      const { preferences, notificationPreferences, marketingPreferences } = profileData;
      
      setFormData({
        // General notification preferences (use new data structure if available, fall back to old)
        notification_frequency: notificationPreferences?.notification_frequency || 
                                preferences?.notification_frequency || 
                                "Daily",
        
        // Marketing specific preferences
        collabs_to_discover: marketingPreferences?.collabs_to_discover || [],
        filtered_marketing_topics: marketingPreferences?.filtered_marketing_topics || [],
        twitter_collabs: marketingPreferences?.twitter_collabs || [],
      });
    }
  }, [isEditMode, profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (
        !formData.notification_frequency ||
        formData.collabs_to_discover.length === 0
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (isEditMode) {
        // For edit mode, update marketing preferences with new endpoint
        const response = await apiRequest("/api/marketing-preferences", "POST", {
          collabs_to_discover: formData.collabs_to_discover,
          filtered_marketing_topics: formData.filtered_marketing_topics,
          twitter_collabs: formData.twitter_collabs
        });

        if (!response.ok) {
          throw new Error("Failed to update marketing preferences");
        }
        
        // Update notification preferences
        const prefResponse = await apiRequest("/api/notification-preferences", "POST", {
          notification_frequency: formData.notification_frequency,
          notifications_enabled: true
        });
        
        if (!prefResponse.ok) {
          throw new Error("Failed to update notification settings");
        }

        await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });

        toast({
          title: "Success!",
          description: "Your marketing preferences have been updated",
          duration: 2000,
        });

        setLocation("/dashboard");
      } else {
        // For onboarding, submit all collected data
        const userFormData = JSON.parse(
          sessionStorage.getItem("userFormData") || "{}",
        );
        const companyFormData = JSON.parse(
          sessionStorage.getItem("companyFormData") || "{}",
        );
        const collabsFormData = JSON.parse(
          sessionStorage.getItem("collabsFormData") || "{}",
        );

        const submitData = {
          // User information
          first_name: userFormData.first_name,
          last_name: userFormData.last_name,
          handle: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || "",
          linkedin_url: userFormData.linkedin_url,
          email: userFormData.email,

          // Company information
          company_name: companyFormData.company_name,
          company_website: companyFormData.website,
          twitter_handle: companyFormData.twitter_url
            ?.replace("https://x.com/", "")
            .replace("@", ""),
          job_title: companyFormData.job_title,
          funding_stage: companyFormData.funding_stage,
          has_token: companyFormData.has_token,
          token_ticker: companyFormData.token_ticker,
          blockchain_networks: companyFormData.blockchain_networks,
          company_tags: companyFormData.tags,

          // General preferences
          notification_frequency: formData.notification_frequency,
          
          // Marketing preferences
          collabs_to_discover: formData.collabs_to_discover,
          collabs_to_host: collabsFormData.collabs_to_host || [],
          filtered_marketing_topics: formData.filtered_marketing_topics,

          // Telegram data
          initData: window.Telegram?.WebApp?.initData || "",
        };

        const response = await apiRequest(
          "/api/onboarding",
          "POST",
          submitData,
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to complete onboarding");
        }

        // Clear session storage after successful submission
        sessionStorage.removeItem("userFormData");
        sessionStorage.removeItem("companyFormData");
        sessionStorage.removeItem("collabsFormData");

        toast({
          title: "Application Submitted!",
          description:
            "We'll review your application and notify you through Telegram.",
          duration: 2000,
        });

        setLocation("/application-status");
      }
    } catch (error) {
      console.error("Failed to submit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit form",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMultiSelect = (collab: string) => {
    setFormData((prev) => ({
      ...prev,
      collabs_to_discover: prev.collabs_to_discover.includes(collab)
        ? prev.collabs_to_discover.filter((item) => item !== collab)
        : [...prev.collabs_to_discover, collab],
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const toggleExcludedTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      filtered_marketing_topics: prev.filtered_marketing_topics.includes(tag)
        ? prev.filtered_marketing_topics.filter((t) => t !== tag)
        : [...prev.filtered_marketing_topics, tag],
    }));
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="Collab Discovery"
        subtitle="Set your collaboration preferences"
        backUrl={isEditMode ? "/dashboard" : "/my-collabs"}
      />

      <div className="p-4 space-y-6">
        {!isEditMode && (
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            <div className="w-3 h-3 rounded-full bg-primary"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <Label className="text-lg">👀 Marketing Collabs</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select the types of collaboration opportunities you'd like to be notified about
              </p>
              <div className="grid grid-cols-1 gap-2">
                {COLLAB_TYPES.map(type => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.collabs_to_discover.includes(type) ? "default" : "outline"}
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => handleMultiSelect(type)}
                  >
                    <span className="text-left">{type}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <Label className="text-lg">🔍 Company Filter</Label>
              <p className="text-sm text-muted-foreground mb-4">
                By default, all company types are included in your discovery feed. Deselect any tags below to exclude those types of companies from your matches.
              </p>

              {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category} className="border rounded-lg overflow-hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full flex justify-between items-center p-4"
                    onClick={() => toggleCategory(category)}
                  >
                    <span className="font-medium">{category}</span>
                    {expandedCategories.includes(category) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {expandedCategories.includes(category) && (
                    <div className="p-4 pt-0 grid grid-cols-1 gap-2">
                      {tags.map(tag => (
                        <Button
                          key={tag}
                          type="button"
                          variant={formData.filtered_marketing_topics.includes(tag) ? "outline" : "default"}
                          className="justify-start h-auto py-3 px-4"
                          onClick={() => toggleExcludedTag(tag)}
                        >
                          <span className="text-left">{tag}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Label className="text-lg">📅 Notification Frequency</Label>
            <p className="text-sm text-muted-foreground mb-4">
              How often would you like to receive notifications about new opportunities?
            </p>
            <Select
              value={formData.notification_frequency}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  notification_frequency: value,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_FREQUENCIES.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}