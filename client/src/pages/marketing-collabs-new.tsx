import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Users, CalendarDays, Clock, Coins, Sliders, Filter } from "lucide-react";
import { 
  COLLAB_TYPES, 
  TWITTER_COLLAB_TYPES,
  TWITTER_FOLLOWER_COUNTS,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  AUDIENCE_SIZE_RANGES,
  FUNDING_STAGES, 
  type Collaboration
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Marketing Collab Schema
const marketingCollabSchema = z.object({
  // Opt-in settings
  enabledCollabs: z.array(z.string()).default([]),
  enabledTwitterCollabs: z.array(z.string()).default([]),
  
  // Filter settings
  matchingEnabled: z.boolean().default(false),
  companySectors: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  companyFollowers: z.string().optional(),
  userFollowers: z.string().optional(),
  fundingStages: z.array(z.string()).default([]),
  hasToken: z.boolean().default(false)
});

type MarketingCollabFormData = z.infer<typeof marketingCollabSchema>;

export default function MarketingCollabs() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("optin");
  
  // Define filter states
  const [filtersEnabled, setFiltersEnabled] = useState({
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false
  });
  
  // Collabs to host toggle state
  const [collabsToHost, setCollabsToHost] = useState<string[]>([]);

  // Fetch existing data
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });
  
  // Fetch user's collaborations
  const { data: collaborations, isLoading: isLoadingCollabs } = useQuery({
    queryKey: ['/api/collaborations/my'],
    queryFn: async () => {
      const response = await apiRequest('/api/collaborations/my', 'GET');
      if (!response.ok) {
        throw new Error("Failed to fetch collaborations");
      }
      const data = await response.json();
      return data as Collaboration[];
    }
  });

  // Initialize form with react-hook-form
  const form = useForm<MarketingCollabFormData>({
    resolver: zodResolver(marketingCollabSchema),
    defaultValues: {
      enabledCollabs: [],
      enabledTwitterCollabs: [],
      matchingEnabled: false,
      companySectors: [],
      topics: [],
      fundingStages: [],
      hasToken: false,
      companyFollowers: TWITTER_FOLLOWER_COUNTS[0],
      userFollowers: TWITTER_FOLLOWER_COUNTS[0]
    }
  });

  // Load existing preferences when data is fetched
  useEffect(() => {
    if (profileData?.preferences) {
      // Extract collabs from the preferences
      const savedCollabsToHost = profileData.preferences.collabs_to_host || [];
      const collabsToDiscover = profileData.preferences.collabs_to_discover || [];
      
      // Combine to get all enabled collabs
      const uniqueCollabs = new Set([...collabsToDiscover]);
      const enabledCollabs = Array.from(uniqueCollabs);
      
      // Set initial state for collabs to host
      setCollabsToHost(savedCollabsToHost);
      
      // Load twitter collabs if they exist
      const twitterCollabs = profileData.preferences.twitter_collabs || [];
      
      // Check if any filter preferences exist
      const hasFilterPreferences = 
        (profileData.preferences.excluded_tags && profileData.preferences.excluded_tags.length > 0) || 
        (profileData.preferences.coffee_match_company_sectors && profileData.preferences.coffee_match_company_sectors.length > 0);
        
      // Always reset filter toggles based on preferences
      setFiltersEnabled({
        topics: profileData.preferences.excluded_tags && profileData.preferences.excluded_tags.length > 0,
        companySectors: profileData.preferences.coffee_match_company_sectors && profileData.preferences.coffee_match_company_sectors.length > 0,
        companyFollowers: Boolean(profileData.preferences.coffee_match_company_followers),
        userFollowers: Boolean(profileData.preferences.coffee_match_user_followers),
        fundingStages: profileData.preferences.coffee_match_funding_stages && profileData.preferences.coffee_match_funding_stages.length > 0,
        hasToken: Boolean(profileData.preferences.coffee_match_token_status)
      });
      
      // Get saved filter data if available
      form.reset({
        enabledCollabs,
        enabledTwitterCollabs: twitterCollabs,
        // Set matching enabled if filter preferences exist
        matchingEnabled: Boolean(hasFilterPreferences),
        // Load saved filter values using appropriate field names from schema
        companySectors: profileData.preferences.coffee_match_company_sectors || [],
        topics: profileData.preferences.excluded_tags || [],
        fundingStages: profileData.preferences.coffee_match_funding_stages || [],
        hasToken: profileData.preferences.coffee_match_token_status || false,
        companyFollowers: profileData.preferences.coffee_match_company_followers || TWITTER_FOLLOWER_COUNTS[0],
        userFollowers: profileData.preferences.coffee_match_user_followers || TWITTER_FOLLOWER_COUNTS[0]
      });
    }
  }, [profileData, form]);

  // Toggle filter visibility
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    setFiltersEnabled((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };
  
  // Handle collabs to host toggle
  const handleCollabsToHostToggle = (collabType: string) => {
    setCollabsToHost(prev => 
      prev.includes(collabType) 
        ? prev.filter(item => item !== collabType) 
        : [...prev, collabType]
    );
  };
  
  // Get matchingEnabled value from form
  const matchingEnabled = form.watch("matchingEnabled");
  
  // React to main matching toggle changes
  useEffect(() => {
    // If matching is disabled, make sure all filter toggles are turned off
    if (!matchingEnabled) {
      setFiltersEnabled({
        topics: false,
        companySectors: false,
        companyFollowers: false,
        userFollowers: false,
        fundingStages: false,
        hasToken: false
      });
    }
  }, [matchingEnabled]);

  const onSubmit = async (data: MarketingCollabFormData) => {
    setIsSubmitting(true);
    console.log("Form data:", data);

    try {
      // Use separate collabs to host and to discover
      const updateData = {
        ...profileData?.preferences,
        collabs_to_host: collabsToHost,
        collabs_to_discover: data.enabledCollabs,
        twitter_collabs: data.enabledTwitterCollabs || [],
        // Save filter preferences if filtering is enabled
        // When main toggle is disabled, we don't apply filters but still store the values
        excluded_tags: data.matchingEnabled ? (filtersEnabled.topics ? data.topics : []) : [],
        coffee_match_company_sectors: data.matchingEnabled ? (filtersEnabled.companySectors ? data.companySectors : []) : data.companySectors,
        coffee_match_company_followers: data.matchingEnabled ? (filtersEnabled.companyFollowers ? data.companyFollowers : null) : data.companyFollowers,
        coffee_match_user_followers: data.matchingEnabled ? (filtersEnabled.userFollowers ? data.userFollowers : null) : data.userFollowers,
        coffee_match_funding_stages: data.matchingEnabled ? (filtersEnabled.fundingStages ? data.fundingStages : []) : data.fundingStages,
        coffee_match_token_status: data.matchingEnabled ? (filtersEnabled.hasToken ? data.hasToken : false) : data.hasToken
      };

      console.log("Saving preferences data:", updateData);

      const response = await apiRequest('/api/preferences', 'POST', updateData);

      if (!response.ok) {
        throw new Error('Failed to update collaborations');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Success!",
        description: "Your marketing collaboration preferences have been updated",
        duration: 2000
      });

      setLocation('/dashboard');
    } catch (error) {
      console.error('Failed to update collaborations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update collaborations"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="Marketing Collabs"
        subtitle="Select your preferred collaboration types"
        backUrl="/dashboard"
      />

      <Tabs defaultValue="optin" onValueChange={setActiveTab}>
        <div className="sticky top-0 z-10 bg-background px-4 pt-4 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optin">✔️ Discover</TabsTrigger>
            <TabsTrigger value="host">🚀 Host</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 space-y-6 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="optin" className="space-y-4 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Discover Collaborations</Label>
                </div>
                
                {/* Collaboration Types Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Types</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select which types of marketing collaborations you're interested in discovering
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="enabledCollabs"
                      render={({ field }) => {
                        // Check if "Co-Marketing on Twitter" is selected
                        const isTwitterCoMarketingSelected = field.value?.includes("Co-Marketing on Twitter");
                        
                        return (
                          <FormItem>
                            <div className="grid grid-cols-1 gap-2">
                              {COLLAB_TYPES.map((collabType) => (
                                <div key={collabType}>
                                  <FormItem
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(collabType)}
                                        onCheckedChange={(checked) => {
                                          const currentTypes = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentTypes, collabType]);
                                          } else {
                                            field.onChange(
                                              currentTypes.filter(
                                                (value) => value !== collabType
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-base">
                                        {collabType}
                                      </FormLabel>
                                      <p className="text-sm text-muted-foreground">
                                        {collabType === "Podcast Guest Appearance"
                                          ? "Appear as a guest on podcasts in the Web3 and blockchain space"
                                          : collabType === "Twitter Spaces Guest"
                                          ? "Join Twitter Spaces as a guest speaker or moderator"
                                          : collabType === "Live Stream Guest Appearance"
                                          ? "Appear as a guest on live streams on YouTube, Twitch or other platforms"
                                          : collabType === "Co-Marketing on Twitter"
                                          ? "Join marketing campaigns with other Web3 companies on Twitter"
                                          : collabType === "Newsletter Feature"
                                          ? "Be featured in newsletters from other Web3 companies"
                                          : collabType === "Blog Post Feature" || collabType === "Report & Research Feature"
                                          ? "Collaborate on content creation with other companies"
                                          : "Collaborate with other Web3 projects"
                                        }
                                      </p>
                                    </div>
                                  </FormItem>
                                </div>
                              ))}
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                    
                    {/* Twitter-specific collabs that are conditionally rendered */}
                    <FormField
                      control={form.control}
                      name="enabledTwitterCollabs"
                      render={({ field }) => {
                        // Only render if Twitter co-marketing is selected
                        return form.watch("enabledCollabs")?.includes("Co-Marketing on Twitter") ? (
                          <FormItem className="mt-4">
                            <FormLabel>Twitter Co-Marketing Options</FormLabel>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                              {TWITTER_COLLAB_TYPES.map((twitterCollab) => (
                                <FormItem
                                  key={twitterCollab}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(twitterCollab)}
                                      onCheckedChange={(checked) => {
                                        const currentTypes = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentTypes, twitterCollab]);
                                        } else {
                                          field.onChange(
                                            currentTypes.filter(
                                              (value) => value !== twitterCollab
                                            )
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {twitterCollab}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </div>
                          </FormItem>
                        ) : null;
                      }}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="host" className="space-y-4 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Host Collaborations</Label>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Host Collaboration Types</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select which types of marketing collaborations you're interested in hosting
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {COLLAB_TYPES.map((collabType) => (
                        <div
                          key={collabType}
                          className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 ${
                            collabsToHost.includes(collabType)
                              ? "bg-primary/10 border-primary/50"
                              : ""
                          }`}
                          onClick={() => handleCollabsToHostToggle(collabType)}
                        >
                          <Checkbox
                            checked={collabsToHost.includes(collabType)}
                            onCheckedChange={() => handleCollabsToHostToggle(collabType)}
                          />
                          <div className="space-y-1 leading-none">
                            <p className="font-medium">{collabType}</p>
                            <p className="text-sm text-muted-foreground">
                              {collabType === "Podcast Guest Appearance"
                                ? "Host podcasts and have guests on your show"
                                : collabType === "Twitter Spaces Guest"
                                ? "Host Twitter Spaces with guest speakers"
                                : collabType === "Live Stream Guest Appearance"
                                ? "Host live streams and invite guests to appear"
                                : collabType === "Co-Marketing on Twitter"
                                ? "Create marketing campaigns with other Web3 companies"
                                : collabType === "Newsletter Feature"
                                ? "Feature other Web3 companies in your newsletter"
                                : collabType === "Community AMA"
                                ? "Host 'Ask Me Anything' sessions for your community"
                                : collabType === "Research Report"
                                ? "Create research reports with other organizations"
                                : "Host collaborations with other Web3 projects"
                              }
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Always visible filter panel at the bottom of the page */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4" />
                      <CardTitle>Discovery Filters</CardTitle>
                    </div>
                    <FormField
                      control={form.control}
                      name="matchingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormLabel className="font-normal">Enable</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <CardDescription>
                    Filter collaborations based on your preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {matchingEnabled && (
                    <div className="space-y-4">
                      {/* Topics Filter */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 mb-1">
                          <Switch
                            checked={filtersEnabled.topics}
                            onCheckedChange={() => toggleFilter("topics")}
                          />
                          <Label>Topics ({form.watch("topics")?.length || 0})</Label>
                        </div>

                        {filtersEnabled.topics && (
                          <FormField
                            control={form.control}
                            name="topics"
                            render={({ field }) => (
                              <FormItem>
                                <div className="grid grid-cols-2 gap-2">
                                  {COLLAB_TOPICS.map((topic) => (
                                    <FormItem
                                      key={topic}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(topic)}
                                          onCheckedChange={(checked) => {
                                            const currentTopics = field.value || [];
                                            if (checked) {
                                              field.onChange([...currentTopics, topic]);
                                            } else {
                                              field.onChange(
                                                currentTopics.filter(
                                                  (value) => value !== topic
                                                )
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {topic}
                                      </FormLabel>
                                    </FormItem>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      {/* Company Sectors Filter */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 mb-1">
                          <Switch
                            checked={filtersEnabled.companySectors}
                            onCheckedChange={() => toggleFilter("companySectors")}
                          />
                          <Label>Company Sectors ({form.watch("companySectors")?.length || 0})</Label>
                        </div>

                        {filtersEnabled.companySectors && (
                          <FormField
                            control={form.control}
                            name="companySectors"
                            render={({ field }) => (
                              <FormItem>
                                <div className="grid grid-cols-1 gap-2">
                                  {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                    <div key={category} className="mb-3">
                                      <h4 className="text-sm font-medium mb-2">{category}</h4>
                                      <div className="grid grid-cols-1 gap-2 ml-2">
                                        {tags.map((tag) => (
                                          <FormItem
                                            key={tag}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(tag)}
                                                onCheckedChange={(checked) => {
                                                  const currentSectors = field.value || [];
                                                  if (checked) {
                                                    field.onChange([...currentSectors, tag]);
                                                  } else {
                                                    field.onChange(
                                                      currentSectors.filter(
                                                        (value) => value !== tag
                                                      )
                                                    );
                                                  }
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="text-sm font-normal">
                                              {tag}
                                            </FormLabel>
                                          </FormItem>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="pt-6">
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Collaboration Preferences"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Tabs>
    </div>
  );
}