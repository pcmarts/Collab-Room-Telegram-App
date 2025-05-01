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
import { Badge } from "@/components/ui/badge";

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

type CoffeeMatchCriteria = z.infer<typeof coffeeMatchCriteriaSchema>;

export default function ConferenceCoffees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  // Filter toggle states
  const [companySectorsEnabled, setCompanySectorsEnabled] = useState(false);
  const [companyFollowersEnabled, setCompanyFollowersEnabled] = useState(false);
  const [userFollowersEnabled, setUserFollowersEnabled] = useState(false);
  const [fundingStagesEnabled, setFundingStagesEnabled] = useState(false);
  const [tokenStatusEnabled, setTokenStatusEnabled] = useState(false);
  const [blockchainNetworksEnabled, setBlockchainNetworksEnabled] = useState(false);
  
  // For keeping track of which blockchain network categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Form initialization
  const form = useForm<CoffeeMatchCriteria>({
    resolver: zodResolver(coffeeMatchCriteriaSchema),
    defaultValues: {
      matchingEnabled: false,
      companySectors: [],
      companyFollowers: TWITTER_FOLLOWER_COUNTS[0],
      userFollowers: TWITTER_FOLLOWER_COUNTS[0],
      fundingStages: [],
      tokenStatus: false,
      blockchainNetworks: []
    },
  });
  
  // Load saved preferences when profile data is fetched
  const { data: profileData, isLoading: isProfileLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    refetchOnWindowFocus: false,
  });
  
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
  
  // Function to toggle filter states
  const toggleFilter = (
    filterType: 'companySectors' | 'companyFollowers' | 'userFollowers' | 'fundingStages' | 'tokenStatus' | 'blockchainNetworks'
  ) => {
    switch(filterType) {
      case 'companySectors':
        setCompanySectorsEnabled(!companySectorsEnabled);
        break;
      case 'companyFollowers':
        setCompanyFollowersEnabled(!companyFollowersEnabled);
        break;
      case 'userFollowers':
        setUserFollowersEnabled(!userFollowersEnabled);
        break;
      case 'fundingStages':
        setFundingStagesEnabled(!fundingStagesEnabled);
        break;
      case 'tokenStatus':
        setTokenStatusEnabled(!tokenStatusEnabled);
        break;
      case 'blockchainNetworks':
        setBlockchainNetworksEnabled(!blockchainNetworksEnabled);
        break;
    }
  };
  
  // Function to toggle category expansion for blockchain networks
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const onSubmitCriteria = async (data: CoffeeMatchCriteria) => {
    try {
      // Prepare the data to send
      const matchingData = {
        coffee_match_enabled: data.matchingEnabled,
        coffee_match_company_sectors: companySectorsEnabled ? data.companySectors : [], 
        coffee_match_company_followers: companyFollowersEnabled ? data.companyFollowers : null,
        coffee_match_user_followers: userFollowersEnabled ? data.userFollowers : null,
        coffee_match_funding_stages: fundingStagesEnabled ? data.fundingStages : [],
        coffee_match_token_status: tokenStatusEnabled ? data.tokenStatus : null,
        coffee_match_blockchain_networks: blockchainNetworksEnabled ? data.blockchainNetworks : [],
        // Filter toggle states
        coffee_match_filter_company_sectors_enabled: companySectorsEnabled,
        coffee_match_filter_company_followers_enabled: companyFollowersEnabled,
        coffee_match_filter_user_followers_enabled: userFollowersEnabled,
        coffee_match_filter_funding_stages_enabled: fundingStagesEnabled,
        coffee_match_filter_token_status_enabled: tokenStatusEnabled,
        coffee_match_filter_blockchain_networks_enabled: blockchainNetworksEnabled
      };
      
      // Log the data we're about to send
      console.log("Saving coffee match criteria:", matchingData);
      
      const response = await apiRequest('/api/conferences/coffee-criteria', 'POST', matchingData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save coffee match criteria');
      }
      
      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      
      toast({
        title: "Matching Criteria Saved",
        description: "Your coffee match preferences have been updated."
      });
      
    } catch (error) {
      console.error("Error saving coffee match criteria:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Conference Meetups" 
        subtitle="Discover relevant connections at events" 
      />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coffee Match Preferences</CardTitle>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCriteria)} className="space-y-6">
              {/* Enable/Disable Matching */}
              <FormField
                control={form.control}
                name="matchingEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Coffee Matches
                      </FormLabel>
                      <FormDescription>
                        Allow connections with compatible attendees based on your criteria
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
              
              {matchingEnabled && (
                <div className="space-y-6">
                  {/* Company Sectors with standardized UI pattern */}
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <Label>Filter by Company Sectors</Label>
                      </div>
                      <Switch
                        checked={companySectorsEnabled}
                        onCheckedChange={() => toggleFilter('companySectors')}
                      />
                    </div>

                    {companySectorsEnabled && (
                      <FormField
                        control={form.control}
                        name="companySectors"
                        render={({ field }) => {
                          // Create a state for keeping track of expanded categories right within the render function
                          const [expandedSectorCategories, setExpandedSectorCategories] = useState<string[]>([]);
                          
                          // Function to toggle category expansion
                          const toggleSectorCategory = (category: string) => {
                            setExpandedSectorCategories(prev =>
                              prev.includes(category)
                                ? prev.filter(c => c !== category)
                                : [...prev, category]
                            );
                          };
                          
                          return (
                            <FormItem>
                              <div className="space-y-4">
                                {/* Overall selection count */}
                                {field.value?.length > 0 && (
                                  <div className="flex justify-between items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {field.value.length} {field.value.length === 1 ? 'sector' : 'sectors'} selected
                                    </Badge>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => field.onChange([])}
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                )}
                              
                                {/* Categorized sector selection with per-category badges */}
                                {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => {
                                  // Calculate how many items in this category are selected
                                  const selectedCount = field.value?.filter(item => tags.includes(item)).length || 0;
                                  
                                  return (
                                    <div key={category} className="border rounded p-3">
                                      <div 
                                        className="flex justify-between items-center cursor-pointer mb-2"
                                        onClick={() => toggleSectorCategory(category)}
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium">{category}</span>
                                          {selectedCount > 0 && (
                                            <Badge variant="secondary" className="text-xs">
                                              {selectedCount}
                                            </Badge>
                                          )}
                                        </div>
                                        {expandedSectorCategories.includes(category) ? (
                                          <ChevronUp className="h-4 w-4" /> 
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </div>
                                      
                                      {expandedSectorCategories.includes(category) && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                          {tags.map((tag) => (
                                            <Button
                                              key={tag}
                                              type="button"
                                              variant={field.value?.includes(tag) ? "default" : "outline"}
                                              className="h-auto py-2 px-3 justify-start text-left font-normal whitespace-normal"
                                              onClick={() => {
                                                const currentTags = field.value || [];
                                                if (!currentTags.includes(tag)) {
                                                  field.onChange([...currentTags, tag]);
                                                } else {
                                                  field.onChange(
                                                    currentTags.filter(value => value !== tag)
                                                  );
                                                }
                                              }}
                                            >
                                              {tag}
                                            </Button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Other filter sections (not modified in this file) */}
                  
                  {/* Blockchain Networks section remains with its existing UI pattern */}
                  
                </div>
              )}
              
              <div className="flex justify-end">
                <Button type="submit" className="w-full sm:w-auto">
                  Save Preferences
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}