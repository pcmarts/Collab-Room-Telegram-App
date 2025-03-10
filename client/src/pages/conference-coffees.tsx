import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  COMPANY_TAG_CATEGORIES,
  TWITTER_FOLLOWER_COUNTS,
  FUNDING_STAGES,
} from "@shared/schema";

// Form schema for coffee match criteria
const coffeeMatchCriteriaSchema = z.object({
  matchingEnabled: z.boolean().default(false),
  companySectors: z.array(z.string()).default([]),
  companyFollowers: z.string().default(TWITTER_FOLLOWER_COUNTS[0]),
  userFollowers: z.string().default(TWITTER_FOLLOWER_COUNTS[0]),
  fundingStages: z.array(z.string()).default([]),
  tokenStatus: z.boolean().default(false),
});

// Type for form data
type CoffeeMatchCriteria = z.infer<typeof coffeeMatchCriteriaSchema>;

// Helper function to handle PostgreSQL boolean values from API
function isPostgresBooleanTrue(value: any): boolean {
  return value === true || 
         value === 't' || 
         value === 'true' || 
         value === 1 || 
         value === '1';
}

export default function ConferenceCoffees() {
  const [activeTab, setActiveTab] = useState("attending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtersEnabled, setFiltersEnabled] = useState({
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    tokenStatus: false,
  });

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
    },
  });

  // Toggle filter visibility - Using hard boolean values to avoid type conversion issues
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    // Get current value with strict boolean conversion
    // Force a true/false value rather than a truthy/falsy value
    const currentValue = filtersEnabled[filterName] === true;
    
    // Log the state change
    console.log(`Toggling filter ${filterName} from ${currentValue} to ${!currentValue}`);
    
    // Create a completely new object with explicit booleans instead of mutating previous state
    const newState = {
      companySectors: filterName === "companySectors" ? !currentValue : (filtersEnabled.companySectors === true),
      companyFollowers: filterName === "companyFollowers" ? !currentValue : (filtersEnabled.companyFollowers === true),
      userFollowers: filterName === "userFollowers" ? !currentValue : (filtersEnabled.userFollowers === true),
      fundingStages: filterName === "fundingStages" ? !currentValue : (filtersEnabled.fundingStages === true),
      tokenStatus: filterName === "tokenStatus" ? !currentValue : (filtersEnabled.tokenStatus === true)
    };
    
    console.log(`New filter states:`, newState);
    setFiltersEnabled(newState);
  };
  
  // Load saved preferences when profile data is fetched
  useEffect(() => {
    if (profileData?.preferences) {
      const prefs = profileData.preferences;
      
      // Set form values from saved preferences
      form.reset({
        matchingEnabled: prefs.coffee_match_enabled ?? false,
        companySectors: prefs.coffee_match_company_sectors ?? [],
        companyFollowers: prefs.coffee_match_company_followers ?? TWITTER_FOLLOWER_COUNTS[0],
        userFollowers: prefs.coffee_match_user_followers ?? TWITTER_FOLLOWER_COUNTS[0],
        fundingStages: prefs.coffee_match_funding_stages ?? [],
        tokenStatus: prefs.coffee_match_token_status ?? false
      });
      
      // For debugging only - Log raw filter states from database
      console.log("Raw DB values for filters:", {
        companySectors: prefs.coffee_match_filter_company_sectors_enabled,
        companyFollowers: prefs.coffee_match_filter_company_followers_enabled, 
        userFollowers: prefs.coffee_match_filter_user_followers_enabled,
        fundingStages: prefs.coffee_match_filter_funding_stages_enabled,
        tokenStatus: prefs.coffee_match_filter_token_status_enabled
      });
      
      // IMPORTANT: Always manually set filter states based on database values
      // PostgreSQL returns 'f' for false, which is truthy in JavaScript
      // We need to explicitly convert to proper booleans using strict equality
      const updatedFilters = {
        companySectors: prefs.coffee_match_filter_company_sectors_enabled === true,
        companyFollowers: prefs.coffee_match_filter_company_followers_enabled === true,
        userFollowers: prefs.coffee_match_filter_user_followers_enabled === true,
        fundingStages: prefs.coffee_match_filter_funding_stages_enabled === true,
        tokenStatus: prefs.coffee_match_filter_token_status_enabled === true
      };
      
      console.log("Loading coffee match filter states:", updatedFilters);
      setFiltersEnabled(updatedFilters);
      
      // Log if no filters were enabled from saved preferences (for debugging only)
      if (!Object.values(updatedFilters).some(Boolean)) {
        console.log("No filters are currently enabled from saved preferences");
        // We're not forcing filters on anymore - this was causing the issue
      }
    }
  }, [profileData, form]);

  // Extract the matchingEnabled value from form
  const matchingEnabled = form.watch("matchingEnabled");

  // Submit criteria
  const onSubmitCriteria = async (data: CoffeeMatchCriteria) => {
    setIsSubmitting(true);
    console.log("Submitting criteria:", data);
    console.log("Filter toggle states:", filtersEnabled);

    try {
      // Get current user preferences
      const profileResponse = await apiRequest('/api/profile', 'GET');
      const profileData = await profileResponse.json();
      console.log("Current profile data:", profileData);
      
      // Make sure we have a default for notification_frequency as it's required
      const notification_frequency = profileData?.preferences?.notification_frequency || "Daily";
      console.log("Using notification_frequency:", notification_frequency);
      
      // For debugging - show current value in database
      console.log("Current filter toggle states in database:", {
        companySectors: profileData?.preferences?.coffee_match_filter_company_sectors_enabled,
        companyFollowers: profileData?.preferences?.coffee_match_filter_company_followers_enabled,
        userFollowers: profileData?.preferences?.coffee_match_filter_user_followers_enabled,
        fundingStages: profileData?.preferences?.coffee_match_filter_funding_stages_enabled,
        tokenStatus: profileData?.preferences?.coffee_match_filter_token_status_enabled
      });
      
      // Update the coffee match criteria fields and toggle states
      const updateData = {
        ...(profileData?.preferences || {}),
        // Ensure required fields are included
        notification_frequency,
        
        // Form data values
        coffee_match_enabled: data.matchingEnabled,
        coffee_match_company_sectors: data.companySectors ?? [],
        coffee_match_company_followers: data.companyFollowers,
        coffee_match_user_followers: data.userFollowers,
        coffee_match_funding_stages: data.fundingStages ?? [],
        coffee_match_token_status: data.tokenStatus,
        
        // Filter toggle states - use explicit true/false values for PostgreSQL
        coffee_match_filter_company_sectors_enabled: Boolean(filtersEnabled.companySectors),
        coffee_match_filter_company_followers_enabled: Boolean(filtersEnabled.companyFollowers),
        coffee_match_filter_user_followers_enabled: Boolean(filtersEnabled.userFollowers),
        coffee_match_filter_funding_stages_enabled: Boolean(filtersEnabled.fundingStages),
        coffee_match_filter_token_status_enabled: Boolean(filtersEnabled.tokenStatus)
      };
      
      console.log("Sending updateData:", updateData);

      // Save to the preferences API
      const response = await apiRequest('/api/preferences', 'POST', updateData);
      
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
        console.log("Successfully saved preferences:", responseData);
        console.log("Saved filter toggle states:", {
          companySectors: responseData.preferences.coffee_match_filter_company_sectors_enabled,
          companyFollowers: responseData.preferences.coffee_match_filter_company_followers_enabled,
          userFollowers: responseData.preferences.coffee_match_filter_user_followers_enabled,
          fundingStages: responseData.preferences.coffee_match_filter_funding_stages_enabled,
          tokenStatus: responseData.preferences.coffee_match_filter_token_status_enabled
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
            <TabsTrigger value="attending">✔️ Attending</TabsTrigger>
            <TabsTrigger value="criteria">🔍 Coffee Match Criteria</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground">
                      Enable to find matches at conferences you're attending
                    </p>
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
                                ? "Matching enabled - you'll be matched with filtered contacts"
                                : "Matching disabled - you'll be matched with everyone"}
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
                          checked={filtersEnabled.companySectors}
                          onCheckedChange={() => toggleFilter("companySectors")}
                        />
                        <Label>Filter by Company Sectors</Label>
                      </div>

                      {filtersEnabled.companySectors && (
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

                      {/* Twitter Followers Filter - Company */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.companyFollowers}
                          onCheckedChange={() =>
                            toggleFilter("companyFollowers")
                          }
                        />
                        <Label>Minimum Company Followers</Label>
                      </div>

                      {filtersEnabled.companyFollowers && (
                        <FormField
                          control={form.control}
                          name="companyFollowers"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select min followers" />
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

                      {/* Twitter Followers Filter - User */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.userFollowers}
                          onCheckedChange={() => toggleFilter("userFollowers")}
                        />
                        <Label>Minimum User Followers</Label>
                      </div>

                      {filtersEnabled.userFollowers && (
                        <FormField
                          control={form.control}
                          name="userFollowers"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select min followers" />
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

                      {/* Funding Stage Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.fundingStages}
                          onCheckedChange={() => toggleFilter("fundingStages")}
                        />
                        <Label>Filter by Funding Stage</Label>
                      </div>

                      {filtersEnabled.fundingStages && (
                        <FormField
                          control={form.control}
                          name="fundingStages"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-2">
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
                          checked={filtersEnabled.tokenStatus}
                          onCheckedChange={() => toggleFilter("tokenStatus")}
                        />
                        <Label>Has Token</Label>
                      </div>

                      {filtersEnabled.tokenStatus && (
                        <FormField
                          control={form.control}
                          name="tokenStatus"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>
                                  Only show companies with a token
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Saving...</span>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                    </>
                  ) : (
                    "Save Coffee Match Criteria"
                  )}
                </Button>
              </form>
              </Form>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
