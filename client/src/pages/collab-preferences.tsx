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
import { Eyebrow } from "@/components/brand";

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
        
        // No need to update notification preferences here, that's only done in dashboard

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
          // Create a user handle - either use Telegram username or generate one from ID
          handle: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 
                 (window.Telegram?.WebApp?.initDataUnsafe?.user?.id ? 
                  `user_${window.Telegram?.WebApp?.initDataUnsafe?.user?.id.toString().substring(0, 8)}` : 
                  undefined),
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

      <div className="px-6 pt-6 pb-10 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <Eyebrow tone="muted">Discovery</Eyebrow>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-text leading-tight">
              Marketing collabs
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Pick the types you want surfaced in your feed.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {COLLAB_TYPES.map((type) => {
                const selected = formData.collabs_to_discover.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleMultiSelect(type)}
                    className={`flex h-11 items-center justify-start rounded-md px-3 text-sm font-medium transition-colors duration-fast ease-out ${
                      selected
                        ? "bg-brand text-brand-fg"
                        : "border border-hairline text-text hover:bg-surface"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <Eyebrow tone="muted">Filters</Eyebrow>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-text leading-tight">
              Company filter
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              All company types are included by default. Deselect any to exclude
              them from matches.
            </p>

            <div className="mt-4 space-y-2">
              {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => {
                const isOpen = expandedCategories.includes(category);
                return (
                  <div
                    key={category}
                    className="overflow-hidden rounded-md border border-hairline"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex w-full items-center justify-between px-3 py-3 text-left transition-colors duration-fast ease-out hover:bg-surface"
                    >
                      <span className="text-sm font-medium text-text">
                        {category}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="border-t border-hairline p-2">
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag) => {
                            const excluded =
                              formData.filtered_marketing_topics.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleExcludedTag(tag)}
                                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ease-out ${
                                  excluded
                                    ? "border border-hairline text-text-subtle line-through"
                                    : "bg-brand text-brand-fg"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <Eyebrow tone="muted">Cadence</Eyebrow>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-text leading-tight">
              Notification frequency
            </h2>
            <p className="mt-1 mb-4 text-sm text-text-muted">
              How often we ping you about new opportunities.
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
          </section>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
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