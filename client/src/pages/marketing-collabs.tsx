import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  COLLAB_TYPES, 
  TWITTER_COLLAB_TYPES,
  TWITTER_FOLLOWER_COUNTS,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  AUDIENCE_SIZE_RANGES,
  FUNDING_STAGES
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  
  const [filtersEnabled, setFiltersEnabled] = useState({
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false
  });

  // Fetch existing data
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
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
      const collabsToHost = profileData.preferences.collabs_to_host || [];
      const collabsToDiscover = profileData.preferences.collabs_to_discover || [];
      
      // Combine to get all enabled collabs
      const uniqueCollabs = new Set([...collabsToHost, ...collabsToDiscover]);
      const enabledCollabs = Array.from(uniqueCollabs);
      
      // For now, we'll start with empty Twitter collabs as they're new
      form.reset({
        enabledCollabs,
        enabledTwitterCollabs: [],
        matchingEnabled: false,
        companySectors: [],
        topics: [],
        fundingStages: [],
        hasToken: false,
        companyFollowers: TWITTER_FOLLOWER_COUNTS[0],
        userFollowers: TWITTER_FOLLOWER_COUNTS[0]
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
  
  // Get matchingEnabled value from form
  const matchingEnabled = form.watch("matchingEnabled");

  const onSubmit = async (data: MarketingCollabFormData) => {
    setIsSubmitting(true);
    console.log("Form data:", data);

    try {
      // Separate collabs into host and discover (for now the same)
      // In a real implementation, we would separate these
      const updateData = {
        ...profileData?.preferences,
        collabs_to_host: data.enabledCollabs,
        collabs_to_discover: data.enabledCollabs
      };

      // Add twitter collabs and filter settings in a real implementation
      // For now, we'll just update the basic collab preferences

      const response = await apiRequest('POST', '/api/preferences', updateData);

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
            <TabsTrigger value="optin">✔️ Opt-In</TabsTrigger>
            <TabsTrigger value="criteria">🔍 Filter Criteria</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 space-y-6 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="optin" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Standard Collaborations</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select which types of marketing collaborations you're interested in
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="enabledCollabs"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-1 gap-2">
                            {COLLAB_TYPES.map((collabType) => (
                              <FormItem
                                key={collabType}
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
                                <FormLabel className="font-normal">{collabType}</FormLabel>
                              </FormItem>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Twitter Collaborations</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select which types of Twitter collaborations you're interested in
                    </p>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="enabledTwitterCollabs"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-1 gap-2">
                            {TWITTER_COLLAB_TYPES.map((collabType) => (
                              <FormItem
                                key={collabType}
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
                                <FormLabel className="font-normal">{collabType}</FormLabel>
                              </FormItem>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="criteria" className="space-y-4 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Match Filtering</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Enable to filter potential marketing collaboration matches
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
                              Enable Collaboration Filtering
                            </FormLabel>
                            <FormDescription>
                              {field.value
                                ? "Filtering enabled - you'll see matches based on criteria"
                                : "Filtering disabled - you'll see all collaboration opportunities"}
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
                        Set requirements for collaboration matches
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Topics Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.topics}
                          onCheckedChange={() => toggleFilter("topics")}
                        />
                        <Label>Filter by Topics</Label>
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
                                                checked={field.value?.includes(tag)}
                                                onCheckedChange={(checked) => {
                                                  const currentTags = field.value || [];
                                                  if (checked) {
                                                    field.onChange([...currentTags, tag]);
                                                  } else {
                                                    field.onChange(
                                                      currentTags.filter(
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
                                  )
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
                          onCheckedChange={() => toggleFilter("companyFollowers")}
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

                      {/* Funding Stages Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.fundingStages}
                          onCheckedChange={() => toggleFilter("fundingStages")}
                        />
                        <Label>Funding Stages</Label>
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
                                          const currentStages = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentStages, stage]);
                                          } else {
                                            field.onChange(
                                              currentStages.filter(
                                                (value) => value !== stage
                                              )
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
                          checked={filtersEnabled.hasToken}
                          onCheckedChange={() => toggleFilter("hasToken")}
                        />
                        <Label>Has Token</Label>
                      </div>

                      {filtersEnabled.hasToken && (
                        <FormField
                          control={form.control}
                          name="hasToken"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <FormLabel>Company must have a token</FormLabel>
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
              </TabsContent>

              <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4 z-10">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
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
