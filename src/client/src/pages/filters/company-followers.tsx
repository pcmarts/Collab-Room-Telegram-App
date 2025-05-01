import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { MobileCheck } from "@/components/MobileCheck";
import { PageHeader } from "@/components/layout/PageHeader";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FilterSaveButton } from "./FilterSaveButton";

import { TWITTER_FOLLOWER_COUNTS } from "@/../../shared/schema";

// Form schema for this specific filter page
const filterSchema = z.object({
  // Filter values
  company_twitter_followers: z.string().optional(),
  
  // Filter toggle state
  discovery_filter_enabled: z.boolean().default(false),
  discovery_filter_company_followers_enabled: z.boolean().default(false),
  
  // We need to include all other filter values to preserve them when saving
  collabs_to_discover: z.array(z.string()).default([]),
  filtered_marketing_topics: z.array(z.string()).default([]),
  company_tags: z.array(z.string()).default([]),
  company_blockchain_networks: z.array(z.string()).default([]),
  funding_stages: z.array(z.string()).default([]),
  twitter_followers: z.string().optional(),
  company_has_token: z.boolean().default(false),
  
  // Other toggle states
  discovery_filter_collab_types_enabled: z.boolean().default(false),
  discovery_filter_topics_enabled: z.boolean().default(false),
  discovery_filter_company_sectors_enabled: z.boolean().default(false),
  discovery_filter_user_followers_enabled: z.boolean().default(false),
  discovery_filter_funding_stages_enabled: z.boolean().default(false),
  discovery_filter_token_status_enabled: z.boolean().default(false),
  discovery_filter_blockchain_networks_enabled: z.boolean().default(false),
});

type FilterFormValues = z.infer<typeof filterSchema>;

