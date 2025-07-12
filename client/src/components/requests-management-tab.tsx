import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    logo_url?: string; // FIX: Add missing logo_url field
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

  const handleViewProfile = (requester: CollaborationRequest['requester']) => {
    if (requester.twitter_url) {
      window.open(requester.twitter_url, '_blank');
    }
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
                  {request.collaboration.topics && request.collaboration.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {request.collaboration.topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
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
                      {request.company.job_title} at {request.company.name}
                    </p>
                  </div>
                  
                  {request.note && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{request.note}</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {request.company.website && (
                        <a 
                          href={request.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Website</span>
                        </a>
                      )}
                      {request.company.twitter_handle && (
                        <span className="flex items-center space-x-1">
                          <Twitter className="h-3 w-3" />
                          <span>@{request.company.twitter_handle}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProfile(request.requester)}
                        disabled={!request.requester.twitter_url}
                      >
                        <User className="h-4 w-4 mr-1" />
                        View Profile
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
    </div>
  );
}