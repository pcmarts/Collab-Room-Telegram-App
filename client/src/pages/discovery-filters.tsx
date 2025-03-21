import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Users, 
  CalendarDays, 
  Clock, 
  Coins, 
  Sliders, 
  Check, 
  X, 
  Eye, 
  MessageSquare, 
  UserCheck, 
  UserX, 
  ListChecks, 
  Trash2,
  Filter,
  Info,
  Save,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  COLLAB_TYPES, 
  TWITTER_FOLLOWER_COUNTS,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  FUNDING_STAGES, 
  BLOCKCHAIN_NETWORKS,
  BLOCKCHAIN_NETWORK_CATEGORIES,
  type Collaboration,
  type CollabApplication,
  type ApplicationData,
  type MarketingPreferences,
  type NotificationPreferences
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { MobileCheck } from "@/components/MobileCheck";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the schema for the form
const marketingPreferencesSchema = z.object({
  matchingEnabled: z.boolean().default(true),
  collabTypes: z.array(z.string()).default([]),
  companySectors: z.array(z.string()).default([]),
  companyFollowers: z.string().optional(),
  fundingStages: z.array(z.string()).default([]),
  hasToken: z.boolean().default(false),
  blockchainNetworks: z.array(z.string()).default([]),
  preferredTopics: z.array(z.string()).default([]),
});

type MarketingPreferencesForm = z.infer<typeof marketingPreferencesSchema>;

