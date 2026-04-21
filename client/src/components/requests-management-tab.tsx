import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow } from "@/components/brand";
import {
  Clock,
  Users,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Twitter } from "lucide-react";
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
  isLoadingMore?: boolean;
  filter: 'received' | 'hidden' | 'sent';
  onFilterChange: (filter: 'received' | 'hidden' | 'sent') => void;
  sentRequestsCount?: number;
  receivedRequestsCount?: number;
  hiddenRequestsCount?: number;
}

export function RequestsManagementTab({ 
  requestGroups, 
  isLoading = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  filter,
  onFilterChange,
  sentRequestsCount = 0,
  receivedRequestsCount = 0,
  hiddenRequestsCount = 0
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
      <div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-hairline py-5"
          >
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-full max-w-[260px]" />
            </div>
          </div>
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
            <TabsTrigger value="received" className="flex-1">Received ({receivedRequestsCount})</TabsTrigger>
            <TabsTrigger value="hidden" className="flex-1">Hidden ({hiddenRequestsCount})</TabsTrigger>
            <TabsTrigger value="sent" className="flex-1">Sent ({sentRequestsCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content Area */}
      {flattenedRequests.length === 0 ? (
        <div className="py-12">
          <h3 className="text-lg font-semibold tracking-tight text-text">
            {filter === 'hidden'
              ? "Nothing hidden."
              : filter === 'sent'
              ? "You haven't requested anything yet."
              : "No requests yet."}
          </h3>
          <p className="mt-1 max-w-[42ch] text-sm text-text-muted">
            {filter === 'hidden'
              ? "Requests you hide will collect here."
              : filter === 'sent'
              ? "Browse the discover feed to find collabs worth chasing."
              : "When someone applies to your collabs, they'll show up here."}
          </p>
        </div>
      ) : (
        <div>
        {flattenedRequests.map((request) => {
          const isInteractive = filter !== 'sent';
          return (
          <article
            key={request.id}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            className={`border-b border-hairline py-5 transition-colors duration-fast ease-out ${isInteractive ? 'cursor-pointer active:bg-surface' : ''}`}
            onClick={isInteractive ? () => handleShowDetails(request) : undefined}
            onKeyDown={isInteractive ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleShowDetails(request);
              }
            } : undefined}
          >
            <div className="flex items-start gap-3">
              <LogoAvatar
                name={request.company.name || "Company"}
                logoUrl={request.company.logo_url}
                size="lg"
                className="h-12 w-12 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Eyebrow tone="brand">
                    {request.collaboration.type}
                  </Eyebrow>
                </div>
                <h3 className="mt-1.5 truncate text-md font-semibold text-text">
                  {request.company.twitter_handle ? (
                    <a
                      href={`https://twitter.com/${request.company.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {request.company.name}
                    </a>
                  ) : (
                    request.company.name
                  )}
                </h3>

                <div className="mt-2 flex items-center gap-2 text-xs tabular text-text-subtle">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </span>
                </div>

                {request.note && request.note.trim() !== '' && (
                  <p className="mt-3 line-clamp-3 border-l-2 border-hairline pl-3 text-sm leading-snug text-text-muted">
                    {request.note}
                  </p>
                )}

                <div className="mt-3">
                  {filter === 'sent' ? (
                    <Eyebrow tone="warm" dot>
                      Pending
                    </Eyebrow>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHideRequest(request.id);
                        }}
                        disabled={hideRequestMutation.isPending}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Hide
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptRequest(request.id);
                        }}
                        disabled={acceptRequestMutation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        );})}
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

      {/* Details sheet */}
      {selectedRequestForDetails && (
        <BottomSheet
          open={!!selectedRequestForDetails}
          onOpenChange={(open) => !open && setSelectedRequestForDetails(null)}
          size="tall"
          eyebrow={selectedRequestForDetails.collaboration.type.toUpperCase()}
          title={selectedRequestForDetails.company.name}
          subtitle={`${selectedRequestForDetails.requester.first_name} ${selectedRequestForDetails.requester.last_name || ""}${
            selectedRequestForDetails.company.job_title
              ? ` · ${selectedRequestForDetails.company.job_title}`
              : ""
          }`}
          footer={
            <BottomSheet.ActionBar>
              <Button
                variant="outline"
                onClick={() => handleHideRequest(selectedRequestForDetails.id)}
                disabled={hideRequestMutation.isPending}
              >
                <XCircle className="h-4 w-4" />
                Hide
              </Button>
              <Button
                onClick={() => handleAcceptRequest(selectedRequestForDetails.id)}
                disabled={acceptRequestMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </Button>
            </BottomSheet.ActionBar>
          }
        >
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
            <LogoAvatar
              name={selectedRequestForDetails.company.name || "Company"}
              logoUrl={selectedRequestForDetails.company.logo_url}
              className="h-12 w-12 shrink-0"
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold leading-tight text-text">
                {selectedRequestForDetails.company.name}
              </p>
              <p className="mt-0.5 text-xs tabular text-text-subtle">
                Requested{" "}
                {formatDistanceToNow(
                  new Date(selectedRequestForDetails.created_at),
                  { addSuffix: true },
                )}
              </p>
            </div>
          </div>

          {selectedRequestForDetails.note && (
            <BottomSheet.Section eyebrow="Personalized note">
              <blockquote className="border-l-2 border-brand pl-3 text-[0.9375rem] italic text-text">
                {selectedRequestForDetails.note}
              </blockquote>
            </BottomSheet.Section>
          )}

          {(selectedRequestForDetails.company.short_description ||
            selectedRequestForDetails.company.long_description) && (
            <BottomSheet.Section eyebrow={`About ${selectedRequestForDetails.company.name}`}>
              <p className="text-[0.9375rem] leading-relaxed text-text">
                {selectedRequestForDetails.company.short_description ||
                  selectedRequestForDetails.company.long_description}
              </p>
            </BottomSheet.Section>
          )}

          {(selectedRequestForDetails.company.twitter_handle ||
            selectedRequestForDetails.company.website ||
            selectedRequestForDetails.company.linkedin_url ||
            selectedRequestForDetails.requester.twitter_url) && (
            <BottomSheet.Section eyebrow="Links">
              <div className="flex flex-wrap gap-2">
                {selectedRequestForDetails.company.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedRequestForDetails.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
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
                    >
                      <Twitter className="h-3 w-3" />@
                      {selectedRequestForDetails.company.twitter_handle}
                    </a>
                  </Button>
                )}
                {selectedRequestForDetails.company.linkedin_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedRequestForDetails.company.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
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
                    >
                      <Twitter className="h-3 w-3" />
                      Personal
                    </a>
                  </Button>
                )}
              </div>
            </BottomSheet.Section>
          )}

          {(selectedRequestForDetails.company.twitter_followers ||
            selectedRequestForDetails.company.funding_stage) && (
            <BottomSheet.Section eyebrow="Signals">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.9375rem]">
                {selectedRequestForDetails.company.twitter_followers && (
                  <>
                    <dt className="text-sm text-text-muted">Twitter</dt>
                    <dd className="tabular text-text">
                      {selectedRequestForDetails.company.twitter_followers}
                    </dd>
                  </>
                )}
                {selectedRequestForDetails.company.funding_stage && (
                  <>
                    <dt className="text-sm text-text-muted">Stage</dt>
                    <dd className="text-text">
                      {selectedRequestForDetails.company.funding_stage}
                    </dd>
                  </>
                )}
              </dl>
            </BottomSheet.Section>
          )}

          {selectedRequestForDetails.company.has_token && (
            <BottomSheet.Section eyebrow="Token">
              {selectedRequestForDetails.company.token_ticker && (
                <p className="font-mono text-base tabular text-text">
                  ${selectedRequestForDetails.company.token_ticker}
                </p>
              )}
              {selectedRequestForDetails.company.blockchain_networks &&
                selectedRequestForDetails.company.blockchain_networks.length >
                  0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedRequestForDetails.company.blockchain_networks.map(
                      (network, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="px-2 py-0.5 text-xs"
                        >
                          {network}
                        </Badge>
                      ),
                    )}
                  </div>
                )}
            </BottomSheet.Section>
          )}

          {selectedRequestForDetails.company.tags &&
            selectedRequestForDetails.company.tags.length > 0 && (
              <BottomSheet.Section eyebrow="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {selectedRequestForDetails.company.tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </BottomSheet.Section>
            )}

          {selectedRequestForDetails.collaboration.description && (
            <BottomSheet.Section eyebrow="Collab">
              <p className="text-[0.9375rem] leading-relaxed text-text">
                {selectedRequestForDetails.collaboration.description}
              </p>
              {selectedRequestForDetails.collaboration.topics &&
                selectedRequestForDetails.collaboration.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedRequestForDetails.collaboration.topics.map(
                      (topic, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="px-2 py-0.5 text-xs"
                        >
                          {topic}
                        </Badge>
                      ),
                    )}
                  </div>
                )}
              <p className="mt-3 text-xs tabular text-text-subtle">
                Created{" "}
                {formatDistanceToNow(
                  new Date(selectedRequestForDetails.collaboration.created_at),
                  { addSuffix: true },
                )}
              </p>
            </BottomSheet.Section>
          )}
        </BottomSheet>
      )}
    </div>
  );
}