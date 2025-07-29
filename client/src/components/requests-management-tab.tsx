import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Clock, 
  Users, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCollabTypeIcon } from "@/lib/collaboration-utils";

interface CollaborationRequest {
  id: string;
  requester: {
    id: string;
    first_name: string;
    last_name?: string;
    twitter_url?: string;
    avatar_url?: string;
  };
  company: {
    name: string;
    twitter_handle?: string;
    job_title?: string;
    website?: string;
    logo_url?: string;
    short_description?: string;
    long_description?: string;
    linkedin_url?: string;
    funding_stage?: string;
    has_token?: boolean;
    token_ticker?: string;
    blockchain_networks?: string[];
    twitter_followers?: string;
    tags?: string[];
    created_at?: string;
    // Additional Twitter data fields
    twitter_data?: {
      username?: string;
      name?: string;
      bio?: string;
      followers_count?: number;
      following_count?: number;
      tweet_count?: number;
      profile_image_url?: string;
      banner_image_url?: string;
      is_verified?: boolean;
      is_business_account?: boolean;
      business_category?: string;
      location?: string;
      website_url?: string;
      twitter_created_at?: string;
      last_fetched_at?: string;
    };
  };
  note?: string;
  created_at: string;
  collaboration: {
    id: string;
    title: string;
    type: string;
    description?: string;
    topics?: string[];
    created_at: string;
  };
}

interface CollaborationGroup {
  collaboration: {
    id: string;
    title: string;
    type: string;
    description?: string;
    topics?: string[];
    created_at: string;
  };
  requests: CollaborationRequest[];
}

