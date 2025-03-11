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
import { Loader2 } from "lucide-react";

import {
  AUDIENCE_SIZE_RANGES,
  COLLAB_TYPES,
  COLLAB_TOPICS,
  COMPANY_CATEGORIES,
  FUNDING_STAGES,
  TWITTER_FOLLOWER_COUNTS,
  TWITTER_COLLAB_TYPES,
  createCollaborationSchema,
  type CreateCollaboration
} from "@shared/schema";

interface CreateCollaborationProps {
  id?: string;
}

export default function CreateCollaborationSteps({ id }: CreateCollaborationProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCollabType, setSelectedCollabType] = useState<string>(COLLAB_TYPES[0]);
  
  // Initialize with basic form data
  const form = useForm<CreateCollaboration>({
    resolver: zodResolver(createCollaborationSchema),
    defaultValues: {
      title: "Collaboration", 
      description: "Created using Collab Room",
      collab_type: COLLAB_TYPES[0],
      date_type: "specific_date",
      specific_date: new Date().toISOString().split('T')[0],
      topics: [],
      is_free_collab: false,
      
      // Filter fields
      filter_company_sectors_enabled: false,
      filter_company_followers_enabled: false,
      filter_user_followers_enabled: false,
      filter_funding_stages_enabled: false,
      filter_token_status_enabled: false,
      
      required_company_sectors: [],
      required_funding_stages: [],
      required_token_status: false,
      min_company_followers: TWITTER_FOLLOWER_COUNTS[0],
      min_user_followers: TWITTER_FOLLOWER_COUNTS[0],
      details: {}
    }
  });

  // Define the steps in our wizard
  const steps = [
    { 
      title: "Basic Information", 
      description: "Select the type of collaboration you want to create" 
    },
    { 
      title: "Collaboration Details", 
      description: "Fill out the specific details for your collaboration" 
    },
    { 
      title: "Matching Requirements", 
      description: "Set criteria for who can apply to your collaboration" 
    }
  ];

  // When collaboration type changes
  const handleCollabTypeChange = (value: string) => {
    setSelectedCollabType(value);
    form.setValue("collab_type", value as typeof COLLAB_TYPES[number]);
    
    // Reset details to avoid field bleeding
    let newDetails = {};
    
    // Set proper initial values based on type
    switch(value) {
      case "Podcast Guest Appearance":
        newDetails = { podcast_name: "", short_description: "", podcast_link: "" };
        break;
      case "Twitter Spaces Guest":
        newDetails = { 
          twitter_handle: "https://x.com/", 
          space_topic: [], 
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
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
          topics: []
        };
        break;
      case "Report & Research Feature":
        newDetails = {
          research_topic: [],
          target_audience: "",
          estimated_release_date: ""
        };
        break;
      case "Newsletter Feature":
        newDetails = {
          newsletter_name: "",
          topics: [],
          audience_reach: AUDIENCE_SIZE_RANGES[0],
          short_description: ""
        };
        break;
      case "Blog Post Feature":
        newDetails = {
          blog_topic: "",
          blog_link: "",
          estimated_release_date: ""
        };
        break;
      case "Co-Marketing on Twitter":
        newDetails = {
          collaboration_types: [],
          host_twitter_handle: "https://x.com/",
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
        };
        break;
      default:
        newDetails = { podcast_name: "", short_description: "", podcast_link: "" };
    }
    
    form.setValue("details", newDetails as any);
  };

  // Move to next step
  const nextStep = async () => {
    // Validate current step fields
    let isValid = true;
    
    if (currentStep === 0) {
      // Basic info validation
      const collabType = form.getValues("collab_type");
      isValid = Boolean(collabType);
    } else if (currentStep === 1) {
      // Details validation will depend on the collab type
      const details = form.getValues("details");
      isValid = Boolean(details) && Object.keys(details).length > 0;
    }
    
    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Submit the form if on the last step
        handleSubmit();
      }
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
    }
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
      };
      
      // Remove specific_date if not needed
      if (data.date_type !== 'specific_date') {
        delete formattedData.specific_date;
      }
      
      // Get Telegram init data
      const telegramInitData = window.Telegram?.WebApp?.initData || '';
      
      const response = await fetch('/api/collaborations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': telegramInitData
        },
        body: JSON.stringify(formattedData),
      });
      
      if (response.ok) {
        // Invalidate queries to refresh collaboration lists
        queryClient.invalidateQueries({ queryKey: ['/api/collaborations/my'] });
        
        toast({
          title: "Success!",
          description: "Your collaboration has been created successfully."
        });
        setLocation('/marketing-collabs-new');
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create: ${errorText}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="collab_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collaboration Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCollabTypeChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collaboration type" />
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
                    Choose the type of collaboration you're looking for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Preference</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a date preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="specific_date">Specific Date</SelectItem>
                      <SelectItem value="any_future_date">Any Future Date</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="next_week">Next Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="next_month">Next Month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    When would you like this collaboration to happen?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch('date_type') === 'specific_date' && (
              <FormField
                control={form.control}
                name="specific_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="topics"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Topics</FormLabel>
                    <FormDescription>
                      Select the topics that best describe this collaboration
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                                      ? [...field.value, topic]
                                      : field.value?.filter(
                                          (t) => t !== topic
                                        );
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
            
            <FormField
              control={form.control}
              name="is_free_collab"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Free Collaboration</FormLabel>
                    <FormDescription>
                      Check this if you're offering this collaboration for free
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        );
      
      case 1:
        // Render different fields based on the selected collaboration type
        return (
          <div className="space-y-6">
            {selectedCollabType === "Podcast Guest Appearance" && (
              <>
                <FormField
                  control={form.control}
                  name="details.podcast_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Podcast Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter podcast name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.short_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of your podcast" 
                          className="min-h-[80px]"
                          {...field} 
                        />
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
                      <FormLabel>Podcast Link</FormLabel>
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
              </>
            )}
            
            {selectedCollabType === "Twitter Spaces Guest" && (
              <>
                <FormField
                  control={form.control}
                  name="details.twitter_handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter Handle</FormLabel>
                      <FormControl>
                        <Input placeholder="https://x.com/username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Must include full URL (https://x.com/)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.space_topic"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Space Topics</FormLabel>
                        <FormDescription>
                          Select topics for your Twitter Space
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {COLLAB_TOPICS.map((topic) => (
                          <FormField
                            key={topic}
                            control={form.control}
                            name="details.space_topic"
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
                                          : (field.value || [])?.filter(
                                              (t) => t !== topic
                                            );
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
                <FormField
                  control={form.control}
                  name="details.host_follower_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host Follower Count</FormLabel>
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
            
            {selectedCollabType === "Co-Marketing on Twitter" && (
              <>
                <FormField
                  control={form.control}
                  name="details.collaboration_types"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Collaboration Types</FormLabel>
                        <FormDescription>
                          Select the types of Twitter collaborations you're interested in
                        </FormDescription>
                      </div>
                      <div className="space-y-2">
                        {TWITTER_COLLAB_TYPES.map((type) => (
                          <FormField
                            key={type}
                            control={form.control}
                            name="details.collaboration_types"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={type}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        const updatedTypes = checked
                                          ? [...(field.value || []), type]
                                          : (field.value || [])?.filter(
                                              (t) => t !== type
                                            );
                                        field.onChange(updatedTypes);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                    {type}
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
                <FormField
                  control={form.control}
                  name="details.host_twitter_handle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter Handle</FormLabel>
                      <FormControl>
                        <Input placeholder="https://x.com/username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Must include full URL (https://x.com/)
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
                      <FormLabel>Host Follower Count</FormLabel>
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
            
            {/* Add more type-specific fields as needed for other collaboration types */}
            {/* For brevity, only showing 3 types here - add others following the same pattern */}
            
            {/* Default message for other collaboration types */}
            {!["Podcast Guest Appearance", "Twitter Spaces Guest", "Co-Marketing on Twitter"].includes(selectedCollabType) && (
              <div className="text-center py-8">
                <p>Please provide details for your {selectedCollabType} collaboration.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Additional fields specific to this collaboration type will be added soon.
                </p>
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Company Sector Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    Only show to companies in these sectors
                  </p>
                </div>
                <Switch
                  checked={form.watch('filter_company_sectors_enabled')}
                  onCheckedChange={(checked) => {
                    form.setValue('filter_company_sectors_enabled', checked);
                  }}
                />
              </div>
              
              {form.watch('filter_company_sectors_enabled') && (
                <FormField
                  control={form.control}
                  name="required_company_sectors"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {COMPANY_CATEGORIES.map((category) => (
                          <FormField
                            key={category}
                            control={form.control}
                            name="required_company_sectors"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={category}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(category)}
                                      onCheckedChange={(checked) => {
                                        const updatedSectors = checked
                                          ? [...(field.value || []), category]
                                          : (field.value || [])?.filter(
                                              (s) => s !== category
                                            );
                                        field.onChange(updatedSectors);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                    {category}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Minimum Company Twitter Followers</h3>
                  <p className="text-sm text-muted-foreground">
                    Set a minimum follower requirement for companies
                  </p>
                </div>
                <Switch
                  checked={form.watch('filter_company_followers_enabled')}
                  onCheckedChange={(checked) => {
                    form.setValue('filter_company_followers_enabled', checked);
                  }}
                />
              </div>
              
              {form.watch('filter_company_followers_enabled') && (
                <FormField
                  control={form.control}
                  name="min_company_followers"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select minimum followers" />
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
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Funding Stage Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    Only show to companies in these funding stages
                  </p>
                </div>
                <Switch
                  checked={form.watch('filter_funding_stages_enabled')}
                  onCheckedChange={(checked) => {
                    form.setValue('filter_funding_stages_enabled', checked);
                  }}
                />
              </div>
              
              {form.watch('filter_funding_stages_enabled') && (
                <FormField
                  control={form.control}
                  name="required_funding_stages"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {FUNDING_STAGES.map((stage) => (
                          <FormField
                            key={stage}
                            control={form.control}
                            name="required_funding_stages"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={stage}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(stage)}
                                      onCheckedChange={(checked) => {
                                        const updatedStages = checked
                                          ? [...(field.value || []), stage]
                                          : (field.value || [])?.filter(
                                              (s) => s !== stage
                                            );
                                        field.onChange(updatedStages);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer flex-grow">
                                    {stage}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Token Status Requirement</h3>
                  <p className="text-sm text-muted-foreground">
                    Only show to companies with a live token
                  </p>
                </div>
                <Switch
                  checked={form.watch('filter_token_status_enabled')}
                  onCheckedChange={(checked) => {
                    form.setValue('filter_token_status_enabled', checked);
                    form.setValue('required_token_status', checked);
                  }}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="container max-w-3xl pb-16">
      <PageHeader 
        title="Create Collaboration" 
        subtitle="Create a new collaboration opportunity"
        backUrl="/marketing-collabs-new"
      />
      
      <div className="space-y-8">
        {/* Progress indicator */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex-1 ${
                index < steps.length - 1 ? "border-t-2 border-border" : ""
              } ${
                index === currentStep
                  ? "text-primary"
                  : index < currentStep
                  ? "text-primary"
                  : "text-muted-foreground"
              } relative`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === currentStep
                    ? "bg-primary text-white"
                    : index < currentStep
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                } absolute -top-4 ${index === 0 ? "left-0" : index === steps.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
              >
                {index + 1}
              </div>
              {!isMobile && (
                <div className={`mt-6 ${
                  index === 0 ? "text-left" : index === steps.length - 1 ? "text-right" : "text-center"
                }`}>
                  <p className={`text-sm font-medium ${
                    index === currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Step title and description */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">{steps[currentStep].title}</h2>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </div>
        
        {/* Form content */}
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form className="space-y-6">
                {renderStepContent()}
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Navigation buttons */}
        <div className="fixed bottom-0 left-0 w-full bg-background border-t border-border p-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0 || isSubmitting}
          >
            Previous
          </Button>
          
          <Button
            type="button"
            onClick={nextStep}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {currentStep === steps.length - 1 ? "Creating..." : "Next"}
              </>
            ) : (
              currentStep === steps.length - 1 ? "Create Collaboration" : "Next"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}