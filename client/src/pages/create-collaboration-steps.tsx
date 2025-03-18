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
      title: "Collaboration",
      description: "",
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
          podcast_link: "",
        };
        break;
      case "Twitter Spaces Guest":
        newDetails = {
          twitter_handle: "https://x.com/",
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0],
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
        };
        break;
      case "Blog Post Feature":
        newDetails = {
          blog_topic: "",
          blog_link: "",
          estimated_release_date: "",
        };
        break;
      case "Co-Marketing on Twitter":
        newDetails = {
          collaboration_types: [],
          host_twitter_handle: "https://x.com/",
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0],
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

    // If validation passes, proceed to next step or submit
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the form if on the last step
      handleSubmit();
    }
  };

  // Validation for the current step
  const validateCurrentStep = () => {
    // For now, we'll use very simple validation
    if (currentStep === 0) {
      const type = form.getValues("collab_type");
      if (!type) {
        toast({
          title: "Please select a collaboration type",
          variant: "destructive",
        });
        return false;
      }
    } 
    else if (currentStep === 1) {
      const title = form.getValues("title");
      const description = form.getValues("description");
      
      if (!title || title.trim() === "") {
        toast({
          title: "Please enter a title",
          variant: "destructive",
        });
        return false;
      }
      
      if (!description || description.trim() === "") {
        toast({
          title: "Please enter a description",
          variant: "destructive",
        });
        return false;
      }
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

  // Render step content based on current step
  const renderStepContent = () => {
    // Just show the fields we need for each step
    switch (currentStep) {
      case 0:
        // Step 1: Collaboration Type
        return (
          <div className="space-y-6">
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
          </div>
        );
        
      case 1:
        // Step 2: Basic Details
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a title for your collaboration" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A brief title that explains what you're looking for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the collaboration opportunity" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide more details about what you're looking for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                    {COLLAB_TOPICS.map((topic) => (
                      <FormField
                        key={topic}
                        control={form.control}
                        name="topics"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={topic}
                              className="flex flex-row items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(topic)}
                                  onCheckedChange={(checked) => {
                                    const updatedTopics = checked
                                      ? [...(field.value || []), topic]
                                      : (field.value || [])?.filter((t) => t !== topic);
                                    field.onChange(updatedTopics);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                {topic}
                              </FormLabel>
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
          </div>
        );
        
      case 2:
        // Step 3: Type-Specific Details
        return (
          <div className="space-y-6">
            {selectedCollabType === "Podcast Guest Appearance" && (
              <>
                <FormField
                  control={form.control}
                  name="details.podcast_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's your podcast name?</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter podcast name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.podcast_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link to your podcast</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-podcast-url.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.estimated_reach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How many listeners do you have?</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
              </>
            )}

            {selectedCollabType === "Twitter Spaces Guest" && (
              <>
                <FormField
                  control={form.control}
                  name="details.twitter_handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's your Twitter/X handle?</FormLabel>
                      <FormControl>
                        <Input
                          defaultValue="https://x.com/"
                          placeholder="https://x.com/username"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include the full URL (https://x.com/...)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.host_follower_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How many followers do you have?</FormLabel>
                      <Select
                        value={field.value}
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
              </>
            )}

            {/* Add other collaboration type fields as needed */}
            
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
          </div>
        );
        
      default:
        return null;
    }
  };

  // Get the total number of steps
  const totalSteps = 3;
  
  // Step titles
  const stepTitles = [
    "Select Type",
    "Basic Details",
    "Specific Details",
  ];

  return (
    <div className="container max-w-md mx-auto px-4 py-6">
      <PageHeader 
        title="Create Collaboration" 
        subtitle="Find partners for your next project"
        backUrl="/dashboard" 
      />
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm font-medium">
            {stepTitles[currentStep]}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary rounded-full h-2 transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          ></div>
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === totalSteps - 1 ? 'Creating...' : 'Next...'}
                </>
              ) : (
                currentStep === totalSteps - 1 ? 'Create Collaboration' : 'Next'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}