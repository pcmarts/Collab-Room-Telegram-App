import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { COMPANY_TAG_CATEGORIES } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/layout/PageHeader";

export default function MatchingFilters() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Fetch existing data
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    excluded_tags: [] as string[]
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (profileData?.preferences) {
      setFormData({
        excluded_tags: profileData.preferences.excluded_tags || []
      });
    }
  }, [profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const submitData = {
        ...profileData?.preferences,
        excluded_tags: formData.excluded_tags
      };

      const response = await apiRequest('POST', '/api/preferences', submitData);

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Success!",
        description: "Your matching filters have been updated",
        duration: 2000
      });

      setLocation('/dashboard');

    } catch (error) {
      console.error('Failed to submit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleExcludedTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      excluded_tags: prev.excluded_tags.includes(tag)
        ? prev.excluded_tags.filter(t => t !== tag)
        : [...prev.excluded_tags, tag]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="Matching Filters"
        subtitle="Control what matches you see"
        backUrl="/dashboard"
      />

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
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
                        variant={formData.excluded_tags.includes(tag) ? "outline" : "default"}
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
