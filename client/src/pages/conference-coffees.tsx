import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Event, UserEvent } from "@shared/schema";
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
  SelectValue 
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  COMPANY_TAG_CATEGORIES, 
  FUNDING_STAGES, 
  TWITTER_FOLLOWER_COUNTS 
} from "@shared/schema";

interface EventWithAttending extends Event {
  isAttending: boolean;
}

// Define schema for coffee match criteria form
const coffeeMatchCriteriaSchema = z.object({
  matchingEnabled: z.boolean().default(false),
  companySectors: z.array(z.string()).optional(),
  companyFollowers: z.string().optional(),
  userFollowers: z.string().optional(),
  fundingStages: z.array(z.string()).optional(),
  tokenStatus: z.boolean().optional(),
});

type CoffeeMatchCriteria = z.infer<typeof coffeeMatchCriteriaSchema>;

export default function ConferenceCoffees() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("attending");
  
  // Track which filters are enabled
  const [filtersEnabled, setFiltersEnabled] = useState({
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    tokenStatus: false
  });

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
    }
  });
  
  // Toggle filter visibility
  const toggleFilter = (filterName: keyof typeof filtersEnabled) => {
    setFiltersEnabled(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };
  
  // Watch for changes to matching enabled
  const matchingEnabled = form.watch("matchingEnabled");
  
  const onSubmitCriteria = async (data: CoffeeMatchCriteria) => {
    console.log("Coffee match criteria:", data);
    try {
      setIsSubmitting(true);
      
      // TODO: Implement API endpoint to save coffee match criteria
      
      toast({
        title: "Success!",
        description: "Your coffee match criteria have been saved",
        duration: 2000
      });
      
    } catch (error) {
      console.error('Failed to save coffee match criteria:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save criteria"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch events and user's attending events
  const { data: events, isLoading: eventsLoading, error: eventsError } = useQuery<Event[]>({
    queryKey: ['/api/events']
  });

  const { data: userEvents, isLoading: userEventsLoading, error: userEventsError } = useQuery<UserEvent[]>({
    queryKey: ['/api/user-events']
  });

  // Combined loading state
  const isLoading = eventsLoading || userEventsLoading;

  // Handle errors
  if (eventsError) {
    console.error('Events fetch error:', eventsError);
    return <div>Error loading events. Please try again.</div>;
  }

  if (userEventsError) {
    console.error('User events fetch error:', userEventsError);
    return <div>Error loading user events. Please try again.</div>;
  }

  // Filter out past events
  const activeEvents = events?.map(event => ({
    ...event,
    isAttending: userEvents?.some(ue => ue.event_id === event.id) || false
  })).filter(event => 
    new Date(event.end_date) > new Date()
  ).sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  ) || [];

  const toggleEventAttendance = async (eventId: string) => {
    try {
      setIsSubmitting(true);

      const response = await apiRequest(
        'POST',
        '/api/user-events',
        { event_id: eventId }
      );

      if (!response.ok) {
        throw new Error('Failed to update event attendance');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/user-events'] });

      toast({
        title: "Success!",
        description: "Your conference selection has been updated",
        duration: 2000
      });

    } catch (error) {
      console.error('Failed to update event attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event attendance"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('Events data:', events);
  console.log('User events data:', userEvents);
  console.log('Active events:', activeEvents);

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="Conference Coffees"
        subtitle="Connect with attendees at events"
        backUrl="/dashboard"
      />

      <div className="p-4 space-y-6">
        <Tabs defaultValue="attending" onValueChange={value => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="attending">1️⃣ Attending</TabsTrigger>
            <TabsTrigger value="criteria">2️⃣ Coffee Match Criteria</TabsTrigger>
          </TabsList>
          
          {/* Attending Tab Content */}
          <TabsContent value="attending" className="space-y-4">
            <div>
              <Label className="text-lg">Select Your Conferences</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the conferences you'll be attending to connect with other attendees
              </p>

              <div className="grid gap-4">
                {activeEvents.map(event => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">{event.name}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(event.start_date)} - {formatDate(event.end_date)}
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
            </div>
          </TabsContent>
          
          {/* Coffee Match Criteria Tab Content */}
          <TabsContent value="criteria" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCriteria)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Coffee Match Discovery</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Enable or disable matching with other attendees
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
                              Turn on to find potential matches at conferences you're attending
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
                      <CardTitle>Filtering Criteria</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Set requirements for who you'd like to meet at conferences
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Company Sectors Filter */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.companySectors}
                          onCheckedChange={() => toggleFilter('companySectors')}
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
                                {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
                                  <div key={category} className="space-y-2 mb-4">
                                    <Label className="font-medium">{category}</Label>
                                    <div className="space-y-2">
                                      {tags.map(tag => (
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
                                                    currentTags.filter(value => value !== tag)
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

                      {/* Twitter Followers Filter - Company */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          checked={filtersEnabled.companyFollowers}
                          onCheckedChange={() => toggleFilter('companyFollowers')}
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
                          onCheckedChange={() => toggleFilter('userFollowers')}
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
                          onCheckedChange={() => toggleFilter('fundingStages')}
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
                                {FUNDING_STAGES.map(stage => (
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
                                              currentStages.filter(value => value !== stage)
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
                          onCheckedChange={() => toggleFilter('tokenStatus')}
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
                                <FormLabel>Only show companies with a token</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Saving...</span>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
                    </>
                  ) : (
                    'Save Coffee Match Criteria'
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}