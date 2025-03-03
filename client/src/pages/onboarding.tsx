import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        close: () => void;
        initData: string;
        expand: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
      };
    };
  }
}

const onboardingSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters").max(300, "Bio must be less than 300 characters"),
  interests: z.string().min(3, "Please enter at least one interest"),
  collaborationTypes: z.string().min(3, "Please enter at least one collaboration type"),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional(),
  companyName: z.string().min(2, "Company name is required").optional(),
  companyWebsite: z.string().url("Please enter a valid website URL").optional(),
  companyIndustry: z.string().min(2, "Please select an industry").optional()
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function OnboardingForm() {
  const { toast } = useToast();
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      bio: "",
      interests: "",
      collaborationTypes: "",
      linkedinUrl: "https://www.linkedin.com/in/",
      companyName: "",
      companyWebsite: "https://",
      companyIndustry: ""
    }
  });

  useEffect(() => {
    // Check if we're in Telegram environment
    if (window.Telegram?.WebApp) {
      try {
        // Initialize WebApp
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand(); // Expand the WebApp to full height
        setIsWebAppReady(true);
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize Telegram WebApp"
        });
      }
    } else {
      // We're not in Telegram environment
      console.log('Not in Telegram WebApp environment');
    }
  }, [toast]);

  async function onSubmit(data: OnboardingData) {
    try {
      if (!window.Telegram?.WebApp) {
        throw new Error("Not in Telegram WebApp environment");
      }

      const { WebApp } = window.Telegram;

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          initData: WebApp.initData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated!"
      });

      // Close the WebApp after a short delay to show the success message
      setTimeout(() => {
        WebApp.close();
      }, 1500);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again."
      });
    }
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else form.handleSubmit(onSubmit)();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Handle input focus to scroll the element into view
  const handleFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-32"> {/* Added bottom padding to prevent last input from being hidden */}
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-muted-foreground mt-2">Step {step} of 3</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your experience in Web3..."
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.linkedin.com/in/your-profile"
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your company name"
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://your-company.com"
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyIndustry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., DeFi, NFT, Gaming"
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interests</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="DeFi, NFTs, DAOs (comma separated)"
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collaborationTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Collaboration Types</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Development, Marketing, Content (comma separated)"
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex gap-4 sticky bottom-4 bg-background p-4 -mx-4 border-t">
                {step > 1 && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                <Button 
                  type={step === 3 ? "submit" : "button"}
                  onClick={step === 3 ? undefined : nextStep}
                  className="flex-1"
                  disabled={!isWebAppReady}
                >
                  {step === 3 ? "Complete Profile" : "Next"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}