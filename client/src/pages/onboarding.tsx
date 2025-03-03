import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const onboardingSchema = z.object({
  bio: z.string().min(10).max(300),
  interests: z.string().min(3),
  collaborationTypes: z.string().min(3)
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function OnboardingForm() {
  const { toast } = useToast();
  const [isWebAppReady, setIsWebAppReady] = useState(false);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      bio: "",
      interests: "",
      collaborationTypes: ""
    }
  });

  useEffect(() => {
    // Check if we're in Telegram environment
    if (window.Telegram?.WebApp) {
      try {
        // Initialize WebApp
        window.Telegram.WebApp.ready();
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">Tell us about yourself to get started</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={!isWebAppReady}
            >
              Complete Profile
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}