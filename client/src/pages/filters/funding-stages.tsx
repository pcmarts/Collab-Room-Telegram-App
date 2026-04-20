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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FilterSaveButton } from "./FilterSaveButton";

import { FUNDING_STAGES, type MarketingPreferences } from "@/../../shared/schema";

// Form schema for this specific filter page
const filterSchema = z.object({
  // Filter values
  funding_stages: z.array(z.string()).default([]),
  
  // Filter toggle state
  discovery_filter_enabled: z.boolean().default(false),
  discovery_filter_funding_stages_enabled: z.boolean().default(false),
  
  // We need to include all other filter values to preserve them when saving
  collabs_to_discover: z.array(z.string()).default([]),
  filtered_marketing_topics: z.array(z.string()).default([]),
  company_tags: z.array(z.string()).default([]),
  company_blockchain_networks: z.array(z.string()).default([]),
  company_twitter_followers: z.string().optional(),
  twitter_followers: z.string().optional(),
  company_has_token: z.boolean().default(false),
  
  // Other toggle states
  discovery_filter_collab_types_enabled: z.boolean().default(false),
  discovery_filter_topics_enabled: z.boolean().default(false),
  discovery_filter_company_sectors_enabled: z.boolean().default(false),
  discovery_filter_company_followers_enabled: z.boolean().default(false),
  discovery_filter_user_followers_enabled: z.boolean().default(false),
  discovery_filter_token_status_enabled: z.boolean().default(false),
  discovery_filter_blockchain_networks_enabled: z.boolean().default(false),
});

type FilterFormValues = z.infer<typeof filterSchema>;

export default function FundingStagesFilter() {
  // Initialize form
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      funding_stages: [],
      discovery_filter_enabled: false,
      discovery_filter_funding_stages_enabled: false,
      collabs_to_discover: [],
      filtered_marketing_topics: [],
      company_tags: [],
      company_blockchain_networks: [],
      company_twitter_followers: undefined,
      twitter_followers: undefined,
      company_has_token: false,
      discovery_filter_collab_types_enabled: false,
      discovery_filter_topics_enabled: false,
      discovery_filter_company_sectors_enabled: false,
      discovery_filter_company_followers_enabled: false,
      discovery_filter_user_followers_enabled: false,
      discovery_filter_token_status_enabled: false,
      discovery_filter_blockchain_networks_enabled: false,
    }
  });

  // Watch form values
  const watchedValues = form.watch();
  
  // Fetch user's current marketing preferences
  const { data: marketingPrefs = {}, isLoading } = useQuery<any>({
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
        funding_stages: Array.isArray(marketingPrefs.funding_stages) 
          ? [...marketingPrefs.funding_stages] 
          : [],
        discovery_filter_funding_stages_enabled: marketingPrefs.discovery_filter_funding_stages_enabled === true,
        
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
        company_twitter_followers: marketingPrefs.company_twitter_followers || undefined,
        twitter_followers: marketingPrefs.twitter_followers || undefined,
        company_has_token: marketingPrefs.company_has_token === true,
        
        // All toggle states
        discovery_filter_enabled: marketingPrefs.discovery_filter_enabled === true,
        discovery_filter_collab_types_enabled: marketingPrefs.discovery_filter_collab_types_enabled === true,
        discovery_filter_topics_enabled: marketingPrefs.discovery_filter_topics_enabled === true,
        discovery_filter_company_sectors_enabled: marketingPrefs.discovery_filter_company_sectors_enabled === true,
        discovery_filter_company_followers_enabled: marketingPrefs.discovery_filter_company_followers_enabled === true,
        discovery_filter_user_followers_enabled: marketingPrefs.discovery_filter_user_followers_enabled === true,
        discovery_filter_token_status_enabled: marketingPrefs.discovery_filter_token_status_enabled === true,
        discovery_filter_blockchain_networks_enabled: marketingPrefs.discovery_filter_blockchain_networks_enabled === true,
      };
      
      form.reset(formValues);
    }
  }, [marketingPrefs, isLoading, form]);

  // Toggle filter enabled state
  const toggleFilterEnabled = () => {
    const currentValue = form.getValues("discovery_filter_funding_stages_enabled");
    form.setValue("discovery_filter_funding_stages_enabled", !currentValue);
    
    // If disabling the filter, clear all selected values
    if (currentValue) {
      form.setValue("funding_stages", []);
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
      values.discovery_filter_company_followers_enabled,
      values.discovery_filter_user_followers_enabled,
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
          title="Funding Stages"
          subtitle="Filter by company funding stage"
          backUrl="/filters"
        />
        
        <Form {...form}>
          <form className="space-y-4 pb-24">
            <Card>
              <CardContent className="p-4 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-medium">Filter by Funding Stages</h3>
                    <p className="text-sm text-muted-foreground">
                      Only show collaborations from companies at these funding stages
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.discovery_filter_funding_stages_enabled}
                    onCheckedChange={toggleFilterEnabled}
                    aria-label="Enable funding stages filter"
                  />
                </div>
                
                {watchedValues.discovery_filter_funding_stages_enabled && (
                  <FormField
                    control={form.control}
                    name="funding_stages"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div className="space-y-2">
                          {FUNDING_STAGES.map((stage) => (
                            <div key={stage} className="flex items-center space-x-2">
                              <Checkbox
                                id={`stage-${stage}`}
                                checked={field.value?.includes(stage)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...field.value, stage]
                                    : field.value.filter(
                                        (value: string) => value !== stage
                                      );
                                  field.onChange(updatedValue);
                                }}
                              />
                              <Label
                                htmlFor={`stage-${stage}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {stage}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}
                
                {watchedValues.discovery_filter_funding_stages_enabled && 
                 watchedValues.funding_stages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Selected Stages:</h4>
                    <div className="flex flex-wrap gap-2">
                      {watchedValues.funding_stages.map((stage) => (
                        <Badge 
                          key={stage} 
                          variant="outline"
                          className="bg-primary/10"
                        >
                          {stage}
                        </Badge>
                      ))}
                    </div>
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