interface RequestsManagementTabProps {
  requestGroups: CollaborationGroup[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  filter: 'all' | 'hidden';
  onFilterChange: (filter: 'all' | 'hidden') => void;
}

export function RequestsManagementTab({ 
  requestGroups, 
  isLoading = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  filter,
  onFilterChange
}: RequestsManagementTabProps) {
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState<CollaborationRequest | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Flatten requestGroups into a single array of requests with collaboration info
  const flattenedRequests: CollaborationRequest[] = requestGroups.flatMap(group => 
    group.requests.map(request => ({
      ...request,
      collaboration: group.collaboration
    }))
  );

  // Using centralized collaboration types registry

  const getCollabTypeBadgeClass = (collabType: string) => {
    const typeLower = collabType.toLowerCase();
    
    if (typeLower.includes('twitter') || typeLower.includes('spaces')) {
      return "bg-blue-500/10 border-blue-500/20 text-blue-700";
    } else if (typeLower.includes('podcast')) {
      return "bg-purple-500/10 border-purple-500/20 text-purple-700";
    } else if (typeLower.includes('blog')) {
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700";
    } else if (typeLower.includes('livestream') || typeLower.includes('live stream')) {
      return "bg-red-500/10 border-red-500/20 text-red-700";
    } else if (typeLower.includes('newsletter')) {
      return "bg-indigo-500/10 border-indigo-500/20 text-indigo-700";
    } else if (typeLower.includes('research') || typeLower.includes('report')) {
      return "bg-amber-500/10 border-amber-500/20 text-amber-700";
    } else if (typeLower.includes('coffee')) {
      return "bg-orange-500/10 border-orange-500/20 text-orange-700";
    }
    
    return "bg-gray-500/10 border-gray-500/20 text-gray-700";
  };

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => 
      apiRequest(`/api/collaboration-requests/${requestId}/accept`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Request Accepted",
        description: "The collaboration request has been accepted and a match has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      // Invalidate all request-related queries to update badges
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests', 'hidden'] });
      
      // Close details modal if open
      setSelectedRequestForDetails(null);
      
      // Redirect to messages tab after a brief delay
      setTimeout(() => {
        window.location.href = '/my-matches';
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request",
        variant: "destructive",
      });
    },
  });

  const hideRequestMutation = useMutation({
    mutationFn: (requestId: string) => 
      apiRequest(`/api/collaboration-requests/${requestId}/hide`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Request Hidden",
        description: "The collaboration request has been hidden.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests/summary'] });
      // Invalidate all request-related queries to update badges
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collaboration-requests', 'hidden'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to hide request",
        variant: "destructive",
      });
    },
  });

  const handleAcceptRequest = (requestId: string) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleHideRequest = (requestId: string) => {
    hideRequestMutation.mutate(requestId);
  };

  const handleShowDetails = (request: CollaborationRequest) => {
    setSelectedRequestForDetails(request);
  };

  if (isLoading && requestGroups.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Header - Always visible */}
      <div className="flex items-center justify-center">
        <Tabs value={filter} onValueChange={(value) => onFilterChange(value as any)} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="hidden" className="flex-1">Hidden</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area */}
      {flattenedRequests.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Collaboration Requests
          </h3>
          <p className="text-sm text-muted-foreground">
            {filter === 'hidden' 
              ? "No hidden collaboration requests found."
              : "When people apply to your collaborations, they'll appear here."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
        {flattenedRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Header section with logo, name and timestamp */}
                <div className="flex items-start space-x-4">
                  <LogoAvatar
                    name={request.company.name || "Company"}
                    logoUrl={request.company.logo_url}
                    size="lg"
                    className="h-12 w-12 flex-shrink-0"
                  />
                  <div className="flex-1 flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {request.requester.twitter_url ? (
                          <a 
                            href={request.requester.twitter_url}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {request.requester.first_name} {request.requester.last_name || ''}
                          </a>
                        ) : (
                          <span>{request.requester.first_name} {request.requester.last_name || ''}</span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {request.company.job_title} at {request.company.twitter_handle ? (
                          <a 
                            href={`https://twitter.com/${request.company.twitter_handle}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {request.company.name}
                          </a>
                        ) : (
                          request.company.name
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Full width content below header */}
                <div className="space-y-4">
                  {/* Main content - requester's note */}
                  {request.note && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-medium">{request.note}</p>
                    </div>
                  )}
                  
                  {/* Collaboration type pill */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getCollabTypeBadgeClass(request.collaboration.type)}
                    >
                      {getCollabTypeIcon(request.collaboration.type)}
                      <span className="ml-1">{request.collaboration.type}</span>
                    </Badge>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="space-y-2">
                    {/* Hide and Accept on same line */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHideRequest(request.id)}
                        disabled={hideRequestMutation.isPending}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Hide
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={acceptRequestMutation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                    
                    {/* Details on its own line */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowDetails(request)}
                      className="w-full"
                    >
                      <User className="h-4 w-4 mr-1" />
                      More Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More Requests"}
          </Button>
        </div>
      )}

      {/* Details Dialog */}
      {selectedRequestForDetails && (
        <Dialog open={!!selectedRequestForDetails} onOpenChange={() => setSelectedRequestForDetails(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="sr-only">
                {selectedRequestForDetails.collaboration.type} Request Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Header Section with Request Summary */}
              <div className="pb-4 border-b">
                <div className="flex items-start gap-3 mb-2">
                  {/* Company Logo */}
                  <LogoAvatar
                    name={selectedRequestForDetails.company.name || "Company"}
                    logoUrl={selectedRequestForDetails.company.logo_url}
                    className="w-16 h-16"
                    size="xl"
                  />
                  
                  {/* Company info and collaboration details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-xl font-bold">{selectedRequestForDetails.company.name}</h2>
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {selectedRequestForDetails.requester.first_name} {selectedRequestForDetails.requester.last_name || ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRequestForDetails.company.job_title}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className="text-primary bg-primary/5 border-primary/10 mb-1 whitespace-nowrap">
                          {selectedRequestForDetails.collaboration.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Requested {formatDistanceToNow(new Date(selectedRequestForDetails.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized Note - If Present */}
              {selectedRequestForDetails.note && (
                <div className="mb-4 bg-primary/5 p-3 rounded-md border border-primary/10">
                  <h3 className="font-medium text-sm text-primary mb-1">
                    Personalized Note
                  </h3>
                  <p className="text-sm italic">{selectedRequestForDetails.note}</p>
                </div>
              )}

              <div className="grid gap-6">
                {/* About Person Section */}
                <div className="p-4 bg-muted/10 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-base mb-2">About {selectedRequestForDetails.requester.first_name} {selectedRequestForDetails.requester.last_name || ''}</h3>
                  <div className="space-y-2">
                    <p className="text-sm">{selectedRequestForDetails.company.short_description || selectedRequestForDetails.company.long_description || "No description available"}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRequestForDetails.company.job_title} at {selectedRequestForDetails.company.name}
                    </p>

                    {/* User Social Links */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRequestForDetails.company.twitter_handle && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`https://x.com/${selectedRequestForDetails.company.twitter_handle}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Twitter className="h-3 w-3" />
                            @{selectedRequestForDetails.company.twitter_handle}
                          </a>
                        </Button>
                      )}

                      {selectedRequestForDetails.company.linkedin_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={selectedRequestForDetails.company.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                            </svg>
                            LinkedIn
                          </a>
                        </Button>
                      )}

                      {selectedRequestForDetails.requester.twitter_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={selectedRequestForDetails.requester.twitter_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Twitter className="h-3 w-3" />
                            Personal Twitter
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* User Analytics */}
                    <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                      {selectedRequestForDetails.company.twitter_followers && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Twitter:</span>
                          <span className="font-medium">{selectedRequestForDetails.company.twitter_followers}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Section */}
                <div className="p-4 bg-muted/10 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-base mb-2">About {selectedRequestForDetails.company.name}</h3>
                  <div className="space-y-3">
                    {selectedRequestForDetails.company.short_description && (
                      <p className="text-sm">{selectedRequestForDetails.company.short_description}</p>
                    )}
                    
                    {selectedRequestForDetails.company.long_description && selectedRequestForDetails.company.long_description !== selectedRequestForDetails.company.short_description && (
                      <p className="text-sm">{selectedRequestForDetails.company.long_description}</p>
                    )}

                    {/* Company Analytics */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {selectedRequestForDetails.company.twitter_followers && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Twitter:</span>
                          <span className="font-medium">{selectedRequestForDetails.company.twitter_followers}</span>
                        </div>
                      )}
                      {selectedRequestForDetails.company.funding_stage && (
                        <div className="flex items-center gap-1">
                          <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                          <span className="text-muted-foreground">Stage:</span>
                          <span className="font-medium">{selectedRequestForDetails.company.funding_stage}</span>
                        </div>
                      )}
                    </div>

                    {/* Company Social Links */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRequestForDetails.company.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={selectedRequestForDetails.company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Website
                          </a>
                        </Button>
                      )}

                      {selectedRequestForDetails.company.twitter_handle && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`https://x.com/${selectedRequestForDetails.company.twitter_handle}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Twitter className="h-3 w-3" />
                            @{selectedRequestForDetails.company.twitter_handle}
                          </a>
                        </Button>
                      )}

                      {selectedRequestForDetails.company.linkedin_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={selectedRequestForDetails.company.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                            </svg>
                            LinkedIn
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Token Information */}
                    {selectedRequestForDetails.company.has_token && (
                      <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                          <span className="text-sm font-medium">Token Information</span>
                        </div>
                        {selectedRequestForDetails.company.token_ticker && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ticker: {selectedRequestForDetails.company.token_ticker}
                          </p>
                        )}
                        {selectedRequestForDetails.company.blockchain_networks && selectedRequestForDetails.company.blockchain_networks.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedRequestForDetails.company.blockchain_networks.map((network, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {network}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Company Tags */}
                    {selectedRequestForDetails.company.tags && selectedRequestForDetails.company.tags.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRequestForDetails.company.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collaboration Details */}
                <div className="p-4 bg-muted/10 rounded-lg border border-border/50">
                  <h3 className="font-semibold text-base mb-3 pb-2 border-b">
                    {selectedRequestForDetails.collaboration.type} Details
                  </h3>
                  {selectedRequestForDetails.collaboration.description && (
                    <div className="bg-muted/30 p-3 rounded-md mb-3">
                      <p className="text-sm">{selectedRequestForDetails.collaboration.description}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getCollabTypeIcon(selectedRequestForDetails.collaboration.type)}
                      <span className="font-medium">{selectedRequestForDetails.collaboration.type}</span>
                    </div>
                    
                    {selectedRequestForDetails.collaboration.topics && selectedRequestForDetails.collaboration.topics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Topics</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRequestForDetails.collaboration.topics.map((topic, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(selectedRequestForDetails.collaboration.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleHideRequest(selectedRequestForDetails.id)}
                  disabled={hideRequestMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Hide
                </Button>
                <Button
                  onClick={() => handleAcceptRequest(selectedRequestForDetails.id)}
                  disabled={acceptRequestMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}