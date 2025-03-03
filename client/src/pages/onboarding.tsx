import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  bio: z.string().min(10).max(300),
  interests: z.string().min(3),
  collaborationTypes: z.string().min(3)
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function OnboardingForm() {
  const { toast } = useToast();
  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      bio: "",
      interests: "",
      collaborationTypes: ""
    }
  });

  async function onSubmit(data: OnboardingData) {
    try {
      const telegram = (window as any).Telegram.WebApp;
      
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          initData: telegram.initData
        })
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated!"
      });

      telegram.close();
    } catch (error) {
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

            <Button type="submit" className="w-full">
              Complete Profile
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
