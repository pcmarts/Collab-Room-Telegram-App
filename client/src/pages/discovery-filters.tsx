import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";

// UI Components
import { MobileCheck } from "@/components/MobileCheck";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Icons
import { 
  Loader2, 
  MessageSquare, 
  Tag, 
  Building, 
  Users, 
  DollarSign, 
  CoinsIcon,
  Network,
  ChevronDown, 
  ChevronUp,
  Save
} from "lucide-react";

// Lazy import constants to reduce initial bundle size
const loadConstants = () => import("@shared/schema");

// Define the filter form schema
const filterFormSchema = z.object({
  // Collaboration types filter
  collabTypes: z.array(z.string()).default([]),
  
  // Topics filter
  topics: z.array(z.string()).default([]),
  
  // Company sectors filter
  companySectors: z.array(z.string()).default([]),
  
  // Follower filters
  companyFollowers: z.string().optional(),
  userFollowers: z.string().optional(),
  
  // Funding and token filters
  fundingStages: z.array(z.string()).default([]),
  hasToken: z.boolean().default(false),
  
  // Blockchain networks filter
  blockchainNetworks: z.array(z.string()).default([])
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

export default function DiscoveryFilters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  
  // State for lazy-loaded constants
  const [constants, setConstants] = useState<any>(null);
  const [constantsLoading, setConstantsLoading] = useState(false);

  // Filter toggle states
  const [filtersEnabled, setFiltersEnabled] = useState({
    collabTypes: false,
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false
  });

  // Filter expansion states (UI only)
  const [filtersExpanded, setFiltersExpanded] = useState({
    collabTypes: false,
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false
  });

  // Category expansion states for nested sections
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Form setup
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      collabTypes: [],
      topics: [],
      companySectors: [],
      companyFollowers: undefined,
      userFollowers: undefined,
      fundingStages: [],
      hasToken: false,
      blockchainNetworks: []
    }
  });

  // Define type for API response
  interface MarketingPreferencesResponse {
    id?: string;
    user_id?: string;
    collabs_to_discover?: string[];
    collabs_to_host?: string[];
    twitter_collabs?: string[];
    filtered_marketing_topics?: string[];
    twitter_followers?: string;
    company_twitter_followers?: string;
    funding_stage?: string;
    company_has_token?: boolean;
    company_token_ticker?: string;
    company_blockchain_networks?: string[];
    company_tags?: string[];
    discovery_filter_enabled?: boolean;
    discovery_filter_collab_types_enabled?: boolean;
    discovery_filter_topics_enabled?: boolean;
    discovery_filter_company_followers_enabled?: boolean;
    discovery_filter_user_followers_enabled?: boolean;
    discovery_filter_funding_stages_enabled?: boolean;
    discovery_filter_token_status_enabled?: boolean;
    discovery_filter_company_sectors_enabled?: boolean;
    discovery_filter_blockchain_networks_enabled?: boolean;
    created_at?: string;
  }

  // Fetch current preferences from API with better caching
  const { data: marketingPrefs = {} as MarketingPreferencesResponse, isLoading } = useQuery<MarketingPreferencesResponse>({
    queryKey: ['/api/marketing-preferences'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Memoized form values to avoid unnecessary recalculations
  const formValues = useMemo(() => {
    if (!marketingPrefs) return null;
    
    return {
      collabTypes: Array.isArray(marketingPrefs.collabs_to_discover) ? 
        marketingPrefs.collabs_to_discover : [],
      
      topics: Array.isArray(marketingPrefs.filtered_marketing_topics) ? 
        marketingPrefs.filtered_marketing_topics : [],
      
      companySectors: Array.isArray(marketingPrefs.company_tags) ? 
        marketingPrefs.company_tags : [],
      
      companyFollowers: marketingPrefs.company_twitter_followers || undefined,
      userFollowers: marketingPrefs.twitter_followers || undefined,
      
      // Handle funding_stage as a comma-separated string
      fundingStages: marketingPrefs.funding_stage ? 
        marketingPrefs.funding_stage.split(',') : [],
      
      hasToken: marketingPrefs.company_has_token === true,
      
      blockchainNetworks: Array.isArray(marketingPrefs.company_blockchain_networks) ? 
        marketingPrefs.company_blockchain_networks : []
    };
  }, [marketingPrefs]);

  // Memoized filter states to avoid unnecessary recalculations
  const filterStates = useMemo(() => {
    if (!marketingPrefs) return null;
    
    return {
      enabled: {
        collabTypes: marketingPrefs.discovery_filter_collab_types_enabled || false,
        topics: marketingPrefs.discovery_filter_topics_enabled || false,
        companySectors: marketingPrefs.discovery_filter_company_sectors_enabled || false,
        companyFollowers: marketingPrefs.discovery_filter_company_followers_enabled || false,
        userFollowers: marketingPrefs.discovery_filter_user_followers_enabled || false,
        fundingStages: marketingPrefs.discovery_filter_funding_stages_enabled || false,
        hasToken: marketingPrefs.discovery_filter_token_status_enabled || false,
        blockchainNetworks: marketingPrefs.discovery_filter_blockchain_networks_enabled || false
      },
      expanded: {
        collabTypes: marketingPrefs.discovery_filter_collab_types_enabled || false,
        topics: marketingPrefs.discovery_filter_topics_enabled || false,
        companySectors: marketingPrefs.discovery_filter_company_sectors_enabled || false,
        companyFollowers: marketingPrefs.discovery_filter_company_followers_enabled || false,
        userFollowers: marketingPrefs.discovery_filter_user_followers_enabled || false,
        fundingStages: marketingPrefs.discovery_filter_funding_stages_enabled || false,
        hasToken: marketingPrefs.discovery_filter_token_status_enabled || false,
        blockchainNetworks: marketingPrefs.discovery_filter_blockchain_networks_enabled || false
      }
    };
  }, [marketingPrefs]);

  // Load constants when component mounts
  useEffect(() => {
    const loadFilterConstants = async () => {
      if (!constants && !constantsLoading) {
        setConstantsLoading(true);
        try {
          const schemaModule = await loadConstants();
          setConstants(schemaModule);
        } catch (error) {
          console.error('Failed to load filter constants:', error);
        } finally {
          setConstantsLoading(false);
        }
      }
    };
    
    loadFilterConstants();
  }, [constants, constantsLoading]);

  // Load saved preferences into form - optimized
  useEffect(() => {
    if (formValues && filterStates) {
      // Reset form with saved values
      form.reset(formValues);
      
      // Set filter states
      setFiltersEnabled(filterStates.enabled);
      setFiltersExpanded(filterStates.expanded);
    }
  }, [formValues, filterStates, form]);

  // Toggle filter enabled state
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    const newState = !filtersEnabled[filterName];
    
    setFiltersEnabled(prev => ({
      ...prev,
      [filterName]: newState
    }));

    // Also expand the section when enabling
    if (newState) {
      setFiltersExpanded(prev => ({
        ...prev,
        [filterName]: true
      }));
    }

    // Clear values if disabling a filter
    if (!newState) {
      switch (filterName) {
        case 'collabTypes':
          form.setValue('collabTypes', []);
          break;
        case 'topics':
          form.setValue('topics', []);
          break;
        case 'companySectors':
          form.setValue('companySectors', []);
          break;
        case 'companyFollowers':
          form.setValue('companyFollowers', undefined);
          break;
        case 'userFollowers':
          form.setValue('userFollowers', undefined);
          break;
        case 'fundingStages':
          form.setValue('fundingStages', []);
          break;
        case 'hasToken':
          form.setValue('hasToken', false);
          break;
        case 'blockchainNetworks':
          form.setValue('blockchainNetworks', []);
          break;
      }
    }
  };

  // Toggle filter section expansion
  const toggleFilterExpansion = (filterName: keyof typeof filtersExpanded) => {
    // Check current expansion state
    const isCurrentlyExpanded = filtersExpanded[filterName];
    
    // Toggle expansion state
    setFiltersExpanded(prev => ({
      ...prev,
      [filterName]: !isCurrentlyExpanded
    }));
    
    // Automatically enable/disable the filter based on whether section is being expanded/collapsed
    // and whether there are any values selected
    if (!isCurrentlyExpanded) {
      // Expanding - automatically turn on the filter
      setFiltersEnabled(prev => ({
        ...prev,
        [filterName]: true
      }));
    } else {
      // Collapsing - check if there are any selected values
      // If no values are selected, turn off the filter
      let hasSelectedValues = false;
      
      switch (filterName) {
        case 'collabTypes':
          hasSelectedValues = form.getValues('collabTypes')?.length > 0;
          break;
        case 'topics':
          hasSelectedValues = form.getValues('topics')?.length > 0;
          break;
        case 'companySectors':
          hasSelectedValues = form.getValues('companySectors')?.length > 0;
          break;
        case 'companyFollowers':
          hasSelectedValues = !!form.getValues('companyFollowers');
          break;
        case 'userFollowers':
          hasSelectedValues = !!form.getValues('userFollowers');
          break;
        case 'fundingStages':
          hasSelectedValues = form.getValues('fundingStages')?.length > 0;
          break;
        case 'hasToken':
          hasSelectedValues = !!form.getValues('hasToken');
          break;
        case 'blockchainNetworks':
          hasSelectedValues = form.getValues('blockchainNetworks')?.length > 0;
          break;
      }
      
      if (!hasSelectedValues) {
        // If no values selected when collapsing, turn off the filter
        setFiltersEnabled(prev => ({
          ...prev,
          [filterName]: false
        }));
      }
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

  // Save filters to API
  const savePreferences = async (values: FilterFormValues) => {
    try {
      // Prepare data in the format expected by the API
      const data = {
        // Array fields
        collabs_to_discover: values.collabTypes,
        filtered_marketing_topics: values.topics,
        company_tags: values.companySectors,
        company_blockchain_networks: values.blockchainNetworks,
        
        // Scalar fields
        company_twitter_followers: filtersEnabled.companyFollowers ? values.companyFollowers : null,
        twitter_followers: filtersEnabled.userFollowers ? values.userFollowers : null,
        // Convert array of funding stages to a comma-separated string to match the backend schema
        funding_stage: filtersEnabled.fundingStages && values.fundingStages.length > 0 ? 
          values.fundingStages.join(',') : null,
        company_has_token: filtersEnabled.hasToken ? values.hasToken : null,
        
        // Filter enabled states
        discovery_filter_enabled: Object.values(filtersEnabled).some(v => v),
        discovery_filter_collab_types_enabled: filtersEnabled.collabTypes,
        discovery_filter_topics_enabled: filtersEnabled.topics,
        discovery_filter_company_sectors_enabled: filtersEnabled.companySectors,
        discovery_filter_company_followers_enabled: filtersEnabled.companyFollowers,
        discovery_filter_user_followers_enabled: filtersEnabled.userFollowers,
        discovery_filter_funding_stages_enabled: filtersEnabled.fundingStages,
        discovery_filter_token_status_enabled: filtersEnabled.hasToken,
        discovery_filter_blockchain_networks_enabled: filtersEnabled.blockchainNetworks,
      };

      console.log("Saving discovery filters:", data);

      // Send to API
      await apiRequest('/api/marketing-preferences', 'POST', data);

      // Invalidate cache and refetch
      queryClient.removeQueries({ queryKey: ['/api/marketing-preferences'] });
      await queryClient.fetchQuery({ 
        queryKey: ['/api/marketing-preferences'],
        staleTime: 0
      });

      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  };

  // Handle form submission
  const onSubmit = async (values: FilterFormValues) => {
    setIsSaving(true);
    
    try {
      const success = await savePreferences(values);
      
      if (success) {
        toast({
          title: "Filters saved",
          description: "Your discovery filters have been updated",
        });
        
        // Navigate to discover page immediately (smooth transition)
        navigate('/discover');
      } else {
        toast({
          title: "Error saving filters",
          description: "There was a problem saving your filters. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error saving filters",
        description: "There was a problem saving your filters. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // For scrollable layout
  useEffect(() => {
    document.documentElement.classList.add('scrollable-page');
    document.body.classList.add('scrollable-page');
    
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.overflow = 'auto';
      rootElement.style.height = 'auto';
      rootElement.style.position = 'static';
      rootElement.style.width = '100%';
    }
    
    return () => {
      document.documentElement.classList.remove('scrollable-page');
      document.body.classList.remove('scrollable-page');
      
      if (rootElement) {
        rootElement.style.removeProperty('overflow');
        rootElement.style.removeProperty('height');
        rootElement.style.removeProperty('position');
        rootElement.style.removeProperty('width');
      }
    };
  }, []);

  return (
    <MobileCheck>
      <div className="container pb-28 pt-4 space-y-6">
        <PageHeader 
          title="Discovery Filters" 
          subtitle="Customize what collaborations you want to discover"
          backUrl="/discover"
        />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Optimized loading state */}
            {isLoading && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </CardHeader>
                </Card>
              </div>
            )}
            
            {!isLoading && (
              <>
                {/* Filter: Collaboration Types */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Collaboration Types</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.collabTypes}
                          onCheckedChange={() => toggleFilter('collabTypes')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('collabTypes')}
                        >
                          {filtersExpanded.collabTypes ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by the type of collaboration
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.collabTypes && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="collabTypes"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {COLLAB_TYPES.map((type) => (
                                <FormItem key={type} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      disabled={!filtersEnabled.collabTypes}
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, type]
                                          : field.value?.filter((value) => value !== type);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {type}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>
                
                {/* Filter: Topics */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Content Topics</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.topics}
                          onCheckedChange={() => toggleFilter('topics')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('topics')}
                        >
                          {filtersExpanded.topics ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by content topics you're interested in
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.topics && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="topics"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {COLLAB_TOPICS.map((topic) => (
                                <FormItem key={topic} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      disabled={!filtersEnabled.topics}
                                      checked={field.value?.includes(topic)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, topic]
                                          : field.value?.filter((value) => value !== topic);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {topic}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>
                
                {/* Filter: Company Sectors */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Company Sectors</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.companySectors}
                          onCheckedChange={() => toggleFilter('companySectors')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('companySectors')}
                        >
                          {filtersExpanded.companySectors ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by company sectors you want to collaborate with
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.companySectors && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="companySectors"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-4">
                              {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                <div key={category} className="space-y-2">
                                  <div 
                                    className="flex items-center gap-2 cursor-pointer" 
                                    onClick={() => toggleCategory(category)}
                                  >
                                    <Badge variant="outline" className="py-1">
                                      {expandedCategories.includes(category) ? 
                                        <ChevronUp className="h-3 w-3 mr-1" /> : 
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                      }
                                      {category}
                                    </Badge>
                                  </div>
                                  
                                  {expandedCategories.includes(category) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                                      {tags.map((tag) => (
                                        <FormItem 
                                          key={tag} 
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              disabled={!filtersEnabled.companySectors}
                                              checked={field.value?.includes(tag)}
                                              onCheckedChange={(checked) => {
                                                const updatedValue = checked
                                                  ? [...field.value, tag]
                                                  : field.value?.filter((value) => value !== tag);
                                                field.onChange(updatedValue);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {tag}
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>
                
                {/* Filter: Chain */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Chain</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.blockchainNetworks}
                          onCheckedChange={() => toggleFilter('blockchainNetworks')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('blockchainNetworks')}
                        >
                          {filtersExpanded.blockchainNetworks ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by blockchain networks
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.blockchainNetworks && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="blockchainNetworks"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-4">
                              {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => (
                                <div key={category} className="space-y-2">
                                  <div 
                                    className="flex items-center gap-2 cursor-pointer" 
                                    onClick={() => toggleCategory(category)}
                                  >
                                    <Badge variant="outline" className="py-1">
                                      {expandedCategories.includes(category) ? 
                                        <ChevronUp className="h-3 w-3 mr-1" /> : 
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                      }
                                      {category}
                                    </Badge>
                                  </div>
                                  
                                  {expandedCategories.includes(category) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                                      {networks.map((network) => (
                                        <FormItem 
                                          key={network} 
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              disabled={!filtersEnabled.blockchainNetworks}
                                              checked={field.value?.includes(network)}
                                              onCheckedChange={(checked) => {
                                                const updatedValue = checked
                                                  ? [...field.value, network]
                                                  : field.value?.filter((value) => value !== network);
                                                field.onChange(updatedValue);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal">
                                            {network}
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>
                
                {/* Filter: Company Followers */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Company Followers</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.companyFollowers}
                          onCheckedChange={() => toggleFilter('companyFollowers')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('companyFollowers')}
                        >
                          {filtersExpanded.companyFollowers ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by minimum company Twitter followers
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.companyFollowers && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="companyFollowers"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              disabled={!filtersEnabled.companyFollowers}
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
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
                    </CardContent>
                  )}
                </Card>
                
                {/* Filter: User Followers */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">User Followers</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.userFollowers}
                          onCheckedChange={() => toggleFilter('userFollowers')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('userFollowers')}
                        >
                          {filtersExpanded.userFollowers ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by minimum user Twitter followers
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.userFollowers && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="userFollowers"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              disabled={!filtersEnabled.userFollowers}
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
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
                    </CardContent>
                  )}
                </Card>
                
                {/* Filter: Funding Stages */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Funding Stages</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.fundingStages}
                          onCheckedChange={() => toggleFilter('fundingStages')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('fundingStages')}
                        >
                          {filtersExpanded.fundingStages ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by company funding stage
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.fundingStages && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="fundingStages"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {FUNDING_STAGES.map((stage) => (
                                <FormItem key={stage} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      disabled={!filtersEnabled.fundingStages}
                                      checked={field.value?.includes(stage)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, stage]
                                          : field.value?.filter((value) => value !== stage);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {stage}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>
                
                {/* Filter: Has Token */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CoinsIcon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Token Status</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={filtersEnabled.hasToken}
                          onCheckedChange={() => toggleFilter('hasToken')}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleFilterExpansion('hasToken')}
                        >
                          {filtersExpanded.hasToken ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Filter by whether the company has a token
                    </CardDescription>
                  </CardHeader>
                  
                  {filtersExpanded.hasToken && (
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="hasToken"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 space-y-0">
                            <FormControl>
                              <Switch
                                disabled={!filtersEnabled.hasToken}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Only show companies with a token
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  )}
                </Card>
                
                {/* Submit Button */}
                <div className="fixed bottom-4 left-0 right-0 bg-background border-t rounded-lg shadow-md mx-4 p-6 flex justify-center">
                  <Button 
                    type="submit" 
                    className="w-full max-w-md py-6"
                    disabled={isSaving || form.formState.isSubmitting}
                  >
                    {isSaving || form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Filters
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </div>
    </MobileCheck>
  );
}