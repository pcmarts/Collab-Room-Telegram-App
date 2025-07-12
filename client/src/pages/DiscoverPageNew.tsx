import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2, Filter, SearchX, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
// Use relative imports for our custom components
import { GlowButton } from "../components/ui/glow-button";
import SimpleCard from "../components/SimpleCard";
import { MatchMoment } from "../components/MatchMoment";
import { CollaborationDetailsDialog } from "../components/CollaborationDetailsDialog";
import { AuthenticationError } from "../components/AuthenticationError";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useMatchContext } from "@/contexts/MatchContext";
import { useToast } from "@/hooks/use-toast";

// Define props for CardStack component
interface CardStackProps {
  cards: CardData[];
  handleRequest: (action: "skip" | "request", note?: string) => Promise<void>;
  handleViewCardDetails: (card: CardData) => void;
  handleDetailsClick: (id: string) => void;
}

// CardStack component to handle rendering cards
const CardStack = ({ cards, handleRequest, handleViewCardDetails, handleDetailsClick }: CardStackProps) => {
  // Log current cards state
  console.log('[CardStack] Rendering with', cards.length, 'cards');
  
  // Handle empty state - don't render anything if there are no cards
  if (cards.length === 0) {
    console.log('[CardStack] No cards to render');
    return null;
  }
  
  // More detailed card info logging to debug swipe issues
  console.log(`[CardStack] Card ID: ${cards[0].id}, Company: ${cards[0].creator_company_name || 'Unknown'}`);
  
  return (
    <>
      {/* Only show the top card for now to fix overlapping issues */}
      {cards.length > 0 && (
        <SimpleCard
          key={cards[0].id}
          data={cards[0]}
          handleRequest={handleRequest}
          onInfoClick={() => handleViewCardDetails(cards[0])}
          handleDetailsClick={handleDetailsClick}
        />
      )}
    </>
  );
};

// Define types for card data
interface CardData {
  id: string;
  collab_type: string;
  description?: string;
  details?: any;
  topics?: string[];
  creator_company_name?: string;
  company_data?: any;
  isPotentialMatch?: boolean;
  potentialMatchData?: {
    user_id: string;
    first_name: string;
    last_name?: string;
    company_name: string;
    job_title?: string;
    twitter_followers?: string;
    company_twitter_followers?: string;
    swipe_created_at?: string;
    collaboration_id: string;
  };
  [key: string]: any;
}

// Define types for request history
interface RequestHistoryItem {
  card: CardData | null;
  action: "skip" | "request";
  index: number;
}

// Type for the paginated response
interface PaginatedResponse {
  items: CardData[];
  hasMore: boolean;
  nextCursor?: string;
}

// Define type for marketing preferences response
interface MarketingPreferencesResponse {
  id?: string;
  user_id?: string;
  collabs_to_discover?: string[];
  collabs_to_host?: string[];
  filtered_marketing_topics?: string[];
  twitter_followers?: string;
  company_twitter_followers?: string;
  funding_stage?: string;
  company_has_token?: boolean;
  company_token_ticker?: string;
  company_blockchain_networks?: string[];
  company_tags?: string[];
  discovery_filter_enabled?: boolean;
  discovery_filter_collab_types_enabled?: boolean;
  discovery_filter_topics_enabled?: boolean;
  discovery_filter_company_followers_enabled?: boolean;
  discovery_filter_user_followers_enabled?: boolean;
  discovery_filter_funding_stages_enabled?: boolean;
  discovery_filter_token_status_enabled?: boolean;
  discovery_filter_company_sectors_enabled?: boolean;
  discovery_filter_blockchain_networks_enabled?: boolean;
  created_at?: string;
}

