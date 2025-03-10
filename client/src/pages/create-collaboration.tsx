import { useState } from "react";
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
      required_company_sectors: [],
      required_funding_stages: [],
      required_token_status: false,
      min_company_followers: TWITTER_FOLLOWER_COUNTS[0],
      min_user_followers: TWITTER_FOLLOWER_COUNTS[0],
      details: {
        // Initial empty details will be filled based on selection
      } as any
    }
  });

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
          twitter_handle: "https://x.com/",
          space_topic: [],
          host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
        });
        break;
      case "Newsletter Feature":
        form.setValue('details', {
          newsletter_name: "",
          subscriber_count: AUDIENCE_SIZE_RANGES[0],
          format: "feature"
        });
        break;
      // Add other collaboration types as needed
      default:
        form.setValue('details', {});
        break;
    }
  }

  const onSubmit = async (data: CreateCollaboration) => {
    setIsSubmitting(true);
    try {
      // Match form data to schema
      const formattedData = {
        ...data,
        // Ensure specific optional fields are in proper format
        required_company_sectors: data.required_company_sectors || [],
        required_funding_stages: data.required_funding_stages || [],
      };
      
      const response = await apiRequest('/api/collaborations', {
        method: 'POST',
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
        // Set initial podcastDetailsSchema when this type is selected
        if (!form.getValues('details') || !('podcast_name' in form.getValues('details'))) {
          form.setValue('details', {
            podcast_name: "",
            short_description: "",
            podcast_link: ""
          });
        }
        
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
        // Set initial twitterSpacesDetailsSchema when this type is selected
        if (!form.getValues('details') || !('twitter_handle' in form.getValues('details'))) {
          form.setValue('details', {
            twitter_handle: "https://x.com/",
            space_topic: [],
            host_follower_count: TWITTER_FOLLOWER_COUNTS[0]
          });
        }
        
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="details.twitter_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://x.com/yourhandle" {...field} />
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
          </div>
        );
        
      case "Newsletter Feature":
        // Set initial newsletterDetailsSchema when this type is selected
        if (!form.getValues('details') || !('newsletter_name' in form.getValues('details'))) {
          form.setValue('details', {
            newsletter_name: "",
            subscriber_count: AUDIENCE_SIZE_RANGES[0],
            format: "feature"
          });
        }
        
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
              name="details.subscriber_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscriber Count</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="sponsored">Sponsored Content</SelectItem>
                      <SelectItem value="news">News Coverage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <PageHeader 
          title="Create Collaboration" 
          subtitle="Offer collaboration opportunities"
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
                  
                  <FormField
                    control={form.control}
                    name="collab_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collaboration Type</FormLabel>
                        <Select 
                          onValueChange={(value) => handleCollabTypeChange(value)} 
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
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="min_user_followers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Twitter Followers</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select minimum followers" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No minimum</SelectItem>
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
                    name="required_company_sectors"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Company Sectors</FormLabel>
                          <FormDescription>
                            Select the sectors that are relevant for this collaboration
                          </FormDescription>
                        </div>
                        {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                          <div key={category} className="mb-4">
                            <h3 className="mb-2 text-sm font-medium">{category}</h3>
                            <div className="space-y-2">
                              {tags.map((tag) => (
                                <FormField
                                  key={tag}
                                  control={form.control}
                                  name="required_company_sectors"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={tag}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(tag)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value || [], tag])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== tag
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {tag}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="required_blockchain_networks"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Blockchain Networks</FormLabel>
                          <FormDescription>
                            Select the blockchain networks that are relevant for this collaboration
                          </FormDescription>
                        </div>
                        <div className="space-y-2">
                          {BLOCKCHAIN_NETWORKS.map((network) => (
                            <FormField
                              key={network}
                              control={form.control}
                              name="required_blockchain_networks"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={network}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(network)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value || [], network])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== network
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {network}
                                    </FormLabel>
                                  </FormItem>
                                )
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
                    name="additional_requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Requirements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any other specific requirements for collaborators" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Token & Compensation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="required_token_status"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(!!checked);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Has Token
                          </FormLabel>
                          <FormDescription>
                            Check if your project has a token
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="has_compensation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Offers Compensation
                          </FormLabel>
                          <FormDescription>
                            Check if you're offering compensation for this collaboration
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("has_compensation") && (
                    <FormField
                      control={form.control}
                      name="compensation_details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compensation Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the compensation offered" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation('/dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="min-w-[120px]"
                >
                  {isSubmitting ? "Submitting..." : "Create Collaboration"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </MobileCheck>
  );
}