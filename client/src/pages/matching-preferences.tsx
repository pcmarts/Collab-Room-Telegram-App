import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, Company, Preferences } from "@shared/schema";

interface ProfileData {
  user: User;
  company: Company;
  preferences: Preferences;
}

export default function MatchingPreferences() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const [preferences, setPreferences] = useState({
    blockchain_preferences: [],
    collaboration_type: "",
    project_size: "",
    team_size: "",
    required_expertise: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const response = await apiRequest("/api/preferences", "POST", {
        ...preferences,
        user_id: profile?.user?.id,
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });

      toast({
        title: "Success!",
        description: "Matching preferences updated successfully",
      });

      setLocation("/dashboard");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update preferences",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        title="Matching Preferences"
        subtitle="Set your collaboration preferences"
        backUrl="/dashboard"
      />

      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Set Your Matching Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium">Blockchain Preferences</label>
                <Select
                  value={preferences.blockchain_preferences[0]}
                  onValueChange={(value) =>
                    setPreferences((prev) => ({
                      ...prev,
                      blockchain_preferences: [value],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="solana">Solana</SelectItem>
                    <SelectItem value="polkadot">Polkadot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Collaboration Type</label>
                <Select
                  value={preferences.collaboration_type}
                  onValueChange={(value) =>
                    setPreferences((prev) => ({
                      ...prev,
                      collaboration_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collaboration type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project Based</SelectItem>
                    <SelectItem value="ongoing">Ongoing Partnership</SelectItem>
                    <SelectItem value="advisory">Advisory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Project Size</label>
                <Select
                  value={preferences.project_size}
                  onValueChange={(value) =>
                    setPreferences((prev) => ({
                      ...prev,
                      project_size: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-3 months)</SelectItem>
                    <SelectItem value="medium">Medium (3-6 months)</SelectItem>
                    <SelectItem value="large">Large (6+ months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Save Preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
