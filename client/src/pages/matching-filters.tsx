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
    // Conference preferences removed as part of simplification
  });

  // Conference preferences removed as part of simplification
  useEffect(() => {
    // No longer needed - conference preferences removed
  }, [profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Conference preferences removed - this page is no longer functional
      
      toast({
        title: "Feature Removed",
        description: "Conference matching filters have been removed from the system",
        duration: 3000
      });

      setLocation('/dashboard');

    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Feature has been removed from the system."
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
    // Conference preferences removed - no longer functional
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
        title="Feature Removed"
        subtitle="Conference matching has been removed"
        backUrl="/dashboard"
      />

      <div className="p-4 space-y-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Conference matching and event attendance features have been removed from the platform as part of a simplification process.
          </p>
          <p className="text-muted-foreground">
            This page is no longer functional and will be removed in future updates.
          </p>
          <Button
            onClick={() => setLocation('/dashboard')}
            className="w-full mt-6"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
