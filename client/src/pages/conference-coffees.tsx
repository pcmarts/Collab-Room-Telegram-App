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
} from "@/components/ui/form";
import { 
  TWITTER_FOLLOWER_COUNTS, 
  FUNDING_STAGES, 
  COMPANY_TAG_CATEGORIES,
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
  tokenStatus: z.boolean().default(false)
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
      
      // Log raw filter states for debugging
      console.log("Raw DB values for filters:", {
        companySectors: prefs.coffee_match_filter_company_sectors_enabled,
        companyFollowers: prefs.coffee_match_filter_company_followers_enabled, 
        userFollowers: prefs.coffee_match_filter_user_followers_enabled,
        fundingStages: prefs.coffee_match_filter_funding_stages_enabled,
        tokenStatus: prefs.coffee_match_filter_token_status_enabled
      });
      
      // Set filter states based on database values with strict equality checks
      // This ensures PostgreSQL booleans are properly handled
      setCompanySectorsEnabled(prefs.coffee_match_filter_company_sectors_enabled === true);
      setCompanyFollowersEnabled(prefs.coffee_match_filter_company_followers_enabled === true);
      setUserFollowersEnabled(prefs.coffee_match_filter_user_followers_enabled === true);
      setFundingStagesEnabled(prefs.coffee_match_filter_funding_stages_enabled === true);
      setTokenStatusEnabled(prefs.coffee_match_filter_token_status_enabled === true);
      
      console.log("Loaded filter toggle states:", {
        companySectors: companySectorsEnabled,
        companyFollowers: companyFollowersEnabled,
        userFollowers: userFollowersEnabled,
        fundingStages: fundingStagesEnabled,
        tokenStatus: tokenStatusEnabled
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
      tokenStatus: tokenStatusEnabled
    });

    try {
      // Get current user preferences
      const profileResponse = await apiRequest('/api/profile', 'GET');
      const profileData = await profileResponse.json();
      console.log("Current profile data:", profileData);
      
      // Make sure we have a default for notification_frequency as it's required
      const notification_frequency = profileData?.preferences?.notification_frequency || "Daily";
      
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
        
        // Filter toggle states - use explicit boolean values to avoid type issues
        coffee_match_filter_company_sectors_enabled: companySectorsEnabled,
        coffee_match_filter_company_followers_enabled: companyFollowersEnabled,
        coffee_match_filter_user_followers_enabled: userFollowersEnabled,
        coffee_match_filter_funding_stages_enabled: fundingStagesEnabled,
        coffee_match_filter_token_status_enabled: tokenStatusEnabled
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
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Criteria"}
                  </Button>
                </div>
                </form>
              </Form>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}