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
  User,
  Mic,
  Video,
  Mail,
  PenTool,
  Coffee,
  MessageSquare,
  ListChecks
} from "lucide-react";
import { FaTwitter as Twitter } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
}

export function RequestsManagementTab({ 
  requestGroups, 
  isLoading = false,
  onLoadMore,
  hasMore = false
}: RequestsManagementTabProps) {
  const [filter, setFilter] = useState<'all' | 'this_week'>('all');
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

  const getCollabTypeIcon = (collabType: string) => {
    switch(collabType) {
      case 'Podcast Guest Appearance':
      case 'Podcast':
        return <Mic className="h-4 w-4" />;
      case 'Twitter Spaces Guest':
      case 'Twitter Space':
        return <Twitter className="h-4 w-4" />;
      case 'Twitter Co-Marketing':
      case 'Co-Marketing on Twitter':
        return <Twitter className="h-4 w-4" />;
      case 'Live Stream Guest Appearance':
      case 'Live Stream':
      case 'Webinar':
        return <Video className="h-4 w-4" />;
      case 'Report & Research Feature':
      case 'Research Report':
        return <ListChecks className="h-4 w-4" />;
      case 'Newsletter Feature':
      case 'Newsletter':
        return <Mail className="h-4 w-4" />;
      case 'Blog Post Feature':
      case 'Blog Post':
        return <PenTool className="h-4 w-4" />;
      case 'Conference Coffee':
        return <Coffee className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
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

  if (flattenedRequests.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No Collaboration Requests
        </h3>
        <p className="text-sm text-muted-foreground">
          When people apply to your collaborations, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Collaboration Requests</h2>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="this_week">This Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Individual Request Cards */}
      <div className="space-y-4">
        {flattenedRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3">
                {getCollabTypeIcon(request.collaboration.type)}
                <div className="flex-1">
                  <CardTitle className="text-base">{request.collaboration.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {request.collaboration.description}
                  </p>

                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <LogoAvatar
                  name={request.company.name || "Company"}
                  logoUrl={request.company.logo_url}
                  size="lg"
                  className="h-12 w-12"
                />
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-medium">
                      {request.requester.first_name} {request.requester.last_name || ''}
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
                  
                  {request.note && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{request.note}</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowDetails(request)}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleHideRequest(request.id)}
                        disabled={hideRequestMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Hide
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={acceptRequestMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More Requests"}
          </Button>
        </div>
      )}

      {/* Details Dialog */}
      {selectedRequestForDetails && (
        <Dialog open={!!selectedRequestForDetails} onOpenChange={() => setSelectedRequestForDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <LogoAvatar
                  name={selectedRequestForDetails.company.name || "Company"}
                  logoUrl={selectedRequestForDetails.company.logo_url}
                  size="md"
                  className="h-10 w-10"
                />
                <div>
                  <h3 className="text-xl font-semibold">{selectedRequestForDetails.requester.first_name} {selectedRequestForDetails.requester.last_name || ''}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRequestForDetails.company.job_title} at {selectedRequestForDetails.company.name}</p>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Company Information */}
              <div>
                <h4 className="font-medium mb-3">Company Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                    <p className="text-sm">{selectedRequestForDetails.company.name}</p>
                  </div>
                  {selectedRequestForDetails.company.funding_stage && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Funding Stage</p>
                      <p className="text-sm">{selectedRequestForDetails.company.funding_stage}</p>
                    </div>
                  )}
                  {selectedRequestForDetails.company.twitter_followers && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Twitter Followers</p>
                      <p className="text-sm">{selectedRequestForDetails.company.twitter_followers}</p>
                    </div>
                  )}
                  {selectedRequestForDetails.company.has_token && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Token</p>
                      <p className="text-sm">{selectedRequestForDetails.company.token_ticker || 'Yes'}</p>
                    </div>
                  )}
                  {selectedRequestForDetails.company.created_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Company Joined</p>
                      <p className="text-sm">{formatDistanceToNow(new Date(selectedRequestForDetails.company.created_at), { addSuffix: true })}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Twitter Data */}
              {selectedRequestForDetails.company.twitter_data && (
                <div>
                  <h4 className="font-medium mb-3">Twitter Analytics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRequestForDetails.company.twitter_data.followers_count && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Followers</p>
                        <p className="text-sm">{selectedRequestForDetails.company.twitter_data.followers_count.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.twitter_data.following_count && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Following</p>
                        <p className="text-sm">{selectedRequestForDetails.company.twitter_data.following_count.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.twitter_data.tweet_count && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tweets</p>
                        <p className="text-sm">{selectedRequestForDetails.company.twitter_data.tweet_count.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.twitter_data.is_verified && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Verified</p>
                        <p className="text-sm">✓ Verified Account</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.twitter_data.is_business_account && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                        <p className="text-sm">Business Account</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.twitter_data.business_category && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Business Category</p>
                        <p className="text-sm">{selectedRequestForDetails.company.twitter_data.business_category}</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.twitter_data.location && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="text-sm">{selectedRequestForDetails.company.twitter_data.location}</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.twitter_data.twitter_created_at && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Twitter Since</p>
                        <p className="text-sm">{new Date(selectedRequestForDetails.company.twitter_data.twitter_created_at).getFullYear()}</p>
                      </div>
                    )}
                  </div>
                  {selectedRequestForDetails.company.twitter_data.bio && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">Twitter Bio</p>
                      <p className="text-sm mt-1">{selectedRequestForDetails.company.twitter_data.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Requester Information */}
              <div>
                <h4 className="font-medium mb-3">Requester Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">{selectedRequestForDetails.requester.first_name} {selectedRequestForDetails.requester.last_name || ''}</p>
                  </div>
                  {selectedRequestForDetails.company.job_title && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Position</p>
                      <p className="text-sm">{selectedRequestForDetails.company.job_title}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Request Date</p>
                    <p className="text-sm">{formatDistanceToNow(new Date(selectedRequestForDetails.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>

              {/* Company Description */}
              {(selectedRequestForDetails.company.short_description || selectedRequestForDetails.company.long_description) && (
                <div>
                  <h4 className="font-medium mb-3">Company Description</h4>
                  <div className="space-y-2">
                    {selectedRequestForDetails.company.short_description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Short Description</p>
                        <p className="text-sm">{selectedRequestForDetails.company.short_description}</p>
                      </div>
                    )}
                    {selectedRequestForDetails.company.long_description && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-muted-foreground">Detailed Description</p>
                        <p className="text-sm">{selectedRequestForDetails.company.long_description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedRequestForDetails.company.tags && selectedRequestForDetails.company.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequestForDetails.company.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Blockchain Networks */}
              {selectedRequestForDetails.company.blockchain_networks && selectedRequestForDetails.company.blockchain_networks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Blockchain Networks</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequestForDetails.company.blockchain_networks.map((network) => (
                      <Badge key={network} variant="outline">
                        {network}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}



              {/* Links & Social */}
              <div>
                <h4 className="font-medium mb-3">Links & Social</h4>
                <div className="space-y-2">
                  {selectedRequestForDetails.company.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={selectedRequestForDetails.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedRequestForDetails.company.name} Website
                      </a>
                    </div>
                  )}
                  {selectedRequestForDetails.company.twitter_handle && (
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`https://twitter.com/${selectedRequestForDetails.company.twitter_handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        @{selectedRequestForDetails.company.twitter_handle}
                      </a>
                    </div>
                  )}
                  {selectedRequestForDetails.company.linkedin_url && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={selectedRequestForDetails.company.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedRequestForDetails.company.name} LinkedIn
                      </a>
                    </div>
                  )}
                  {selectedRequestForDetails.requester.twitter_url && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={selectedRequestForDetails.requester.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedRequestForDetails.requester.first_name}'s Twitter
                      </a>
                    </div>
                  )}
                  {selectedRequestForDetails.company.twitter_data?.website_url && selectedRequestForDetails.company.twitter_data.website_url !== selectedRequestForDetails.company.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={selectedRequestForDetails.company.twitter_data.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Alternative Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Note */}
              {selectedRequestForDetails.note && (
                <div>
                  <h4 className="font-medium mb-3">Request Message</h4>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{selectedRequestForDetails.note}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
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