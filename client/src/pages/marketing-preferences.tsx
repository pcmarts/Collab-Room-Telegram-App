import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save,
  Info,
  Plus
} from "lucide-react";
import { 
  COLLAB_TYPES, 
  TWITTER_COLLAB_TYPES,
  TWITTER_FOLLOWER_COUNTS,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  FUNDING_STAGES, 
  type Collaboration
} from "@shared/schema";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the form schema
const formSchema = z.object({
  enabledCollabs: z.array(z.string()).default([]),
  enabledTwitterCollabs: z.array(z.string()).default([]),
  matchingEnabled: z.boolean().default(false),
  topics: z.array(z.string()).default([]),
  companySectors: z.array(z.string()).default([]),
  fundingStages: z.array(z.string()).default([]),
  hasToken: z.boolean().default(false),
  companyFollowers: z.string().default(TWITTER_FOLLOWER_COUNTS[0]),
  userFollowers: z.string().default(TWITTER_FOLLOWER_COUNTS[0])
});

type MarketingPreferencesFormData = z.infer<typeof formSchema>;

// Main component
export default function MarketingPreferences() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [isCollabsLoading, setIsCollabsLoading] = useState(true);
  
  // Toggle states for filters
  const [filtersEnabled, setFiltersEnabled] = useState({
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false,
  });
  
  // Form initialization
  const form = useForm<MarketingPreferencesFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabledCollabs: [],
      enabledTwitterCollabs: [],
      matchingEnabled: false,
      topics: [],
      companySectors: [],
      fundingStages: [],
      hasToken: false,
      companyFollowers: TWITTER_FOLLOWER_COUNTS[0],
      userFollowers: TWITTER_FOLLOWER_COUNTS[0]
    }
  });

  // Fetch user profile data
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['/api/profile'],
    staleTime: 60 * 1000
  });
  
  // Fetch user collaborations
  const { data: collabData, isLoading: isCollabDataLoading } = useQuery({
    queryKey: ['/api/collaborations/my'],
    staleTime: 60 * 1000
  });

  // Update collaborations state when data is loaded
  useEffect(() => {
    if (collabData) {
      setCollaborations(collabData);
      setIsCollabsLoading(false);
    }
  }, [collabData]);
  
  // Load existing preferences when profile data is fetched
  useEffect(() => {
    if (profileData) {
      const marketingPreferences = profileData.marketingPreferences || {};
      console.log("Loading marketing preferences:", marketingPreferences);
      
      // Extract data from marketing preferences
      const marketingPrefs = marketingPreferences;
      const savedCollabsToHost = marketingPrefs.collabs_to_host || [];
      const collabsToDiscover = marketingPrefs.collabs_to_discover || [];
      const savedTwitterCollabs = marketingPrefs.twitter_collabs || [];
      
      // Load filter toggle states from dedicated fields
      setFiltersEnabled({
        topics: !!marketingPrefs.discovery_filter_topics_enabled,
        companySectors: !!marketingPrefs.discovery_filter_company_sectors_enabled,
        companyFollowers: !!marketingPrefs.discovery_filter_company_followers_enabled,
        userFollowers: !!marketingPrefs.discovery_filter_user_followers_enabled,
        fundingStages: !!marketingPrefs.discovery_filter_funding_stages_enabled,
        hasToken: !!marketingPrefs.discovery_filter_token_status_enabled
      });
      
      // Extract topics from filtered_marketing_topics
      const topicEntries = (marketingPrefs.filtered_marketing_topics || [])
        .filter((item: string) => item.startsWith('filter:topic:'))
        .map((item: string) => item.replace('filter:topic:', ''));
      
      console.log("Extracted topics from saved preferences:", topicEntries);
      
      // Extract other filter values
      let filterCompanySectors: string[] = [];
      let filterFundingStages: string[] = [];
      let filterCompanyFollowers: string = TWITTER_FOLLOWER_COUNTS[0];
      let filterUserFollowers: string = TWITTER_FOLLOWER_COUNTS[0];
      let filterHasToken: boolean = false;
      let filterMatchingEnabled: boolean = !!marketingPrefs.discovery_filter_enabled;
      
      // Process saved filter data from filtered_marketing_topics
      (marketingPrefs.filtered_marketing_topics || []).forEach((item: string) => {
        if (typeof item === 'string') {
          if (item.startsWith('filter:sector:')) {
            filterCompanySectors.push(item.replace('filter:sector:', ''));
          } else if (item.startsWith('filter:stage:')) {
            filterFundingStages.push(item.replace('filter:stage:', ''));
          } else if (item.startsWith('filter:company_followers:')) {
            filterCompanyFollowers = item.replace('filter:company_followers:', '');
          } else if (item.startsWith('filter:user_followers:')) {
            filterUserFollowers = item.replace('filter:user_followers:', '');
          } else if (item === 'filter:has_token:true') {
            filterHasToken = true;
          } else if (item === 'filter:matching_enabled:true') {
            filterMatchingEnabled = true;
          }
        }
      });
      
      // Reset form with loaded values
      form.reset({
        enabledCollabs: collabsToDiscover,
        enabledTwitterCollabs: savedTwitterCollabs,
        matchingEnabled: filterMatchingEnabled,
        companySectors: filterCompanySectors,
        topics: topicEntries,
        fundingStages: filterFundingStages,
        hasToken: filterHasToken,
        companyFollowers: filterCompanyFollowers as typeof TWITTER_FOLLOWER_COUNTS[number],
        userFollowers: filterUserFollowers as typeof TWITTER_FOLLOWER_COUNTS[number]
      });
    }
  }, [profileData, form]);

  // Toggle filter sections visibility
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    setFiltersEnabled(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  // Handle topic selection
  const handleTopicToggle = (topic: string) => {
    const currentTopics = form.getValues().topics || [];
    const isSelected = currentTopics.includes(topic);
    
    if (isSelected) {
      // Remove topic
      const newTopics = currentTopics.filter(t => t !== topic);
      form.setValue('topics', newTopics, { shouldDirty: true });
    } else {
      // Add topic
      const newTopics = [...currentTopics, topic];
      form.setValue('topics', newTopics, { shouldDirty: true });
    }
  };
  
  // Handle company sector selection 
  const handleSectorToggle = (sector: string) => {
    const currentSectors = form.getValues().companySectors || [];
    const isSelected = currentSectors.includes(sector);
    
    if (isSelected) {
      // Remove sector
      const newSectors = currentSectors.filter(s => s !== sector);
      form.setValue('companySectors', newSectors, { shouldDirty: true });
    } else {
      // Add sector
      const newSectors = [...currentSectors, sector];
      form.setValue('companySectors', newSectors, { shouldDirty: true });
    }
  };
  
  // Handle funding stage selection
  const handleFundingStageToggle = (stage: string) => {
    const currentStages = form.getValues().fundingStages || [];
    const isSelected = currentStages.includes(stage);
    
    if (isSelected) {
      // Remove stage
      const newStages = currentStages.filter(s => s !== stage);
      form.setValue('fundingStages', newStages, { shouldDirty: true });
    } else {
      // Add stage
      const newStages = [...currentStages, stage];
      form.setValue('fundingStages', newStages, { shouldDirty: true });
    }
  };

  // Submit form data
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Get current form values
      const currentFormValues = form.getValues();
      
      // Prepare topics array
      const formattedTopics = currentFormValues.topics.map(topic => `filter:topic:${topic}`);
      console.log("Topics to save:", currentFormValues.topics); 
      console.log("Formatted topics:", formattedTopics);
      
      // Format other filter data
      const formattedSectors = currentFormValues.companySectors.map(sector => `filter:sector:${sector}`);
      const formattedStages = currentFormValues.fundingStages.map(stage => `filter:stage:${stage}`);
      
      // Filter toggle states
      const toggleStates = [
        ...(filtersEnabled.topics ? [`filter:section_enabled:topics`] : []),
        ...(filtersEnabled.companySectors ? [`filter:section_enabled:companySectors`] : []),
        ...(filtersEnabled.companyFollowers ? [`filter:section_enabled:companyFollowers`] : []),
        ...(filtersEnabled.userFollowers ? [`filter:section_enabled:userFollowers`] : []),
        ...(filtersEnabled.fundingStages ? [`filter:section_enabled:fundingStages`] : []),
        ...(filtersEnabled.hasToken ? [`filter:section_enabled:hasToken`] : [])
      ];
      
      // Combine all filter tags
      const allFilteredTopics = [
        ...formattedTopics,
        ...formattedSectors,
        ...formattedStages,
        ...toggleStates
      ];
      
      // Build marketing preferences data
      const marketingPrefsData = {
        // These must be arrays
        collabs_to_discover: [...currentFormValues.enabledCollabs],
        collabs_to_host: [],
        twitter_collabs: [...currentFormValues.enabledTwitterCollabs],
        filtered_marketing_topics: [...allFilteredTopics],
        
        // Discovery filter toggle states
        discovery_filter_enabled: currentFormValues.matchingEnabled,
        discovery_filter_topics_enabled: filtersEnabled.topics,
        discovery_filter_company_sectors_enabled: filtersEnabled.companySectors,
        discovery_filter_company_followers_enabled: filtersEnabled.companyFollowers,
        discovery_filter_user_followers_enabled: filtersEnabled.userFollowers,
        discovery_filter_funding_stages_enabled: filtersEnabled.fundingStages,
        discovery_filter_token_status_enabled: filtersEnabled.hasToken
      };
      
      // Make the API request directly
      console.log("Making API request to /api/marketing-preferences");
      const response = await fetch('/api/marketing-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(window.Telegram?.WebApp?.initData ? {
            'x-telegram-init-data': window.Telegram.WebApp.initData
          } : {})
        },
        body: JSON.stringify(marketingPrefsData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to save preferences: ${response.status} ${response.statusText}`);
      }
      
      // Get response data
      const data = await response.json();
      console.log("Success response:", data);
      
      // Update UI state
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your marketing preferences have been updated",
        duration: 3000
      });
      
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ));
  };

  if (isProfileLoading) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader title="Loading..." />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 pb-28">
      <PageHeader title="Marketing & Collaborations" backUrl="/dashboard" />
      
      <div className="mt-6">
        <Tabs defaultValue="preferences">
          <TabsList className="mb-4">
            <TabsTrigger value="preferences">My Preferences</TabsTrigger>
            <TabsTrigger value="collaborations">My Collaborations</TabsTrigger>
          </TabsList>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Form {...form}>
              <form className="space-y-6">
                {/* Collab Discovery Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Discovery Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Master switch for matching */}
                    <FormField
                      control={form.control}
                      name="matchingEnabled"
                      render={({ field }) => (
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                          <div>
                            <h3 className="text-lg font-medium">Enable Collaboration Matching</h3>
                            <p className="text-sm text-gray-500">
                              Receive notifications about new collaborations that match your preferences
                            </p>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      )}
                    />
                    
                    {form.watch("matchingEnabled") ? (
                      <>
                        {/* Topics Filter */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="text-base font-medium">Filter by Topics</h3>
                              <p className="text-sm text-gray-500">
                                Only show collaborations about these topics
                              </p>
                            </div>
                            <Switch 
                              checked={filtersEnabled.topics}
                              onCheckedChange={() => toggleFilter('topics')}
                            />
                          </div>
                          
                          {filtersEnabled.topics && (
                            <div className="border rounded-lg p-4 bg-background">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {COLLAB_TOPICS.map((topic) => {
                                  const isSelected = form.watch('topics').includes(topic);
                                  return (
                                    <button
                                      type="button"
                                      key={topic}
                                      className="flex items-center p-3 border rounded-md hover:bg-accent/10 mb-2 shadow-sm cursor-pointer text-left"
                                      onClick={() => handleTopicToggle(topic)}
                                    >
                                      <div className={`h-5 w-5 mr-4 border rounded-sm flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                        {isSelected && (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-sm font-medium leading-none w-full">
                                        {topic}
                                      </span>
                                    </button>
                                  );
                                })}
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
                            <Switch 
                              checked={filtersEnabled.companySectors}
                              onCheckedChange={() => toggleFilter('companySectors')}
                            />
                          </div>
                          
                          {filtersEnabled.companySectors && (
                            <div className="border rounded-lg p-4 bg-background">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                  <div key={category} className="col-span-full mb-4">
                                    <h4 className="font-medium mb-2">{category}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                      {tags.map((tag) => {
                                        const isSelected = form.watch('companySectors').includes(tag);
                                        return (
                                          <button
                                            type="button"
                                            key={tag}
                                            className="flex items-center p-3 border rounded-md hover:bg-accent/10 mb-2 shadow-sm cursor-pointer text-left"
                                            onClick={() => handleSectorToggle(tag)}
                                          >
                                            <div className={`h-5 w-5 mr-4 border rounded-sm flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                              {isSelected && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check">
                                                  <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                              )}
                                            </div>
                                            <span className="text-sm font-normal w-full">
                                              {tag}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Company Followers Filter */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="text-base font-medium">Filter by Company Twitter Followers</h3>
                              <p className="text-sm text-gray-500">
                                Only show collaborations from companies with at least this many followers
                              </p>
                            </div>
                            <Switch 
                              checked={filtersEnabled.companyFollowers}
                              onCheckedChange={() => toggleFilter('companyFollowers')}
                            />
                          </div>
                          
                          {filtersEnabled.companyFollowers && (
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
                            <Switch 
                              checked={filtersEnabled.fundingStages}
                              onCheckedChange={() => toggleFilter('fundingStages')}
                            />
                          </div>
                          
                          {filtersEnabled.fundingStages && (
                            <div className="border rounded-lg p-4 bg-background">
                              <div className="grid grid-cols-1 gap-3">
                                {FUNDING_STAGES.map((stage) => {
                                  const isSelected = form.watch('fundingStages').includes(stage);
                                  return (
                                    <button
                                      type="button"
                                      key={stage}
                                      className="flex items-center p-3 border rounded-md hover:bg-accent/10 mb-2 shadow-sm cursor-pointer text-left"
                                      onClick={() => handleFundingStageToggle(stage)}
                                    >
                                      <div className={`h-5 w-5 mr-4 border rounded-sm flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                        {isSelected && (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-sm font-normal w-full">
                                        {stage}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
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
                            <Switch 
                              checked={filtersEnabled.hasToken}
                              onCheckedChange={(checked) => {
                                toggleFilter('hasToken');
                                form.setValue('hasToken', checked);
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Enable matching to access filtering options</p>
                    )}
                  </CardContent>
                </Card>
                
                <div className="fixed bottom-0 left-0 right-0 bg-background border-t py-4 px-6 shadow-lg z-10">
                  <div className="container">
                    <Button 
                      type="button" 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* Collaborations Tab */}
          <TabsContent value="collaborations" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">My Collaborations</h2>
              <Button onClick={() => setLocation('/create-collaboration')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
            </div>
            
            {isCollabsLoading ? (
              renderSkeletons()
            ) : collaborations.length > 0 ? (
              <div className="space-y-4">
                {collaborations.map((collab: Collaboration) => (
                  <Card key={collab.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle>{collab.title}</CardTitle>
                      <Badge>{collab.collab_type}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{collab.description}</p>
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/edit-collaboration/${collab.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Info className="h-8 w-8 text-gray-400" />
                  <h3 className="text-lg font-medium">No collaborations yet</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any collaborations yet. Create your first one to start connecting!
                  </p>
                  <Button onClick={() => setLocation('/create-collaboration')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Collaboration
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}