export default function CompanyFollowersFilter() {
  // Initialize form
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      company_twitter_followers: undefined,
      discovery_filter_enabled: false,
      discovery_filter_company_followers_enabled: false,
      collabs_to_discover: [],
      filtered_marketing_topics: [],
      company_tags: [],
      company_blockchain_networks: [],
      funding_stages: [],
      twitter_followers: undefined,
      company_has_token: false,
      discovery_filter_collab_types_enabled: false,
      discovery_filter_topics_enabled: false,
      discovery_filter_company_sectors_enabled: false,
      discovery_filter_user_followers_enabled: false,
      discovery_filter_funding_stages_enabled: false,
      discovery_filter_token_status_enabled: false,
      discovery_filter_blockchain_networks_enabled: false,
    }
  });

  // Watch form values
  const watchedValues = form.watch();
  
  // Fetch user's current marketing preferences
  const { data: marketingPrefs = {}, isLoading } = useQuery({
    queryKey: ['/api/marketing-preferences'],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Initialize form with current preferences when data is loaded
  useEffect(() => {
    if (marketingPrefs && !isLoading) {
      const formValues: FilterFormValues = {
        // Set values for this specific filter
        company_twitter_followers: marketingPrefs.company_twitter_followers || undefined,
        discovery_filter_company_followers_enabled: marketingPrefs.discovery_filter_company_followers_enabled === true,
        
        // Preserve all other values
        collabs_to_discover: Array.isArray(marketingPrefs.collabs_to_discover) 
          ? [...marketingPrefs.collabs_to_discover] 
          : [],
        filtered_marketing_topics: Array.isArray(marketingPrefs.filtered_marketing_topics) 
          ? [...marketingPrefs.filtered_marketing_topics] 
          : [],
        company_tags: Array.isArray(marketingPrefs.company_tags) 
          ? [...marketingPrefs.company_tags] 
          : [],
        company_blockchain_networks: Array.isArray(marketingPrefs.company_blockchain_networks) 
          ? [...marketingPrefs.company_blockchain_networks] 
          : [],
        funding_stages: Array.isArray(marketingPrefs.funding_stages) 
          ? [...marketingPrefs.funding_stages] 
          : [],
        twitter_followers: marketingPrefs.twitter_followers || undefined,
        company_has_token: marketingPrefs.company_has_token === true,
        
        // All toggle states
        discovery_filter_enabled: marketingPrefs.discovery_filter_enabled === true,
        discovery_filter_collab_types_enabled: marketingPrefs.discovery_filter_collab_types_enabled === true,
        discovery_filter_topics_enabled: marketingPrefs.discovery_filter_topics_enabled === true,
        discovery_filter_company_sectors_enabled: marketingPrefs.discovery_filter_company_sectors_enabled === true,
        discovery_filter_user_followers_enabled: marketingPrefs.discovery_filter_user_followers_enabled === true,
        discovery_filter_funding_stages_enabled: marketingPrefs.discovery_filter_funding_stages_enabled === true,
        discovery_filter_token_status_enabled: marketingPrefs.discovery_filter_token_status_enabled === true,
        discovery_filter_blockchain_networks_enabled: marketingPrefs.discovery_filter_blockchain_networks_enabled === true,
      };
      
      form.reset(formValues);
    }
  }, [marketingPrefs, isLoading, form]);

  // Toggle filter enabled state
  const toggleFilterEnabled = () => {
    const currentValue = form.getValues("discovery_filter_company_followers_enabled");
    form.setValue("discovery_filter_company_followers_enabled", !currentValue);
    
    // If disabling the filter, clear selected value
    if (currentValue) {
      form.setValue("company_twitter_followers", undefined);
    }
    
    // Update the overall discovery_filter_enabled flag
    updateOverallFilterEnabled(!currentValue);
  };
  
  // Update the overall filter enabled flag based on any filter being enabled
  const updateOverallFilterEnabled = (currentToggleValue: boolean) => {
    // If enabling this filter, ensure overall filter is enabled
    if (currentToggleValue) {
      form.setValue("discovery_filter_enabled", true);
      return;
    }
    
    // If disabling, check if any other filter is still enabled
    const values = form.getValues();
    const anyFilterEnabled = [
      values.discovery_filter_collab_types_enabled,
      values.discovery_filter_topics_enabled,
      values.discovery_filter_company_sectors_enabled,
      values.discovery_filter_user_followers_enabled,
      values.discovery_filter_funding_stages_enabled,
      values.discovery_filter_token_status_enabled,
      values.discovery_filter_blockchain_networks_enabled
    ].some(value => value === true);
    
    form.setValue("discovery_filter_enabled", anyFilterEnabled);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <MobileCheck>
      <div className="container pb-6 min-h-screen">
        <PageHeader
          title="Company Followers"
          subtitle="Filter by minimum Twitter followers"
          backUrl="/filters"
        />
        
        <Form {...form}>
          <form className="space-y-4 pb-24">
            <Card>
              <CardContent className="p-4 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-medium">Filter by Minimum Company Followers</h3>
                    <p className="text-sm text-muted-foreground">
                      Only show collaborations from companies with at least this many Twitter followers
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.discovery_filter_company_followers_enabled}
                    onCheckedChange={toggleFilterEnabled}
                    aria-label="Enable company followers filter"
                  />
                </div>
                
                {watchedValues.discovery_filter_company_followers_enabled && (
                  <FormField
                    control={form.control}
                    name="company_twitter_followers"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {TWITTER_FOLLOWER_COUNTS.map((count) => (
                            <div key={count} className="flex items-center space-x-2">
                              <RadioGroupItem value={count} id={`count-${count}`} />
                              <Label htmlFor={`count-${count}`} className="font-normal">
                                {count}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormItem>
                    )}
                  />
                )}
                
                {watchedValues.discovery_filter_company_followers_enabled && 
                 watchedValues.company_twitter_followers && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm">
                      Only showing collaborations from companies with at least{" "}
                      <span className="font-medium">{watchedValues.company_twitter_followers}</span> Twitter followers
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <FilterSaveButton formValues={form.getValues()} />
          </form>
        </Form>
      </div>
    </MobileCheck>
  );
}