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
import { MobileCheck } from "@/components/MobileCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/layout/PageHeader";

import {
  AUDIENCE_SIZE_RANGES,
  BLOCKCHAIN_NETWORKS,
  COLLAB_TYPES,
  COMPANY_CATEGORIES,
  COMPANY_TAG_CATEGORIES,
  FUNDING_STAGES,
  TWITTER_FOLLOWER_COUNTS,
  TWITTER_COLLAB_TYPES,
  createCollaborationSchema,
  type CreateCollaboration
} from "@shared/schema";

export default function CreateCollaboration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCollabType, setSelectedCollabType] = useState<typeof COLLAB_TYPES[number] | "">("");

  const form = useForm<CreateCollaboration>({
    resolver: zodResolver(createCollaborationSchema),
    defaultValues: {
      title: "",
      description: "",
      collab_type: COLLAB_TYPES[0],
      date_type: "specific_date",
      specific_date: new Date().toISOString().split('T')[0],
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
    handleCollabTypeChange(COLLAB_TYPES[0]);
  }, []);

  const handleCollabTypeChange = (value: typeof COLLAB_TYPES[number]) => {
    setSelectedCollabType(value);
    form.setValue("collab_type", value);
    
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
          collaboration_type: TWITTER_COLLAB_TYPES[0],
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
        });
        break;
      default:
        form.setValue('details', {});
        break;
    }
  };

  const onSubmit = async (data: CreateCollaboration) => {
    console.log("Form data to be submitted:", data);
    setIsSubmitting(true);
    try {
      // Match form data to schema
      const formattedData = {
        ...data,
        // Ensure specific optional fields are in proper format
        required_company_sectors: data.required_company_sectors || [],
        required_funding_stages: data.required_funding_stages || [],
      };
      
      // Use the correct type for apiRequest
      const response = await fetch('/api/collaborations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your collaboration has been posted.",
        });
        setLocation('/my-collabs');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create collaboration');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post collaboration",
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
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="details.collaboration_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collaboration Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select collaboration type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TWITTER_COLLAB_TYPES.map((type) => (
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
        return (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Select a collaboration type to see specific options</p>
          </div>
        );
    }
  };

  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <PageHeader 
          title="Create Collaboration" 
          subtitle="Offer collaboration opportunities"
          backUrl="/dashboard"
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
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a title for your collaboration" {...field} />
                        </FormControl>
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
                            placeholder="Describe your collaboration opportunity" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {selectedCollabType && (
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {renderCollabTypeSpecificFields()}
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Filtering Criteria</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set requirements for who can apply to your collaboration
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="min_company_followers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Company Twitter Followers</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="min_user_followers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum User Twitter Followers</FormLabel>
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
                  
                  <FormField
                    control={form.control}
                    name="required_funding_stages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Funding Stages</FormLabel>
                        <FormDescription>
                          Select funding stages that are eligible to apply
                        </FormDescription>
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
                              <FormLabel className="font-normal">{stage}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="required_token_status"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel className="font-normal">Require Token</FormLabel>
                          <FormDescription>
                            Only companies with tokens can apply
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  {isSubmitting ? "Creating..." : "Create Collaboration"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </MobileCheck>
  );
}