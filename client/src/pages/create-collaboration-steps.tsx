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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
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
      is_free_collab: true, // Default to true since we only want free collaborations
      
      // Filter fields
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
          // Removed space_topic as topics are now captured at the platform level
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
  const nextStep = () => {
    let canProceed = true;
    let errorMessage = "";
    
    // Validation logic based on current step
    if (currentStep === 0) {
      // Basic info validation
      const values = form.getValues();
      
      // Check title and description
      if (!values.title?.trim()) {
        canProceed = false;
        errorMessage = "Title is required";
      } else if (!values.description?.trim()) {
        canProceed = false;
        errorMessage = "Description is required";
      } else if (!values.collab_type) {
        canProceed = false;
        errorMessage = "Please select a collaboration type";
      } else if (!values.date_type) {
        canProceed = false;
        errorMessage = "Please select a date preference";
      } else if (values.date_type === "specific_date" && !values.specific_date) {
        canProceed = false;
        errorMessage = "Please select a specific date";
      } else if (!values.topics || values.topics.length === 0) {
        canProceed = false;
        errorMessage = "Please select at least one topic";
      }
    } 
    else if (currentStep === 1) {
      // Details validation based on collaboration type
      const details = form.getValues("details") || {};
      const collabType = form.getValues("collab_type");
      
      if (collabType === "Podcast Guest Appearance") {
        if (!details.podcast_name?.trim()) {
          canProceed = false;
          errorMessage = "Podcast name is required";
        } else if (!details.short_description?.trim()) {
          canProceed = false;
          errorMessage = "Short description is required";
        }
      }
      else if (collabType === "Twitter Spaces Guest") {
        if (!details.twitter_handle?.trim()) {
          canProceed = false;
          errorMessage = "Twitter handle is required";
        } else if (!details.twitter_handle.startsWith("https://x.com/")) {
          canProceed = false;
          errorMessage = "Twitter handle must start with https://x.com/";
        }
        // Removed space_topic validation as topics are captured at the top level
      }
      else if (collabType === "Co-Marketing on Twitter") {
        if (!details.collaboration_types || !Array.isArray(details.collaboration_types) || details.collaboration_types.length === 0) {
          canProceed = false;
          errorMessage = "Please select at least one collaboration type";
        } else if (!details.host_twitter_handle?.trim()) {
          canProceed = false;
          errorMessage = "Twitter handle is required";
        } else if (!details.host_twitter_handle.startsWith("https://x.com/")) {
          canProceed = false;
          errorMessage = "Twitter handle must start with https://x.com/";
        }
      }
    }
    else if (currentStep === 2) {
      // Validate enabled filters have selections
      const values = form.getValues();
      
      if (values.filter_company_sectors_enabled && 
          (!values.required_company_sectors || !Array.isArray(values.required_company_sectors) || values.required_company_sectors.length === 0)) {
        canProceed = false;
        errorMessage = "Please select at least one company sector when that filter is enabled";
      } else if (values.filter_company_followers_enabled && !values.min_company_followers) {
        canProceed = false;
        errorMessage = "Please select minimum company followers";
      } else if (values.filter_user_followers_enabled && !values.min_user_followers) {
        canProceed = false;
        errorMessage = "Please select minimum user followers";
      } else if (values.filter_funding_stages_enabled && 
                (!values.required_funding_stages || !Array.isArray(values.required_funding_stages) || values.required_funding_stages.length === 0)) {
        canProceed = false;
        errorMessage = "Please select at least one funding stage when that filter is enabled";
      } else if (values.filter_blockchain_networks_enabled && 
                (!values.required_blockchain_networks || !Array.isArray(values.required_blockchain_networks) || values.required_blockchain_networks.length === 0)) {
        canProceed = false;
        errorMessage = "Please select at least one blockchain network when that filter is enabled";
      }
    }
    
    // Show error message if validation fails
    if (!canProceed) {
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    
    // If validation passes, proceed to next step or submit
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the form if on the last step
      handleSubmit();
    }
  };

  // Go back to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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
        
        // Add standardized fields for consistent filtering across all tables
        company_tags: data.required_company_sectors || [],
        company_twitter_followers: data.min_company_followers,
        twitter_followers: data.min_user_followers,
        funding_stage: data.required_funding_stages && data.required_funding_stages.length > 0
          ? data.required_funding_stages[0]
          : "Not Applicable", // Default to "Not Applicable" when no funding stage is selected
        company_has_token: data.required_token_status || false,
        company_blockchain_networks: data.required_blockchain_networks || [],
        
        // Set filter toggle states based on whether requirements are specified
        filter_company_sectors_enabled: Array.isArray(data.required_company_sectors) && data.required_company_sectors.length > 0,
        filter_company_followers_enabled: !!data.min_company_followers,
        filter_user_followers_enabled: !!data.min_user_followers,
        filter_funding_stages_enabled: Array.isArray(data.required_funding_stages) && data.required_funding_stages.length > 0,
        filter_token_status_enabled: !!data.required_token_status,
        filter_blockchain_networks_enabled: Array.isArray(data.required_blockchain_networks) && data.required_blockchain_networks.length > 0
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
        // Redirect to the "My Collaborations" tab on marketing-collabs-new
        setLocation('/marketing-collabs-new?tab=my');
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
                      onCheckedChange={(checked) => {
                        // Always default to true since we only want free collaborations
                        field.onChange(true);
                        // If someone tries to uncheck, show a warning
                        if (!checked) {
                          toast({
                            title: "Free collaborations only",
                            description: "Only free collaborations are allowed on our platform.",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={true} // Make it impossible to uncheck
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Free Collaboration (Required)</FormLabel>
                    <FormDescription>
                      All collaborations on our platform must be free with no payments involved
                    </FormDescription>
                    <FormMessage>This field is required</FormMessage>
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
                <FormField
                  control={form.control}
                  name="details.estimated_reach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Reach</FormLabel>
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
                      <FormDescription>
                        Approximate number of listeners per episode
                      </FormDescription>
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
                {/* Space topics field removed - topics are now captured at the platform level */}
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
            
            {selectedCollabType === "Blog Post Feature" && (
              <>
                <FormField
                  control={form.control}
                  name="details.blog_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter blog name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Blog topic field removed as we already capture topics at the top level */}
                <FormField
                  control={form.control}
                  name="details.blog_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourblog.com" {...field} />
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
                          placeholder="Brief description of your blog" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {selectedCollabType === "Newsletter Feature" && (
              <>
                <FormField
                  control={form.control}
                  name="details.newsletter_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Newsletter Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter newsletter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.newsletter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Newsletter URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://newsletter-signup.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.total_subscribers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Subscribers</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subscriber count" />
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
            
            {selectedCollabType === "Report & Research Feature" && (
              <>
                <FormField
                  control={form.control}
                  name="details.report_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter report name" {...field} />
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
                      <FormLabel>Short Description of Report</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of your report or research" 
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
                  name="details.audience_reach"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience Reach</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience size" />
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
            
            {selectedCollabType === "Live Stream Guest Appearance" && (
              <>
                <FormField
                  control={form.control}
                  name="details.stream_platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Streaming Platform</FormLabel>
                      <FormControl>
                        <Input placeholder="YouTube, Twitch, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.previous_stream_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL to Previous Livestreams</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourstreamexample.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="details.expected_audience_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Audience Size</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience size" />
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
            
            {/* Default message for collaboration types without custom fields */}
            {!["Podcast Guest Appearance", "Twitter Spaces Guest", "Co-Marketing on Twitter", 
               "Blog Post Feature", "Newsletter Feature", "Report & Research Feature", 
               "Live Stream Guest Appearance"].includes(selectedCollabType) && (
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
                      <p className="text-sm text-muted-foreground mb-3">
                        Select tags that best describe the company sectors you want to target
                      </p>
                      
                      {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => {
                        // Count how many tags from this category are selected
                        const selectedCount = form.watch('required_company_sectors')?.filter(
                          (tag) => (tags as readonly string[]).some(t => t === tag)
                        ).length || 0;
                        
                        return (
                          <div key={category} className="border rounded-lg overflow-hidden mb-3">
                            {/* Make the entire header row clickable */}
                            <div 
                              className="w-full flex justify-between items-center p-4 cursor-pointer hover:bg-accent/50"
                              onClick={() => toggleCategory(category)}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{category}</span>
                                {selectedCount > 0 && (
                                  <span className="inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 px-2">
                                    {selectedCount}
                                  </span>
                                )}
                              </div>
                              {expandedCategories.includes(category) ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              )}
                            </div>

                            {expandedCategories.includes(category) && (
                              <div className="p-4 pt-0 grid grid-cols-1 gap-3">
                                {tags.map(tag => (
                                  <Button
                                    key={tag}
                                    type="button"
                                    variant={form.watch('required_company_sectors')?.includes(tag) ? "default" : "outline"}
                                    className="justify-start h-auto py-3 px-4 w-full"
                                    onClick={() => {
                                      const currentSectors = form.watch('required_company_sectors') || [];
                                      const updatedSectors = currentSectors.includes(tag)
                                        ? currentSectors.filter(t => t !== tag)
                                        : [...currentSectors, tag];
                                      form.setValue('required_company_sectors', updatedSectors);
                                    }}
                                  >
                                    <span className="text-left">{tag}</span>
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <FormMessage />
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
                  <h3 className="text-lg font-medium">Minimum User Twitter Followers</h3>
                  <p className="text-sm text-muted-foreground">
                    Set a minimum follower requirement for applicants
                  </p>
                </div>
                <Switch
                  checked={form.watch('filter_user_followers_enabled')}
                  onCheckedChange={(checked) => {
                    form.setValue('filter_user_followers_enabled', checked);
                  }}
                />
              </div>
              
              {form.watch('filter_user_followers_enabled') && (
                <FormField
                  control={form.control}
                  name="min_user_followers"
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
                    
                    // If token status is enabled, also enable blockchain networks requirement
                    if (checked) {
                      form.setValue('filter_blockchain_networks_enabled', true);
                    }
                  }}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Blockchain Network Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    Only show to companies on these blockchain networks
                  </p>
                </div>
                <Switch
                  checked={form.watch('filter_blockchain_networks_enabled')}
                  onCheckedChange={(checked) => {
                    form.setValue('filter_blockchain_networks_enabled', checked);
                    
                    // If blockchain network filtering is disabled, clear selected networks
                    if (!checked) {
                      form.setValue('required_blockchain_networks', []);
                    }
                  }}
                  // Disable the blockchain network filter if token status is disabled
                  disabled={!form.watch('filter_token_status_enabled')}
                />
              </div>
              
              {form.watch('filter_blockchain_networks_enabled') && (
                <FormField
                  control={form.control}
                  name="required_blockchain_networks"
                  render={() => (
                    <FormItem>
                      {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => {
                        // Count how many networks from this category are selected
                        const selectedCount = (form.watch('required_blockchain_networks') || []).filter(
                          (network) => networks.includes(network as typeof BLOCKCHAIN_NETWORKS[number])
                        ).length;
                        
                        return (
                          <div key={category} className="border rounded-lg overflow-hidden mb-3">
                            <div 
                              className="w-full flex justify-between items-center p-4 cursor-pointer hover:bg-accent/50"
                              onClick={() => toggleCategory(category)}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{category}</span>
                                {selectedCount > 0 && (
                                  <span className="inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 px-2">
                                    {selectedCount}
                                  </span>
                                )}
                              </div>
                              {expandedCategories.includes(category) ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              )}
                            </div>

                            {expandedCategories.includes(category) && (
                              <div className="p-4 pt-0 grid grid-cols-1 gap-3">
                                {networks.map(network => (
                                  <Button
                                    key={network}
                                    type="button"
                                    variant={(form.watch('required_blockchain_networks') || []).includes(network) ? "default" : "outline"}
                                    className="justify-start h-auto py-3 px-4 w-full"
                                    onClick={() => {
                                      const currentNetworks = form.watch('required_blockchain_networks') || [];
                                      const updatedNetworks = currentNetworks.includes(network)
                                        ? currentNetworks.filter(n => n !== network)
                                        : [...currentNetworks, network];
                                      form.setValue('required_blockchain_networks', updatedNetworks);
                                    }}
                                  >
                                    <span className="text-left">{network}</span>
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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