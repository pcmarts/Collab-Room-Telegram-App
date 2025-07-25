import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { MobileCheck } from "@/components/MobileCheck";
import { RequestsManagementTab } from "@/components/requests-management-tab";
import { useToast } from "@/hooks/use-toast";

export default function RequestsPage() {
  const [requestsFilter, setRequestsFilter] = useState<"all" | "hidden">("all");
  const { toast } = useToast();

  // Check authentication
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: () => apiRequest('/api/profile'),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!userProfile;

  // Fetch collaboration requests summary for the summary card
  const { data: requestsSummary } = useQuery({
    queryKey: ['/api/collaboration-requests/summary'],
    queryFn: async () => {
      try {
        const data = await apiRequest('/api/collaboration-requests/summary');
        return data;
      } catch (error) {
        console.error("Error fetching requests summary:", error);
        return { totalPendingCount: 0 };
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch full collaboration requests for the management tab
  const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['/api/collaboration-requests', requestsFilter],
    queryFn: async () => {
      try {
        const data = await apiRequest(`/api/collaboration-requests?filter=${requestsFilter}`);
        return data;
      } catch (error) {
        console.error("Error fetching collaboration requests:", error);
        return { requests: [], hasMore: false };
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Transform the flat requests array into grouped format expected by RequestsManagementTab
  const requestGroups = React.useMemo(() => {
    if (!requestsData?.requests) {
      return [];
    }

    // Group requests by collaboration_id
    const groupsMap = new Map();
    
    requestsData.requests.forEach((request: any) => {
      const collabId = request.collaboration_id;
      
      if (!groupsMap.has(collabId)) {
        groupsMap.set(collabId, {
          collaboration: {
            id: collabId,
            title: request.collaboration_description || request.collaboration_type || 'Collaboration',
            type: request.collaboration_type,
            description: request.collaboration_description,
            topics: [],
            created_at: request.created_at || new Date().toISOString()
          },
          requests: []
        });
      }
      
      // Transform the flat request structure into the nested structure expected by RequestsManagementTab
      const transformedRequest = {
        id: request.request_id,
        requester: {
          id: request.requester_id,
          first_name: request.requester_first_name,
          last_name: request.requester_last_name,
          twitter_url: null,
          avatar_url: null
        },
        company: {
          name: request.company_name,
          twitter_handle: request.company_twitter_handle,
          job_title: request.requester_job_title,
          website: request.company_website,
          logo_url: request.company_logo_url,
          short_description: null,
          long_description: null,
          linkedin_url: null,
          funding_stage: null,
          has_token: false,
          token_ticker: null,
          blockchain_networks: [],
          twitter_followers: request.company_twitter_followers,
          tags: request.company_tags || []
        },
        note: request.note,
        created_at: request.created_at,
        collaboration: {
          id: collabId,
          title: request.collaboration_description || request.collaboration_type || 'Collaboration',
          type: request.collaboration_type,
          description: request.collaboration_description,
          topics: [],
          created_at: request.created_at || new Date().toISOString()
        }
      };
      
      groupsMap.get(collabId).requests.push(transformedRequest);
    });
    
    return Array.from(groupsMap.values());
  }, [requestsData?.requests]);





  if (isLoadingProfile) {
    return (
      <MobileCheck>
        <div className="min-h-[100svh] bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </MobileCheck>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileCheck>
        <div className="min-h-[100svh] bg-background">
          <PageHeader title="Requests" />
          <div className="container mx-auto py-8 px-4 text-center">
            <p className="text-muted-foreground">Please log in to view your collaboration requests.</p>
          </div>
        </div>
      </MobileCheck>
    );
  }

  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background">
        <PageHeader title="Requests" />
        
        <div className="container mx-auto py-4 px-4">

          <RequestsManagementTab
            requestGroups={requestGroups}
            isLoading={isLoadingRequests}
            filter={requestsFilter}
            onFilterChange={setRequestsFilter}
          />
        </div>
      </div>
    </MobileCheck>
  );
}