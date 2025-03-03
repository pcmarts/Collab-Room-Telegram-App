import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { type OnboardingData, onboardingSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

const COLLAB_OPTIONS = [
  "Podcast Guest Appearances",
  "Twitter Spaces Guest",
  "Webinar Guest Appearance",
  "Keynote Speaking at Virtual Events",
  "Medium Guest Posts"
];

export default function OnboardingForm() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCollabsToDiscover, setSelectedCollabsToDiscover] = useState<string[]>([]);
  const [selectedCollabsToHost, setSelectedCollabsToHost] = useState<string[]>([]);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      handle: "",
      company_name: "",
      company_website: "https://",
      twitter_handle: "@",
      company_category: "Crypto",
      company_size: "1-10",
      notification_frequency: "Daily",
      collabs_to_discover: [],
      collabs_to_host: []
    }
  });

  const onSubmit = async (data: OnboardingData) => {
    try {
      setIsSubmitting(true);
      console.log('Form submitted with data:', data);

      // Prepare form data
      let formData = {
        ...data,
        collabs_to_discover: selectedCollabsToDiscover,
        collabs_to_host: selectedCollabsToHost
      };

      // Add Telegram initData if available
      if (window.Telegram?.WebApp) {
        formData = {
          ...formData,
          initData: window.Telegram.WebApp.initData
        };
      }

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      toast({
        title: "Success",
        description: "Your profile has been saved successfully!"
      });

      // Redirect to profile overview
      window.location.href = '/profile-overview';
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">Step {step} of 3</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram Handle</FormLabel>
                      <FormControl>
                        <Input placeholder="@username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter_handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Twitter Handle</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "Crypto", "NFT", "DeFi", "Web3 Gaming", "Memes & Culture",
                            "Bitcoin", "Solana", "Ethereum", "Creator Economy",
                            "Fundraising", "AI & Web3"
                          ].map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="200+">200+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Collaborations to Discover</Label>
                  <div className="grid gap-2">
                    {COLLAB_OPTIONS.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCollabsToDiscover.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCollabsToDiscover([...selectedCollabsToDiscover, option]);
                            } else {
                              setSelectedCollabsToDiscover(
                                selectedCollabsToDiscover.filter((item) => item !== option)
                              );
                            }
                          }}
                        />
                        <Label className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Collaborations to Host</Label>
                  <div className="grid gap-2">
                    {COLLAB_OPTIONS.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCollabsToHost.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCollabsToHost([...selectedCollabsToHost, option]);
                            } else {
                              setSelectedCollabsToHost(
                                selectedCollabsToHost.filter((item) => item !== option)
                              );
                            }
                          }}
                        />
                        <Label className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notification_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notification Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Instant">Instant</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>

        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 flex gap-4">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button
            type={step === 3 ? "submit" : "button"}
            onClick={() => {
              if (step === 3) {
                form.handleSubmit(onSubmit)();
              } else {
                setStep(step + 1);
              }
            }}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : step === 3 ? (
              "Complete Profile"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}