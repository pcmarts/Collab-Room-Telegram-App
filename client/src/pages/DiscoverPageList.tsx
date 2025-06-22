import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2, Filter, SearchX, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CollaborationListItem } from "../components/CollaborationListItem";
import { CollaborationDetailsDialog } from "../components/CollaborationDetailsDialog";
import { AuthenticationPrompt } from "../components/AuthenticationPrompt";
import { MatchMoment } from "../components/MatchMoment";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useMatchContext } from "@/contexts/MatchContext";
import { useToast } from "@/hooks/use-toast";

// Types
interface CardData {
  id: string;
  title: string;
  type: string;
  creator_company_name?: string;
  company_logo_url?: string;
  short_description?: string;
  topics?: string[];
  creator_id?: string;
  details?: any;
}

interface PotentialMatch {
  id: string;
  collaboration_id: string;
  user_id: string;
  created_at: string;
  collaboration: CardData;
}

export default function DiscoverPageList() {
  // State for UI components
  const [selectedCardDetails, setSelectedCardDetails] = useState<CardData | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<{title: string; companyName: string; collaborationType: string; userName?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [authError, setAuthError] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  
  // State for collaborations and pagination
  const [collaborations, setCollaborations] = useState<CardData[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs
  const initialLoadCompletedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Context and navigation
  const { setNewMatchCreated } = useMatchContext();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Check authentication status
  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const response = await apiRequest('/api/profile');
      setIsAuthenticated(true);
      setAuthError(false);
    } catch (error) {
      setIsAuthenticated(false);
      // Don't set authError for unauthenticated state - this is expected
      console.log('[Discovery] User not authenticated, showing public view');
    }
  };

  // Fetch marketing preferences to detect active filters
  const { data: marketingPrefs } = useQuery({
    queryKey: ['/api/marketing-preferences'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/marketing-preferences');
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Check if filters are active
  const hasActiveFilters = marketingPrefs && (
    (marketingPrefs.collaboration_types && marketingPrefs.collaboration_types.length > 0) ||
    (marketingPrefs.company_tags && marketingPrefs.company_tags.length > 0) ||
    (marketingPrefs.funding_stages && marketingPrefs.funding_stages.length > 0) ||
    (marketingPrefs.blockchain_networks && marketingPrefs.blockchain_networks.length > 0) ||
    marketingPrefs.min_company_followers ||
    marketingPrefs.min_user_followers ||
    marketingPrefs.has_token
  );

  // Fetch collaborations
  const fetchCollaborations = async (cursor?: string) => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      return { items: [], hasMore: false, nextCursor: undefined };
    }
    lastFetchTimeRef.current = now;

    try {
      const params = new URLSearchParams({
        limit: '20',
      });
      
      if (cursor && cursor !== 'initial') {
        params.append('cursor', cursor);
      }

      const url = `/api/collaborations/search?${params.toString()}`;
      console.log('[Discovery] Fetching collaborations:', url);
      
      const response = await apiRequest(url);
      return response || { items: [], hasMore: false, nextCursor: undefined };
    } catch (error) {
      console.error('[Discovery] Error fetching collaborations:', error);
      throw error;
    }
  };

  // Fetch potential matches (only for authenticated users)
  const fetchPotentialMatches = async () => {
    if (!isAuthenticated) return [];
    
    try {
      const response = await apiRequest('/api/potential-matches');
      return response || [];
    } catch (error) {
      console.log('[Discovery] Could not fetch potential matches:', error);
      return [];
    }
  };

  // Load more collaborations when scrolling near bottom
  const loadMoreCollaborations = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;

    setLoadingMore(true);
    try {
      const result = await fetchCollaborations(nextCursor);
      
      setCollaborations(prev => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('[Discovery] Error loading more collaborations:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    setAuthError(false);
    
    try {
      // Check authentication first
      await checkAuthenticationStatus();
      
      // Fetch potential matches and collaborations in parallel
      const [matchesResult, collabsResult] = await Promise.allSettled([
        fetchPotentialMatches(),
        fetchCollaborations('initial')
      ]);

      // Handle potential matches
      if (matchesResult.status === 'fulfilled') {
        setPotentialMatches(matchesResult.value);
      }

      // Handle collaborations
      if (collabsResult.status === 'fulfilled') {
        setCollaborations(collabsResult.value.items || []);
        setNextCursor(collabsResult.value.nextCursor);
        setHasMore(collabsResult.value.hasMore || false);
      } else {
        console.error('[Discovery] Error fetching collaborations:', collabsResult.reason);
        setCollaborations([]);
        setHasMore(false);
      }

    } catch (error) {
      console.error('[Discovery] Error during refresh:', error);
      setAuthError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll event handler for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollElement = document.querySelector('.overflow-auto');
      if (!scrollElement) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold

      if (scrolledToBottom && hasMore && !loadingMore) {
        loadMoreCollaborations();
      }
    };

    const scrollElement = document.querySelector('.overflow-auto');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, nextCursor, loadMoreCollaborations]);

  // Initial data load
  useEffect(() => {
    if (!initialLoadCompletedRef.current) {
      handleRefresh();
      initialLoadCompletedRef.current = true;
    }
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    setAuthError(false);
    
    try {
      // Check authentication first
      await checkAuthenticationStatus();
      
      // Fetch potential matches and collaborations in parallel
      const [matchesResult, collabsResult] = await Promise.allSettled([
        fetchPotentialMatches(),
        fetchCollaborations('initial')
      ]);

      // Handle potential matches
      if (matchesResult.status === 'fulfilled') {
        setPotentialMatches(matchesResult.value);
      } else {
        setPotentialMatches([]);
      }

      // Handle collaborations
      if (collabsResult.status === 'fulfilled') {
        const { items, hasMore: moreAvailable, nextCursor: cursor } = collabsResult.value;
        setCollaborations(items || []);
        setHasMore(moreAvailable || false);
        setNextCursor(cursor);
      } else {
        setCollaborations([]);
        setHasMore(false);
        setNextCursor(undefined);
      }
      
    } catch (error) {
      console.error('[Discovery] Error during refresh:', error);
      setCollaborations([]);
      setPotentialMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load more collaborations
  const loadMoreCollaborations = async () => {
    if (loadingMore || !hasMore || !nextCursor) return;

    setLoadingMore(true);
    try {
      const { items, hasMore: moreAvailable, nextCursor: cursor } = await fetchCollaborations(nextCursor);
      setCollaborations(prev => [...prev, ...(items || [])]);
      setHasMore(moreAvailable || false);
      setNextCursor(cursor);
    } catch (error) {
      console.error('[Discovery] Error loading more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreCollaborations();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, nextCursor]);

  // Handle collaboration request
  const handleRequestCollaboration = async (collaboration: CardData, isPotentialMatch: boolean = false) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request collaborations.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/collaborations/${collaboration.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: isPotentialMatch ? "Accepting your collaboration request!" : "I'm interested in this collaboration opportunity.",
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send collaboration request');
      }
      
      const result = await response.json();

      if (result?.match) {
        setNewMatchCreated(true);
        setMatchData({
          title: collaboration.title,
          companyName: collaboration.creator_company_name || "Unknown Company",
          collaborationType: collaboration.type,
          userName: "You"
        });
        setShowMatch(true);
        toast({
          title: isPotentialMatch ? "Match Created!" : "Request Sent!",
          description: isPotentialMatch ? "You've created a new match!" : "Your collaboration request has been sent.",
        });
      } else {
        toast({
          title: "Request Sent!",
          description: "Your collaboration request has been sent.",
        });
      }

      // Remove from potential matches if it was one
      if (isPotentialMatch) {
        setPotentialMatches(prev => prev.filter(pm => pm.collaboration_id !== collaboration.id));
      }

    } catch (error) {
      console.error('[Discovery] Error requesting collaboration:', error);
      toast({
        title: "Error",
        description: "Failed to send collaboration request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle view details
  const handleViewDetails = (collaboration: CardData) => {
    setSelectedCardDetails(collaboration);
    setCardDialogOpen(true);
  };

  // Navigate to filters
  const handleOpenFilters = () => {
    setLocation('/discovery-filters');
  };

  // Handle authentication prompt
  const handleAuthenticationPrompt = () => {
    // In a real Telegram WebApp, this would trigger the authentication flow
    toast({
      title: "Authentication Required",
      description: "This app must be opened through Telegram to function properly.",
      variant: "default",
    });
  };

  // Combine potential matches and regular collaborations
  const allItems = [
    ...potentialMatches.map(pm => ({ ...pm.collaboration, isPotentialMatch: true, potentialMatchId: pm.id })),
    ...collaborations.map(collab => ({ ...collab, isPotentialMatch: false }))
  ];

  // Debug logging
  console.log('[Discovery] All items for rendering:', allItems);
  if (allItems.length > 0) {
    console.log('[Discovery] First item structure:', allItems[0]);
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Discover</h1>
            <p className="text-sm text-muted-foreground">Find collaboration opportunities</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleOpenFilters}>
            <Filter className="w-4 h-4 mr-2" />
            {hasActiveFilters ? "Filters (Active)" : "Filters"}
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading collaborations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-semibold">Discover</h1>
          <p className="text-sm text-muted-foreground">
            {isAuthenticated ? "Find collaboration opportunities" : "Browse collaboration opportunities"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenFilters}>
            <Filter className="w-4 h-4 mr-2" />
            {hasActiveFilters ? "Filters (Active)" : "Filters"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Authentication status for unauthenticated users */}
      {!isAuthenticated && (
        <div className="p-4 bg-muted/30 border-b">
          <AuthenticationPrompt 
            compact={true}
            onSignIn={handleAuthenticationPrompt}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <SearchX className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collaborations found</h3>
            <p className="text-muted-foreground max-w-md">
              {hasActiveFilters 
                ? "No collaborations match your current filters. Try adjusting your filter settings."
                : "There are no collaboration opportunities available at the moment."
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleOpenFilters} className="mt-4">
                <Settings className="w-4 h-4 mr-2" />
                Adjust Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {allItems.map((item) => (
              <CollaborationListItem
                key={`${item.isPotentialMatch ? 'match' : 'collab'}-${item.id}`}
                collaboration={item}
                isAuthenticated={isAuthenticated}
                onViewDetails={() => handleViewDetails(item)}
                onRequestCollaboration={() => handleRequestCollaboration(item, item.isPotentialMatch)}
                isPotentialMatch={item.isPotentialMatch}
              />
            ))}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading more...</span>
                </div>
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && allItems.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  You've reached the end of available collaborations
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CollaborationDetailsDialog
        isOpen={cardDialogOpen}
        onClose={() => setCardDialogOpen(false)}
        collaboration={selectedCardDetails ? {
          id: selectedCardDetails.id,
          title: selectedCardDetails.title,
          collab_type: selectedCardDetails.type,
          description: selectedCardDetails.short_description,
          topics: selectedCardDetails.topics,
          companyName: selectedCardDetails.creator_company_name,
          details: selectedCardDetails.details,
          type: selectedCardDetails.type
        } : undefined}
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
          onMessage={() => setLocation('/matches')}
        />
      )}
    </div>
  );
}