import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { COMPANY_TAG_CATEGORIES } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CompanySector() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

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

  const toggleTag = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.company_tags.includes(tag)
        ? prev.company_tags.filter(t => t !== tag)
        : [...prev.company_tags, tag];
      return { ...prev, company_tags: newTags };
    });
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

    // Store form data and proceed to next step
    sessionStorage.setItem('companySectorData', JSON.stringify(formData));
    setLocation('/company-details');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/company-basics')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Company Sector</h1>
          <p className="text-muted-foreground mt-2">Select your company's sectors and technologies</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <div className="space-y-4">
            <Label>Company Sectors *</Label>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                <div key={category} className="mb-4">
                  <h3 className="font-medium mb-2">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge
                        key={tag}
                        variant={formData.company_tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to Company Details"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}