import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { COMPANY_TAG_CATEGORIES } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { TelegramButton, TelegramFixedButtonContainer } from "@/components/ui/telegram-button";
import { applyButtonFix } from "@/App";

// Type helper for tag strings
type TagString = string;

export default function CompanySector() {
  const { toast } = useToast();

  const [_, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    company_tags: [] as string[]
  });

  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        company_tags: profileData.company.tags || []
      });
    } else {
      const savedData = sessionStorage.getItem('companySectorData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [profileData]);
  
  // Apply button fix when component mounts and after any render
  useEffect(() => {
    // Apply immediately on mount
    applyButtonFix();
    
    // Set up interval to keep applying the fix
    const fixInterval = setInterval(() => {
      applyButtonFix();
    }, 300);
    
    // Cleanup on unmount
    return () => clearInterval(fixInterval);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.company_tags.includes(tag)
        ? prev.company_tags.filter(t => t !== tag)
        : [...prev.company_tags, tag];
      return { ...prev, company_tags: newTags };
    });
  };

  const clearCategorySelections = (category: string) => {
    const tags = COMPANY_TAG_CATEGORIES[category] as readonly string[];
    setFormData(prev => ({
      ...prev,
      company_tags: prev.company_tags.filter(tag => 
        !tags.includes(tag)
      )
    }));
  };

  const handleNext = () => {
    if (!formData.company_tags.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one company sector",
        duration: 2000
      });
      return;
    }

    sessionStorage.setItem('companySectorData', JSON.stringify(formData));
    setLocation('/company-details');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      <OnboardingHeader
        title="Company Sector"
        subtitle=""
        step={0}
        totalSteps={0}
        backUrl="/company-basics"
      />

      {/* Scrollable container */}
      <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        <div className="max-w-md mx-auto space-y-8 w-full">
          <div className="space-y-4 pb-32">
            {/* Display total selections count if any */}
            {formData.company_tags.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <Badge variant="secondary" className="text-xs">
                  {formData.company_tags.length} {formData.company_tags.length === 1 ? 'sector' : 'sectors'} selected
                </Badge>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFormData({ company_tags: [] })}
                >
                  Clear all
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                <Card key={category} className="border rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-accent"
                    onClick={() => toggleCategory(category)}
                  >
                    <h3 className="font-medium">{category}</h3>
                    <div className="flex items-center gap-2">
                      {/* Category-specific selection count */}
                      {formData.company_tags.filter(tag => (tags as readonly string[]).includes(tag)).length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {formData.company_tags.filter(tag => (tags as readonly string[]).includes(tag)).length}
                        </Badge>
                      )}
                      {expandedCategories.includes(category) ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </div>
                  </div>

                  {/* Category content */}
                  {expandedCategories.includes(category) && (
                    <CardContent className="pt-2">
                      {/* Clear category button */}
                      {formData.company_tags.some(tag => (tags as readonly string[]).includes(tag)) && (
                        <div className="flex justify-end mb-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => clearCategorySelections(category)}
                          >
                            Clear
                          </Button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-2">
                        {(tags as readonly string[]).map(tag => (
                          <Button
                            key={tag}
                            type="button"
                            variant={formData.company_tags.includes(tag) ? "default" : "outline"}
                            className="h-auto py-2 px-3 justify-start text-left font-normal w-full"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Button container directly at the root level - outside any form or scrollable container */}
      <TelegramFixedButtonContainer>
        <TelegramButton
          type="button"
          onClick={handleNext}
          text="Continue to Company Details"
        />
      </TelegramFixedButtonContainer>
    </div>
  );
}