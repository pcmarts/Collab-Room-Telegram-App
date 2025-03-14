import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { TWITTER_FOLLOWER_COUNTS } from "../../../shared/schema";

export default function PersonalInfo() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  const { data: profileData } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    linkedin_url: 'https://linkedin.com/in/',
    email: '',
    twitter_url: 'https://x.com/',
    twitter_followers: ''
  });

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        first_name: profileData.user.first_name,
        last_name: profileData.user.last_name || '',
        linkedin_url: profileData.user.linkedin_url || 'https://linkedin.com/in/',
        email: profileData.user.email || '',
        twitter_url: profileData.user.twitter_url || 'https://x.com/',
        twitter_followers: profileData.user.twitter_followers || ''
      });
    } else {
      const savedData = sessionStorage.getItem('userFormData');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    }
  }, [profileData]);

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
    setLocation('/company-basics');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Compact header section */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/apply')}
            className="flex items-center p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="w-2 h-2 rounded-full bg-primary/50"></div>
          <div className="w-2 h-2 rounded-full bg-primary/50"></div>
          <div className="w-2 h-2 rounded-full bg-primary/50"></div>
        </div>

        {/* Compact header text */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">Tell Us About Yourself</h1>
          <p className="text-sm text-muted-foreground">Share your details to help us know you better</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-3 pb-20">
          <div>
            <Label htmlFor="first_name" className="text-sm">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              required
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="last_name" className="text-sm">Last Name *</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url" className="text-sm">LinkedIn URL *</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              required
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm">Company Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="twitter_url" className="text-sm">My Personal Twitter URL</Label>
            <Input
              id="twitter_url"
              name="twitter_url"
              type="url"
              value={formData.twitter_url}
              onChange={handleInputChange}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="twitter_followers" className="text-sm">My Twitter Follower Count</Label>
            <Select
              value={formData.twitter_followers}
              onValueChange={(value) => {
                const newFormData = {
                  ...formData,
                  twitter_followers: value
                };
                setFormData(newFormData);
                sessionStorage.setItem('userFormData', JSON.stringify(newFormData));
              }}
            >
              <SelectTrigger className="h-9">
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

          {/* Floating Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border shadow-lg">
            <Button
              type="submit"
              className="w-full h-9"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to Company Info"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}