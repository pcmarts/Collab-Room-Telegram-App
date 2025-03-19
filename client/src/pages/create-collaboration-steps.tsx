import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { LoadingScreen } from "@/components/LoadingScreen";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/layout/PageHeader";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

import {
  AUDIENCE_SIZE_RANGES,
  COLLAB_TYPES,
  COLLAB_TOPICS,
  COMPANY_CATEGORIES,
  COMPANY_TAG_CATEGORIES,
  ALL_COMPANY_TAGS,
  FUNDING_STAGES,
  TWITTER_FOLLOWER_COUNTS,
  TWITTER_COLLAB_TYPES,
  BLOCKCHAIN_NETWORKS,
  BLOCKCHAIN_NETWORK_CATEGORIES,
  createCollaborationSchema,
  type CreateCollaboration,
} from "@shared/schema";

interface CreateCollaborationProps {
  id?: string;
}

export default function CreateCollaborationSteps({
  id,
}: CreateCollaborationProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCollabType, setSelectedCollabType] = useState<string>(
    COLLAB_TYPES[0],
  );

  // Initialize with basic form data
  const form = useForm<CreateCollaboration>({
    resolver: zodResolver(createCollaborationSchema),
    defaultValues: {
      collab_type: COLLAB_TYPES[0],
      date_type: "specific_date",
      specific_date: new Date().toISOString().split("T")[0],
      topics: [],
      is_free_collab: true,
      filter_company_sectors_enabled: false,
      filter_company_followers_enabled: false,
      filter_user_followers_enabled: false,
      filter_funding_stages_enabled: false,
      filter_token_status_enabled: false,
      filter_blockchain_networks_enabled: false,
      required_company_sectors: [],
      required_funding_stages: [],
      required_token_status: false,
      required_blockchain_networks: [],
      min_company_followers: TWITTER_FOLLOWER_COUNTS[0],
      min_user_followers: TWITTER_FOLLOWER_COUNTS[0],
      details: {},
    },
  });

  // When collaboration type changes
  const handleCollabTypeChange = (value: string) => {
    setSelectedCollabType(value);
    form.setValue("collab_type", value as (typeof COLLAB_TYPES)[number]);

    // Reset details to avoid field bleeding
    let newDetails = {};

    // Set proper initial values based on type
    switch (value) {
      case "Podcast Guest Appearance":
        newDetails = {
          podcast_name: "",
          short_description: "",
          podcast_description: "",
          podcast_link: "",
          estimated_reach: AUDIENCE_SIZE_RANGES[0],
        };
        break;
      case "Twitter Spaces Guest":
        newDetails = {
          twitter_handle: "https://x.com/",
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0],
          topic: "",
          short_description: "",
        };
        break;
      case "Live Stream Guest Appearance":
        newDetails = {
          title: "",
          short_description: "",
          date_selection: "any_future_date",
          specific_date: "",
          previous_stream_link: "",
          expected_audience_size: AUDIENCE_SIZE_RANGES[0],
          topics: [],
        };
        break;
      case "Report & Research Feature":
        newDetails = {
          research_topic: [],
          target_audience: "",
          estimated_release_date: "",
        };
        break;
      case "Newsletter Feature":
        newDetails = {
          newsletter_name: "",
          topics: [],
          audience_reach: AUDIENCE_SIZE_RANGES[0],
          short_description: "",
          newsletter_description: "",
          newsletter_url: "",
          total_subscribers: AUDIENCE_SIZE_RANGES[0],
        };
        break;
      case "Blog Post Feature":
        newDetails = {
          blog_topic: "",
          blog_link: "",
          blog_name: "",
          blog_url: "",
          est_readers: AUDIENCE_SIZE_RANGES[0],
          short_description: "",
          estimated_release_date: "",
        };
        break;
      case "Co-Marketing on Twitter":
        newDetails = {
          twittercomarketing_type: ["Tweet"],
          host_twitter_handle: "https://x.com/",
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0],
          short_description: "",
        };
        break;
      default:
        newDetails = {
          podcast_name: "",
          short_description: "",
          podcast_link: "",
        };
    }

    form.setValue("details", newDetails as any);
  };

  // Move to next step
  const nextStep = () => {
    // Validate current step
    const stepValid = validateCurrentStep();
    
    if (!stepValid) {
      return;
    }

    const activeSteps = getActiveSteps();
    
    // If we're on the last step, submit the form
    if (currentStep >= activeSteps.length - 1) {
      // Submit the form if on the last step
      handleSubmit();
    } else {
      // Otherwise move to the next step
      setCurrentStep(currentStep + 1);
    }
  };

  // Validation for the current step
  const validateCurrentStep = () => {
    const activeSteps = getActiveSteps();
    if (currentStep < 0 || currentStep >= activeSteps.length) {
      return false;
    }
    
    const currentStepId = activeSteps[currentStep].id;
    
    // Validate based on the field ID
    switch (currentStepId) {
      case "collab_type":
        const type = form.getValues("collab_type");
        if (!type) {
          toast({
            title: "Please select a collaboration type",
            variant: "destructive",
          });
          return false;
        }
        break;
        
      case "topics":
        const topics = form.getValues("topics");
        if (!topics || !Array.isArray(topics) || topics.length === 0) {
          toast({
            title: "Please select at least one topic",
            variant: "destructive",
          });
          return false;
        }
        break;
      
      // Type-specific validations
      case "podcast_name":
        const podcastName = form.getValues("details.podcast_name");
        if (!podcastName || podcastName.trim() === "") {
          toast({
            title: "Please enter a podcast name",
            variant: "destructive",
          });
          return false;
        }
        break;
        
      case "podcast_description":
        const podcastDescription = form.getValues("details.podcast_description");
        if (!podcastDescription || podcastDescription.trim() === "") {
          toast({
            title: "Please enter a podcast description",
            variant: "destructive",
          });
          return false;
        }
        break;
        
      case "podcast_link":
        const podcastLink = form.getValues("details.podcast_link");
        if (!podcastLink || podcastLink.trim() === "") {
          toast({
            title: "Please enter a podcast link",
            variant: "destructive",
          });
          return false;
        }
        break;
      
      // Add more validation as needed for other fields
    }

    return true;
  };

  // Go back to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Get the form data
      const data = form.getValues();
      console.log("Form data being submitted:", data);

      // Ensure that details has all required fields based on collaboration type
      // This prevents validation errors when submitting the form
      if (data.collab_type === "Podcast Guest Appearance" && typeof data.details === 'object') {
        data.details = {
          podcast_name: data.details.podcast_name || "",
          short_description: data.details.short_description || "",
          podcast_description: data.details.podcast_description || "",
          podcast_link: data.details.podcast_link || "",
          estimated_reach: data.details.estimated_reach || AUDIENCE_SIZE_RANGES[0],
        };
      } else if (data.collab_type === "Twitter Spaces Guest" && typeof data.details === 'object') {
        data.details = {
          twitter_handle: data.details.twitter_handle || "https://x.com/",
          host_follower_count: data.details.host_follower_count || TWITTER_FOLLOWER_COUNTS[0],
          space_topic: data.details.space_topic || "",
          short_description: data.details.short_description || "",
        };
      } else if (data.collab_type === "Live Stream Guest Appearance" && typeof data.details === 'object') {
        data.details = {
          title: data.details.title || "",
          short_description: data.details.short_description || "",
          date_selection: data.details.date_selection || "any_future_date",
          specific_date: data.details.specific_date || "",
          previous_stream_link: data.details.previous_stream_link || "",
          expected_audience_size: data.details.expected_audience_size || AUDIENCE_SIZE_RANGES[0],
          topics: data.details.topics || [],
        };
      } else if (data.collab_type === "Report & Research Feature" && typeof data.details === 'object') {
        data.details = {
          research_topic: data.details.research_topic || [],
          target_audience: data.details.target_audience || "",
          estimated_release_date: data.details.estimated_release_date || "",
        };
      } else if (data.collab_type === "Newsletter Feature" && typeof data.details === 'object') {
        data.details = {
          newsletter_name: data.details.newsletter_name || "",
          short_description: data.details.short_description || "",
          newsletter_description: data.details.newsletter_description || "",
          newsletter_url: data.details.newsletter_url || "",
          audience_reach: data.details.audience_reach || AUDIENCE_SIZE_RANGES[0],
          total_subscribers: data.details.total_subscribers || AUDIENCE_SIZE_RANGES[0],
          topics: data.details.topics || [],
        };
      } else if (data.collab_type === "Blog Post Feature" && typeof data.details === 'object') {
        data.details = {
          blog_topic: data.details.blog_topic || "",
          blog_link: data.details.blog_link || "",
          blog_name: data.details.blog_name || "",
          blog_url: data.details.blog_url || "",
          short_description: data.details.short_description || "",
          est_readers: data.details.est_readers || AUDIENCE_SIZE_RANGES[0],
          estimated_release_date: data.details.estimated_release_date || "",
        };
      } else if (data.collab_type === "Co-Marketing on Twitter" && typeof data.details === 'object') {
        data.details = {
          twittercomarketing_type: data.details.twittercomarketing_type || ["Tweet"],
          host_twitter_handle: data.details.host_twitter_handle || "https://x.com/",
          host_follower_count: data.details.host_follower_count || TWITTER_FOLLOWER_COUNTS[0],
          short_description: data.details.short_description || "",
        };
      }

      // Format the data
      const formattedData = {
        ...data,
        required_company_sectors: data.required_company_sectors || [],
        required_funding_stages: data.required_funding_stages || [],
        required_blockchain_networks: data.required_blockchain_networks || [],
        company_tags: data.required_company_sectors || [],
        company_twitter_followers: data.min_company_followers,
        twitter_followers: data.min_user_followers,
        funding_stage:
          data.required_funding_stages &&
          data.required_funding_stages.length > 0
            ? data.required_funding_stages[0]
            : "Not Applicable",
        company_has_token: data.required_token_status || false,
        company_blockchain_networks: data.required_blockchain_networks || [],
      };

      // Remove specific_date if not needed
      if (data.date_type !== "specific_date") {
        delete formattedData.specific_date;
      }

      // Get Telegram init data
      const telegramInitData = window.Telegram?.WebApp?.initData || "";

      const response = await fetch("/api/collaborations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": telegramInitData,
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        // Invalidate queries to refresh collaboration lists
        queryClient.invalidateQueries({ queryKey: ["/api/collaborations/my"] });

        toast({
          title: "Success!",
          description: "Your collaboration has been created successfully.",
        });
        // Redirect to the "My Collaborations" tab on marketing-collabs-new
        setLocation("/marketing-collabs-new?tab=my");
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create: ${errorText}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Define all the possible steps with their associated fields
  const allSteps = [
    {
      id: "collab_type",
      title: "Collaboration Type",
      description: "What type of collaboration are you looking for?",
      render: () => (
        <FormField
          control={form.control}
          name="collab_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What type of collaboration are you looking for?</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleCollabTypeChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COLLAB_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the type that best describes what you want to create
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    },
    {
      id: "topics",
      title: "Topics",
      description: "What topics will this collaboration cover?",
      render: () => (
        <FormField
          control={form.control}
          name="topics"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel>Select Topics (pick at least one)</FormLabel>
                <FormDescription>
                  What topics will this collaboration cover?
                </FormDescription>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {COLLAB_TOPICS.map((topic) => (
                  <FormField
                    key={topic}
                    control={form.control}
                    name="topics"
                    render={({ field }) => {
                      const isSelected = field.value?.includes(topic);
                      return (
                        <FormItem key={topic} className="flex-1">
                          <FormControl>
                            <Button
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              className={`w-full h-auto py-1 px-2 text-xs justify-start normal-case ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/20'}`}
                              onClick={() => {
                                const currentValue = field.value || [];
                                const updatedTopics = isSelected
                                  ? currentValue.filter((t) => t !== topic)
                                  : [...currentValue, topic];
                                field.onChange(updatedTopics);
                              }}
                            >
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                              {topic}
                            </Button>
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    },
    {
      id: "date_type",
      title: "Date Preference",
      description: "Do you have a specific date in mind?",
      render: () => (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="date_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Preference</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Clear specific date if selecting "any_future_date"
                    if (value === "any_future_date") {
                      form.setValue("specific_date", "");
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a date preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="specific_date">
                      Specific Date
                    </SelectItem>
                    <SelectItem value="any_future_date">
                      Any Future Date
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  When would you like this collaboration to happen?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch("date_type") === "specific_date" && (
            <FormField
              control={form.control}
              name="specific_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )
    },
    {
      id: "podcast_name",
      title: "Podcast Name",
      description: "What's your podcast called?",
      render: () => (
        <FormField
          control={form.control}
          name="details.podcast_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What's your podcast name?</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter podcast name" 
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "podcast_description",
      title: "Podcast Description",
      description: "Describe your podcast",
      render: () => (
        <FormField
          control={form.control}
          name="details.podcast_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your podcast</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What is your podcast about? Who is your audience?" 
                  className="min-h-[100px]"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>
                Provide details about your podcast format, audience, and typical content
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "podcast_link",
      title: "Podcast Link",
      description: "Link to your podcast",
      render: () => (
        <FormField
          control={form.control}
          name="details.podcast_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to your podcast</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://your-podcast-url.com"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "podcast_reach",
      title: "Podcast Audience",
      description: "How many listeners do you have?",
      render: () => (
        <FormField
          control={form.control}
          name="details.estimated_reach"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How many listeners do you have?</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select podcast reach" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AUDIENCE_SIZE_RANGES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Podcast Guest Appearance"
    },
    {
      id: "twitter_handle",
      title: "Twitter Handle",
      description: "What's your Twitter/X handle?",
      render: () => (
        <FormField
          control={form.control}
          name="details.twitter_handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What's your Twitter/X handle?</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://x.com/username"
                  value={field.value || "https://x.com/"}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>
                Include the full URL (https://x.com/...)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Twitter Spaces Guest"
    },
    {
      id: "twitter_followers",
      title: "Twitter Followers",
      description: "How many followers do you have?",
      render: () => (
        <FormField
          control={form.control}
          name="details.host_follower_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How many followers do you have?</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select follower count" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TWITTER_FOLLOWER_COUNTS.map((count) => (
                    <SelectItem key={count} value={count}>
                      {count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Twitter Spaces Guest"
    },
    {
      id: "twitter_space_topic",
      title: "Twitter Space Topic",
      description: "What topic will your Twitter Space cover?",
      render: () => (
        <FormField
          control={form.control}
          name="details.space_topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What topic will your Twitter Space cover?</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter Twitter Space topic"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>
                A clear, specific topic will attract the right audience
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Twitter Spaces Guest"
    },
    {
      id: "twitter_space_description",
      title: "Twitter Space Description",
      description: "Describe your Twitter Space",
      render: () => (
        <FormField
          control={form.control}
          name="details.short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your Twitter Space</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide details about your Twitter Space format, goals, and target audience"
                  className="min-h-[100px]"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Twitter Spaces Guest"
    },
    {
      id: "twitter_comarketing_type",
      title: "Co-Marketing Type",
      description: "What type of co-marketing do you want to do?",
      render: () => (
        <FormField
          control={form.control}
          name="details.twittercomarketing_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Co-Marketing Type(s)</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {TWITTER_COLLAB_TYPES.map((type) => {
                  const isSelected = Array.isArray(field.value) && field.value.includes(type);
                  return (
                    <Button
                      key={type}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full h-auto py-2 px-3 text-sm justify-start normal-case ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/20'}`}
                      onClick={() => {
                        const currentTypes = Array.isArray(field.value) ? field.value : [];
                        const updatedTypes = isSelected
                          ? currentTypes.filter((t) => t !== type)
                          : [...currentTypes, type];
                        field.onChange(updatedTypes);
                      }}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      {type}
                    </Button>
                  );
                })}
              </div>
              <FormDescription>
                Select all the types of content you'd like to collaborate on
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "twitter_comarketing_handle",
      title: "Twitter Handle",
      description: "What's your Twitter/X handle?",
      render: () => (
        <FormField
          control={form.control}
          name="details.host_twitter_handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What's your Twitter/X handle?</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://x.com/username"
                  value={field.value || "https://x.com/"}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>
                Include the full URL (https://x.com/...)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "twitter_comarketing_followers",
      title: "Twitter Followers",
      description: "How many followers do you have?",
      render: () => (
        <FormField
          control={form.control}
          name="details.host_follower_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How many followers do you have?</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select follower count" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TWITTER_FOLLOWER_COUNTS.map((count) => (
                    <SelectItem key={count} value={count}>
                      {count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "twitter_comarketing_description",
      title: "Co-Marketing Description",
      description: "Describe your co-marketing idea",
      render: () => (
        <FormField
          control={form.control}
          name="details.short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your co-marketing idea</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What kind of content would you like to create together? What are your goals?"
                  className="min-h-[100px]"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>
                The more details you provide, the easier it will be to find a great match
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      shouldShow: () => selectedCollabType === "Co-Marketing on Twitter"
    },
    {
      id: "free_collab",
      title: "Free Collaboration",
      description: "Verify that this is a free collaboration",
      render: () => (
        <FormField
          control={form.control}
          name="is_free_collab"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-gray-50 p-4 rounded-md">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(true);
                    if (!checked) {
                      toast({
                        title: "Free collaborations only",
                        description: "Only free collaborations are allowed on our platform.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={true}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Free Collaboration (Required)</FormLabel>
                <FormDescription>
                  All collaborations on our platform must be free
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      )
    }
  ];

  // Get the active steps based on current form values
  const getActiveSteps = () => {
    return allSteps.filter(step => {
      if (step.shouldShow) {
        return step.shouldShow();
      }
      return true;
    });
  };

  // Render step content based on current step
  const renderStepContent = () => {
    const activeSteps = getActiveSteps();
    if (currentStep < 0 || currentStep >= activeSteps.length) {
      return null;
    }
    
    const step = activeSteps[currentStep];
    return (
      <div className="space-y-6">
        {step.render()}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* Compact header with back button and progress bar */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 mr-2" 
          onClick={() => setLocation("/dashboard")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          <span className="sr-only">Back</span>
        </Button>
        
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary rounded-full h-1 transition-all duration-300" 
              style={{ width: `${((currentStep + 1) / getActiveSteps().length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {renderStepContent()}
            </CardContent>
          </Card>
          
          <div className="flex justify-between pt-4">
            {currentStep > 0 ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            
            <Button 
              type="button" 
              onClick={nextStep}
              disabled={isSubmitting}
            >
              {(() => {
                const activeSteps = getActiveSteps();
                const isLastStep = currentStep === activeSteps.length - 1;
                
                if (isSubmitting) {
                  return (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLastStep ? 'Creating...' : 'Next...'}
                    </>
                  );
                } else {
                  return isLastStep ? 'Create Collaboration' : 'Next';
                }
              })()}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}