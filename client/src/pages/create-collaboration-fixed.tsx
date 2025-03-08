import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { MobileCheck } from "@/components/MobileCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/layout/PageHeader";

import {
  AUDIENCE_SIZE_RANGES,
  BLOCKCHAIN_NETWORKS,
  COLLAB_TYPES,
  COLLAB_TOPICS,
  COMPANY_CATEGORIES,
  COMPANY_TAG_CATEGORIES,
  FUNDING_STAGES,
  TWITTER_FOLLOWER_COUNTS,
  TWITTER_COLLAB_TYPES,
  createCollaborationSchema,
  type CreateCollaboration
} from "@shared/schema";

interface CreateCollaborationProps {
  id?: string;
}

export default function CreateCollaboration({ id }: CreateCollaborationProps = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCollabType, setSelectedCollabType] = useState<typeof COLLAB_TYPES[number] | "">("");
  const [showTwitterFields, setShowTwitterFields] = useState(false);
  const [isEditing, setIsEditing] = useState(Boolean(id));

  // Track which filters are enabled
  const [filtersEnabled, setFiltersEnabled] = useState({
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    tokenStatus: false
  });

  // Toggle filter visibility
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    setFiltersEnabled(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const form = useForm<CreateCollaboration>({
    resolver: zodResolver(createCollaborationSchema),
    defaultValues: {
      title: "Collaboration", // Default title (hidden from user)
      description: "Created using Collab Room", // Default description (hidden from user)
      collab_type: COLLAB_TYPES[0],
      date_type: "specific_date",
      specific_date: new Date().toISOString().split('T')[0], // Use ISO string format YYYY-MM-DD
      topics: [], // Initialize empty topics array
      is_free_collab: false, // This will require users to actively check the box
      required_company_sectors: [],
      required_funding_stages: [],
      required_token_status: false,
      min_company_followers: TWITTER_FOLLOWER_COUNTS[0],
      min_user_followers: TWITTER_FOLLOWER_COUNTS[0],
      details: {}
    }
  });

  // Setup default detail fields based on collaboration type
  useEffect(() => {
    // Since we've moved "Co-Marketing on Twitter" to the top of the list
    handleCollabTypeChange(COLLAB_TYPES[0]);
  }, []);

  const handleCollabTypeChange = (value: typeof COLLAB_TYPES[number]) => {
    setSelectedCollabType(value);
    form.setValue("collab_type", value);
    
    // Set showTwitterFields based on the selected collaboration type
    setShowTwitterFields(value === "Co-Marketing on Twitter");
    
    // Clear the details object completely first to prevent field value bleed
    // We need to set a temporary empty object that matches the expected type
    form.setValue('details', {} as any);
    
    // Reset details object when collaboration type changes
    switch (value) {
      case "Podcast Guest Appearance":
        form.setValue('details', {
          podcast_name: "",
          short_description: "",
          podcast_link: ""
        });
        break;
      case "Twitter Spaces Guest":
        form.setValue('details', {
          twitter_handle: "",
          space_topic: [],
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
        });
        break;
      case "Live Stream Guest Appearance":
        form.setValue('details', {
          title: "",
          short_description: "",
          date_selection: "any_future_date",
          specific_date: "",
          previous_stream_link: "",
          expected_audience_size: AUDIENCE_SIZE_RANGES[0],
          topics: []
        });
        break;
      case "Report & Research Feature":
        form.setValue('details', {
          research_topic: [],
          target_audience: "",
          estimated_release_date: ""
        });
        break;
      case "Newsletter Feature":
        form.setValue('details', {
          newsletter_name: "",
          topics: [],
          audience_reach: AUDIENCE_SIZE_RANGES[0],
          short_description: ""
        });
        break;
      case "Blog Post Feature":
        form.setValue('details', {
          blog_topic: "",
          blog_link: "",
          estimated_release_date: ""
        });
        break;
      case "Co-Marketing on Twitter":
        form.setValue('details', {
          collaboration_types: [], // Multiple types can be selected
          host_twitter_handle: "",
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
        });
        break;
      default:
        form.setValue('details', {
          podcast_name: "",
          short_description: "",
          podcast_link: ""
        });
        break;
    }
  };

  // Fetch collaboration data if editing
  useEffect(() => {
    const fetchCollaboration = async () => {
      if (id) {
        try {
          const response = await apiRequest(`/api/collaborations/get/${id}`, 'GET');
          
          if (response.ok) {
            const collab = await response.json();
            
            // Set form values based on the fetched data
            if (collab) {
              // Update form with fetched data
              form.reset({
                ...collab,
                // Convert other fields as needed
                topics: collab.topics || [],
                required_company_sectors: collab.required_company_sectors || [],
                required_funding_stages: collab.required_funding_stages || [],
              });
              
              // Update UI state
              setSelectedCollabType(collab.collab_type);
              setShowTwitterFields(collab.collab_type === "Co-Marketing on Twitter");
              
              // Update filter toggles based on data
              setFiltersEnabled({
                companySectors: Boolean(collab.required_company_sectors?.length),
                companyFollowers: Boolean(collab.min_company_followers),
                userFollowers: Boolean(collab.min_user_followers),
                fundingStages: Boolean(collab.required_funding_stages?.length),
                tokenStatus: Boolean(collab.required_token_status)
              });
            }
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch collaboration data",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching collaboration:", error);
          toast({
            title: "Error",
            description: "Failed to load collaboration data",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchCollaboration();
  }, [id, form, toast]);

  const onSubmit = async (data: CreateCollaboration) => {
    console.log("Form data to be submitted:", data);
    setIsSubmitting(true);
    try {
      // Create a clean copy of the data without any type issues
      let formattedData = { ...data };
      
      // Handle specific_date - only include if date_type is specific_date
      if (data.date_type === 'specific_date' && data.specific_date) {
        // Ensure it's in YYYY-MM-DD format
        const dateStr = String(data.specific_date);
        console.log("Specific date before formatting:", dateStr);
        
        // We already have it in the correct format from the date picker
        formattedData.specific_date = dateStr;
      } else {
        // Remove specific_date if not needed
        delete formattedData.specific_date;
      }
      
      // Ensure specific optional fields are in proper format
      formattedData = {
        ...formattedData,
        required_company_sectors: formattedData.required_company_sectors || [],
        required_funding_stages: formattedData.required_funding_stages || [],
      };
      
      // Get Telegram init data if available
      const telegramInitData = window.Telegram?.WebApp?.initData || '';
      
      // Determine if we're creating or updating
      const endpoint = isEditing ? `/api/collaborations/${id}` : '/api/collaborations';
      const method = isEditing ? 'PATCH' : 'POST';
      
      // Use the correct type for apiRequest
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': telegramInitData
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: isEditing 
            ? "Your collaboration has been updated."
            : "Your collaboration has been posted.",
        });
        setLocation('/my-collaborations');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} collaboration`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} collaboration`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render specific details form based on selected collaboration type
  const renderCollabTypeSpecificFields = () => {
    switch (selectedCollabType) {
      case "Podcast Guest Appearance":
        return (
          <div className="space-y-4">
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
                    <Input placeholder="https://your-podcast-link.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      
      case "Twitter Spaces Guest":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="details.twitter_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter Handle</FormLabel>
                  <FormControl>
                    <Input placeholder="@yourhandle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.host_follower_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter Follower Count</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="details.space_topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Topics</FormLabel>
                  <FormDescription>
                    Enter topics separated by commas
                  </FormDescription>
                  <FormControl>
                    <Input 
                      placeholder="Blockchain, DeFi, Web3" 
                      onChange={(e) => {
                        // Convert comma-separated string to array
                        const topicsArray = e.target.value.split(',').map(topic => topic.trim());
                        field.onChange(topicsArray);
                      }}
                      // Convert array back to comma-separated string for display
                      value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case "Newsletter Feature":
        return (
          <div className="space-y-4">
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
              name="details.audience_reach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience Reach</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      placeholder="Brief description of your newsletter" 
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
              name="details.topics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Newsletter Topics</FormLabel>
                  <FormDescription>
                    Enter topics separated by commas
                  </FormDescription>
                  <FormControl>
                    <Input 
                      placeholder="Blockchain, DeFi, Web3" 
                      onChange={(e) => {
                        // Convert comma-separated string to array
                        const topicsArray = e.target.value.split(',').map(topic => topic.trim());
                        field.onChange(topicsArray);
                      }}
                      // Convert array back to comma-separated string for display
                      value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "Co-Marketing on Twitter":
        // Only render this if NOT showing the inline fields
        if (showTwitterFields) {
          return null;
        }
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="details.collaboration_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter Collaboration Types</FormLabel>
                  <FormDescription>
                    Select all collaboration types you're interested in
                  </FormDescription>
                  <div className="space-y-2">
                    {TWITTER_COLLAB_TYPES.map((type) => (
                      <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(type)}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              if (checked) {
                                field.onChange([...currentValue, type]);
                              } else {
                                field.onChange(currentValue.filter((value) => value !== type));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{type}</FormLabel>
                      </FormItem>
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
                  <FormLabel>Host Twitter Handle</FormLabel>
                  <FormControl>
                    <Input placeholder="@yourhandle" {...field} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          </div>
        );

      // Add support for other collaboration types here
        
      default:
        return null;
    }
  };

  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <PageHeader 
          title={isEditing ? "Edit Collaboration" : "Create Collaboration"} 
          subtitle={isEditing ? "Update your collaboration details" : "Offer collaboration opportunities"}
          backUrl="/my-collaborations"
        />
        
        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="collab_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collaboration Type</FormLabel>
                        <Select 
                          onValueChange={(value) => handleCollabTypeChange(value as typeof COLLAB_TYPES[number])} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select collaboration type" />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Twitter Co-Marketing Fields - Only shown when that type is selected */}
                  {showTwitterFields && (
                    <div className="mt-4 p-4 border rounded-md bg-card dark:border-gray-700">
                      <div className="font-medium mb-4 text-card-foreground">Twitter Collaboration Types</div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="details.collaboration_types"
                          render={({ field }) => (
                            <FormItem>
                              <FormDescription>
                                Select all collaboration types you're interested in
                              </FormDescription>
                              <div className="space-y-2">
                                {TWITTER_COLLAB_TYPES.map((type) => (
                                  <FormItem key={type} className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(type)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentValue, type]);
                                          } else {
                                            field.onChange(currentValue.filter((value) => value !== type));
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">{type}</FormLabel>
                                  </FormItem>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Topics moved to Collaboration Details */}
                  
                  <FormField
                    control={form.control}
                    name="date_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Timing</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="any_future_date" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Any Future Date
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="specific_date" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Specific Date
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
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
                          <FormLabel>Specific Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Title and description fields removed as requested */}
                </CardContent>
              </Card>
              
              {/* For Twitter Co-Marketing, show handle and follower count in Collaboration Details */}
              {(selectedCollabType === "Co-Marketing on Twitter" && showTwitterFields) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Twitter Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="details.host_twitter_handle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host Twitter Handle</FormLabel>
                          <FormControl>
                            <Input placeholder="@yourhandle" {...field} />
                          </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </CardContent>
                </Card>
              )}
              
              {/* Collaboration Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Topics for this collaboration */}
                  <FormField
                    control={form.control}
                    name="topics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topics</FormLabel>
                        <FormDescription>
                          Select all topics that apply to this collaboration
                        </FormDescription>
                        <div className="flex justify-between mb-2">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // Select all topics
                              field.onChange([...COLLAB_TOPICS]);
                            }}
                          >
                            Select All
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => field.onChange([])}
                          >
                            Deselect All
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                          {COLLAB_TOPICS.map((topic) => (
                            <FormItem key={topic} className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(topic)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, topic]);
                                    } else {
                                      field.onChange(currentValue.filter((value) => value !== topic));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">{topic}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Free Collaboration Confirmation */}
                  <FormField
                    control={form.control}
                    name="is_free_collab"
                    render={({ field }) => (
                      <FormItem className="border p-4 rounded-md bg-background border-primary/20">
                        <div className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="font-medium text-primary">This is a completely free collaboration</FormLabel>
                            <FormDescription>
                              I confirm this collab is 100% free with no payments, fees, or commercial aspects involved. 
                              Money-related collabs aren't allowed on our platform.
                            </FormDescription>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Specific collaboration type fields */}
                  {selectedCollabType && !showTwitterFields && renderCollabTypeSpecificFields() && (
                    <div className="pt-4 border-t mt-6">
                      <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                      {renderCollabTypeSpecificFields()}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Filtering Criteria</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set requirements for who can apply to your collaboration
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Sectors Filter */}
                  <div className="flex items-center space-x-3 mb-4">
                    <Switch
                      checked={filtersEnabled.companySectors}
                      onCheckedChange={() => toggleFilter('companySectors')}
                    />
                    <div className="grid gap-0.5">
                      <div className="text-base font-medium">Company Sectors</div>
                      <p className="text-sm text-muted-foreground">
                        Filter by specific company sectors
                      </p>
                    </div>
                  </div>
                  
                  {filtersEnabled.companySectors && (
                    <FormField
                      control={form.control}
                      name="required_company_sectors"
                      render={({ field }) => (
                        <FormItem className="ml-10">
                          <div className="mb-2 font-medium">Required Company Sectors</div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Select the company sectors that can apply
                          </p>
                          <div className="flex justify-between mb-2">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Select all company sectors
                                const allSectors = Object.values(COMPANY_TAG_CATEGORIES).flat();
                                field.onChange(allSectors);
                              }}
                            >
                              Select All
                            </Button>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => field.onChange([])}
                            >
                              Deselect All
                            </Button>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto p-2 border rounded-md">
                            {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                              <div key={category} className="mb-4">
                                <div className="font-medium mb-2">{category}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {tags.map((tag) => (
                                    <FormItem key={tag} className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(tag)}
                                          onCheckedChange={(checked) => {
                                            const currentValue = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentValue, tag]);
                                            } else {
                                              field.onChange(currentValue.filter((value) => value !== tag));
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <div className="font-normal text-sm">{tag}</div>
                                    </FormItem>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Company Followers Filter */}
                  <div className="flex items-center space-x-3 mb-4">
                    <Switch
                      checked={filtersEnabled.companyFollowers}
                      onCheckedChange={() => toggleFilter('companyFollowers')}
                    />
                    <div className="grid gap-0.5">
                      <div className="text-base font-medium">Company Twitter Followers</div>
                      <p className="text-sm text-muted-foreground">
                        Set minimum company follower count
                      </p>
                    </div>
                  </div>
                  
                  {filtersEnabled.companyFollowers && (
                    <FormField
                      control={form.control}
                      name="min_company_followers"
                      render={({ field }) => (
                        <FormItem className="ml-10">
                          <div className="mb-2 font-medium">Minimum Company Twitter Followers</div>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* User Followers Filter */}
                  <div className="flex items-center space-x-3 mb-4 mt-6">
                    <Switch
                      checked={filtersEnabled.userFollowers}
                      onCheckedChange={() => toggleFilter('userFollowers')}
                    />
                    <div className="grid gap-0.5">
                      <div className="text-base font-medium">User Twitter Followers</div>
                      <p className="text-sm text-muted-foreground">
                        Set minimum user follower count
                      </p>
                    </div>
                  </div>
                  
                  {filtersEnabled.userFollowers && (
                    <FormField
                      control={form.control}
                      name="min_user_followers"
                      render={({ field }) => (
                        <FormItem className="ml-10">
                          <div className="mb-2 font-medium">Minimum User Twitter Followers</div>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Funding Stages Filter */}
                  <div className="flex items-center space-x-3 mb-4 mt-6">
                    <Switch
                      checked={filtersEnabled.fundingStages}
                      onCheckedChange={() => toggleFilter('fundingStages')}
                    />
                    <div className="grid gap-0.5">
                      <div className="text-base font-medium">Funding Stages</div>
                      <p className="text-sm text-muted-foreground">
                        Filter by company funding stages
                      </p>
                    </div>
                  </div>
                  
                  {filtersEnabled.fundingStages && (
                    <FormField
                      control={form.control}
                      name="required_funding_stages"
                      render={({ field }) => (
                        <FormItem className="ml-10">
                          <div className="mb-2 font-medium">Required Funding Stages</div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Select funding stages that are eligible to apply
                          </p>
                          <div className="flex justify-between mb-2">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Select all funding stages
                                field.onChange([...FUNDING_STAGES]);
                              }}
                            >
                              Select All
                            </Button>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => field.onChange([])}
                            >
                              Deselect All
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {FUNDING_STAGES.map((stage) => (
                              <FormItem key={stage} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(stage)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = field.value || [];
                                      if (checked) {
                                        field.onChange([...currentValue, stage]);
                                      } else {
                                        field.onChange(currentValue.filter((value) => value !== stage));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <div className="font-normal">{stage}</div>
                              </FormItem>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Token Status Filter */}
                  <div className="flex items-center space-x-3 mb-4 mt-6">
                    <Switch
                      checked={filtersEnabled.tokenStatus}
                      onCheckedChange={() => toggleFilter('tokenStatus')}
                    />
                    <div className="grid gap-0.5">
                      <div className="text-base font-medium">Token Requirement</div>
                      <p className="text-sm text-muted-foreground">
                        Only allow companies with tokens
                      </p>
                    </div>
                  </div>
                  
                  {filtersEnabled.tokenStatus && (
                    <FormField
                      control={form.control}
                      name="required_token_status"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 ml-10">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div>
                            <div className="font-medium">Require Token</div>
                            <p className="text-sm text-muted-foreground">
                              Only companies with tokens can apply
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-between pt-4 pb-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting 
                    ? (isEditing ? "Updating..." : "Creating...") 
                    : (isEditing ? "Update Collaboration" : "Create Collaboration")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </MobileCheck>
  );
}