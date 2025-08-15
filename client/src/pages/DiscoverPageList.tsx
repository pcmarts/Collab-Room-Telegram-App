import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2, Filter, SearchX, RefreshCw, Settings, UserPlus, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CollaborationListItem } from "../components/CollaborationListItem";
import { CollaborationDetailsDialog } from "../components/CollaborationDetailsDialog";
import { SignupToCollaborateDialog } from "../components/SignupToCollaborateDialog";
import { AuthenticationPrompt } from "../components/AuthenticationPrompt";
import { MatchMoment } from "../components/MatchMoment";
import AddNoteDialog from "../components/AddNoteDialog";
import { SortByButton, type SortOption } from "../components/SortByButton";
import { AddCollabBanner } from "../components/AddCollabBanner";
import { PendingApplicationCard } from "../components/PendingApplicationCard";


import { CollaborationTypeFilters, FILTER_OPTIONS } from "../components/CollaborationTypeFilters";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useMatchContext } from "@/contexts/MatchContext";
import { useToast } from "@/hooks/use-toast";

// Types
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
  // State for UI components
  const [selectedCardDetails, setSelectedCardDetails] = useState<CardData | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<{title: string; companyName: string; collaborationType: string; userName?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [authError, setAuthError] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAnimatedItems, setShowAnimatedItems] = useState(false);
  const { toast } = useToast();
  
  // State for collaborations and pagination
  const [collaborations, setCollaborations] = useState<CardData[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  
  // State for collaboration type filters
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  // State for tracking requested collaborations (for immediate UI updates)
  const [requestedCollaborations, setRequestedCollaborations] = useState<Set<string>>(new Set());
  
  // State for note dialog
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedCollaboration, setSelectedCollaboration] = useState<CardData | null>(null);
  
  // State for signup dialog (moved from CollaborationDetailsDialog)
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [signupCollaboration, setSignupCollaboration] = useState<CardData | null>(null);
  
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

  // Query for user profile (to get user ID)
  const { data: userProfile } = useQuery({
    queryKey: ['/api/profile'],
    queryFn: () => apiRequest('/api/profile'),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Query for user collaboration interactions (requests/matches)
  const { data: collaborationInteractions } = useQuery({
    queryKey: ['/api/collaborations/interactions'],
    queryFn: () => apiRequest('/api/collaborations/interactions'),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Query for user request history (for status indicators)
  const { data: userRequestHistory } = useQuery({
    queryKey: ['/api/user-requests'],
    queryFn: () => apiRequest('/api/user-requests'),
    enabled: isAuthenticated,
    retry: false,
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

  // Check if user is authenticated but not approved
  const isAuthenticatedButNotApproved = isAuthenticated && userProfile && !userProfile.user.is_approved;
  
  // Show limited view for both unauthenticated users and authenticated users who are not approved
  const shouldShowLimitedView = !isAuthenticated || isAuthenticatedButNotApproved;

  // Fetch collaborations
  const fetchCollaborations = async (cursor?: string, customSortBy?: SortOption, customFilter?: string) => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      return { items: [], hasMore: false, nextCursor: undefined };
    }
    lastFetchTimeRef.current = now;

    try {
      const params = new URLSearchParams({
        limit: '20',
        sortBy: customSortBy || sortBy,
      });
      
      if (cursor && cursor !== 'initial') {
        params.append('cursor', cursor);
      }

      // Add collaboration type filter if not "all"
      const filterToUse = customFilter || selectedFilter;
      if (filterToUse !== "all") {
        const filterOption = FILTER_OPTIONS.find(f => f.id === filterToUse);
        if (filterOption?.collabTypeId) {
          params.append('collabTypes', filterOption.collabTypeId);
        }
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
      const result = await fetchCollaborations(nextCursor, sortBy, selectedFilter);
      
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
    setShowAnimatedItems(false);
    
    try {
      // Check authentication first
      await checkAuthenticationStatus();
      
      // Fetch potential matches and collaborations in parallel
      const [matchesResult, collabsResult] = await Promise.allSettled([
        fetchPotentialMatches(),
        fetchCollaborations('initial', sortBy, selectedFilter)
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

  // Scroll event handler for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 300; // 300px threshold

      if (scrolledToBottom && hasMore && !loadingMore && nextCursor) {
        loadMoreCollaborations();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, nextCursor]);

  // Apply scroll and style fixes - optimized to run only once
  useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    // Modify for this page to allow scrolling - apply all changes in a single batch
    requestAnimationFrame(() => {
      document.body.style.cssText = `
        overflow: auto;
        position: static;
        width: auto;
        height: auto;
      `;
      
      // Add scrollable-page class to html and body
      document.documentElement.classList.add("scrollable-page");
      document.body.classList.add("scrollable-page");
      
      // Also fix the root element
      const rootElement = document.getElementById("root");
      if (rootElement) {
        rootElement.style.cssText = `
          overflow: auto;
          height: auto;
          position: static;
          width: 100%;
        `;
      }
    });

    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove("scrollable-page");
      document.body.classList.remove("scrollable-page");
      
      const rootElement = document.getElementById("root");
      if (rootElement) {
        rootElement.style.overflow = '';
        rootElement.style.height = '';
        rootElement.style.position = '';
        rootElement.style.width = '';
      }
    };
  }, []);

  // Initial data load
  useEffect(() => {
    if (!initialLoadCompletedRef.current) {
      handleRefresh();
      initialLoadCompletedRef.current = true;
    }
  }, []);

  // Handle request collaboration - show note dialog first
  const handleRequestCollaboration = async (collaboration: CardData, isPotentialMatch: boolean = false) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign up to request collaborations.",
        variant: "destructive",
      });
      return;
    }

    // For potential matches, skip the note dialog and directly send the request
    if (isPotentialMatch) {
      await sendCollaborationRequest(collaboration, "Accepting your collaboration request!", isPotentialMatch);
    } else {
      // For regular collaborations, show the note dialog
      setSelectedCollaboration(collaboration);
      setShowNoteDialog(true);
    }
  };

  // Handle sending collaboration request with note
  const sendCollaborationRequest = async (collaboration: CardData, note: string, isPotentialMatch: boolean = false) => {
    // Immediately update the local state to show "Requested" status
    setRequestedCollaborations(prev => new Set(prev).add(collaboration.id));

    try {
      // Prepare headers with Telegram authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Telegram authentication header if available
      if (window.Telegram?.WebApp?.initData) {
        headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
      }
      
      const response = await fetch(`/api/collaborations/${collaboration.id}/apply`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: note || (isPotentialMatch ? "Accepting your collaboration request!" : "I'm interested in this collaboration opportunity."),
        }),
        credentials: 'include' // Ensure cookies are sent for session authentication
      });
      
      if (!response.ok) {
        // If request fails, remove from requested state
        setRequestedCollaborations(prev => {
          const newSet = new Set(prev);
          newSet.delete(collaboration.id);
          return newSet;
        });
        throw new Error('Failed to send collaboration request');
      }
      
      const result = await response.json();

      if (result?.match) {
        setNewMatchCreated(true);
        setMatchData({
          title: collaboration.title || collaboration.collab_type || 'Collaboration',
          companyName: collaboration.creator_company_name || "Unknown Company",
          collaborationType: collaboration.type || collaboration.collab_type || 'Collaboration',
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

      // Invalidate and refetch interaction data to sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/interactions'] });

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
    setLocation('/welcome');
  };

  // Handle sort change
  const handleSortChange = async (newSort: SortOption) => {
    setSortBy(newSort);
    // Reset pagination state immediately
    setCollaborations([]);
    setNextCursor(undefined);
    setHasMore(true);
    setIsLoading(true);
    
    try {
      // Fetch fresh data with new sort immediately - pass the new sort value directly
      const result = await fetchCollaborations('initial', newSort, selectedFilter);
      setCollaborations(result.items || []);
      setHasMore(result.hasMore || false);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('[Discovery] Error changing sort:', error);
      setCollaborations([]);
      setHasMore(false);
      setNextCursor(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter change with smooth transition (no flash, keep previous data visible)
  const handleFilterChange = async (newFilter: string) => {
    const previousFilter = selectedFilter;
    
    // Set transition state and update filter immediately
    setIsFilterTransitioning(true);
    setSelectedFilter(newFilter);
    
    try {
      // Fetch fresh data with new filter
      const result = await fetchCollaborations('initial', sortBy, newFilter);
      
      // Smoothly update data after fetch completes
      setCollaborations(result.items || []);
      setHasMore(result.hasMore || false);
      setNextCursor(result.nextCursor);
      
    } catch (error) {
      console.error('[Discovery] Error changing filter:', error);
      // Revert filter on error to prevent broken state
      setSelectedFilter(previousFilter);
      toast({
        title: "Filter Error",
        description: "Failed to load collaborations for this filter. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always clear transition state
      setTimeout(() => setIsFilterTransitioning(false), 100);
    }
  };

  // Create a mapping from collaboration ID to request status
  const getCollaborationStatus = (collaborationId: string) => {
    // Check if locally requested first (for immediate UI update)
    if (requestedCollaborations.has(collaborationId)) {
      return 'pending';
    }
    
    // Check userRequestHistory for actual status from database
    if (userRequestHistory && userRequestHistory.length > 0) {
      const request = userRequestHistory.find((req: any) => req.collaboration_id === collaborationId);
      if (request && request.status) {
        // Map database status to UI status
        switch (request.status) {
          case 'pending':
            return 'pending';
          case 'accepted':
            return 'matched';
          case 'hidden':
          case 'skipped':
            return undefined; // Don't show status for hidden/skipped
          default:
            return undefined;
        }
      }
    }
    
    // Fallback to legacy collaborationInteractions data
    if (collaborationInteractions && collaborationInteractions[collaborationId]) {
      return collaborationInteractions[collaborationId].status;
    }
    
    return undefined;
  };

  // Combine potential matches and regular collaborations
  const allItems = [
    ...potentialMatches.map(pm => ({ ...pm.collaboration, isPotentialMatch: true, potentialMatchId: pm.id })),
    ...collaborations.map(collab => ({ ...collab, isPotentialMatch: false }))
  ];

  // Debug logging
  console.log('[Discovery] All items for rendering:', allItems);
  console.log('[Discovery] User request history:', userRequestHistory);
  if (allItems.length > 0) {
    console.log('[Discovery] First item structure:', allItems[0]);
    console.log('[Discovery] Status for first item:', getCollaborationStatus(allItems[0].id));
  }

  // Trigger animation after loading completes and items are available
  useEffect(() => {
    if (!isLoading && allItems.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setShowAnimatedItems(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, allItems.length]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Discover</h1>
          </div>
          {/* <Button variant="outline" size="sm" onClick={handleOpenFilters}>
            <Filter className="w-4 h-4 mr-2" />
            {hasActiveFilters ? "Filters (Active)" : "Filters"}
          </Button> */}
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
        </div>
        <div className="flex gap-2">
          <SortByButton 
            currentSort={sortBy}
            onSortChange={handleSortChange}
          />
          {/* Show Refresh and Sign Up buttons for non-authenticated users */}
          {!isAuthenticated && (
            <>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="default" size="sm" onClick={handleAuthenticationPrompt}>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </>
          )}
          {/* Show Refresh button for authenticated users */}
          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          {/* Show Account button for authenticated users - moved to far right */}
          {isAuthenticated && (
            <Button variant="outline" size="sm" onClick={() => setLocation('/dashboard')}>
              <UserCircle className="w-4 h-4" />
            </Button>
          )}
          {/* <Button variant="outline" size="sm" onClick={handleOpenFilters}>
            <Filter className="w-4 h-4 mr-2" />
            {hasActiveFilters ? "Filters (Active)" : "Filters"}
          </Button> */}
        </div>
      </div>

      {/* Filter Pills */}
      <CollaborationTypeFilters
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
        collaborationCount={collaborations.length}
      />

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
          <div className={`p-4 space-y-4 transition-opacity duration-200 ${
            isFilterTransitioning ? 'opacity-60' : 'opacity-100'
          }`}>

            {/* Show pending application card for authenticated but not approved users */}
            {isAuthenticatedButNotApproved && (
              <div 
                className={`transition-all duration-500 ${
                  showAnimatedItems 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                <PendingApplicationCard userFirstName={userProfile?.user?.first_name} />
              </div>
            )}

            {allItems.map((item, index) => (
              <div key={`${item.isPotentialMatch ? 'match' : 'collab'}-${item.id}`}>
                <div 
                  className={`transition-all duration-500 ${
                    showAnimatedItems 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${200 + index * 150}ms` }}
                >
                  <CollaborationListItem
                    collaboration={item}
                    isAuthenticated={isAuthenticated}
                    onViewDetails={() => handleViewDetails(item)}
                    onRequestCollaboration={() => handleRequestCollaboration(item, item.isPotentialMatch)}
                    isPotentialMatch={item.isPotentialMatch}
                    collaborationStatus={
                      // Never show collaboration status for user's own collaborations
                      userProfile?.user?.id && item.creator_id === userProfile.user.id
                        ? undefined
                        : // Get status from the new function
                          getCollaborationStatus(item.id) as 'pending' | 'matched' | undefined
                    }
                    onNavigateToMatches={() => setLocation('/matches')}
                    currentUserId={userProfile?.user?.id}
                    isApplicationPending={isAuthenticatedButNotApproved}
                  />
                </div>
                
                {/* Add banner after the 5th item (index 4) */}
                {index === 4 && (
                  <div 
                    className={`my-4 transition-all duration-500 ${
                      showAnimatedItems 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${200 + (index + 1) * 150}ms` }}
                  >
                    <AddCollabBanner
                      isAuthenticated={isAuthenticated}
                      isApproved={userProfile?.user?.is_approved || false}
                      onSignIn={handleAuthenticationPrompt}
                    />
                  </div>
                )}
              </div>
            ))}
            
            {/* Add banner at the end if there are collaborations */}
            {allItems.length > 0 && !loadingMore && (
              <div 
                className={`mt-4 transition-all duration-500 ${
                  showAnimatedItems 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${200 + allItems.length * 150}ms` }}
              >
                <AddCollabBanner
                  isAuthenticated={isAuthenticated}
                  isApproved={userProfile?.user?.is_approved || false}
                  onSignIn={handleAuthenticationPrompt}
                />
              </div>
            )}

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
              <div 
                className={`text-center py-8 transition-all duration-500 ${
                  showAnimatedItems 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${200 + (allItems.length + 1) * 150}ms` }}
              >
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
        onRequestCollaboration={() => {
          if (selectedCardDetails) {
            handleRequestCollaboration(selectedCardDetails, selectedCardDetails.isPotentialMatch);
          }
        }}
        onShowSignupDialog={() => {
          // Store the collaboration for signup dialog and show it
          setSignupCollaboration(selectedCardDetails);
          setShowSignupDialog(true);
        }}
        currentUserId={userProfile?.user?.id}
        isAuthenticated={isAuthenticated}
        collaboration={selectedCardDetails ? {
          id: selectedCardDetails.id,
          title: selectedCardDetails.title,
          collab_type: selectedCardDetails.type || selectedCardDetails.collab_type,
          description: selectedCardDetails.short_description || selectedCardDetails.description,
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
            // Map our UI status to dialog status
            if (status === 'matched') return 'matched';
            if (status === 'pending') return 'pending';
            return null;
          })()
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
        />
      )}

      {/* Add Note Dialog */}
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
        collaboration={selectedCollaboration ? {
          id: selectedCollaboration.id,
          creator_company_name: selectedCollaboration.creator_company_name || selectedCollaboration.companyName || '',
          company_logo_url: selectedCollaboration.company_logo_url,
          collab_type: selectedCollaboration.type || selectedCollaboration.collab_type || '',
          description: selectedCollaboration.description
        } : undefined}
      />

      {/* Signup Dialog for non-authenticated users */}
      <SignupToCollaborateDialog
        open={showSignupDialog}
        onOpenChange={(open) => {
          setShowSignupDialog(open);
          // When dialog closes, also clear the stored collaboration
          if (!open) {
            setSignupCollaboration(null);
          }
        }}
        companyName={signupCollaboration?.creator_company_name || signupCollaboration?.companyName || "Company"}
        companyLogoUrl={signupCollaboration?.company_logo_url || signupCollaboration?.company_data?.logo_url}
        collaborationType={signupCollaboration?.type || signupCollaboration?.collab_type || "Collaboration"}
      />
    </div>
  );
}