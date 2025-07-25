import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { MobileCheck } from "@/components/MobileCheck";
import { RequestsManagementTab } from "@/components/requests-management-tab";
import { useToast } from "@/hooks/use-toast";

export default function RequestsPage() {
  const [requestsFilter, setRequestsFilter] = useState<"all" | "hidden">("all");
  const [allRequestsData, setAllRequestsData] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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

  // Fetch initial collaboration requests for the management tab
  const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['/api/collaboration-requests', requestsFilter],
    queryFn: async () => {
      try {
        const data = await apiRequest(`/api/collaboration-requests?filter=${requestsFilter}&limit=20`);
        return data;
      } catch (error) {
        console.error("Error fetching collaboration requests:", error);
        return { requests: [], hasMore: false, nextCursor: undefined };
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Load more requests function
  const loadMoreRequests = async () => {
    if (!nextCursor || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const moreData = await apiRequest(`/api/collaboration-requests?filter=${requestsFilter}&limit=20&cursor=${nextCursor}`);
      
      if (moreData && moreData.requests) {
        setAllRequestsData(prev => [...prev, ...moreData.requests]);
        setHasMore(moreData.hasMore || false);
        setNextCursor(moreData.nextCursor);
      }
    } catch (error) {
      console.error("Error loading more requests:", error);
      toast({
        title: "Error",
        description: "Failed to load more requests",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Update state when data changes
  React.useEffect(() => {
    if (requestsData) {
      setAllRequestsData(requestsData.requests || []);
      setHasMore(requestsData.hasMore || false);
      setNextCursor(requestsData.nextCursor);
    }
  }, [requestsData]);

  // Transform the flat requests array into grouped format expected by RequestsManagementTab
  const requestGroups = React.useMemo(() => {
    if (!allRequestsData || allRequestsData.length === 0) {
      return [];
    }

    // Group requests by collaboration_id
    const groupsMap = new Map();
    
    allRequestsData.forEach((request: any) => {
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
  }, [allRequestsData]);





  if (isLoadingProfile) {
    return (
      <MobileCheck>
        <div className="flex flex-col h-[100svh]">
          <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-semibold">Requests</h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </MobileCheck>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileCheck>
        <div className="flex flex-col h-[100svh]">
          <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-semibold">Requests</h1>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Please log in to view your collaboration requests.</p>
          </div>
        </div>
      </MobileCheck>
    );
  }

  return (
    <MobileCheck>
      <div className="flex flex-col h-[100svh]">
        {/* Header - matching discover page style */}
        <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-semibold">Requests</h1>
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-4 px-4">
            <RequestsManagementTab
              requestGroups={requestGroups}
              isLoading={isLoadingRequests}
              filter={requestsFilter}
              onFilterChange={setRequestsFilter}
              onLoadMore={loadMoreRequests}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
            />
          </div>
        </div>
      </div>
    </MobileCheck>
  );
}