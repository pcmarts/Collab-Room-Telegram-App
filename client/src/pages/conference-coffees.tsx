import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Event, UserEvent } from "@shared/schema";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  TWITTER_FOLLOWER_COUNTS, 
  FUNDING_STAGES, 
  COMPANY_TAG_CATEGORIES,
  BLOCKCHAIN_NETWORK_CATEGORIES,
} from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Define schema for coffee match criteria
const coffeeMatchCriteriaSchema = z.object({
  matchingEnabled: z.boolean().default(false),
  companySectors: z.array(z.string()).default([]),
  companyFollowers: z.string().default(TWITTER_FOLLOWER_COUNTS[0]),
  userFollowers: z.string().default(TWITTER_FOLLOWER_COUNTS[0]),
  fundingStages: z.array(z.string()).default([]),
  tokenStatus: z.boolean().default(false),
  blockchainNetworks: z.array(z.string()).default([])
});

// Type for form data
type CoffeeMatchCriteria = z.infer<typeof coffeeMatchCriteriaSchema>;

export default function ConferenceCoffees() {
  const [activeTab, setActiveTab] = useState("attending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Individual state variables for each toggle switch
  const [companySectorsEnabled, setCompanySectorsEnabled] = useState(false);
  const [companyFollowersEnabled, setCompanyFollowersEnabled] = useState(false);
  const [userFollowersEnabled, setUserFollowersEnabled] = useState(false);
  const [fundingStagesEnabled, setFundingStagesEnabled] = useState(false);
  const [tokenStatusEnabled, setTokenStatusEnabled] = useState(false);
  const [blockchainNetworksEnabled, setBlockchainNetworksEnabled] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Format date helper
  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "";
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Fetch events and user events
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    staleTime: 60 * 1000, // 1 minute
  });

  const { data: userEvents = [] } = useQuery<UserEvent[]>({
    queryKey: ["/api/user-events"],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch user profile to get saved preferences
  const { data: profileData, isLoading: profileLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Toggle event attendance
  const toggleEventAttendance = async (eventId: string) => {
    setIsSubmitting(true);
    try {
      const isAttending = userEvents.some((ue) => ue.event_id === eventId);

      if (isAttending) {
        // Remove user from event
        const userEvent = userEvents.find((ue) => ue.event_id === eventId);
        if (userEvent) {
          await apiRequest(`/api/user-events/${userEvent.id}`, "DELETE");
          toast({
            title: "You're no longer attending",
            description: "You've been removed from this event",
          });
        }
      } else {
        // Add user to event
        await apiRequest("/api/user-events", "POST", { event_id: eventId });
        toast({
          title: "You're attending!",
          description: "You've been added to this event",
        });
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user-events"] });
    } catch (error) {
      console.error("Failed to update attendance:", error);
      toast({
        title: "Failed to update attendance",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Coffee match criteria form
  const form = useForm<CoffeeMatchCriteria>({
    resolver: zodResolver(coffeeMatchCriteriaSchema),
    defaultValues: {
      matchingEnabled: false,
      companySectors: [],
      fundingStages: [],
      tokenStatus: false,
      companyFollowers: TWITTER_FOLLOWER_COUNTS[0],
      userFollowers: TWITTER_FOLLOWER_COUNTS[0],
      blockchainNetworks: [],
    },
  });
  
  // Load saved preferences when profile data is fetched
  useEffect(() => {
    if (profileData?.conferencePreferences) {
      const prefs = profileData.conferencePreferences;
      
      // Set form values from saved conference preferences
      form.reset({
        matchingEnabled: prefs.coffee_match_enabled ?? false,
        companySectors: prefs.coffee_match_company_sectors ?? [],
        companyFollowers: prefs.coffee_match_company_followers ?? TWITTER_FOLLOWER_COUNTS[0],
        userFollowers: prefs.coffee_match_user_followers ?? TWITTER_FOLLOWER_COUNTS[0],
        fundingStages: prefs.coffee_match_funding_stages ?? [],
        tokenStatus: prefs.coffee_match_token_status ?? false,
        blockchainNetworks: prefs.company_blockchain_networks ?? []
      });
      
      // Log raw filter states for debugging
      console.log("Raw DB values for filters:", {
        companySectors: prefs.coffee_match_filter_company_sectors_enabled,
        companyFollowers: prefs.coffee_match_filter_company_followers_enabled, 
        userFollowers: prefs.coffee_match_filter_user_followers_enabled,
        fundingStages: prefs.coffee_match_filter_funding_stages_enabled,
        tokenStatus: prefs.coffee_match_filter_token_status_enabled,
        blockchainNetworks: prefs.coffee_match_filter_blockchain_networks_enabled
      });
      
      // Set filter states based on database values with strict equality checks
      // This ensures PostgreSQL booleans are properly handled
      setCompanySectorsEnabled(prefs.coffee_match_filter_company_sectors_enabled === true);
      setCompanyFollowersEnabled(prefs.coffee_match_filter_company_followers_enabled === true);
      setUserFollowersEnabled(prefs.coffee_match_filter_user_followers_enabled === true);
      setFundingStagesEnabled(prefs.coffee_match_filter_funding_stages_enabled === true);
      setTokenStatusEnabled(prefs.coffee_match_filter_token_status_enabled === true);
      setBlockchainNetworksEnabled(prefs.coffee_match_filter_blockchain_networks_enabled === true);
      
      console.log("Loaded filter toggle states:", {
        companySectors: companySectorsEnabled,
        companyFollowers: companyFollowersEnabled,
        userFollowers: userFollowersEnabled,
        fundingStages: fundingStagesEnabled,
        tokenStatus: tokenStatusEnabled,
        blockchainNetworks: blockchainNetworksEnabled
      });
    }
  }, [profileData, form]);

  // Extract the matchingEnabled value from form
  const matchingEnabled = form.watch("matchingEnabled");

  // Submit criteria
  const onSubmitCriteria = async (data: CoffeeMatchCriteria) => {
    setIsSubmitting(true);
    console.log("Submitting criteria:", data);
    console.log("Filter toggle states:", {
      companySectors: companySectorsEnabled,
      companyFollowers: companyFollowersEnabled,
      userFollowers: userFollowersEnabled,
      fundingStages: fundingStagesEnabled,
      tokenStatus: tokenStatusEnabled,
      blockchainNetworks: blockchainNetworksEnabled
    });

    try {
      // Get current user preferences
      const profileResponse = await apiRequest('/api/profile', 'GET');
      const profileData = await profileResponse.json();
      console.log("Current profile data:", profileData);
      
      // Make sure we have a default for notification_frequency as it's required
      const notification_frequency = profileData?.preferences?.notification_frequency || "Daily";
      
      // Prepare conference preferences data with new standardized fields
      const conferencePrefsData = {
        // Legacy fields kept for backward compatibility
        coffee_match_enabled: data.matchingEnabled,
        coffee_match_company_sectors: data.companySectors ?? [],
        coffee_match_company_followers: data.companyFollowers,
        coffee_match_user_followers: data.userFollowers,
        coffee_match_funding_stages: data.fundingStages ?? [],
        coffee_match_token_status: data.tokenStatus,
        
        // Filter toggle states - use explicit boolean values to avoid type issues
        coffee_match_filter_company_sectors_enabled: companySectorsEnabled,
        coffee_match_filter_company_followers_enabled: companyFollowersEnabled,
        coffee_match_filter_user_followers_enabled: userFollowersEnabled,
        coffee_match_filter_funding_stages_enabled: fundingStagesEnabled,
        coffee_match_filter_token_status_enabled: tokenStatusEnabled,
        coffee_match_filter_blockchain_networks_enabled: blockchainNetworksEnabled,
        
        // New standardized fields for consistent filtering across all tables
        company_tags: data.companySectors ?? [], // Map sectors to company_tags
        company_twitter_followers: companyFollowersEnabled ? data.companyFollowers : null,
        twitter_followers: userFollowersEnabled ? data.userFollowers : null,
        funding_stage: data.fundingStages && data.fundingStages.length > 0 
          ? data.fundingStages[0] // Take first item if array has values
          : null,
        company_has_token: tokenStatusEnabled ? data.tokenStatus : false,
        company_blockchain_networks: blockchainNetworksEnabled ? data.blockchainNetworks : []
      };
      
      console.log("Sending conference preferences data:", conferencePrefsData);

      // Save to the conference preferences API endpoint
      const response = await apiRequest('/api/conference-preferences', 'POST', conferencePrefsData);
      
      if (!response.ok) {
        // Try to get more detailed error information
        let errorMessage = 'Failed to save coffee match criteria';
        try {
          const errorData = await response.json();
          console.error("Error response:", errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          console.error("Could not parse error response as JSON");
        }
        throw new Error(errorMessage);
      }
      
      // Log the successful response for debugging
      try {
        const responseData = await response.clone().json();
        console.log("Successfully saved conference preferences:", responseData);
        console.log("Saved filter toggle states:", {
          companySectors: responseData.conferencePrefs?.coffee_match_filter_company_sectors_enabled,
          companyFollowers: responseData.conferencePrefs?.coffee_match_filter_company_followers_enabled,
          userFollowers: responseData.conferencePrefs?.coffee_match_filter_user_followers_enabled,
          fundingStages: responseData.conferencePrefs?.coffee_match_filter_funding_stages_enabled,
          tokenStatus: responseData.conferencePrefs?.coffee_match_filter_token_status_enabled,
          blockchainNetworks: responseData.conferencePrefs?.coffee_match_filter_blockchain_networks_enabled
        });
      } catch (e) {
        console.error("Could not parse response data:", e);
      }

      // Invalidate profile data to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Criteria saved",
        description: "Your coffee match criteria have been updated",
      });
    } catch (error) {
      console.error("Failed to save criteria:", error);
      toast({
        title: "Failed to save criteria",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine events with user attendance data
  const activeEvents = events
    .filter((event) => new Date(event.end_date) >= new Date()) // Only future events
    .map((event) => ({
      ...event,
      isAttending: userEvents.some((ue) => ue.event_id === event.id),
    }))
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="Conference Coffees"
        subtitle="Connect with attendees at events"
        backUrl="/dashboard"
      />

      <Tabs defaultValue="attending" onValueChange={setActiveTab}>
        <div className="sticky top-0 z-10 bg-background px-4 pt-4 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attending">Attending</TabsTrigger>
            <TabsTrigger value="criteria">Preferences</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 space-y-6 pt-2">
          <TabsContent value="attending" className="space-y-4 mt-0">
            <Label className="text-lg">Select Your Conferences</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the conferences you'll be attending to connect with other
              attendees
            </p>

            <div className="grid gap-4">
              {activeEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{event.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.start_date)} -{" "}
                          {formatDate(event.end_date)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          📍 {event.city}
                        </div>
                      </div>
                      <Button
                        variant={event.isAttending ? "default" : "outline"}
                        onClick={() => toggleEventAttendance(event.id)}
                        disabled={isSubmitting}
                      >
                        {event.isAttending ? "Attending" : "I'll be there"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-4 mt-0">
            {profileLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading your preferences...</p>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmitCriteria)}
                  className="space-y-6"
                >
                <Card>
                  <CardHeader>
                    <CardTitle>Coffee Match Discovery</CardTitle>
                  
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="matchingEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-primary">
                              Enable Coffee Match Discovery
                            </FormLabel>
                            <FormDescription>
                              {field.value
                                ? "Matching enabled - get ready to find matches at conferences you're attending"
                                : "Matching disabled"}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {matchingEnabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Filtering Criteria (optional)</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Set optional requirements for who you'd like to meet at
                        conferences
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Company Sectors Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={companySectorsEnabled}
                          onCheckedChange={() => setCompanySectorsEnabled(!companySectorsEnabled)}
                        />
                        <Label>Filter by Company Sectors</Label>
                      </div>

                      {companySectorsEnabled && (
                        <FormField
                          control={form.control}
                          name="companySectors"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(COMPANY_TAG_CATEGORIES).map(
                                  ([category, tags]) => (
                                    <div
                                      key={category}
                                      className="space-y-2 mb-4"
                                    >
                                      <Label className="font-medium">
                                        {category}
                                      </Label>
                                      <div className="space-y-2">
                                        {tags.map((tag) => (
                                          <FormItem
                                            key={tag}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(
                                                  tag,
                                                )}
                                                onCheckedChange={(checked) => {
                                                  const currentTags =
                                                    field.value || [];
                                                  if (checked) {
                                                    field.onChange([
                                                      ...currentTags,
                                                      tag,
                                                    ]);
                                                  } else {
                                                    field.onChange(
                                                      currentTags.filter(
                                                        (value) =>
                                                          value !== tag,
                                                      ),
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
                                  ),
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Company Followers Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={companyFollowersEnabled}
                          onCheckedChange={() => setCompanyFollowersEnabled(!companyFollowersEnabled)}
                        />
                        <Label>Minimum Company Followers</Label>
                      </div>

                      {companyFollowersEnabled && (
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
                                    <SelectValue placeholder="Select company follower count" />
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

                      {/* User Followers Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={userFollowersEnabled}
                          onCheckedChange={() => setUserFollowersEnabled(!userFollowersEnabled)}
                        />
                        <Label>Minimum User Followers</Label>
                      </div>

                      {userFollowersEnabled && (
                        <FormField
                          control={form.control}
                          name="userFollowers"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select user follower count" />
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

                      {/* Funding Stages Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={fundingStagesEnabled}
                          onCheckedChange={() => setFundingStagesEnabled(!fundingStagesEnabled)}
                        />
                        <Label>Filter by Funding Stage</Label>
                      </div>

                      {fundingStagesEnabled && (
                        <FormField
                          control={form.control}
                          name="fundingStages"
                          render={({ field }) => (
                            <FormItem>
                              <div className="space-y-2">
                                {FUNDING_STAGES.map((stage) => (
                                  <FormItem
                                    key={stage}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(stage)}
                                        onCheckedChange={(checked) => {
                                          const currentStages =
                                            field.value || [];
                                          if (checked) {
                                            field.onChange([
                                              ...currentStages,
                                              stage,
                                            ]);
                                          } else {
                                            field.onChange(
                                              currentStages.filter(
                                                (value) => value !== stage,
                                              ),
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {stage}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Token Status Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={tokenStatusEnabled}
                          onCheckedChange={() => setTokenStatusEnabled(!tokenStatusEnabled)}
                        />
                        <Label>Has Token</Label>
                      </div>

                      {tokenStatusEnabled && (
                        <FormField
                          control={form.control}
                          name="tokenStatus"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Projects must have a token
                                </FormLabel>
                                <FormDescription>
                                  Only match with projects that have a token
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Blockchain Networks Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={blockchainNetworksEnabled}
                          onCheckedChange={() => setBlockchainNetworksEnabled(!blockchainNetworksEnabled)}
                        />
                        <Label>Blockchain Network Requirements</Label>
                      </div>

                      {blockchainNetworksEnabled && (
                        <FormField
                          control={form.control}
                          name="blockchainNetworks"
                          render={({ field }) => {
                            // Add state for expanded categories
                            const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
                            
                            // Toggle category expansion
                            const toggleCategory = (category: string) => {
                              setExpandedCategories(prev =>
                                prev.includes(category)
                                  ? prev.filter(c => c !== category)
                                  : [...prev, category]
                              );
                            };
                            
                            return (
                              <FormItem>
                                <FormDescription>
                                  Select the blockchain networks you want to match with
                                </FormDescription>
                                <div className="space-y-3">
                                  {Object.entries(BLOCKCHAIN_NETWORK_CATEGORIES).map(([category, networks]) => {
                                    // Count how many networks are selected in this category
                                    const selectedCount = (field.value || []).filter(
                                      (network) => networks.includes(network as any)
                                    ).length;
                                    
                                    return (
                                      <div key={category} className="border rounded-lg overflow-hidden">
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
                                                variant={(field.value || []).includes(network) ? "default" : "outline"}
                                                className="justify-start h-auto py-3 px-4 w-full"
                                                onClick={() => {
                                                  const currentNetworks = field.value || [];
                                                  const updatedNetworks = currentNetworks.includes(network)
                                                    ? currentNetworks.filter(n => n !== network)
                                                    : [...currentNetworks, network];
                                                  field.onChange(updatedNetworks);
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
                                </div>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeTab === "criteria" && (
                  <div className="fixed bottom-0 left-0 right-0 bg-background py-4 px-4 border-t shadow-md flex justify-center z-10">
                    <Button type="submit" disabled={isSubmitting} className="w-full max-w-md" size="lg">
                      {isSubmitting ? "Saving..." : "Save Criteria"}
                    </Button>
                  </div>
                )}
                {/* Invisible spacer to ensure content isn't hidden behind fixed button */}
                {activeTab === "criteria" && <div className="h-20"></div>}
                </form>
              </Form>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}