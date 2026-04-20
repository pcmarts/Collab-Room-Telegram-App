import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollaborationListItem } from "../components/CollaborationListItem";
import { CollaborationDetailsDialog } from "../components/CollaborationDetailsDialog";
import { SignupToCollaborateDialog } from "../components/SignupToCollaborateDialog";
import { MatchMoment } from "../components/MatchMoment";
import AddNoteDialog from "../components/AddNoteDialog";
import { SortByButton, type SortOption } from "../components/SortByButton";
import { AddCollabBanner } from "../components/AddCollabBanner";
import { PendingApplicationCard } from "../components/PendingApplicationCard";
import { CollaborationListSkeleton } from "../components/CollaborationListItemSkeleton";
import {
  CollaborationTypeFilters,
  FILTER_OPTIONS,
} from "../components/CollaborationTypeFilters";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useMatchContext } from "@/contexts/MatchContext";
import { useToast } from "@/hooks/use-toast";

interface CardData {
  id: string;
  title?: string;
  type?: string;
  collab_type?: string;
  creator_company_name?: string;
  company_logo_url?: string;
  short_description?: string;
  description?: string;
  topics?: string[];
  creator_id?: string;
  details?: any;
  date_type?: string;
  specific_date?: string;
  companyName?: string;
  isPotentialMatch?: boolean;
  potentialMatchData?: {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    job_title?: string;
    note?: string;
  };
  company_data?: {
    name?: string;
    short_description?: string;
    long_description?: string;
    twitter_handle?: string;
    twitter_followers?: string;
    website?: string;
    linkedin_url?: string;
    funding_stage?: string;
    has_token?: boolean;
    token_ticker?: string;
    blockchain_networks?: string[];
    job_title?: string;
    tags?: string[];
    logo_url?: string;
  };
}

interface PotentialMatch {
  id: string;
  collaboration_id: string;
  user_id: string;
  created_at: string;
  collaboration: CardData;
}

