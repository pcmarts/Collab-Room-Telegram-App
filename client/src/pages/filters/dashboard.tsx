import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { MarketingPreferences } from "@/../../shared/schema";
import { MobileCheck } from "@/components/MobileCheck";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  MessageSquare, 
  Tag, 
  Building, 
  Users, 
  DollarSign,
  CoinsIcon,
  Network,
  ChevronRight
} from "lucide-react";

// Filter dashboard page - provides access to all filter categories
export default function FiltersDashboard() {
  const [, navigate] = useLocation();

  // Fetch user's current marketing preferences
  const { data: marketingPrefs = {}, isLoading } = useQuery<any>({
    queryKey: ['/api/marketing-preferences'],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Helper to get active filter count for a specific filter type
  const getActiveFilterCount = (filterType: string, valueArray?: string[] | null) => {
    if (!marketingPrefs) return 0;
    
    // Check if filter is enabled
    const isEnabled = marketingPrefs[`discovery_filter_${filterType}_enabled`];
    if (!isEnabled) return 0;
    
    // Return count of values if available
    return Array.isArray(valueArray) ? valueArray.length : 0;
  };

  // Helper to determine if a scalar filter is active
  const isScalarFilterActive = (filterType: string) => {
    if (!marketingPrefs) return false;
    return marketingPrefs[`discovery_filter_${filterType}_enabled`] === true;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const filterItems = [
    {
      name: "Collaboration Types",
      icon: <MessageSquare className="h-5 w-5 text-primary" />,
      path: "/filters/collab-types",
      count: getActiveFilterCount("collab_types", marketingPrefs.collabs_to_discover),
      enabled: marketingPrefs.discovery_filter_collab_types_enabled
    },
    {
      name: "Content Topics",
      icon: <Tag className="h-5 w-5 text-primary" />,
      path: "/filters/topics",
      count: getActiveFilterCount("topics", marketingPrefs.filtered_marketing_topics),
      enabled: marketingPrefs.discovery_filter_topics_enabled
    },
    {
      name: "Company Sectors",
      icon: <Building className="h-5 w-5 text-primary" />,
      path: "/filters/company-sectors",
      count: getActiveFilterCount("company_sectors", marketingPrefs.company_tags),
      enabled: marketingPrefs.discovery_filter_company_sectors_enabled
    },
    {
      name: "Company Followers",
      icon: <Users className="h-5 w-5 text-primary" />,
      path: "/filters/company-followers",
      count: 0, // Scalar filter
      enabled: isScalarFilterActive("company_followers")
    },
    {
      name: "User Followers",
      icon: <Users className="h-5 w-5 text-primary" />,
      path: "/filters/user-followers",
      count: 0, // Scalar filter 
      enabled: isScalarFilterActive("user_followers")
    },
    {
      name: "Funding Stages",
      icon: <DollarSign className="h-5 w-5 text-primary" />,
      path: "/filters/funding-stages",
      count: getActiveFilterCount("funding_stages", marketingPrefs.funding_stages),
      enabled: marketingPrefs.discovery_filter_funding_stages_enabled
    },
    {
      name: "Token Status",
      icon: <CoinsIcon className="h-5 w-5 text-primary" />,
      path: "/filters/token-status",
      count: 0, // Boolean filter
      enabled: isScalarFilterActive("token_status")
    },
    {
      name: "Blockchain Networks",
      icon: <Network className="h-5 w-5 text-primary" />,
      path: "/filters/blockchain-networks",
      count: getActiveFilterCount("blockchain_networks", marketingPrefs.company_blockchain_networks),
      enabled: marketingPrefs.discovery_filter_blockchain_networks_enabled
    }
  ];

  return (
    <MobileCheck>
      <div className="container pb-6 min-h-screen">
        <PageHeader
          title="Discovery Filters"
          subtitle="Customize which collaborations appear in your feed"
          backUrl="/discover"
        />

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <h3 className="text-base font-medium">Choose Filter Category</h3>
              <p className="text-sm text-muted-foreground">
                Select a category below to customize your filters
              </p>
            </div>

            <div className="space-y-2">
              {filterItems.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <div className="flex items-center">
                        {item.enabled ? (
                          <span className="text-xs text-green-600 flex items-center">
                            Active {item.count > 0 && `(${item.count})`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileCheck>
  );
}