export default function DiscoveryFilters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  

  
  // State for tracking expanded accordion sections
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // State for filter toggles
  const [filtersEnabled, setFiltersEnabled] = useState({
    collabTypes: false,
    topics: false,
    companySectors: false,
    companyFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false,
  });
  
  // State for filter sections expansion (separate from enabled state)
  const [filtersExpanded, setFiltersExpanded] = useState({
    collabTypes: false,
    topics: false,
    companySectors: false,
    companyFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false,
  });
  
  // State for topics (managed separately)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Form setup
  const form = useForm<MarketingPreferencesForm>({
    resolver: zodResolver(marketingPreferencesSchema),
    defaultValues: {
      matchingEnabled: true,
      collabTypes: [],
      companySectors: [],
      companyFollowers: undefined,
      fundingStages: [],
      hasToken: false,
      blockchainNetworks: [],
      preferredTopics: [],
    }
  });
  
  // Auto-save timer
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Load saved preferences
  const { data: marketingPreferences, isLoading } = useQuery({
    queryKey: ['/api/marketing-preferences'],
    staleTime: 1000 * 60 * 5,
  });
  
  // Initialize form with saved preferences
  useEffect(() => {
    if (marketingPreferences) {
      console.log("Loading marketing preferences:", marketingPreferences);
      
      // Map marketingPreferences to form values using the correct field names from the API
      const formValues: MarketingPreferencesForm = {
        matchingEnabled: true,
        collabTypes: marketingPreferences.collab_types || [],
        companySectors: marketingPreferences.company_tags || [], // Backend uses company_tags
        companyFollowers: marketingPreferences.company_twitter_followers || undefined, // Backend uses company_twitter_followers
        fundingStages: marketingPreferences.funding_stages || [],
        hasToken: marketingPreferences.company_has_token || false, // Backend uses company_has_token
        blockchainNetworks: marketingPreferences.company_blockchain_networks || [], // Backend uses company_blockchain_networks
        preferredTopics: marketingPreferences.preferred_topics || [],
      };
      
      // Reset form with saved values
      form.reset(formValues);
      
      // Set selected topics separately
      const savedTopics = marketingPreferences.preferred_topics || [];
      console.log("Extracted topics from saved preferences:", savedTopics);
      setSelectedTopics(savedTopics);
      
      // Setup filter toggles based on enabled state fields rather than just values
      const newFiltersEnabled = {
        collabTypes: marketingPreferences.discovery_filter_collab_types_enabled || false,
        topics: marketingPreferences.discovery_filter_topics_enabled || false,
        companySectors: marketingPreferences.discovery_filter_company_sectors_enabled || false,
        companyFollowers: marketingPreferences.discovery_filter_company_followers_enabled || false,
        fundingStages: marketingPreferences.discovery_filter_funding_stages_enabled || false,
        hasToken: marketingPreferences.discovery_filter_token_status_enabled || false,
        blockchainNetworks: marketingPreferences.discovery_filter_blockchain_networks_enabled || false,
      };
      setFiltersEnabled(newFiltersEnabled);
      
      // Initially expand all enabled filters
      setFiltersExpanded({
        collabTypes: newFiltersEnabled.collabTypes,
        topics: newFiltersEnabled.topics,
        companySectors: newFiltersEnabled.companySectors,
        companyFollowers: newFiltersEnabled.companyFollowers,
        fundingStages: newFiltersEnabled.fundingStages,
        hasToken: newFiltersEnabled.hasToken,
        blockchainNetworks: newFiltersEnabled.blockchainNetworks,
      });
      
      // Check for blockchain networks
      console.log("Loading blockchain networks from preferences:", marketingPreferences.company_blockchain_networks || []);
    }
  }, [marketingPreferences, form]);
  
  // Topic handling
  const handleTopicChange = (topic: string, checked: boolean) => {
    let newTopics: string[];
    if (checked) {
      newTopics = [...selectedTopics, topic];
    } else {
      newTopics = selectedTopics.filter(t => t !== topic);
    }
    setSelectedTopics(newTopics);
    form.setValue('preferredTopics', newTopics);
    
    // Trigger auto-save
    handleAutoSave();
  };
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  // Toggle filter sections
  const toggleFilter = (filterName: string) => {
    const newState = !filtersEnabled[filterName as keyof typeof filtersEnabled];
    setFiltersEnabled((prevState) => {
      const newFiltersEnabled = {
        ...prevState,
        [filterName]: newState
      };
      
      // Save the updated filter state immediately
      setTimeout(() => {
        savePreferences();
      }, 0);
      
      return newFiltersEnabled;
    });
    
    // Also update expanded state when enabling
    if (newState) {
      setFiltersExpanded({
        ...filtersExpanded,
        [filterName]: true
      });
    }
    
    // Clear values if disabling a filter
    if (!newState) {
      switch(filterName) {
        case 'collabTypes':
          form.setValue('collabTypes', []);
          break;
        case 'topics':
          setSelectedTopics([]);
          form.setValue('preferredTopics', []);
          break;
        case 'companySectors':
          form.setValue('companySectors', []);
          break;
        case 'companyFollowers':
          form.setValue('companyFollowers', undefined);
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
  
  // Toggle filter section expansion without affecting filter state
  const toggleFilterExpansion = (filterName: string) => {
    setFiltersExpanded({
      ...filtersExpanded,
      [filterName]: !filtersExpanded[filterName as keyof typeof filtersExpanded]
    });
  };
  
  // Auto-save handler
  const handleAutoSave = () => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      savePreferences();
    }, 500);
  };
  
  // Save preferences to API
  const savePreferences = async () => {
    try {
      const formValues = form.getValues();
      
      // Prepare data for API
      const data = {
        // Filter values using the exact field names expected by the backend 
        collab_types: formValues.collabTypes,
        preferred_topics: selectedTopics,
        company_tags: formValues.companySectors, // Backend expects company_tags (not company_sectors)
        company_twitter_followers: formValues.companyFollowers, // Standardized field name for follower count
        funding_stages: formValues.fundingStages,
        company_has_token: formValues.hasToken, // Backend expects company_has_token
        company_blockchain_networks: formValues.blockchainNetworks, // Backend expects company_blockchain_networks
        
        // Filter enabled states - critical for saving filter preferences
        discovery_filter_enabled: Object.values(filtersEnabled).some(v => v), // Enabled if any filter is on
        discovery_filter_collab_types_enabled: filtersEnabled.collabTypes,
        discovery_filter_topics_enabled: filtersEnabled.topics,
        discovery_filter_company_sectors_enabled: filtersEnabled.companySectors,
        discovery_filter_company_followers_enabled: filtersEnabled.companyFollowers,
        discovery_filter_funding_stages_enabled: filtersEnabled.fundingStages,
        discovery_filter_token_status_enabled: filtersEnabled.hasToken,
        discovery_filter_blockchain_networks_enabled: filtersEnabled.blockchainNetworks,
      };
      
      console.log("Saving discovery filters with data:", data);
      
      // Send to API
      await apiRequest('/api/marketing-preferences', 'POST', data);
      
      // Update cache
      queryClient.invalidateQueries({ queryKey: ['/api/marketing-preferences'] });
      
      // No toast notification for auto-save
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };
  
  // Watch for form changes to trigger auto-save
  useEffect(() => {
    const subscription = form.watch((_value, { name, type }) => {
      if (type === 'change') {
        handleAutoSave();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle form submission (manual save)
  const onSubmit = async (values: MarketingPreferencesForm) => {
    await savePreferences();
    toast({
      title: "Preferences saved",
      description: "Your discovery filters have been updated",
    });
  };
  
  // Apply special class for scrolling to document when component mounts
  useEffect(() => {
    // Add the scrollable-page class to enable scrolling
    document.documentElement.classList.add('scrollable-page');
    document.body.classList.add('scrollable-page');
    
    // Also fix the root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.overflow = 'auto';
      rootElement.style.height = 'auto';
      rootElement.style.position = 'static';
      rootElement.style.width = '100%';
    }
    
    // Force immediate layout calculation
    document.body.scrollTop = 0;
    
    // Clean up when the component unmounts
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
      <div className="container discovery-filters-page">
        <PageHeader 
          title="Discovery Filters" 
          subtitle="Customize what collaboration types appear in your discover cards"
          backUrl="/discover"
        />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 form-scrollable-container subtle-scrollbar">
            <div className="space-y-4">
              
              {/* Filters */}
              <Card>
                <CardContent className="space-y-6 pt-6">
                  {/* Filter by Collab Types */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-medium">Filter by Collab Type</h3>
                        <p className="text-sm text-gray-500">
                          Choose which types of collaborations you want to see
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {filtersEnabled.collabTypes && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFilterExpansion('collabTypes')}
                            className="h-8 w-8"
                            title={filtersExpanded.collabTypes ? "Collapse" : "Expand"}
                          >
                            {filtersExpanded.collabTypes ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Switch 
                          checked={filtersEnabled.collabTypes}
                          onCheckedChange={() => toggleFilter('collabTypes')}
                        />
                      </div>
                    </div>
                    
                    {filtersEnabled.collabTypes && filtersExpanded.collabTypes && (
                      <div className="border rounded-lg p-4 bg-background">
                        <FormField
                          control={form.control}
                          name="collabTypes"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex flex-col gap-2">
                                {COLLAB_TYPES.map((type) => (
                                  <Button
                                    key={type}
                                    type="button"
                                    variant={field.value.includes(type) ? "default" : "outline"}
                                    className="h-auto py-2 px-3 justify-start text-left font-normal w-full"
                                    onClick={() => {
                                      const newChecked = !field.value.includes(type);
                                      const newValue = newChecked
                                        ? [...field.value, type]
                                        : field.value.filter((value) => value !== type);
                                      field.onChange(newValue);
                                    }}
                                  >
                                    {type}
                                  </Button>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Topic Filter */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-medium">Filter by Topics</h3>
                        <p className="text-sm text-gray-500">
                          Only show collaborations in these topics
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {filtersEnabled.topics && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFilterExpansion('topics')}
                            className="h-8 w-8"
                            title={filtersExpanded.topics ? "Collapse" : "Expand"}
                          >
                            {filtersExpanded.topics ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Switch 
                          checked={filtersEnabled.topics}
                          onCheckedChange={() => toggleFilter('topics')}
                        />
                      </div>
                    </div>
                    
                    {filtersEnabled.topics && filtersExpanded.topics && (
                      <div className="border rounded-lg p-4 bg-background">
                        <div className="flex flex-col gap-2">
                          {COLLAB_TOPICS.map((topic) => (
                            <Button
                              key={topic}
                              type="button"
                              variant={selectedTopics.includes(topic) ? "default" : "outline"}
                              className="h-auto py-2 px-3 justify-start text-left font-normal w-full"
                              onClick={() => handleTopicChange(topic, !selectedTopics.includes(topic))}
                            >
                              {topic}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Company Sectors Filter */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-medium">Filter by Company Sectors</h3>
                        <p className="text-sm text-gray-500">
                          Only show collaborations from companies in these sectors
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {filtersEnabled.companySectors && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFilterExpansion('companySectors')}
                            className="h-8 w-8"
                            title={filtersExpanded.companySectors ? "Collapse" : "Expand"}
                          >
                            {filtersExpanded.companySectors ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Switch 
                          checked={filtersEnabled.companySectors}
                          onCheckedChange={() => toggleFilter('companySectors')}
                        />
                      </div>
                    </div>
                    
                    {filtersEnabled.companySectors && filtersExpanded.companySectors && (
                      <div className="border rounded-lg p-4 bg-background">
                        <FormField
                          control={form.control}
                          name="companySectors"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-4">
                                {/* Show selection count */}
                                {field.value.length > 0 && (
                                  <div className="flex justify-between items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {field.value.length} {field.value.length === 1 ? 'sector' : 'sectors'} selected
                                    </Badge>
                                  </div>
                                )}
                                
                                {/* Categorized sector selection */}
                                {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                  <div key={category} className="border rounded p-3">
                                    <div 
                                      className="flex justify-between items-center cursor-pointer mb-2"
                                      onClick={() => toggleCategory(category)}
                                    >
                                      <div className="font-medium">{category}</div>
                                      <div>
                                        {expandedCategories.includes(category) ? 
                                          <ChevronUp className="h-4 w-4" /> : 
                                          <ChevronDown className="h-4 w-4" />
                                        }
                                      </div>
                                    </div>
                                    
                                    {expandedCategories.includes(category) && (
                                      <div className="flex flex-col gap-2 mt-3">
                                        {tags.map((tag) => (
                                          <Button
                                            key={tag}
                                            type="button"
                                            variant={field.value.includes(tag) ? "default" : "outline"}
                                            className="h-auto py-2 px-3 justify-start text-left font-normal whitespace-normal w-full"
                                            onClick={() => {
                                              const newChecked = !field.value.includes(tag);
                                              return newChecked
                                                ? field.onChange([...field.value, tag])
                                                : field.onChange(
                                                    field.value.filter(
                                                      (value) => value !== tag
                                                    )
                                                  )
                                            }}
                                          >
                                            {tag}
                                          </Button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Company Followers Filter */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-medium">Filter by Company Followers</h3>
                        <p className="text-sm text-gray-500">
                          Only show collaborations from companies with at least this many social media followers
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {filtersEnabled.companyFollowers && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFilterExpansion('companyFollowers')}
                            className="h-8 w-8"
                            title={filtersExpanded.companyFollowers ? "Collapse" : "Expand"}
                          >
                            {filtersExpanded.companyFollowers ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Switch 
                          checked={filtersEnabled.companyFollowers}
                          onCheckedChange={() => toggleFilter('companyFollowers')}
                        />
                      </div>
                    </div>
                    
                    {filtersEnabled.companyFollowers && filtersExpanded.companyFollowers && (
                      <div className="border rounded-lg p-4 bg-background">
                        <FormField
                          control={form.control}
                          name="companyFollowers"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
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
                      </div>
                    )}
                  </div>
                  
                  {/* Funding Stages Filter */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-medium">Filter by Funding Stages</h3>
                        <p className="text-sm text-gray-500">
                          Only show collaborations from companies in these funding stages
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {filtersEnabled.fundingStages && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFilterExpansion('fundingStages')}
                            className="h-8 w-8"
                            title={filtersExpanded.fundingStages ? "Collapse" : "Expand"}
                          >
                            {filtersExpanded.fundingStages ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Switch 
                          checked={filtersEnabled.fundingStages}
                          onCheckedChange={() => toggleFilter('fundingStages')}
                        />
                      </div>
                    </div>
                    
                    {filtersEnabled.fundingStages && filtersExpanded.fundingStages && (
                      <div className="border rounded-lg p-4 bg-background">
                        <FormField
                          control={form.control}
                          name="fundingStages"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-4">
                                {/* Show selection count */}
                                {field.value.length > 0 && (
                                  <div className="flex justify-between items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {field.value.length} {field.value.length === 1 ? 'stage' : 'stages'} selected
                                    </Badge>
                                  </div>
                                )}
                                
                                <div className="flex flex-col gap-2">
                                  {FUNDING_STAGES.map((stage) => (
                                    <Button
                                      key={stage}
                                      type="button"
                                      variant={field.value.includes(stage) ? "default" : "outline"}
                                      className="h-auto py-2 px-3 justify-start text-left font-normal w-full"
                                      onClick={() => {
                                        const newChecked = !field.value.includes(stage);
                                        return newChecked
                                          ? field.onChange([...field.value, stage])
                                          : field.onChange(
                                              field.value.filter(
                                                (value) => value !== stage
                                              )
                                            )
                                      }}
                                    >
                                      {stage}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Has Token Filter */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-base font-medium">Filter by Token Status</h3>
                        <p className="text-sm text-gray-500">
                          Only show collaborations from companies with a token
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {filtersEnabled.hasToken && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFilterExpansion('hasToken')}
                            className="h-8 w-8"
                            title={filtersExpanded.hasToken ? "Collapse" : "Expand"}
                          >
                            {filtersExpanded.hasToken ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Switch 
                          checked={filtersEnabled.hasToken}
                          onCheckedChange={(checked) => {
                            toggleFilter('hasToken');
                            form.setValue('hasToken', checked);
                          }}
                        />
                      </div>
                    </div>
                    
                    {filtersEnabled.hasToken && filtersExpanded.hasToken && (
                      <div className="border rounded-lg p-4 bg-background">
                        <p className="text-sm text-muted-foreground">
                          When enabled, your feed will only show collaborations from companies 
                          that have their own token
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Blockchain Networks Filter */}
                  <div className="mt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-medium">Filter by Blockchain Networks</h3>
                        <p className="text-sm text-gray-500">
                          Only show collaborations from companies building on these networks
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {filtersEnabled.blockchainNetworks && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFilterExpansion('blockchainNetworks')}
                            className="h-8 w-8"
                            title={filtersExpanded.blockchainNetworks ? "Collapse" : "Expand"}
                          >
                            {filtersExpanded.blockchainNetworks ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Switch 
                          checked={filtersEnabled.blockchainNetworks}
                          onCheckedChange={() => toggleFilter('blockchainNetworks')}
                        />
                      </div>
                    </div>
                    
                    {filtersEnabled.blockchainNetworks && filtersExpanded.blockchainNetworks && (
                      <div className="border rounded-lg p-4 bg-background mt-2">
                        <FormField
                          control={form.control}
                          name="blockchainNetworks"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-4">
                                {/* Show selection count */}
                                {field.value.length > 0 && (
                                  <div className="flex justify-between items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {field.value.length} {field.value.length === 1 ? 'network' : 'networks'} selected
                                    </Badge>
                                  </div>
                                )}
                                
                                {/* Categorized network selection */}
                                {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => (
                                  <div key={category} className="border rounded p-3">
                                    <div 
                                      className="flex justify-between items-center cursor-pointer mb-2"
                                      onClick={() => toggleCategory(category)}
                                    >
                                      <div className="font-medium">{category}</div>
                                      <div>
                                        {expandedCategories.includes(category) ? 
                                          <ChevronUp className="h-4 w-4" /> : 
                                          <ChevronDown className="h-4 w-4" />
                                        }
                                      </div>
                                    </div>
                                    
                                    {expandedCategories.includes(category) && (
                                      <div className="flex flex-col gap-2 mt-3">
                                        {networks.map((network) => (
                                          <Button
                                            key={network}
                                            type="button"
                                            variant={field.value.includes(network) ? "default" : "outline"}
                                            className="h-auto py-2 px-3 justify-start text-left font-normal whitespace-normal w-full"
                                            onClick={() => {
                                              const newChecked = !field.value.includes(network);
                                              return newChecked
                                                ? field.onChange([...field.value, network])
                                                : field.onChange(
                                                    field.value.filter(
                                                      (value) => value !== network
                                                    )
                                                  )
                                            }}
                                          >
                                            {network}
                                          </Button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Manual Save Button (floating) */}
              <div className="fixed bottom-6 right-6 z-10">
                <Button 
                  type="submit" 
                  size="lg"
                  className="shadow-lg rounded-full h-12 w-12 p-0"
                >
                  <Save className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </MobileCheck>
  );
}