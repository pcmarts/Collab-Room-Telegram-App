import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowUp, ArrowDown, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { useFormNavigation } from "@/hooks/use-form-navigation";

export default function ApplicationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const { formRef, navigateToNext, navigateToPrevious } = useFormNavigation({
    onDone: () => handleNext()
  });

  // Fetch profile data to check if user has already applied
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  // Check if user has already applied and redirect if necessary
  useEffect(() => {
    if (!isLoading && profileData?.user) {
      // If the user has already applied, redirect them to application status
      setLocation('/application-status');
    }
  }, [profileData, isLoading]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    linkedin_url: 'https://linkedin.com/in/',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
  };

  const handleNext = () => {
    if (!formData.first_name || !formData.last_name || !formData.linkedin_url || !formData.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
        duration: 2000
      });
      return;
    }

    sessionStorage.setItem('userFormData', JSON.stringify(formData));
    setLocation('/company-info');
  };

  // Show loading state while checking profile
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
          <div className="w-3 h-3 rounded-full bg-primary/50"></div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Join the Network</h1>
          <p className="text-muted-foreground mt-2">
            Apply to join our exclusive Web3 collaboration network
          </p>
        </div>

        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              type="text"
              inputMode="text"
              autoComplete="given-name"
              required
            />
          </div>

          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              type="text"
              inputMode="text"
              autoComplete="family-name"
              required
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL *</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              inputMode="url"
              autoComplete="url"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Company Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              inputMode="email"
              autoComplete="email"
              placeholder="your@company.com"
              required
            />
          </div>
        </form>

        {/* Floating Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={navigateToPrevious}
            className="w-full"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={navigateToNext}
            className="w-full"
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Next
          </Button>
          <Button
            type="submit"
            size="sm"
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Done
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}