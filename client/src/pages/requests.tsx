import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Clock, Users, CheckCircle, XCircle, Eye, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { MobileCheck } from "@/components/MobileCheck";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { RequestsManagementTab } from "@/components/requests-management-tab";
// Transform requests from API to the grouped format expected by RequestsManagementTab
function transformRequestsToGroups(requests: any[]): any[] {
  const groups: { [key: string]: any } = {};
  
  requests.forEach(request => {
    const collabId = request.collaboration_id;
    
    if (!groups[collabId]) {
      groups[collabId] = {
        collaboration: {
          id: collabId,
          title: request.collaboration_type, // Use type as title to avoid duplication
          type: request.collaboration_type,
          description: request.collaboration_description,
          topics: [], // Topics not provided in this API response
          created_at: request.created_at
        },
        requests: []
      };
    }
    
    groups[collabId].requests.push({
      id: request.request_id,
      requester: {
        id: request.requester_id,
        first_name: request.requester_first_name,
        last_name: request.requester_last_name,
        twitter_url: request.requester_twitter_url,
        avatar_url: null
      },
      company: {
        name: request.company_name,
        twitter_handle: request.company_twitter_handle,
        job_title: request.requester_job_title,
        website: request.company_website,
        logo_url: request.company_logo_url,
        short_description: request.company_short_description,
        long_description: request.company_long_description,
        linkedin_url: request.company_linkedin_url,
        funding_stage: request.company_funding_stage,
        has_token: request.company_has_token,
        token_ticker: request.company_token_ticker,
        blockchain_networks: request.company_blockchain_networks,
        twitter_followers: request.company_twitter_followers,
        tags: request.company_tags,
        created_at: request.created_at
      },
      note: request.note,
      created_at: request.created_at,
      collaboration: {
        id: collabId,
        title: request.collaboration_type, // Use type as title to avoid duplication
        type: request.collaboration_type,
        description: request.collaboration_description,
        topics: [],
        created_at: request.created_at
      }
    });
  });
  
  return Object.values(groups);
}
import { format } from "date-fns";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState("all");
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

  // Transform the flat requests array into grouped format expected by the component
  const requestGroups = requestsData?.requests ? transformRequestsToGroups(requestsData.requests) : [];

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "management") {
      // When switching to management tab, ensure we refetch the latest data
      refetchRequests();
    }
  };

  // Handle request action
  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await apiRequest('/api/collaboration-requests/respond', 'POST', {
        requestId,
        action
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests/summary'] });
      
      toast({
        title: action === 'accept' ? "Request Accepted" : "Request Declined",
        description: `The collaboration request has been ${action}ed.`,
      });

      refetchRequests();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} request. Please try again.`,
        variant: "destructive",
      });
    }
  };

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
          {/* Summary Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requestsSummary && requestsSummary.recentRequests && requestsSummary.recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {requestsSummary.recentRequests.slice(0, 4).map((request: any) => (
                    <div key={request.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={request.requester.avatar_url} />
                        <AvatarFallback>
                          {request.requester.first_name?.[0]}{request.requester.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {request.requester.first_name} {request.requester.last_name}
                          </p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {request.collaboration_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.company.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(request.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      {requestsSummary.totalPendingCount} total pending requests
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setActiveTab("management");
                        setRequestsFilter("all");
                      }}
                      className="gap-2"
                    >
                      View All <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No recent collaboration requests</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Overview</TabsTrigger>
              <TabsTrigger value="management">
                Manage Requests
                {requestsSummary && requestsSummary.totalPendingCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-primary text-primary-foreground flex items-center justify-center">
                    {requestsSummary.totalPendingCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Request Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {requestsSummary?.totalPendingCount || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {requestsSummary?.recentRequests?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Recent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setActiveTab("management");
                        setRequestsFilter("all");
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Review All Requests
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        setActiveTab("management");
                        setRequestsFilter("hidden");
                      }}
                    >
                      <Clock className="w-4 h-4" />
                      View Hidden Requests
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="management" className="mt-6">
              <RequestsManagementTab
                requestGroups={requestGroups}
                isLoading={isLoadingRequests}
                filter={requestsFilter}
                onFilterChange={setRequestsFilter}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileCheck>
  );
}