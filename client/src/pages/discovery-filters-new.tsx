import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

// UI Components
import { MobileCheck } from "@/components/MobileCheck";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, ChevronUp, ChevronDown, Filter, X } from "lucide-react";

// Constants and types
import {
  COLLAB_TYPES,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  FUNDING_STAGES,
  BLOCKCHAIN_NETWORK_CATEGORIES,
  TWITTER_FOLLOWER_COUNTS
} from "@/../../shared/schema";

// Define form schema
const filterFormSchema = z.object({
  // Lists (arrays) of filter values
  collabs_to_discover: z.array(z.string()).default([]),
  filtered_marketing_topics: z.array(z.string()).default([]),
  company_tags: z.array(z.string()).default([]),
  company_blockchain_networks: z.array(z.string()).default([]),
  funding_stages: z.array(z.string()).default([]),
  
  // Scalar filter values
  company_twitter_followers: z.string().optional(),
  twitter_followers: z.string().optional(),
  company_has_token: z.boolean().default(false),
  
  // Filter section toggle states
  discovery_filter_enabled: z.boolean().default(false),
  discovery_filter_collab_types_enabled: z.boolean().default(false),
  discovery_filter_topics_enabled: z.boolean().default(false),
  discovery_filter_company_sectors_enabled: z.boolean().default(false),
  discovery_filter_company_followers_enabled: z.boolean().default(false),
  discovery_filter_user_followers_enabled: z.boolean().default(false), 
  discovery_filter_funding_stages_enabled: z.boolean().default(false),
  discovery_filter_token_status_enabled: z.boolean().default(false),
  discovery_filter_blockchain_networks_enabled: z.boolean().default(false),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

export default function DiscoveryFiltersNew() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Initialize the form
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      collabs_to_discover: [],
      filtered_marketing_topics: [],
      company_tags: [],
      company_blockchain_networks: [],
      funding_stages: [],
      company_twitter_followers: undefined,
      twitter_followers: undefined,
      company_has_token: false,
      discovery_filter_enabled: false,
      discovery_filter_collab_types_enabled: false,
      discovery_filter_topics_enabled: false,
      discovery_filter_company_sectors_enabled: false,
      discovery_filter_company_followers_enabled: false,
      discovery_filter_user_followers_enabled: false,
      discovery_filter_funding_stages_enabled: false,
      discovery_filter_token_status_enabled: false,
      discovery_filter_blockchain_networks_enabled: false,
    }
  });
  
  // Get current values of the form to control UI elements
  const watchedValues = form.watch();
  
  // Track expanded filter sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    collabTypes: true,
    topics: true,
    companySectors: true,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false,
  });
  
  // Define a type for the marketing preferences response
  type MarketingPreferencesResponse = {
    collabs_to_discover: string[];
    filtered_marketing_topics: string[];
    company_tags: string[] | null;
    company_blockchain_networks: string[] | null;
    company_twitter_followers: string | null;
    twitter_followers: string | null;
    company_has_token: boolean | null;
    funding_stages: string[] | null;
    discovery_filter_enabled: boolean;
    discovery_filter_collab_types_enabled: boolean;
    discovery_filter_topics_enabled: boolean;
    discovery_filter_company_sectors_enabled: boolean;
    discovery_filter_company_followers_enabled: boolean;
    discovery_filter_user_followers_enabled: boolean;
    discovery_filter_funding_stages_enabled: boolean;
    discovery_filter_token_status_enabled: boolean;
    discovery_filter_blockchain_networks_enabled: boolean;
  };

  // Fetch user's current marketing preferences with proper typing
  const { 
    data: marketingPrefs = {} as MarketingPreferencesResponse, 
    isLoading: isLoadingPrefs 
  } = useQuery<MarketingPreferencesResponse>({
    queryKey: ['/api/marketing-preferences'],
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, 
    refetchOnMount: true,
    retry: 3 // Try up to 3 times if the request fails
  });
  
  // Toggle blockchain network category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Toggle a filter section's enabled state
  const toggleFilterEnabled = (filterName: string) => {
    const fieldName = `discovery_filter_${filterName}_enabled` as keyof FilterFormValues;
    const currentValue = form.getValues(fieldName);
    form.setValue(fieldName, !currentValue);
    
    // Also update the overall filter enabled state
    const newFormValues = form.getValues();
    const anyFilterEnabled = Object.keys(newFormValues)
      .filter(key => key.startsWith('discovery_filter_') && key !== 'discovery_filter_enabled')
      .some(key => newFormValues[key as keyof FilterFormValues] === true);
    
    form.setValue('discovery_filter_enabled', anyFilterEnabled);
    
    // Expand section when enabling it
    if (!currentValue) {
      setExpandedSections(prev => ({
        ...prev,
        [filterName.replace('_', '')]: true
      }));
    }
    
    // Clear values if disabling a filter section
    if (currentValue) {
      switch(filterName) {
        case 'collab_types':
          form.setValue('collabs_to_discover', []);
          break;
        case 'topics':
          form.setValue('filtered_marketing_topics', []);
          break;
        case 'company_sectors':
          form.setValue('company_tags', []);
          break;
        case 'company_followers':
          form.setValue('company_twitter_followers', undefined);
          break;
        case 'user_followers':
          form.setValue('twitter_followers', undefined);
          break;
        case 'funding_stages':
          form.setValue('funding_stages', []);
          break;
        case 'token_status':
          form.setValue('company_has_token', false);
          break;
        case 'blockchain_networks':
          form.setValue('company_blockchain_networks', []);
          break;
      }
    }
  };
  
  // Toggle a filter section's expansion without affecting enabled state
  const toggleSectionExpanded = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };
  
  // Initialize form with current preferences
  useEffect(() => {
    if (marketingPrefs && !isLoadingPrefs) {
      console.log("Loading marketing preferences:", JSON.stringify(marketingPrefs, null, 2));
      
      // Build form values from preferences
      const formValues: FilterFormValues = {
        // Arrays - ensure they're arrays using || []
        collabs_to_discover: Array.isArray(marketingPrefs.collabs_to_discover) ? [...marketingPrefs.collabs_to_discover] : [],
        filtered_marketing_topics: Array.isArray(marketingPrefs.filtered_marketing_topics) ? [...marketingPrefs.filtered_marketing_topics] : [],
        company_tags: Array.isArray(marketingPrefs.company_tags) ? [...marketingPrefs.company_tags] : [],
        company_blockchain_networks: Array.isArray(marketingPrefs.company_blockchain_networks) ? [...marketingPrefs.company_blockchain_networks] : [],
        funding_stages: Array.isArray(marketingPrefs.funding_stages) ? [...marketingPrefs.funding_stages] : [],
        
        // Scalar values with appropriate defaults
        company_twitter_followers: marketingPrefs.company_twitter_followers || undefined,
        twitter_followers: marketingPrefs.twitter_followers || undefined,
        company_has_token: marketingPrefs.company_has_token === true,
        
        // Filter section toggle states
        discovery_filter_enabled: marketingPrefs.discovery_filter_enabled === true,
        discovery_filter_collab_types_enabled: marketingPrefs.discovery_filter_collab_types_enabled === true,
        discovery_filter_topics_enabled: marketingPrefs.discovery_filter_topics_enabled === true,
        discovery_filter_company_sectors_enabled: marketingPrefs.discovery_filter_company_sectors_enabled === true,
        discovery_filter_company_followers_enabled: marketingPrefs.discovery_filter_company_followers_enabled === true,
        discovery_filter_user_followers_enabled: marketingPrefs.discovery_filter_user_followers_enabled === true,
        discovery_filter_funding_stages_enabled: marketingPrefs.discovery_filter_funding_stages_enabled === true,
        discovery_filter_token_status_enabled: marketingPrefs.discovery_filter_token_status_enabled === true,
        discovery_filter_blockchain_networks_enabled: marketingPrefs.discovery_filter_blockchain_networks_enabled === true,
      };
      
      console.log("Setting form values:", JSON.stringify(formValues, null, 2));
      form.reset(formValues);
      
      // Set expanded sections based on enabled states
      setExpandedSections({
        collabTypes: marketingPrefs.discovery_filter_collab_types_enabled === true,
        topics: marketingPrefs.discovery_filter_topics_enabled === true,
        companySectors: marketingPrefs.discovery_filter_company_sectors_enabled === true,
        companyFollowers: marketingPrefs.discovery_filter_company_followers_enabled === true,
        userFollowers: marketingPrefs.discovery_filter_user_followers_enabled === true,
        fundingStages: marketingPrefs.discovery_filter_funding_stages_enabled === true,
        hasToken: marketingPrefs.discovery_filter_token_status_enabled === true,
        blockchainNetworks: marketingPrefs.discovery_filter_blockchain_networks_enabled === true,
      });
      
      // Set expanded blockchain network categories if any networks are selected
      if (formValues.company_blockchain_networks.length > 0) {
        // Find which categories contain the selected networks
        const categoriesWithSelectedNetworks = Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES)
          .filter(([_, networks]) => 
            formValues.company_blockchain_networks.some(selected => 
              networks.includes(selected)
            )
          )
          .map(([category]) => category);
        
        setExpandedCategories(categoriesWithSelectedNetworks);
      }
    }
  }, [marketingPrefs, isLoadingPrefs, form]);
  
  // Save the form data to the API
  const savePreferences = async (values: FilterFormValues) => {
    try {
      setLoading(true);
      
      console.log("Saving preferences:", JSON.stringify(values, null, 2));
      
      // Send data to API
      const response = await apiRequest('/api/marketing-preferences', 'POST', values);
      console.log("API response:", JSON.stringify(response, null, 2));
      
      // Improved cache handling: completely remove and fetch new data
      await queryClient.removeQueries({ queryKey: ['/api/marketing-preferences'] });
      await queryClient.fetchQuery({ 
        queryKey: ['/api/marketing-preferences'],
        staleTime: 0
      });
      
      toast({
        title: "Preferences saved",
        description: "Your discovery filters have been updated"
      });
      
      return true;
    } catch (error) {
      console.error("Error saving preferences:", error);
      
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences. Please try again.",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission with improved error handling
  const onSubmit = async (values: FilterFormValues) => {
    try {
      console.log("Form submitted with values:", JSON.stringify(values, null, 2));
      const success = await savePreferences(values);
      
      if (success) {
        toast({
          title: "Success!",
          description: "Your discovery filter preferences have been saved and will be applied to your feed."
        });
        
        // Add a slightly longer delay to ensure UI feedback and data refresh
        setTimeout(() => {
          console.log("Redirecting to /discover page");
          navigate('/discover');
        }, 500);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error saving preferences",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Apply styles to ensure proper scrolling while having fixed bottom buttons
  useEffect(() => {
    // Only set overflow to auto (not the height) to ensure scrolling works
    document.body.style.overflow = 'auto';
    
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, []);
  
  if (isLoadingPrefs) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your preferences...</span>
      </div>
    );
  }
  
  return (
    <MobileCheck>
      <div className="container pb-52 min-h-screen">
        <PageHeader
          title="Discovery Filters"
          subtitle="Customize which collaborations appear in your discover feed"
          backUrl="/discover"
        />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Main filters card with improved styling */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 space-y-8">
                {/* Collaboration Types Filter */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-indigo-700">Collaboration Types</h3>
                      <p className="text-sm text-indigo-500/80">
                        Filter by specific collaboration formats
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_collab_types_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('collabTypes')}
                          type="button"
                        >
                          {expandedSections.collabTypes ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_collab_types_enabled}
                        onCheckedChange={() => toggleFilterEnabled('collab_types')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_collab_types_enabled && expandedSections.collabTypes && (
                    <FormField
                      control={form.control}
                      name="collabs_to_discover"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {field.value.map(type => (
                                  <Badge
                                    key={type}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {type}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                      onClick={() => {
                                        field.onChange(field.value.filter(t => t !== type));
                                      }}
                                      type="button"
                                    >
                                      <X size={12} />
                                    </Button>
                                  </Badge>
                                ))}
                                
                                {field.value.length > 0 && (
                                  <Button
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => field.onChange([])}
                                    type="button"
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {COLLAB_TYPES.map(type => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`collab-type-${type}`}
                                    checked={field.value.includes(type)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, type]);
                                      } else {
                                        field.onChange(field.value.filter(t => t !== type));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`collab-type-${type}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {type}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Topics Filter with updated styling */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-purple-50/50 to-fuchsia-50/50 border border-purple-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-700">Topics</h3>
                      <p className="text-sm text-purple-500/80">
                        Filter by collaboration topic areas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_topics_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('topics')}
                          type="button"
                        >
                          {expandedSections.topics ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_topics_enabled}
                        onCheckedChange={() => toggleFilterEnabled('topics')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_topics_enabled && expandedSections.topics && (
                    <FormField
                      control={form.control}
                      name="filtered_marketing_topics"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {field.value.map(topic => (
                                  <Badge
                                    key={topic}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {topic}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                      onClick={() => {
                                        field.onChange(field.value.filter(t => t !== topic));
                                      }}
                                      type="button"
                                    >
                                      <X size={12} />
                                    </Button>
                                  </Badge>
                                ))}
                                
                                {field.value.length > 0 && (
                                  <Button
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => field.onChange([])}
                                    type="button"
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {COLLAB_TOPICS.map(topic => (
                                <div key={topic} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`topic-${topic}`}
                                    checked={field.value.includes(topic)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, topic]);
                                      } else {
                                        field.onChange(field.value.filter(t => t !== topic));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`topic-${topic}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {topic}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Company Sectors Filter */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 border border-cyan-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-700">Company Sectors</h3>
                      <p className="text-sm text-cyan-500/80">
                        Filter by company industry or focus
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_company_sectors_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('companySectors')}
                          type="button"
                        >
                          {expandedSections.companySectors ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_company_sectors_enabled}
                        onCheckedChange={() => toggleFilterEnabled('company_sectors')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_company_sectors_enabled && expandedSections.companySectors && (
                    <FormField
                      control={form.control}
                      name="company_tags"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {field.value.map(tag => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {tag}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                      onClick={() => {
                                        field.onChange(field.value.filter(t => t !== tag));
                                      }}
                                      type="button"
                                    >
                                      <X size={12} />
                                    </Button>
                                  </Badge>
                                ))}
                                
                                {field.value.length > 0 && (
                                  <Button
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => field.onChange([])}
                                    type="button"
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            <Accordion type="multiple" className="w-full">
                              {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                <AccordionItem key={category} value={category}>
                                  <AccordionTrigger className="text-sm font-medium py-2">
                                    {category}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                                      {tags.map(tag => (
                                        <div key={tag} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`tag-${tag}`}
                                            checked={field.value.includes(tag)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                field.onChange([...field.value, tag]);
                                              } else {
                                                field.onChange(field.value.filter(t => t !== tag));
                                              }
                                            }}
                                          />
                                          <label
                                            htmlFor={`tag-${tag}`}
                                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {tag}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Company Twitter Followers Filter */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border border-emerald-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-700">Company Twitter Followers</h3>
                      <p className="text-sm text-emerald-500/80">
                        Filter by minimum follower count
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_company_followers_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('companyFollowers')}
                          type="button"
                        >
                          {expandedSections.companyFollowers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_company_followers_enabled}
                        onCheckedChange={() => toggleFilterEnabled('company_followers')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_company_followers_enabled && expandedSections.companyFollowers && (
                    <FormField
                      control={form.control}
                      name="company_twitter_followers"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select minimum followers" />
                            </SelectTrigger>
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
                
                {/* User Twitter Followers Filter */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-blue-50/50 to-sky-50/50 border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-700">User Twitter Followers</h3>
                      <p className="text-sm text-blue-500/80">
                        Filter by minimum follower count for the creator
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_user_followers_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('userFollowers')}
                          type="button"
                        >
                          {expandedSections.userFollowers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_user_followers_enabled}
                        onCheckedChange={() => toggleFilterEnabled('user_followers')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_user_followers_enabled && expandedSections.userFollowers && (
                    <FormField
                      control={form.control}
                      name="twitter_followers"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select minimum followers" />
                            </SelectTrigger>
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
                
                {/* Funding Stages Filter */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-amber-700">Funding Stages</h3>
                      <p className="text-sm text-amber-500/80">
                        Filter by company funding stage
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_funding_stages_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('fundingStages')}
                          type="button"
                        >
                          {expandedSections.fundingStages ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_funding_stages_enabled}
                        onCheckedChange={() => toggleFilterEnabled('funding_stages')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_funding_stages_enabled && expandedSections.fundingStages && (
                    <FormField
                      control={form.control}
                      name="funding_stages"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {field.value.map(stage => (
                                  <Badge
                                    key={stage}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {stage}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                      onClick={() => {
                                        field.onChange(field.value.filter(s => s !== stage));
                                      }}
                                      type="button"
                                    >
                                      <X size={12} />
                                    </Button>
                                  </Badge>
                                ))}
                                
                                {field.value.length > 0 && (
                                  <Button
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => field.onChange([])}
                                    type="button"
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {FUNDING_STAGES.map(stage => (
                                <div key={stage} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`stage-${stage}`}
                                    checked={field.value.includes(stage)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...field.value, stage]);
                                      } else {
                                        field.onChange(field.value.filter(s => s !== stage));
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`stage-${stage}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {stage}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Token Status Filter */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-purple-50/50 to-violet-50/50 border border-purple-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-700">Has Token</h3>
                      <p className="text-sm text-purple-500/80">
                        Filter by company token status
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_token_status_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('hasToken')}
                          type="button"
                        >
                          {expandedSections.hasToken ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_token_status_enabled}
                        onCheckedChange={() => toggleFilterEnabled('token_status')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_token_status_enabled && expandedSections.hasToken && (
                    <FormField
                      control={form.control}
                      name="company_has_token"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="token-switch"
                            />
                            <label
                              htmlFor="token-switch"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Only show companies with tokens
                            </label>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {/* Blockchain Networks Filter */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-teal-50/50 to-green-50/50 border border-teal-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-teal-700">Blockchain Networks</h3>
                      <p className="text-sm text-teal-500/80">
                        Filter by supported blockchain networks
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {watchedValues.discovery_filter_blockchain_networks_enabled && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSectionExpanded('blockchainNetworks')}
                          type="button"
                        >
                          {expandedSections.blockchainNetworks ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </Button>
                      )}
                      <Switch
                        checked={watchedValues.discovery_filter_blockchain_networks_enabled}
                        onCheckedChange={() => toggleFilterEnabled('blockchain_networks')}
                      />
                    </div>
                  </div>
                  
                  {watchedValues.discovery_filter_blockchain_networks_enabled && expandedSections.blockchainNetworks && (
                    <FormField
                      control={form.control}
                      name="company_blockchain_networks"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-2">
                            {field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {field.value.map(network => (
                                  <Badge
                                    key={network}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {network}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                      onClick={() => {
                                        field.onChange(field.value.filter(n => n !== network));
                                      }}
                                      type="button"
                                    >
                                      <X size={12} />
                                    </Button>
                                  </Badge>
                                ))}
                                
                                {field.value.length > 0 && (
                                  <Button
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => field.onChange([])}
                                    type="button"
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            <Accordion type="multiple" className="w-full">
                              {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => (
                                <AccordionItem key={category} value={category}>
                                  <AccordionTrigger className="text-sm font-medium py-2">
                                    {category}
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                                      {networks.map(network => (
                                        <div key={network} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`network-${network}`}
                                            checked={field.value.includes(network)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                field.onChange([...field.value, network]);
                                              } else {
                                                field.onChange(field.value.filter(n => n !== network));
                                              }
                                            }}
                                          />
                                          <label
                                            htmlFor={`network-${network}`}
                                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {network}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
        
        {/* Modern floating action bar with gradient background and pill-shaped buttons */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md p-4 bg-gradient-to-r from-indigo-500/90 to-purple-600/90 backdrop-blur-md rounded-full shadow-2xl flex justify-between items-center z-50 border border-indigo-300/30">
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate('/discover')}
            disabled={loading}
            className="text-base font-medium text-white hover:text-white/80 hover:bg-white/10"
          >
            Cancel
          </Button>
          
          <span className="h-8 w-px bg-white/20"></span>
          
          <Button
            type="button"
            disabled={loading}
            className="bg-white text-indigo-700 hover:bg-white/90 hover:text-indigo-800 transition-all duration-200 px-6 py-2 rounded-full font-medium flex items-center text-base"
            onClick={() => form.handleSubmit(onSubmit)()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4" />
                Save Filters
              </>
            )}
          </Button>
        </div>
      </div>
    </MobileCheck>
  );
}