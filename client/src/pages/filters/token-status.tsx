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
import { FilterSaveButton } from "./FilterSaveButton";
import { Coins } from "lucide-react";

// Form schema for this specific filter page
const filterSchema = z.object({
  // Filter values
  company_has_token: z.boolean().default(false),
  
  // Filter toggle state
  discovery_filter_enabled: z.boolean().default(false),
  discovery_filter_token_status_enabled: z.boolean().default(false),
  
  // We need to include all other filter values to preserve them when saving
  collabs_to_discover: z.array(z.string()).default([]),
  filtered_marketing_topics: z.array(z.string()).default([]),
  company_tags: z.array(z.string()).default([]),
  company_blockchain_networks: z.array(z.string()).default([]),
  funding_stages: z.array(z.string()).default([]),
  company_twitter_followers: z.string().optional(),
  twitter_followers: z.string().optional(),
  
  // Other toggle states
  discovery_filter_collab_types_enabled: z.boolean().default(false),
  discovery_filter_topics_enabled: z.boolean().default(false),
  discovery_filter_company_sectors_enabled: z.boolean().default(false),
  discovery_filter_company_followers_enabled: z.boolean().default(false),
  discovery_filter_user_followers_enabled: z.boolean().default(false),
  discovery_filter_funding_stages_enabled: z.boolean().default(false),
  discovery_filter_blockchain_networks_enabled: z.boolean().default(false),
});

type FilterFormValues = z.infer<typeof filterSchema>;

export default function TokenStatusFilter() {
  // Initialize form
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      company_has_token: false,
      discovery_filter_enabled: false,
      discovery_filter_token_status_enabled: false,
      collabs_to_discover: [],
      filtered_marketing_topics: [],
      company_tags: [],
      company_blockchain_networks: [],
      funding_stages: [],
      company_twitter_followers: undefined,
      twitter_followers: undefined,
      discovery_filter_collab_types_enabled: false,
      discovery_filter_topics_enabled: false,
      discovery_filter_company_sectors_enabled: false,
      discovery_filter_company_followers_enabled: false,
      discovery_filter_user_followers_enabled: false,
      discovery_filter_funding_stages_enabled: false,
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
        company_has_token: marketingPrefs.company_has_token === true,
        discovery_filter_token_status_enabled: marketingPrefs.discovery_filter_token_status_enabled === true,
        
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
        company_twitter_followers: marketingPrefs.company_twitter_followers || undefined,
        twitter_followers: marketingPrefs.twitter_followers || undefined,
        
        // All toggle states
        discovery_filter_enabled: marketingPrefs.discovery_filter_enabled === true,
        discovery_filter_collab_types_enabled: marketingPrefs.discovery_filter_collab_types_enabled === true,
        discovery_filter_topics_enabled: marketingPrefs.discovery_filter_topics_enabled === true,
        discovery_filter_company_sectors_enabled: marketingPrefs.discovery_filter_company_sectors_enabled === true,
        discovery_filter_company_followers_enabled: marketingPrefs.discovery_filter_company_followers_enabled === true,
        discovery_filter_user_followers_enabled: marketingPrefs.discovery_filter_user_followers_enabled === true,
        discovery_filter_funding_stages_enabled: marketingPrefs.discovery_filter_funding_stages_enabled === true,
        discovery_filter_blockchain_networks_enabled: marketingPrefs.discovery_filter_blockchain_networks_enabled === true,
      };
      
      form.reset(formValues);
    }
  }, [marketingPrefs, isLoading, form]);

  // Toggle filter enabled state
  const toggleFilterEnabled = () => {
    const currentValue = form.getValues("discovery_filter_token_status_enabled");
    form.setValue("discovery_filter_token_status_enabled", !currentValue);
    
    // When disabling, we keep the token status value as it's just a boolean
    // but we should update the overall enabled state
    updateOverallFilterEnabled(!currentValue);
  };
  
  // Toggle token status
  const toggleTokenStatus = () => {
    const currentValue = form.getValues("company_has_token");
    form.setValue("company_has_token", !currentValue);
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
      values.discovery_filter_company_followers_enabled,
      values.discovery_filter_user_followers_enabled,
      values.discovery_filter_funding_stages_enabled,
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
          title="Token Status"
          subtitle="Filter by company token status"
          backUrl="/filters"
        />
        
        <Form {...form}>
          <form className="space-y-4 pb-24">
            <Card>
              <CardContent className="p-4 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-medium">Filter by Token Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Only show collaborations from companies with tokens
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.discovery_filter_token_status_enabled}
                    onCheckedChange={toggleFilterEnabled}
                    aria-label="Enable token status filter"
                  />
                </div>
                
                {watchedValues.discovery_filter_token_status_enabled && (
                  <div className="border rounded-lg p-4 bg-background/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Coins className="h-5 w-5 text-primary mr-2" />
                        <p className="text-sm">Show only companies with tokens</p>
                      </div>
                      <Switch
                        checked={watchedValues.company_has_token}
                        onCheckedChange={toggleTokenStatus}
                        aria-label="Companies must have tokens"
                      />
                    </div>
                  </div>
                )}
                
                {watchedValues.discovery_filter_token_status_enabled && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm">
                      {watchedValues.company_has_token 
                        ? "Only showing collaborations from companies that have a token" 
                        : "Only showing collaborations from companies that do not have a token"}
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