export default function DiscoverPageList() {
  const [selectedCardDetails, setSelectedCardDetails] = useState<CardData | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<{
    title: string;
    companyName: string;
    collaborationType: string;
    userName?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const [collaborations, setCollaborations] = useState<CardData[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const [requestedCollaborations, setRequestedCollaborations] = useState<Set<string>>(new Set());
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedCollaboration, setSelectedCollaboration] = useState<CardData | null>(null);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [signupCollaboration, setSignupCollaboration] = useState<CardData | null>(null);

  const initialLoadCompletedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { setNewMatchCreated } = useMatchContext();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const checkAuthenticationStatus = useCallback(async () => {
    try {
      await apiRequest("/api/profile");
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuthenticationStatus();
  }, [checkAuthenticationStatus]);

  const { data: marketingPrefs } = useQuery({
    queryKey: ["/api/marketing-preferences"],
    queryFn: async () => {
      try {
        return await apiRequest("/api/marketing-preferences");
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: () => apiRequest("/api/profile"),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: collaborationInteractions } = useQuery({
    queryKey: ["/api/collaborations/interactions"],
    queryFn: () => apiRequest("/api/collaborations/interactions"),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: userRequestHistory } = useQuery({
    queryKey: ["/api/user-requests"],
    queryFn: () => apiRequest("/api/user-requests"),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const hasActiveFilters =
    marketingPrefs &&
    ((marketingPrefs.collaboration_types?.length ?? 0) > 0 ||
      (marketingPrefs.company_tags?.length ?? 0) > 0 ||
      (marketingPrefs.funding_stages?.length ?? 0) > 0 ||
      (marketingPrefs.blockchain_networks?.length ?? 0) > 0 ||
      marketingPrefs.min_company_followers ||
      marketingPrefs.min_user_followers ||
      marketingPrefs.has_token);

  const isAuthenticatedButNotApproved =
    isAuthenticated && userProfile && !userProfile.user.is_approved;

  const fetchCollaborations = async (
    cursor?: string,
    customSortBy?: SortOption,
    customFilter?: string
  ) => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      return { items: [], hasMore: false, nextCursor: undefined };
    }
    lastFetchTimeRef.current = now;

    const params = new URLSearchParams({
      limit: "20",
      sortBy: customSortBy || sortBy,
    });
    if (cursor && cursor !== "initial") params.append("cursor", cursor);

    const filterToUse = customFilter || selectedFilter;
    if (filterToUse !== "all") {
      const filterOption = FILTER_OPTIONS.find((f) => f.id === filterToUse);
      if (filterOption?.collabTypeId) {
        params.append("collabTypes", filterOption.collabTypeId);
      }
    }

    const response = await apiRequest(
      `/api/collaborations/search?${params.toString()}`
    );
    return response || { items: [], hasMore: false, nextCursor: undefined };
  };

  const fetchPotentialMatches = async () => {
    if (!isAuthenticated) return [];
    try {
      return (await apiRequest("/api/potential-matches")) || [];
    } catch {
      return [];
    }
  };

  const loadMoreCollaborations = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await fetchCollaborations(nextCursor, sortBy, selectedFilter);
      setCollaborations((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await checkAuthenticationStatus();
      const [matchesResult, collabsResult] = await Promise.allSettled([
        fetchPotentialMatches(),
        fetchCollaborations("initial", sortBy, selectedFilter),
      ]);

      setPotentialMatches(matchesResult.status === "fulfilled" ? matchesResult.value : []);

      if (collabsResult.status === "fulfilled") {
        const { items, hasMore: more, nextCursor: cursor } = collabsResult.value;
        setCollaborations(items || []);
        setHasMore(more || false);
        setNextCursor(cursor);
      } else {
        setCollaborations([]);
        setHasMore(false);
        setNextCursor(undefined);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollContainerRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && nextCursor) {
          loadMoreCollaborations();
        }
      },
      { root, rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, nextCursor]);

  useEffect(() => {
    if (!initialLoadCompletedRef.current) {
      handleRefresh();
      initialLoadCompletedRef.current = true;
    }
  }, []);

  const handleRequestCollaboration = async (
    collaboration: CardData,
    isPotentialMatch: boolean = false
  ) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign up first",
        description: "You'll need an account to request this.",
        variant: "destructive",
      });
      return;
    }

    if (isPotentialMatch) {
      await sendCollaborationRequest(
        collaboration,
        "Accepting your collaboration request!",
        isPotentialMatch
      );
    } else {
      setSelectedCollaboration(collaboration);
      setShowNoteDialog(true);
    }
  };

  const sendCollaborationRequest = async (
    collaboration: CardData,
    note: string,
    isPotentialMatch: boolean = false
  ) => {
    setRequestedCollaborations((prev) => new Set(prev).add(collaboration.id));
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (window.Telegram?.WebApp?.initData) {
        headers["x-telegram-init-data"] = window.Telegram.WebApp.initData;
      }

      const response = await fetch(
        `/api/collaborations/${collaboration.id}/apply`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message:
              note ||
              (isPotentialMatch
                ? "Accepting your collaboration request!"
                : "I'm interested in this collaboration opportunity."),
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        setRequestedCollaborations((prev) => {
          const next = new Set(prev);
          next.delete(collaboration.id);
          return next;
        });
        throw new Error("Failed to send collaboration request");
      }

      const result = await response.json();

      if (result?.match) {
        setNewMatchCreated(true);
        setMatchData({
          title: collaboration.title || collaboration.collab_type || "Collaboration",
          companyName: collaboration.creator_company_name || "Unknown Company",
          collaborationType:
            collaboration.type || collaboration.collab_type || "Collaboration",
          userName: "You",
        });
        setShowMatch(true);
        toast({
          title: isPotentialMatch ? "Matched" : "Request sent",
          description: isPotentialMatch
            ? "You've opened a chat with this host."
            : "The host will see your profile now.",
        });
      } else {
        toast({
          title: "Request sent",
          description: "The host will see your profile now.",
        });
      }

      if (isPotentialMatch) {
        setPotentialMatches((prev) =>
          prev.filter((pm) => pm.collaboration_id !== collaboration.id)
        );
      }

      queryClient.invalidateQueries({ queryKey: ["/api/collaborations/interactions"] });
    } catch {
      toast({
        title: "Couldn't send",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (collaboration: CardData) => {
    setSelectedCardDetails(collaboration);
    setCardDialogOpen(true);
  };

  const handleAuthenticationPrompt = () => setLocation("/welcome");

  const handleSortChange = async (newSort: SortOption) => {
    setSortBy(newSort);
    setCollaborations([]);
    setNextCursor(undefined);
    setHasMore(true);
    setIsLoading(true);
    try {
      const result = await fetchCollaborations("initial", newSort, selectedFilter);
      setCollaborations(result.items || []);
      setHasMore(result.hasMore || false);
      setNextCursor(result.nextCursor);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (newFilter: string) => {
    const previousFilter = selectedFilter;
    setIsFilterTransitioning(true);
    setSelectedFilter(newFilter);
    try {
      const result = await fetchCollaborations("initial", sortBy, newFilter);
      setCollaborations(result.items || []);
      setHasMore(result.hasMore || false);
      setNextCursor(result.nextCursor);
    } catch {
      setSelectedFilter(previousFilter);
      toast({
        title: "Filter failed",
        description: "Couldn't load that view. Try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsFilterTransitioning(false), 100);
    }
  };

  const getCollaborationStatus = (collaborationId: string) => {
    if (requestedCollaborations.has(collaborationId)) return "pending";
    if (userRequestHistory?.length) {
      const request = userRequestHistory.find(
        (r: any) => r.collaboration_id === collaborationId
      );
      if (request?.status) {
        switch (request.status) {
          case "pending":
            return "pending";
          case "accepted":
            return "matched";
          case "hidden":
          case "skipped":
            return undefined;
          default:
            return undefined;
        }
      }
    }
    if (collaborationInteractions?.[collaborationId]) {
      return collaborationInteractions[collaborationId].status;
    }
    return undefined;
  };

  const allItems = [
    ...potentialMatches.map((pm) => ({
      ...pm.collaboration,
      isPotentialMatch: true,
      potentialMatchId: pm.id,
    })),
    ...collaborations.map((c) => ({ ...c, isPotentialMatch: false })),
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-baseline justify-between gap-3 border-b border-hairline px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight text-text">
          Discover
        </h1>
        <div className="flex items-center gap-1">
          <SortByButton currentSort={sortBy} onSortChange={handleSortChange} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setLocation("/dashboard")}
              aria-label="Account"
            >
              <UserCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleAuthenticationPrompt}>
              Sign up
            </Button>
          )}
        </div>
      </header>

      <CollaborationTypeFilters
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
        collaborationCount={collaborations.length}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4"
      >
        {isLoading ? (
          <CollaborationListSkeleton count={6} />
        ) : allItems.length === 0 ? (
          <EmptyState
            hasActiveFilters={!!hasActiveFilters}
            onOpenFilters={() => setLocation("/discovery-filters")}
          />
        ) : (
          <div
            className={`transition-opacity duration-fast ease-out ${
              isFilterTransitioning ? "opacity-60" : "opacity-100"
            }`}
          >
            {isAuthenticatedButNotApproved && (
              <PendingApplicationCard
                userFirstName={
                  `${userProfile?.user?.first_name || ""} ${
                    userProfile?.user?.last_name || ""
                  }`.trim()
                }
                companyName={userProfile?.company?.name}
                companyLogoUrl={userProfile?.company?.logo_url}
                submissionDate={userProfile?.user?.created_at}
              />
            )}

            {allItems.map((item, index) => (
              <div key={`${item.isPotentialMatch ? "match" : "collab"}-${item.id}`}>
                <CollaborationListItem
                  collaboration={item}
                  isAuthenticated={isAuthenticated}
                  onViewDetails={() => handleViewDetails(item)}
                  onRequestCollaboration={() =>
                    handleRequestCollaboration(item, item.isPotentialMatch)
                  }
                  isPotentialMatch={item.isPotentialMatch}
                  collaborationStatus={
                    userProfile?.user?.id && item.creator_id === userProfile.user.id
                      ? undefined
                      : (getCollaborationStatus(item.id) as "pending" | "matched" | undefined)
                  }
                  onNavigateToMatches={() => setLocation("/matches")}
                  currentUserId={userProfile?.user?.id}
                  isApplicationPending={isAuthenticatedButNotApproved}
                />

                {index === 4 && (
                  <AddCollabBanner
                    isAuthenticated={isAuthenticated}
                    isApproved={userProfile?.user?.is_approved || false}
                    onSignIn={handleAuthenticationPrompt}
                  />
                )}
              </div>
            ))}

            {allItems.length > 0 && allItems.length <= 5 && !loadingMore && (
              <AddCollabBanner
                isAuthenticated={isAuthenticated}
                isApproved={userProfile?.user?.is_approved || false}
                onSignIn={handleAuthenticationPrompt}
              />
            )}

            <div ref={sentinelRef} aria-hidden className="h-4" />

            {loadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-text-subtle" />
              </div>
            )}

            {!hasMore && allItems.length > 0 && !loadingMore && (
              <p className="py-8 text-center text-xs tabular text-text-subtle">
                End of feed — {allItems.length.toLocaleString()} shown
              </p>
            )}
          </div>
        )}
      </div>

      <CollaborationDetailsDialog
        isOpen={cardDialogOpen}
        onClose={() => setCardDialogOpen(false)}
        onRequestCollaboration={() => {
          if (selectedCardDetails) {
            handleRequestCollaboration(
              selectedCardDetails,
              selectedCardDetails.isPotentialMatch
            );
          }
        }}
        onShowSignupDialog={() => {
          setSignupCollaboration(selectedCardDetails);
          setShowSignupDialog(true);
        }}
        currentUserId={userProfile?.user?.id}
        isAuthenticated={isAuthenticated}
        isUserApproved={userProfile?.user?.is_approved}
        collaboration={
          selectedCardDetails
            ? {
                id: selectedCardDetails.id,
                title: selectedCardDetails.title,
                collab_type:
                  selectedCardDetails.type || selectedCardDetails.collab_type,
                description:
                  selectedCardDetails.short_description ||
                  selectedCardDetails.description,
                topics: selectedCardDetails.topics,
                companyName: selectedCardDetails.creator_company_name,
                company_logo_url: selectedCardDetails.company_logo_url,
                details: selectedCardDetails.details,
                type: selectedCardDetails.type || selectedCardDetails.collab_type,
                company_data: selectedCardDetails.company_data,
                creator_id: selectedCardDetails.creator_id,
                isPotentialMatch: selectedCardDetails.isPotentialMatch,
                potentialMatchData: selectedCardDetails.potentialMatchData,
                date_type: selectedCardDetails.date_type,
                specific_date: selectedCardDetails.specific_date,
                requestStatus: (() => {
                  const status = getCollaborationStatus(selectedCardDetails.id);
                  if (status === "matched") return "matched";
                  if (status === "pending") return "pending";
                  return null;
                })(),
              }
            : undefined
        }
      />

      {matchData && (
        <MatchMoment
          title={matchData.title}
          companyName={matchData.companyName}
          collaborationType={matchData.collaborationType}
          userName={matchData.userName}
          isOpen={showMatch}
          onClose={() => {
            setShowMatch(false);
            setMatchData(null);
          }}
        />
      )}

      <AddNoteDialog
        isOpen={showNoteDialog}
        onClose={() => {
          setShowNoteDialog(false);
          setSelectedCollaboration(null);
        }}
        onSendWithNote={(note) => {
          if (selectedCollaboration) {
            sendCollaborationRequest(selectedCollaboration, note);
          }
          setShowNoteDialog(false);
          setSelectedCollaboration(null);
        }}
        collaboration={
          selectedCollaboration
            ? {
                id: selectedCollaboration.id,
                creator_company_name:
                  selectedCollaboration.creator_company_name ||
                  selectedCollaboration.companyName ||
                  "",
                company_logo_url: selectedCollaboration.company_logo_url,
                collab_type:
                  selectedCollaboration.type ||
                  selectedCollaboration.collab_type ||
                  "",
                description: selectedCollaboration.description,
              }
            : undefined
        }
      />

      <SignupToCollaborateDialog
        open={showSignupDialog}
        onOpenChange={(open) => {
          setShowSignupDialog(open);
          if (!open) setSignupCollaboration(null);
        }}
        companyName={
          signupCollaboration?.creator_company_name ||
          signupCollaboration?.companyName ||
          "Company"
        }
        companyLogoUrl={
          signupCollaboration?.company_logo_url ||
          signupCollaboration?.company_data?.logo_url
        }
        collaborationType={
          signupCollaboration?.type ||
          signupCollaboration?.collab_type ||
          "Collaboration"
        }
      />
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onOpenFilters,
}: {
  hasActiveFilters: boolean;
  onOpenFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-12">
      <h3 className="text-lg font-semibold tracking-tight text-text">
        {hasActiveFilters ? "Nothing here — yet." : "Feed's quiet right now."}
      </h3>
      <p className="text-sm text-text-muted max-w-[42ch]">
        {hasActiveFilters
          ? "Your filters are narrow. Loosen them, or post what you're looking for."
          : "New opportunities land every day. Post what you're looking for and be the first one people request."}
      </p>
      {hasActiveFilters && (
        <Button size="sm" variant="secondary" onClick={onOpenFilters}>
          Adjust filters
        </Button>
      )}
    </div>
  );
}
