import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState, useCallback } from "react";
import { type OnboardingData, onboardingSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface OnboardingFormProps {
  isEditMode?: boolean;
}

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

const STORAGE_KEY = 'onboarding_data';

const COLLAB_OPTIONS = [
  "Podcast Guest Appearances",
  "Twitter Spaces Guest",
  "Webinar Guest Appearance",
  "Keynote Speaking at Virtual Events",
  "Keynote Speaking at Real Events",
  "Medium Guest Posts",
  "Newsletter Features or Guest Posts",
  "Report and Research Features",
  "Co-Marketing on Twitter"
];

const COMPANY_CATEGORIES = [
  "Crypto", "NFT", "DeFi", "Web3 Gaming", "Memes & Culture", "Bitcoin",
  "Solana", "Ethereum", "Creator Economy", "Fundraising", "AI & Web3",
  "Infrastructure", "DAOs", "Metaverse", "DEXs & Trading",
  "Stablecoins & Payments", "Real World Assets (RWA)", "SocialFi",
  "Identity & Privacy", "Security & Auditing", "Interoperability & Bridges",
  "Data & Oracles", "ReFi (Regenerative Finance)", "Decentralized Compute & Storage"
];

const GEOGRAPHIC_FOCUS = [
  "Global", "North America", "Europe", "Asia",
  "Latin America", "Africa", "Middle East", "Australia"
];

export default function OnboardingForm({ isEditMode = false }: OnboardingFormProps) {
  const { toast } = useToast();
  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCollabsToDiscover, setSelectedCollabsToDiscover] = useState<string[]>([]);
  const [selectedCollabsToHost, setSelectedCollabsToHost] = useState<string[]>([]);

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      telegram_handle: "",
      linkedin_url: "https://www.linkedin.com/in/",
      email: "",
      company_name: "",
      job_title: "",
      company_website: "https://",
      twitter_handle: "@",
      company_linkedin: "https://www.linkedin.com/company/",
      company_telegram: "https://t.me/",
      notification_frequency: "Daily",
      additional_opportunities: "",
      collabs_to_discover: [],
      collabs_to_host: []
    }
  });

  // Load saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setSelectedCollabsToDiscover(data.collabs_to_discover || []);
        setSelectedCollabsToHost(data.collabs_to_host || []);
        Object.keys(data).forEach(key => {
          if (key !== 'collabs_to_discover' && key !== 'collabs_to_host') {
            form.setValue(key as keyof OnboardingData, data[key]);
          }
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Load existing profile data in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchProfile = async () => {
        try {
          if (!window.Telegram?.WebApp) return;

          const response = await fetch(`/api/profile?initData=${encodeURIComponent(window.Telegram.WebApp.initData)}`);
          if (!response.ok) throw new Error('Failed to fetch profile');

          const { user, company, preferences } = await response.json();

          // Set form values
          form.reset({
            first_name: user.first_name,
            last_name: user.last_name,
            telegram_handle: user.handle,
            linkedin_url: user.linkedin_url,
            email: user.email,
            company_name: company.name,
            job_title: company.job_title,
            company_website: company.website,
            twitter_handle: company.twitter_handle,
            company_linkedin: company.linkedin_url,
            company_telegram: company.telegram_group,
            company_category: company.category,
            company_size: company.size,
            funding_stage: company.funding_stage,
            geographic_focus: company.geographic_focus,
            notification_frequency: preferences.notification_frequency,
            additional_opportunities: preferences.additional_opportunities
          });

          // Set collaboration preferences
          setSelectedCollabsToDiscover(preferences.collabs_to_discover);
          setSelectedCollabsToHost(preferences.collabs_to_host);
        } catch (error) {
          console.error('Error fetching profile:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load profile data"
          });
        }
      };

      fetchProfile();
    }
  }, [isEditMode, form, toast]);

  // Save form data on change
  useEffect(() => {
    const saveData = () => {
      try {
        const formData = form.getValues();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...formData,
          collabs_to_discover: selectedCollabsToDiscover,
          collabs_to_host: selectedCollabsToHost
        }));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };

    const subscription = form.watch(saveData);
    return () => subscription.unsubscribe();
  }, [selectedCollabsToDiscover, selectedCollabsToHost]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        setIsWebAppReady(true);
      } catch (error) {
        console.error('Failed to initialize Telegram WebApp:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize Telegram WebApp"
        });
      }
    }
  }, [toast]);

  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const isCurrentStepValid = useCallback(() => {
    const currentErrors = form.formState.errors;

    switch (step) {
      case 1:
        return !['first_name', 'last_name', 'telegram_handle', 'linkedin_url']
          .some(field => currentErrors[field as keyof OnboardingData]);
      case 2:
        return ![
          'company_name', 'job_title', 'company_website', 'twitter_handle',
          'company_linkedin', 'company_category', 'company_size', 'funding_stage',
          'geographic_focus'
        ].some(field => currentErrors[field as keyof OnboardingData]);
      case 3:
        return selectedCollabsToDiscover.length > 0 && selectedCollabsToHost.length > 0;
      default:
        return false;
    }
  }, [form.formState.errors, step, selectedCollabsToDiscover, selectedCollabsToHost]);

  const handleSubmit = useCallback(async (data: OnboardingData) => {
    try {
      setIsSubmitting(true);
      console.log('Form submission started', { data, selectedCollabsToDiscover, selectedCollabsToHost });

      if (!window.Telegram?.WebApp) {
        throw new Error("Not in Telegram WebApp environment");
      }

      if (selectedCollabsToDiscover.length === 0 || selectedCollabsToHost.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select at least one option for both collaboration types."
        });
        return;
      }

      const formData = {
        ...data,
        collabs_to_discover: selectedCollabsToDiscover,
        collabs_to_host: selectedCollabsToHost,
        initData: window.Telegram.WebApp.initData
      };

      console.log('Sending form data to server:', formData);

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      console.log('Form submission successful');
      localStorage.removeItem(STORAGE_KEY);

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
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [toast, selectedCollabsToDiscover, selectedCollabsToHost]);

  const handleNextStep = useCallback(async () => {
    if (step === 3) {
      // For the final step, trigger form submission
      if (isCurrentStepValid()) {
        await form.handleSubmit(handleSubmit)();
      }
    } else {
      // For other steps, validate and move to next step
      const fieldsToValidate: (keyof OnboardingData)[] = step === 1
        ? ['first_name', 'last_name', 'telegram_handle', 'linkedin_url']
        : ['company_name', 'job_title', 'company_website', 'twitter_handle',
           'company_linkedin', 'company_category', 'company_size', 'funding_stage',
           'geographic_focus'];

      const isValid = await form.trigger(fieldsToValidate);
      if (isValid) {
        setStep(prev => prev + 1);
      }
    }
  }, [step, form, handleSubmit, isCurrentStepValid]);

  const prevStep = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 pb-40">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Profile' : 'Complete Your Profile'}</h1>
            <p className="text-muted-foreground mt-2">Step {step} of 3</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Personal Information</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} onFocus={handleFocus} />
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
                            <Input {...field} onFocus={handleFocus} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="telegram_handle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram Handle</FormLabel>
                        <FormControl>
                          <Input placeholder="@username" {...field} onFocus={handleFocus} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile</FormLabel>
                        <FormControl>
                          <Input {...field} onFocus={handleFocus} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} onFocus={handleFocus} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Company Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Company Information</h2>

                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} onFocus={handleFocus} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title / Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Founder, CMO" {...field} onFocus={handleFocus} />
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
                            {COMPANY_CATEGORIES.map((category) => (
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

                  <div className="grid grid-cols-2 gap-4">
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

                    <FormField
                      control={form.control}
                      name="funding_stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Stage</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                              <SelectItem value="Seed">Seed</SelectItem>
                              <SelectItem value="Series A">Series A</SelectItem>
                              <SelectItem value="Series B+">Series B+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="geographic_focus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geographic Focus</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GEOGRAPHIC_FOCUS.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="company_website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input {...field} onFocus={handleFocus} />
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
                          <FormLabel>Twitter Handle</FormLabel>
                          <FormControl>
                            <Input {...field} onFocus={handleFocus} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company LinkedIn</FormLabel>
                          <FormControl>
                            <Input {...field} onFocus={handleFocus} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company_telegram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telegram Group (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} onFocus={handleFocus} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Collaboration Preferences */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Collaboration Preferences</h2>

                  <div className="space-y-4">
                    <Label className="text-base">Collaborations to Discover</Label>
                    <div className="grid grid-cols-1 gap-2">
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
                    <Label className="text-base">Collaborations to Host</Label>
                    <div className="grid grid-cols-1 gap-2">
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

                  <FormField
                    control={form.control}
                    name="additional_opportunities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Collaboration Opportunities (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about other collaboration types you're interested in..."
                            {...field}
                            onFocus={handleFocus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 flex gap-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1"
                  disabled={!isWebAppReady || !isCurrentStepValid() || isSubmitting}
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
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}