export default function DiscoverPage() {
  // State for UI components
  const [selectedCardDetails, setSelectedCardDetails] = useState<CardData | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allCardsViewed, setAllCardsViewed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [authError, setAuthError] = useState<boolean>(false);
  const [isResettingSwipes, setIsResettingSwipes] = useState(false);
  const { toast } = useToast();
  
  // State for cards and pagination
  const [cards, setCards] = useState<CardData[]>([]);
  const [requestHistory, setRequestHistory] = useState<RequestHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs for tracking state across renders
  const cardsRef = useRef<CardData[]>([]);
  const requestHistoryRef = useRef<RequestHistoryItem[]>([]);
  const isFetchingNextBatchRef = useRef(false);
  const initialLoadCompletedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const requestCooldownTimeRef = useRef<number>(0); // Track time to enforce cooldown between requests
  
  // Get access to the match context
  const { setNewMatchCreated } = useMatchContext();
  
  // Fetch marketing preferences to detect active filters
  const { data: marketingPrefs = {} as MarketingPreferencesResponse } = useQuery<MarketingPreferencesResponse>({
    queryKey: ['/api/marketing-preferences'],
    staleTime: 60000, // Consider stale after 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });
  
  // Mutation for resetting skipped collaborations
  const resetSkippedCollaborationsMutation = useMutation({
    mutationFn: async () => {
      setIsResettingSwipes(true);
      try {
        const response = await apiRequest('/api/reset-skipped', 'POST');
        return response;
      } catch (error) {
        throw error;
      } finally {
        setIsResettingSwipes(false);
      }
    },
    onSuccess: async (data) => {
      toast({
        title: "Skipped Cards Reset",
        description: `Successfully reset ${data.deleted_count} skipped collaboration(s). You'll now see cards you previously skipped.`,
        duration: 5000,
      });
      
      console.log('[Discovery] Reset skipped collaborations successful, performing complete state reset');
      
      // Reset all local state
      setCards([]);
      setNextCursor(undefined);
      setHasMore(true);
      setAllCardsViewed(false);
      
      // Also reset session swipe history
      setSwipeHistory([]);
      
      // Reset any local storage swipe records
      try {
        localStorage.removeItem('swipedCardIds');
        console.log('[Discovery] Cleared localStorage swipe cache');
      } catch (e) {
        console.warn('[Discovery] Failed to clear localStorage swipes:', e);
      }
      
      // Invalidate ALL relevant queries to force fresh data fetches
      await queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/potential-matches'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/collaborations/search'] });
      
      // Explicitly fetch fresh swipe data before getting new cards
      try {
        const updatedSwipes = await apiRequest('/api/user-swipes');
        console.log(`[Discovery] Fetched ${updatedSwipes.length} swipes after reset`);
      } catch (refreshError) {
        console.warn('[Discovery] Error refreshing swipes after reset:', refreshError);
      }
      
      // Force a fetch of new cards with slight delay to ensure database consistency
      setTimeout(() => fetchNextBatch(), 100);
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: "Failed to reset swipes. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      setIsResettingSwipes(false);
    }
  });
  
  // Check if any filters are active based on marketing preferences
  const hasActiveFilters = useMemo(() => {
    // If the main discovery_filter_enabled flag is set, filters are active
    if (marketingPrefs?.discovery_filter_enabled) {
      return true;
    }
    
    // Check individual filter toggles
    return !!(
      marketingPrefs?.discovery_filter_collab_types_enabled ||
      marketingPrefs?.discovery_filter_topics_enabled ||
      marketingPrefs?.discovery_filter_company_followers_enabled ||
      marketingPrefs?.discovery_filter_user_followers_enabled ||
      marketingPrefs?.discovery_filter_funding_stages_enabled ||
      marketingPrefs?.discovery_filter_token_status_enabled ||
      marketingPrefs?.discovery_filter_company_sectors_enabled ||
      marketingPrefs?.discovery_filter_blockchain_networks_enabled
    );
  }, [marketingPrefs]);
  
  // Match data for the match moment dialog
  const [matchData, setMatchData] = useState<{
    title: string;
    companyName: string;
    collaborationType: string;
    userName?: string;
  }>({
    title: '',
    companyName: '',
    collaborationType: '',
    userName: ''
  });
  
  // Routing
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Track previous location to detect navigation
  const prevLocationRef = useRef<string>('');
  
  // We've removed motion animations since they're not needed without drag functionality
  
  // Get user swipe history to prevent showing already swiped cards
  const { data: serverRequestHistory } = useQuery({
    queryKey: ['/api/user-requests'],
    queryFn: async () => {
      try {
        console.log('[Discovery] Fetching user request history...');
        const data = await apiRequest('/api/user-requests');
        console.log(`[Discovery] User request history fetched, count: ${data.length}`);
        return data;
      } catch (err) {
        console.error('[Discovery] User request history fetch error:', err);
        // Check if this is an authentication error
        if (err && (
          (err as Error).name === 'AuthenticationError' || 
          ((err as Error).message && (err as Error).message.includes('Unauthorized'))
        )) {
          setAuthError(true);
        }
        throw err;
      }
    },
    staleTime: Infinity, // Never consider data stale to prevent auto-refresh
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: false,
  });
  
  // Extract all requested card IDs (combining client-side, server-side and localStorage)
  const allRequestedCardIds = useMemo(() => {
    // Get IDs from current session request history
    const sessionIds = requestHistory
      .map(hist => hist.card?.id)
      .filter(Boolean) as string[];
    
    // Get IDs from server request history
    const serverIds = serverRequestHistory 
      ? serverRequestHistory.map(request => request.collaboration_id)
      : [];
    
    // Get IDs from localStorage (persistent storage)
    let persistentIds: string[] = [];
    try {
      const storedIds = localStorage.getItem('requestedCardIds');
      if (storedIds) {
        persistentIds = JSON.parse(storedIds);
      }
    } catch (e) {
      console.warn('[Discovery] Failed to retrieve persistent requested card IDs:', e);
    }
    
    // Combine and deduplicate all sources
    const uniqueIdsSet = new Set([...sessionIds, ...serverIds, ...persistentIds]);
    const uniqueIds = Array.from(uniqueIdsSet);
    
    console.log('[Discovery] All requested card IDs:', {
      fromState: sessionIds.length,
      fromServer: serverIds.length,
      fromStorage: persistentIds.length,
      uniqueIdsCount: uniqueIds.length
    });
    
    return uniqueIds;
  }, [requestHistory, serverRequestHistory]);
  
  // Fetch potential matches (users who swiped right on your collaborations)
  const { data: potentialMatches, isLoading: isPotentialMatchesLoading } = useQuery({
    queryKey: ['/api/potential-matches'],
    queryFn: async () => {
      try {
        console.log('[Discovery] Fetching potential matches...');
        const data = await apiRequest('/api/potential-matches');
        console.log(`[Discovery] Potential matches fetched, count: ${data.length}`);
        
        // Get local storage swiped IDs to filter out any cards the user has already swiped on
        let persistentSwipedIds: string[] = [];
        try {
          const storedIds = localStorage.getItem('swipedCardIds');
          if (storedIds) {
            persistentSwipedIds = JSON.parse(storedIds);
          }
        } catch (e) {
          console.warn('[Discovery] Failed to read swiped card IDs from localStorage:', e);
        }
        
        console.log(`[Discovery] Filtering potential matches with ${persistentSwipedIds.length} locally stored swiped IDs`);
        
        // Get user's own collaborations to exclude them from being shown as potential matches
        let userOwnCollaborations: string[] = [];
        try {
          const userCollabResponse = await apiRequest('/api/collaborations/my');
          if (userCollabResponse && Array.isArray(userCollabResponse)) {
            userOwnCollaborations = userCollabResponse.map((collab: any) => collab.id);
            console.log(`[Discovery] Found ${userOwnCollaborations.length} collaborations created by user, excluding from potential matches`);
            console.log(`[Discovery] User collaboration IDs: ${userOwnCollaborations.join(', ')}`);
          }
        } catch (e) {
          console.warn('[Discovery] Failed to fetch user collaborations for filtering:', e);
        }

        // Filter out:
        // 1. Any potential matches for cards the user has already swiped on
        // 2. Any potential matches where collaboration_id is missing
        // 3. Any potential matches that ARE the user's own collaborations (CRITICAL FIX)
        const filteredMatches = data.filter((match: any) => {
          const matchId = match.id;
          const swipeId = match.swipe_id;
          const collabId = match.collaboration_id;
          
          // Check if either the match ID or swipe ID is in the list of already swiped IDs
          const alreadySwiped = 
            (matchId && persistentSwipedIds.includes(matchId)) || 
            (swipeId && persistentSwipedIds.includes(swipeId));
          
          // Check if this potential match is for one of the user's own collaborations
          const isUsersOwnCollaboration = 
            collabId && userOwnCollaborations.includes(collabId);
          
          if (isUsersOwnCollaboration) {
            console.log(`[Discovery] Filtering out potential match for user's own collaboration: ${collabId}`);
          }
            
          return matchId && !alreadySwiped && collabId && !isUsersOwnCollaboration;
        });
        
        console.log(`[Discovery] After filtering, ${filteredMatches.length} potential matches remain`);
        
        // Transform the potential matches data to match CardData structure
        const transformedMatches = filteredMatches.map((match: any) => {
          // Debug the structure of incoming potential matches
          console.log('[Discovery] Processing potential match data:', {
            hasMatchData: !!match.potentialMatchData,
            matchId: match.id,
            userInfo: match.user_data || match.user || 'No user data',
            companyInfo: match.company_data || match.company || 'No company data'
          });
          
          // Check if we're dealing with nested user and company objects from server
          const hasNestedData = !!match.user && !!match.company;
          
          // Construct the proper potentialMatchData object
          const potentialMatchData = {
            user_id: hasNestedData ? match.user?.id : (match.user_id || match.requester_id || ''),
            first_name: hasNestedData ? match.user?.first_name : (match.first_name || match.requester_first_name || ''),
            last_name: hasNestedData ? match.user?.last_name : (match.last_name || match.requester_last_name || ''),
            company_name: hasNestedData ? match.company?.name : (match.company_name || match.requester_company || ''),
            company_description: hasNestedData ? match.company?.description : (match.company_description || match.short_description || match.description || ''),
            company_website: hasNestedData ? match.company?.website : (match.company_website || match.website || ''),
            company_twitter: hasNestedData ? match.company?.twitter_handle : (match.company_twitter || match.twitter_handle || ''),
            company_linkedin: hasNestedData ? match.company?.linkedin_url : (match.company_linkedin || match.linkedin || ''),
            job_title: hasNestedData ? match.user?.job_title : (match.job_title || match.requester_role || ''),
            twitter_followers: hasNestedData ? match.user?.twitter_followers : (match.twitter_followers || ''),
            company_twitter_followers: hasNestedData ? match.company?.twitter_followers : (match.company_twitter_followers || ''),
            swipe_created_at: match.created_at || match.swipe_created_at || new Date().toISOString(),
            collaboration_id: match.collaboration_id || match.id,
            note: match.note || '' // Include the personalized note from the swipe
          };
          
          // Log the constructed potentialMatchData for debugging
          console.log('[Discovery] Constructed potentialMatchData:', potentialMatchData);
          
          return {
            ...match,
            id: match.id,
            isPotentialMatch: true,
            potentialMatchData: potentialMatchData,
            collab_type: match.collaboration_type || match.collab_type || 'Collaboration',
            description: match.collaboration_description || match.description || '',
            topics: match.collaboration_topics || match.topics || [],
            creator_company_name: potentialMatchData.company_name || '',
            // Keep these for backward compatibility
            requester_company: match.requester_company || potentialMatchData.company_name || '',
            requester_role: match.requester_role || potentialMatchData.job_title || '',
          };
        });
        
        // Validate transformed matches to ensure they have required fields
        const validMatches = transformedMatches.filter(match => {
          const isValid = match.id && 
                   match.potentialMatchData && 
                   match.potentialMatchData.company_name && 
                   match.potentialMatchData.user_id;
                   
          if (!isValid) {
            console.log('[Discovery] Filtering out invalid potential match:', {
              id: match.id,
              hasPotentialMatchData: !!match.potentialMatchData,
              companyName: match.potentialMatchData?.company_name,
              userId: match.potentialMatchData?.user_id
            });
          }
          
          return isValid;
        });
        
        console.log(`[Discovery] After validation, ${validMatches.length} of ${transformedMatches.length} potential matches remain`);
        return validMatches;
      } catch (err) {
        console.error('[Discovery] Potential matches fetch error:', err);
        // Check if this is an authentication error
        if (err && (
          (err as Error).name === 'AuthenticationError' || 
          ((err as Error).message && (err as Error).message.includes('Unauthorized'))
        )) {
          setAuthError(true);
        }
        return [];
      }
    },
    staleTime: Infinity, // Never consider data stale to prevent auto-refresh
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: false
  });
  
  // Cache for user's own collaborations, to avoid multiple API calls
  const [userOwnCollaborationIds, setUserOwnCollaborationIds] = useState<string[]>([]);
  
  // Load user's collaborations for filtering
  useEffect(() => {
    const loadUserCollaborations = async () => {
      try {
        console.log('[Discovery] Fetching user collaborations for validation...');
        const userCollabResponse = await apiRequest('/api/collaborations/my');
        if (userCollabResponse && Array.isArray(userCollabResponse)) {
          const ids = userCollabResponse.map((collab: any) => collab.id);
          setUserOwnCollaborationIds(ids);
          console.log(`[Discovery] Loaded ${ids.length} user collaborations for filtering: ${ids.join(', ')}`);
        }
      } catch (e) {
        console.warn('[Discovery] Failed to load user collaborations:', e);
      }
    };
    
    loadUserCollaborations();
  }, []);
  
  // Helper function to validate card data and filter out incomplete cards
  const validateCardData = (cards: CardData[]): CardData[] => {
    if (!cards || !Array.isArray(cards)) return [];
    
    console.log('[Discovery] Validating card data, original count:', cards.length);
    
    // Log complete card data for the first card to debug field names/structure
    if (cards.length > 0) {
      console.log('[Discovery] First card data structure sample:', {
        id: cards[0].id,
        collab_type: cards[0].collab_type,
        creator_company_name: cards[0].creator_company_name,
        title: cards[0].title,
        // Log all available fields for debugging
        availableFields: Object.keys(cards[0])
      });
    }
    
    // ENHANCED VALIDATION: Accept all cards with ID and fix missing fields
    const validCards = cards.filter(card => {
      // Card structure validation and debug logging
      if (!card) {
        console.log('[Discovery] Filtering out null/undefined card');
        return false;
      }
      
      // Log the complete structure of any problematic card
      if (!card.id || typeof card !== 'object') {
        console.log('[Discovery] Problem card structure:', JSON.stringify(card, null, 2));
      }
      
      // ONLY require id - all other fields are now optional
      const hasValidId = !!card.id;
      
      // Basic validation - just require an ID
      if (!hasValidId) {
        console.log('[Discovery] Filtering out card without ID');
        return false;
      }
      
      // Check if this card belongs to the user (should never happen with server filters, but adding defense-in-depth)
      if (userOwnCollaborationIds.includes(card.id)) {
        console.warn(`[Discovery] CRITICAL: Filtering out user's own collaboration that wasn't caught by server filters: ${card.id}`);
        return false;
      }
      
      // If this is a potential match, check if it's for the user's own collaboration
      if (card.isPotentialMatch && card.potentialMatchData?.collaboration_id) {
        const collabId = card.potentialMatchData.collaboration_id;
        if (userOwnCollaborationIds.includes(collabId)) {
          console.warn(`[Discovery] Filtering out potential match for user's own collaboration: ${collabId}`);
          return false;
        }
      }
      
      // Enhanced field checking with detailed logs for debugging
      console.log(`[Discovery] Processing card ${card.id} - isPotentialMatch: ${!!card.isPotentialMatch}, hasType: ${!!card.collab_type}`);
      
      // If collab_type is missing, provide a default
      if (!card.collab_type) {
        console.log('[Discovery] Adding default collab_type for card:', card.id);
        card.collab_type = "Collaboration";
      }
      
      // If creator_company_name is missing, provide a default or extract from potentialMatchData if available
      if (!card.creator_company_name) {
        if (card.isPotentialMatch && card.potentialMatchData?.company_name) {
          console.log('[Discovery] Using company name from potentialMatchData for card:', card.id);
          card.creator_company_name = card.potentialMatchData.company_name;
        } else if (card.company_data?.name) {
          console.log('[Discovery] Using company name from company_data for card:', card.id);
          card.creator_company_name = card.company_data.name;
        } else {
          console.log('[Discovery] Adding default company name for card:', card.id);
          card.creator_company_name = "Company";
        }
      }
      
      // Don't set title to collaboration type to avoid duplication in the UI
      // The collaboration type is already displayed as a badge in the card header
      if (!card.title) {
        console.log('[Discovery] Card has no title, leaving it empty to avoid duplication with the collaboration type badge');
        card.title = ""; // Set an empty title
      }
      
      return true;
    });
    
    console.log('[Discovery] Validation complete, kept cards:', validCards.length, 'out of', cards.length);
    return validCards;
  };

  // Function to AGGRESSIVELY ENSURE we're not showing already swiped cards
  const fetchNextBatch = async () => {
    // Prevent fetching if already in progress 
    if (isFetchingNextBatchRef.current) {
      console.log('[Discovery] Skipping fetchNextBatch - already fetching');
      return;
    }
    
    // COOLDOWN MECHANISM: Prevent excessive API requests
    const now = Date.now();
    const timeSinceLastRequest = now - requestCooldownTimeRef.current;
    const COOLDOWN_PERIOD_MS = 3000; // 3 seconds cooldown
    
    if (timeSinceLastRequest < COOLDOWN_PERIOD_MS) {
      console.log(`[Discovery] Request cooldown active - need to wait ${(COOLDOWN_PERIOD_MS - timeSinceLastRequest) / 1000}s more`);
      return;
    }
    
    // Update the cooldown timestamp
    requestCooldownTimeRef.current = now;
    
    // If we have cards available, don't reset pagination too aggressively
    // Only reset pagination if:
    // 1. We have a cursor but hasMore is false (end of page), OR
    // 2. We have no cards at all (all swiped or no results yet)
    // But NOT if we just have a small number of cards
    if ((nextCursor && !hasMore) || (cards.length === 0 && !loadingMore && !isLoading)) {
      console.log('[Discovery] Resetting pagination to try fresh search', {
        reason: nextCursor && !hasMore ? 'end of page' : 'no cards',
        nextCursor,
        hasMore,
        cardCount: cards.length
      });
      
      // Reset pagination to start fresh - this helps when all cards in current batch are swiped
      // but there might be new cards available from the beginning
      setNextCursor(undefined);
      setHasMore(true);
    }
    
    // If we already have more than 10 cards, don't fetch more yet (but allow initial fetch)
    if (cards.length > 10) {
      console.log('[Discovery] Skipping fetchNextBatch - already have enough cards cached');
      return;
    }
    
    try {
      setLoadingMore(true);
      isFetchingNextBatchRef.current = true;
      
      console.log(`[Discovery] Fetching next batch with cursor: ${nextCursor || 'initial'}`);
      
      // Get request IDs directly from the server - THE SINGLE SOURCE OF TRUTH
      // The server already tracks which cards have been processed and excludes them
      let serverProcessedIds: string[] = [];
      try {
        const latestRequests = await apiRequest('/api/user-requests') as any[];
        if (latestRequests && latestRequests.length > 0) {
          // Extract all collaboration IDs from requests regardless of action
          // This ensures we filter out ALL cards the user has interacted with
          serverProcessedIds = latestRequests.map(request => request.collaboration_id);
          console.log(`[Discovery] Server reports ${serverProcessedIds.length} requests`);
          
          // Log the actions of requests for debugging
          const skipRequests = latestRequests.filter(request => request.action === 'skip').length;
          const sentRequests = latestRequests.filter(request => request.action === 'request').length;
          console.log(`[Discovery] Request actions - Skip: ${skipRequests}, Sent: ${sentRequests}`);
        } else {
          console.log('[Discovery] Server returned no requests');
        }
      } catch (e) {
        console.warn('[Discovery] Failed to fetch requests from server:', e);
      }
      
      // We only use the local session history for cards processed in the current session
      // that might not have been saved to the server yet
      const sessionIds = requestHistory
        .map(hist => hist.card?.id)
        .filter(Boolean) as string[];
      console.log(`[Discovery] Current session has ${sessionIds.length} cards in local request history`);
      
      // Server IDs + current session IDs
      const uniqueExclusionIds = Array.from(new Set([
        ...serverProcessedIds, 
        ...sessionIds
      ]));
      
      console.log(`[Discovery] Using ${uniqueExclusionIds.length} unique card IDs to exclude`)
      
      // Construct the query parameters
      const params = new URLSearchParams();
      
      // Add cursor if available
      if (nextCursor) {
        params.append('cursor', nextCursor);
      }
      
      // Add limit
      params.append('limit', '10'); // Fetch 10 cards at a time
      
      // Additional diagnostic logging
      console.log('[Discovery] Making collaboration search request with params:', {
        url: `/api/collaborations/search?${params.toString()}`,
        excludeIdsCount: uniqueExclusionIds.length,
        telegramAvailable: !!window.Telegram?.WebApp,
        sessionAuth: !!document.cookie.includes('connect.sid') // Check if we have a session cookie
      });
      
      // Fetch data with cursor-based pagination
      const response = await apiRequest(`/api/collaborations/search?${params.toString()}`, 'POST', {
        excludeIds: uniqueExclusionIds // Send list of swiped card IDs in request body
      }) as PaginatedResponse;
      
      // Log detailed response data for debugging
      console.log('[Discovery] Received collaboration search response:', {
        success: !!response,
        status: 'success',
        itemCount: response?.items?.length || 0,
        hasMore: response?.hasMore || false
      });
      
      // Update state with new cards and pagination info
      if (response && response.items && response.items.length > 0) {
        console.log('[Discovery] Adding items to cards:', response.items.length, 'items');
        
        // Filter out incomplete card data before adding to the state
        const validItems = validateCardData(response.items);
        console.log('[Discovery] Validated items:', validItems.length, 'valid items');
        
        // Important: Force a state update with the new cards
        setCards(prevCards => {
          const newCards = [...prevCards, ...validItems];
          console.log('[Discovery] New cards state will have', newCards.length, 'total cards');
          return newCards;
        });
        
        // Update pagination state
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        
        // Only set all cards viewed if we have no more cards AND current batch is empty
        if (!response.hasMore && response.items.length === 0) {
          setAllCardsViewed(true);
        }
      } else {
        // No cards in the response
        console.log('[Discovery] No items in response', response);
        
        // We need to check if there were actually items in the response
        // but they got filtered out by validation (which might be the issue)
        if (response && response.items && response.items.length > 0) {
          console.log('[Discovery] Server returned items but they were filtered out by validation');
          // Force a reset of pagination to try from the beginning
          setNextCursor(undefined);
          setHasMore(true);
          // Schedule a retry
          setTimeout(fetchNextBatch, 1000);
        } else if (cards.length === 0) {
          // Only set allCardsViewed=true if we have no cards at all
          console.log('[Discovery] No cards available after fetch, setting allCardsViewed=true');
          setAllCardsViewed(true);
          setHasMore(false);
        } else {
          // We still have some cards to show
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('[Discovery] Error fetching next batch:', error);
      // Check if this is an authentication error
      if (error && (
        (error as Error).name === 'AuthenticationError' || 
        ((error as Error).message && (error as Error).message.includes('Unauthorized'))
      )) {
        setAuthError(true);
      }
    } finally {
      setLoadingMore(false);
      isFetchingNextBatchRef.current = false;
      
      // Additional logging to verify loading state
      console.log('[Discovery] Completed fetchNextBatch, current state:', {
        cardCount: cards.length,
        loadingMore: false,
        hasMore,
        authError
      });
    }
  };
  
  // Handle initial data loading on component mount
  useEffect(() => {
    // Logging only on component mount to help with debugging
    console.log('[Discovery] Component mounted with route:', {
      location,
      windowLocation: window.location.pathname,
      telegramAvailable: !!window?.Telegram?.WebApp,
      telegramInitData: !!window?.Telegram?.WebApp?.initData
    });
    
    // Initial setup of refs
    initialLoadCompletedRef.current = false;
    prevLocationRef.current = location;
    lastFetchTimeRef.current = Date.now();
    
    // Wait a short time for Telegram authentication to initialize
    // This allows the Telegram SDK to properly initialize
    const initialLoadTimer = setTimeout(() => {
      console.log('[Discovery] Initial data load triggered with authentication check');
      
      // Use the same loading mechanism as refresh for consistency
      handleRefresh();
    }, 300); // Short delay to ensure authentication is ready
    
    // Return cleanup function
    return () => {
      console.log('[Discovery] Component unmounting, cleaning up');
      clearTimeout(initialLoadTimer);
    };
  }, []); // Empty dependency array - only runs once on mount
  

  
  // Track the current card index for optimal pre-loading
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  // Auto-fetch more cards when we're running low or approaching the end of the batch
  useEffect(() => {
    // Check cooldown first to avoid excessive API calls
    const now = Date.now();
    const timeSinceLastRequest = now - requestCooldownTimeRef.current;
    const COOLDOWN_PERIOD_MS = 3000; // 3 seconds cooldown
    
    if (timeSinceLastRequest < COOLDOWN_PERIOD_MS) {
      // Still in cooldown period, do nothing
      return;
    }
    
    // Conditions to trigger a fetch:
    // 1. User is on the last card (last chance to load more before empty state)
    const onLastCard = cards.length > 0 && currentCardIndex === cards.length - 1;
    
    // 2. Extremely low card count (only 1 card left)
    const criticallyLowCardCount = cards.length === 1;
    
    // 3. Completely out of cards (but only if hasMore is true so we don't spam when at the end)
    const noCardsWithMoreAvailable = cards.length === 0 && hasMore;
    
    // Much more conservative fetch trigger - only fetch when absolutely necessary
    const shouldFetchMore = (onLastCard || criticallyLowCardCount || noCardsWithMoreAvailable) && 
                            !loadingMore && 
                            !isLoading;
    
    // Only set all cards viewed if server has confirmed no more cards AND we have none locally
    const emptyNoMore = cards.length === 0 && !hasMore && !loadingMore && !isLoading;
    
    if (shouldFetchMore) {
      console.log('[Discovery] Fetching more cards...', {
        reason: cards.length === 0 ? 'no cards left' :
                criticallyLowCardCount ? 'critically low card count' : 
                'on last card',
        currentCardIndex,
        totalCards: cards.length,
        hasMore
      });
      
      // If we have no cards and hasMore is false, we need to reset pagination
      // to try a completely fresh search (this helps when server pagination is off)
      if (cards.length === 0 && !hasMore) {
        console.log('[Discovery] No cards left and hasMore is false - resetting pagination');
        setNextCursor(undefined);
        setHasMore(true);
      }
      
      fetchNextBatch();
    } else if (emptyNoMore) {
      console.log('[Discovery] No more cards available to fetch');
      setAllCardsViewed(true);
      
      // Set up an interval to periodically check for new cards when all have been viewed
      // This replaces the need for a manual refresh button
      const AUTO_RETRY_DELAY_MS = 5000; // 5 seconds
      console.log(`[Discovery] Setting up auto-retry in ${AUTO_RETRY_DELAY_MS/1000}s`);
      
      const retryTimer = setTimeout(() => {
        console.log('[Discovery] Auto-retry: Attempting to find new cards');
        // Reset pagination to start fresh
        setNextCursor(undefined);
        setHasMore(true);
        setAllCardsViewed(false);
        // Reset cooldown to allow immediate fetch
        requestCooldownTimeRef.current = 0;
        // Trigger a fetch
        fetchNextBatch();
      }, AUTO_RETRY_DELAY_MS);
      
      // Clean up timer if the component unmounts or dependencies change
      return () => clearTimeout(retryTimer);
    }
  }, [cards.length, hasMore, loadingMore, isLoading, currentCardIndex]);
  
  // Update the refs whenever the state changes
  useEffect(() => {
    // Update swipe history ref to always have the latest value
    swipeHistoryRef.current = swipeHistory;
  }, [swipeHistory]);

  // Keep cardsRef in sync with actual cards state
  useEffect(() => {
    // Update cardsRef to always have the latest value
    cardsRef.current = cards;
    
    // Log the current cards state for debugging
    console.log('[Discovery] Cards state changed:', {
      cardsLength: cards.length,
      hasData: cards.length > 0,
      firstCardId: cards[0]?.id || 'none',
    });
  }, [cards]);
  
  // Initialize Telegram WebApp when component mounts - this is a critical initialization for the app
  useEffect(() => {
    console.log('[Auth] Component mounted, checking for Telegram WebApp...');
    
    // Check if we need to initialize Telegram WebApp
    if (window?.Telegram?.WebApp) {
      try {
        // Signal that the WebApp is ready
        console.log('[Auth] Telegram WebApp object found, initializing...');
        
        // Initialize the WebApp - this is critical for auth
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Check if initData is available - this is critical for authentication
        const initDataAvailable = !!window.Telegram.WebApp.initData;
        console.log(`[Auth] Telegram initData is ${initDataAvailable ? 'available' : 'missing'} after initialization`);
        
        // Log the user's session info for debugging
        console.log('[Auth] Session information:', {
          hasCookie: document.cookie.includes('connect.sid'),
          location: window.location.pathname,
          referrer: document.referrer,
          clientTime: new Date().toISOString()
        });
        
        if (!initDataAvailable) {
          console.error('[Auth] Telegram WebApp initData is missing - authentication will fail');
          // Set auth error immediately if no initData - this app requires Telegram initData
          setAuthError(true);
          
          // DISABLED: No auto-reload anymore to prevent authentication loops
          console.log('[Auth] Auto-reload on missing Telegram initData has been disabled');
          // User will need to manually reload using the button if needed
        }
      } catch (e) {
        console.error('[Auth] Error initializing Telegram WebApp:', e);
        setAuthError(true);
      }
    } else {
      console.error('[Auth] Telegram WebApp is not available - this app must be opened from Telegram');
      setAuthError(true);
      
      // When testing in Replit webview, we need to show a helpful error
      console.log('[Auth] If testing in Replit webview, you need to use Telegram WebApp integration');
    }
  }, []);
  
  // Add error handling for API authentication errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('[Discovery] Unhandled error:', event.error);
      
      // Check if the error is an authentication error
      if (event.error && (
        event.error.name === 'AuthenticationError' ||
        (event.error.message && event.error.message.includes('Unauthorized'))
      )) {
        console.log('[Auth] Authentication error detected:', event.error);
        setAuthError(true);
      }
      
      // If we hit an error while displaying cards, try to recover gracefully
      if (cards.length === 0 && !isLoading && !loadingMore) {
        console.log('[Discovery] Attempting recovery from error by resetting state');
        
        // Reset state to trigger a fresh load
        setTimeout(() => {
          setNextCursor(undefined);
          setHasMore(true);
          setAllCardsViewed(false);
          
          // Try reloading cards after a short delay
          setTimeout(fetchNextBatch, 1000);
        }, 500);
      }
    };
    
    // Handle unhandled rejections as well (for async errors)
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('[Discovery] Unhandled promise rejection:', event.reason);
      
      if (event.reason && (
        (event.reason.name === 'AuthenticationError') ||
        (event.reason.message && event.reason.message.includes('Unauthorized'))
      )) {
        console.log('[Auth] Authentication rejection detected:', event.reason);
        setAuthError(true);
      }
    };
    
    // Add event listeners
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);
  
  // Navigation auto-refresh has been disabled per user request
  useEffect(() => {
    // Check if we're on the discover page
    const isOnDiscoverPage = location === '/discover';
    
    // Store the new location for future comparison (keeping this for future reference)
    const oldLocation = prevLocationRef.current;
    prevLocationRef.current = location;
    
    console.log('[Discovery] Location change detected:', {
      current: location,
      previous: oldLocation,
      isOnDiscoverPage,
      cardsCount: cardsRef.current.length,
      autoRefreshDisabled: true // Flag indicating auto-refresh is disabled
    });
    
    // No automatic refreshes on navigation as per user request
    console.log('[Discovery] Auto-refresh on navigation has been disabled');
    
  }, [location]);

  // Auto-refresh disabled per user request to prevent authentication issues
  // This effect previously contained code that would auto-refresh content
  // when the page became visible again, which was causing problems for users
  // who couldn't authenticate with Telegram.
  useEffect(() => {
    // Auto-refresh functionality has been disabled
    console.log('[Discovery] Auto-refresh on visibility/focus change has been disabled');
    
    // No event listeners added for visibilitychange or focus
    
    // No clean up needed
    return () => {};
  }, []);
  
  // Authentication retry functionality disabled per user request
  const handleAuthRetry = () => {
    console.log('[Auth] Auth retry functionality has been disabled');
    
    // Simply reload the page instead of trying to automatically refresh authentication
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
    
    // No auto-retry attempts, just keep showing the error state
    // This prevents endless authentication loops
  };
  
  // Helper function already defined above with better variable name (fetchNextBatch)
  // Using that function instead of duplicating code

  // Handle request actions
  const handleRequest = async (action: "skip" | "request", note?: string): Promise<void> => {
    try {
      console.log(`[Discovery] Action: ${action}${note ? ' with note' : ''}`);
      
      // Ensure we have cards to process
      if (cards.length === 0) {
        console.warn('[Discovery] No cards available to process');
        return; // Return promise fulfills without doing anything
      }
      
      const card = cards[0];
      
      // Skip if card is null (shouldn't happen, but just in case)
      if (!card) {
        console.warn('[Discovery] Attempted to swipe on null card');
        return; // Return promise fulfills without doing anything
      }
      
      // Determine if this is a potential match card or regular collaboration
      const isPotentialMatch = !!card.isPotentialMatch;
      console.log(`[Discovery] Card type: ${isPotentialMatch ? 'Potential Match' : 'Regular Collaboration'}`);
      
      // Add to local request history first
      const updatedHistory = [
        ...requestHistory,
        { card, action, index: requestHistory.length }
      ];
      setRequestHistory(updatedHistory);
      
      // Remove the card from the stack
      const remainingCards = cards.slice(1);
      setCards(remainingCards);
      
      // Update current card index for pagination tracking
      // Since we're removing the first card, the current index is now 0 again
      setCurrentCardIndex(0);
      
      // If we've just swiped the last card, immediately trigger a fetch for more
      if (remainingCards.length === 0) {
        console.log('[Discovery] Just swiped the last card, attempting to fetch more immediately');
        // Force reset pagination state to ensure we can fetch more cards
        if (!hasMore) {
          console.log('[Discovery] hasMore is false but we need more cards - forcing pagination reset');
          setNextCursor(undefined);
          setHasMore(true);
          setAllCardsViewed(false);
        }
        // Reset the cooldown to allow immediate fetch
        requestCooldownTimeRef.current = 0;
        // Fetch more in the next render cycle
        setTimeout(() => fetchNextBatch(), 0);
      }
      
      // Log the new current card index
      console.log(`[Discovery] Card swiped, new current index: 0, remaining cards: ${cards.length - 1}`);
      
      // RELIABILITY ENHANCEMENT: Store this processed card ID in localStorage
      // This ensures we never show it again, even if the server call fails or session expires
      try {
        // Get existing processed card IDs from localStorage or initialize empty array
        let persistentProcessedIds: string[] = [];
        const storedIds = localStorage.getItem('processedCardIds');
        if (storedIds) {
          persistentProcessedIds = JSON.parse(storedIds);
        }
        
        // Add this card's ID if it's not already in the list
        if (card.id && !persistentProcessedIds.includes(card.id)) {
          persistentProcessedIds.push(card.id);
          localStorage.setItem('processedCardIds', JSON.stringify(persistentProcessedIds));
          console.log(`[Discovery] Added card ID ${card.id} to persistent storage (total: ${persistentProcessedIds.length})`);
        }
        
        // If this is a potential match, also save the request_id to ensure we properly filter
        if (isPotentialMatch && card.swipe_id && !persistentProcessedIds.includes(card.swipe_id)) {
          persistentProcessedIds.push(card.swipe_id);
          localStorage.setItem('processedCardIds', JSON.stringify(persistentProcessedIds));
          console.log(`[Discovery] Added request ID ${card.swipe_id} to persistent storage (total: ${persistentProcessedIds.length})`);
        }
      } catch (e) {
        console.warn('[Discovery] Failed to store processed card ID in localStorage:', e);
      }
      
      // Prepare and send request data to the server
      const requestData = isPotentialMatch
        ? {
            is_potential_match: true,
            request_id: card.id,
            action
          }
        : {
            collaboration_id: card.id,
            action,
            note // Include note in the request if provided
          };
      
      console.log('[Discovery] Sending request data to server:', requestData);
      
      if (note) {
        console.log('[Discovery] Sending request with personalized note:', note);
      }
      
      const requestResult = await apiRequest('/api/requests', 'POST', requestData);
      console.log('[Discovery] Request recorded successfully:', requestResult);
      
      // Check if we created a match and show match moment if needed
      if (action === 'request' && (isPotentialMatch || requestResult.match_created)) {
        setMatchData({
          title: isPotentialMatch ? "Potential Match" : "New Match",
          companyName: isPotentialMatch ? card.potentialMatchData?.company_name || '' : card.creator_company_name || '',
          collaborationType: card.collab_type || 'Collaboration',
          userName: isPotentialMatch ? card.potentialMatchData?.first_name || '' : ''
        });
        
        // Update match context to indicate a new match was created
        console.log('[Discovery] Match created, updating context');
        setNewMatchCreated(true);
        
        // Show match moment after a short delay
        setTimeout(() => setShowMatch(true), 300);
      } else if (action === 'request') {
        // Show request sent notification for requests that don't create matches
        toast({
          title: "Request Sent!",
          description: "Your collaboration request has been sent.",
        });
      }
      
      // Invalidate queries to ensure fresh data
      // For user requests, we need this data to be up-to-date
      await queryClient.invalidateQueries({ queryKey: ['/api/user-requests'] });
      
      // Force a refresh of the user requests to ensure they're in memory before the next batch fetch
      try {
        console.log('[Discovery] Explicitly fetching updated request data after request');
        const updatedRequests = await apiRequest('/api/user-requests');
        console.log(`[Discovery] Fetched ${updatedRequests.length} requests after recording request`);
      } catch (requestRefreshError) {
        console.warn('[Discovery] Error refreshing requests - continuing anyway:', requestRefreshError);
      }
      
      try {
        // Invalidate matches data - but wrapped in try/catch to prevent any errors
        // from the `/api/matches` endpoint from breaking the card flow
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      } catch (matchError) {
        // Silently handle any error with the matches invalidation
        // This prevents the 500 error in /api/matches from affecting the card flow
        console.warn("[Discovery] Error invalidating matches query - ignoring:", matchError);
      }
      
      // Check if we need to load more cards
      if (cards.length < 3) {
        console.log('[Discovery] Cards running low after swipe, fetching next batch...');
        // Always try to fetch more regardless of hasMore flag
        // This helps recover from pagination state inconsistencies
        if (!hasMore) {
          console.log('[Discovery] hasMore was false, but resetting pagination to try anyway');
          setNextCursor(undefined);
          setHasMore(true);
        }
        fetchNextBatch();
      }
    } catch (error) {
      console.error('[Discovery] Error handling swipe:', error);
      // Even if there's an error, we need to fulfill the promise 
      // so the UI can continue
    }
  };
  
  // View card details
  const handleViewCardDetails = (card: CardData) => {
    console.log('[Discovery] Viewing card details, full card data:', JSON.stringify(card, null, 2));
    
    // First, make a copy of the card data to avoid modifying the original
    const cardWithCompanyData = { ...card };
    
    // Check if this is a potential match card and handle accordingly
    if (card.isPotentialMatch && card.potentialMatchData) {
      console.log('[Discovery] Processing potential match card details');
      console.log('[Discovery] Potential match data job title:', card.potentialMatchData.job_title);
      
      // For potential match cards, use the potentialMatchData fields
      cardWithCompanyData.company_data = {
        // Basic company information
        id: card.potentialMatchData.id || '',
        name: card.potentialMatchData.company_name || '',
        logo_url: card.potentialMatchData.company_logo_url || '',
        description: card.potentialMatchData.company_description || '',
        short_description: card.potentialMatchData.company_description || '',
        website: card.potentialMatchData.company_website || '',
        
        // Social media links
        twitter_handle: card.potentialMatchData.company_twitter || '',
        twitter_followers: card.potentialMatchData.company_twitter_followers || '',
        linkedin_url: card.potentialMatchData.company_linkedin || '',
        
        // Classification information
        funding_stage: '',
        tags: [],
        
        // Additional data
        industry: card.potentialMatchData.industry || '',
      };
      
      // Preserve the job title in potentialMatchData to ensure it's available in the dialog
      if (card.potentialMatchData.job_title) {
        console.log('[Discovery] Setting job_title in potentialMatchData:', card.potentialMatchData.job_title);
        
        // Add job title to both company_data and potentialMatchData to ensure it's accessible
        cardWithCompanyData.potentialMatchData = {
          ...card.potentialMatchData,
          job_title: card.potentialMatchData.job_title
        };
      }
      
      // Get collaboration details from the embedded collaboration object if available
      if (card.collaboration) {
        console.log('[Discovery] Using nested collaboration data from potential match card');
        
        // Add a properly formed collaboration property that will be used in the details dialog
        cardWithCompanyData.collaboration = {
          id: card.collaboration.id,
          title: card.collaboration.title || '',
          collab_type: card.collaboration.collab_type || card.collab_type || 'Collaboration',
          description: card.collaboration.description || '',
          topics: card.collaboration.topics || [],
          details: card.collaboration.details || {},
          creator_id: card.collaboration.creator_id || '',
          creator_company_name: card.collaboration.creator_company_name || ''
        };
        
        // Also add direct fields for backward compatibility
        cardWithCompanyData.title = card.collaboration.title || card.title || '';
        cardWithCompanyData.description = card.collaboration.description || card.description || '';
        cardWithCompanyData.collab_type = card.collaboration.collab_type || card.collab_type || 'Collaboration';
        cardWithCompanyData.topics = card.collaboration.topics || card.topics || [];
        cardWithCompanyData.details = card.collaboration.details || card.details || {};
      } else {
        // Fallback to direct card properties if no embedded collaboration object
        console.log('[Discovery] Using direct card properties for potential match (no embedded collaboration)');
        
        cardWithCompanyData.title = card.title || '';
        cardWithCompanyData.description = card.description || '';
        cardWithCompanyData.collab_type = card.collab_type || 'Collaboration';
        cardWithCompanyData.topics = card.topics || [];
        cardWithCompanyData.details = card.details || {};
      }
      
      // Set the company name for compatibility
      cardWithCompanyData.companyName = card.potentialMatchData.company_name || '';
      cardWithCompanyData.creator_company_name = card.potentialMatchData.company_name || '';
    } 
    // Regular collaboration card
    else if (!cardWithCompanyData.company_data) {
      // Create a complete company_data object with all fields the dialog might need
      cardWithCompanyData.company_data = {
        // Basic company information
        name: card.creator_company_name,
        logo_url: card.company_logo_url || card.creator_company_logo_url,
        description: card.company_description,
        short_description: card.company_description,
        website: card.company_website,
        
        // Social media links
        twitter_handle: card.company_twitter || card.twitter_handle,
        twitter_followers: card.company_twitter_followers || card.twitter_followers,
        linkedin_url: card.company_linkedin || card.linkedin_url,
        
        // Classification information
        funding_stage: card.funding_stage,
        tags: card.company_tags || card.tags,
        
        // Blockchain related fields
        has_token: card.has_token || card.company_has_token,
        token_ticker: card.token_ticker || card.company_token_ticker,
        blockchain_networks: card.blockchain_networks || card.company_blockchain_networks,
        
        // Job information
        job_title: card.creator_role || card.job_title,
      };
      
      // Also set companyName for backward compatibility
      if (!cardWithCompanyData.companyName && cardWithCompanyData.creator_company_name) {
        cardWithCompanyData.companyName = cardWithCompanyData.creator_company_name;
      }
    }
    
    console.log('[Discovery] Opening details dialog with data:', cardWithCompanyData);
    setSelectedCardDetails(cardWithCompanyData);
    setCardDialogOpen(true);
  };
  
  // Handle view details button click (opens details dialog)
  const handleDetailsClick = (id: string) => {
    console.log(`[Discovery] Opening details dialog for collaboration: ${id}`);
    // Find the matching card data
    const card = cards.find(card => card.id === id);
    if (card) {
      // Use the existing card details dialog
      handleViewCardDetails(card);
    } else {
      console.error(`[Discovery] Could not find card data for ID: ${id}`);
    }
  };
  
  // SIMPLIFIED SERVER-SIDE APPROACH to refresh discover feed 
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Save current cards state before refreshing
      const currentCards = [...cards];
      
      // Complete reset of pagination state for a fresh start
      setAllCardsViewed(false);
      setNextCursor(undefined);
      setHasMore(true);
      setCurrentCardIndex(0); // Reset card index when refreshing
      
      // Log session information for debugging
      console.log('[Discovery] Refresh: Session information', {
        hasCookie: document.cookie.includes('connect.sid'),
        telegramAvailable: !!window.Telegram?.WebApp,
        telegramDataAvailable: !!window.Telegram?.WebApp?.initData
      });
      
      // Invalidate and refetch queries to ensure we have fresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/potential-matches'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
      
      try {
        // Handle matches invalidation separately to prevent errors from /api/matches from breaking the card flow
        await queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      } catch (matchError) {
        console.warn("[Discovery] Error invalidating matches query during refresh - ignoring:", matchError);
      }
      
      try {
        // Reset cards array completely for a fresh start
        setCards([]);
        
        // Get swipe IDs directly from the server - THE SINGLE SOURCE OF TRUTH
        // The server already tracks which cards have been swiped and excludes them
        // No need for additional client-side tracking
        const latestSwipes = await apiRequest('/api/user-swipes') as any[];
        console.log(`[Discovery] Refresh: Server reports ${latestSwipes?.length || 0} swipes`);
        
        // We only use the local session history for cards swiped in the current session
        // that might not have been saved to the server yet
        const sessionCardIds = swipeHistory
          .map(hist => hist.card?.id)
          .filter(Boolean) as string[];
        console.log(`[Discovery] Refresh: Current session has ${sessionCardIds.length} cards in local swipe history`);
        
        // Server IDs + current session IDs
        const exclusionIds = [
          ...(latestSwipes?.map(swipe => swipe.collaboration_id) || []),
          ...sessionCardIds
        ];
        
        // Remove duplicates
        const uniqueExclusionIds = Array.from(new Set(exclusionIds));
        console.log(`[Discovery] Refresh: Using ${uniqueExclusionIds.length} unique card IDs to exclude`);

        // We don't need localStorage - the server will exclude all previously swiped cards
        // We just send the current session's cards as additional exclusions
        
        // Fetch potential matches first (users who swiped right on your collaborations)
        const potentialMatchesData = await apiRequest('/api/potential-matches') as any[];
        console.log(`[Discovery] Refresh: Got ${potentialMatchesData?.length || 0} potential matches`);
        
        // Detailed log to see exact structure (useful for fixing collaboration details)
        if (potentialMatchesData && potentialMatchesData.length > 0) {
          console.log('[Discovery] First potential match full structure:', JSON.stringify(potentialMatchesData[0], null, 2));
        }
        
        // Log the raw data to understand its exact structure
        if (potentialMatchesData && potentialMatchesData.length > 0) {
          console.log('[Discovery] Raw potential match data:', JSON.stringify(potentialMatchesData, null, 2));
        } else {
          console.log('[Discovery] No potential matches returned from server');
        }
        
        if (potentialMatchesData && potentialMatchesData.length > 0) {
          // Transform and add potential matches to the card stack
          const formattedMatches = potentialMatchesData.map((match: any) => {
            // Construct proper potentialMatchData object from the raw response
            const potentialMatchData = {
              user_id: match.user?.id || match.user_id || '',
              first_name: match.user?.first_name || match.first_name || '',
              last_name: match.user?.last_name || match.last_name || '',
              company_name: match.company?.name || match.company_name || '',
              company_description: match.company?.description || match.company_description || '',
              company_website: match.company?.website || match.company_website || '',
              company_twitter: match.company?.twitter_handle || match.company_twitter || '',
              company_linkedin: match.company?.linkedin_url || match.company_linkedin || '',
              job_title: match.user?.job_title || match.job_title || '',
              twitter_followers: match.user?.twitter_followers || match.twitter_followers || '',
              company_twitter_followers: match.company?.twitter_followers || match.company_twitter_followers || '',
              swipe_created_at: match.created_at || new Date().toISOString(),
              collaboration_id: match.collaboration_id || '',
              note: match.note || '' // Include the personalized note from the swipe
            };
            
            // Extract collaboration details from API response
            const collaborationInfo = match.collaboration || {};
            
            console.log('[Discovery] Created potentialMatchData:', potentialMatchData);
            console.log('[Discovery] Collaboration info for potential match:', collaborationInfo);
            
            // Build the properly formatted card data
            return {
              ...match,
              id: match.id,
              isPotentialMatch: true,
              collab_type: collaborationInfo.collab_type || match.collab_type || 'Collaboration',
              title: collaborationInfo.title || '',
              description: collaborationInfo.description || '',
              topics: collaborationInfo.topics || [],
              details: collaborationInfo.details || {},
              creator_company_name: potentialMatchData.company_name || '',
              potentialMatchData: potentialMatchData,
              // Store the full collaboration data for direct access
              collaboration: collaborationInfo
            };
          });
          
          // Validate potential matches before setting cards
          const validMatches = formattedMatches.filter(match => {
            // Make sure we have valid potentialMatchData with required fields
            const isValid = match.id && 
                  match.potentialMatchData && 
                  match.potentialMatchData.company_name && 
                  match.potentialMatchData.user_id;
                  
            if (!isValid) {
              console.log('[Discovery] Filtering out invalid potential match in refresh:', {
                id: match.id,
                hasPotentialMatchData: !!match.potentialMatchData,
                companyName: match.potentialMatchData?.company_name,
                userId: match.potentialMatchData?.user_id
              });
            }
            
            return isValid;
          });
          
          console.log(`[Discovery] Filtered potential matches: ${formattedMatches.length} -> ${validMatches.length} valid matches`);
          
          if (validMatches.length > 0) {
            setCards(validMatches);
          } else {
            // If no valid potential matches, make sure we clear cards array
            setCards([]);
          }
        } else {
          // No potential matches found, ensure cards array is empty
          setCards([]);
        }
        
        // Fetch fresh batch of regular collaborations
        const params = new URLSearchParams();
        params.append('limit', '10');
        
        const response = await apiRequest(`/api/collaborations/search?${params.toString()}`, 'POST', {
          excludeIds: uniqueExclusionIds
        }) as PaginatedResponse;
        
        // Update state with new cards and pagination info
        if (response.items && response.items.length > 0) {
          setCards(prevCards => [...prevCards, ...response.items]);
          setNextCursor(response.nextCursor);
          setHasMore(response.hasMore);
          
          console.log('[Discovery] Refresh complete, card count:', 
            (potentialMatchesData?.length || 0) + response.items.length);
        } else if (cards.length === 0) {
          console.log('[Discovery] No cards available after refresh');
          setAllCardsViewed(true);
        }
      } catch (fetchError) {
        console.error('[Discovery] Error fetching new cards during refresh:', fetchError);
        // If the fetch fails, restore the previous cards
        if (currentCards.length > 0) {
          console.log('[Discovery] Restoring previous cards after fetch error');
          setCards(currentCards);
        }
      }
    } catch (error) {
      console.error('[Discovery] Error refreshing feed:', error);
      // Check if this is an authentication error
      if (error && (
        (error as Error).name === 'AuthenticationError' || 
        ((error as Error).message && (error as Error).message.includes('Unauthorized'))
      )) {
        setAuthError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to filters
  const handleOpenFilters = () => {
    setLocation('/discovery-filters');
  };
  
  // Render authentication error state
  if (authError) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center">
          <h1 className="text-xl font-semibold">Discover</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <AuthenticationError
            message="Unable to authenticate with Telegram. Please ensure you're opening this app through the Telegram app."
            onRetry={handleAuthRetry}
          />
        </div>
      </div>
    );
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center">
          <h1 className="text-xl font-semibold">Discover</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading collaboration cards...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render empty state - but only if all these conditions are true:
  // 1. allCardsViewed flag is set (server said no more cards)
  // 2. We have no cards left to show
  // 3. We're not currently loading or refreshing data
  if (allCardsViewed && cards.length === 0 && !isLoading && !loadingMore) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center">
          <h1 className="text-xl font-semibold">Discover</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No more cards to display</h2>
            <p className="text-muted-foreground mb-6">You've viewed all available collaborations that match your criteria.</p>
            
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {/* Only show Adjust Filters button when filters are actually active */}
              {hasActiveFilters && (
                <GlowButton 
                  onClick={handleOpenFilters}
                  icon={<Filter className="h-4 w-4" />}
                  variant="default"
                >
                  Adjust Filters
                </GlowButton>
              )}
              
              {/* Add Reset Swipes button */}
              <Button 
                variant="secondary"
                onClick={() => resetLeftSwipesMutation.mutate()}
                disabled={isResettingSwipes}
                className="flex items-center justify-center gap-2"
              >
                {isResettingSwipes ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Reset Left Swipes
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setLocation('/create-collaboration-v2')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create a Collab
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Card Stack Container */}
      <div className="flex-grow relative flex items-center justify-center p-4">
        <div 
          className="w-full h-[440px] max-w-md mx-auto relative"
          style={{ perspective: "1000px" }} // 3D effect for cards
        >
          <CardStack 
            cards={cards}
            handleRequest={handleRequest}
            handleViewCardDetails={handleViewCardDetails}
            handleDetailsClick={handleDetailsClick}
          />
          
          {/* Loading More Indicator */}
          {(loadingMore || isLoading) && cards.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Finding collaborations for you...</p>
            </div>
          )}
          
          {/* No Cards Available */}
          {!loadingMore && !isLoading && cards.length === 0 && !hasMore && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <SearchX className="h-12 w-12 text-muted-foreground" />
              <p className="text-base text-muted-foreground">No more collaborations available.</p>
              <p className="text-xs text-muted-foreground">Automatically checking for new collaborations...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom controls */}
      <div className="p-4 border-t bg-card/50 flex justify-between items-center">
        {/* <Button 
          variant="outline" 
          onClick={handleOpenFilters}
          size="sm"
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button> */}
        
        {/* Refresh button removed per user request */}
        <div className="flex gap-2">
          {/* Empty div to maintain layout */}
        </div>
      </div>
      
      {/* Card Details Dialog */}
      <CollaborationDetailsDialog
        isOpen={cardDialogOpen}
        onClose={() => setCardDialogOpen(false)}
        collaboration={selectedCardDetails || undefined}
      />
      
      {/* Match Moment Dialog */}
      <MatchMoment
        isOpen={showMatch}
        onClose={() => setShowMatch(false)}
        title={matchData.title}
        companyName={matchData.companyName}
        collaborationType={matchData.collaborationType}
        userName={matchData.userName}
      />
    </div>
  );
}