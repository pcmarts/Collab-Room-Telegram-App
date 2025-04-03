import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { Loader2, Filter, SearchX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
// Use relative imports for our custom components
import { GlowButton } from "../components/ui/glow-button";
import { SwipeableCard } from "../components/SwipeableCard";
import { MatchMoment } from "../components/MatchMoment";
import { CollaborationDetailsDialog } from "../components/CollaborationDetailsDialog";
import { AuthenticationError } from "../components/AuthenticationError";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useMatchContext } from "@/contexts/MatchContext";

// Define props for CardStack component
interface CardStackProps {
  cards: CardData[];
  handleSwipe: (direction: "left" | "right") => Promise<void>;
  handleViewCardDetails: (card: CardData) => void;
  x: MotionValue<number>;
  rotate: MotionValue<number>;
  opacity: MotionValue<number>;
}

// CardStack component to handle rendering cards
const CardStack = ({ cards, handleSwipe, handleViewCardDetails, x, rotate, opacity }: CardStackProps) => {
  // Create constrained states for each card position
  const [constrained0, setConstrained0] = useState(true);
  const [constrained1, setConstrained1] = useState(true);
  const [constrained2, setConstrained2] = useState(true);

  // Log current cards state
  console.log('[CardStack] Rendering with', cards.length, 'cards');
  
  if (cards.length === 0) {
    console.log('[CardStack] No cards to render');
  }
  
  return (
    <>
      {cards.slice(0, 3).map((card, index) => {
        // Determine z-index and apply scaling
        const zIndex = cards.length - index;
        
        // Select the appropriate constrained state based on index
        const constrained = index === 0 ? constrained0 : (index === 1 ? constrained1 : constrained2);
        const setConstrained = index === 0 ? setConstrained0 : (index === 1 ? setConstrained1 : setConstrained2);
        
        // Use SwipeableCard for both regular and potential match cards
        return (
          <SwipeableCard
            key={card.id + "-" + index}
            data={card}
            handleSwipe={handleSwipe}
            onInfoClick={() => handleViewCardDetails(card)}
            zIndex={zIndex}
            constrained={constrained}
            setConstrained={setConstrained}
            x={index === 0 ? x : undefined}
            rotate={index === 0 ? rotate : undefined}
            opacity={opacity}
          />
        );
      })}
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

// Define types for swipe history
interface SwipeHistoryItem {
  card: CardData | null;
  direction: "left" | "right";
  index: number;
}

// Type for the paginated response
interface PaginatedResponse {
  items: CardData[];
  hasMore: boolean;
  nextCursor?: string;
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
  
  // State for cards and pagination
  const [cards, setCards] = useState<CardData[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs
  const swipeHistoryRef = useRef<SwipeHistoryItem[]>([]);
  const isFetchingNextBatchRef = useRef(false);
  
  // Get access to the match context
  const { setNewMatchCreated } = useMatchContext();
  
  // Match data for the match moment dialog
  const [matchData, setMatchData] = useState<{
    title: string;
    companyName: string;
    collaborationType: string;
  }>({
    title: '',
    companyName: '',
    collaborationType: ''
  });
  
  // Routing
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Motion values for card animations
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const background = useTransform(
    x,
    [-200, 0, 200],
    [
      "rgba(239, 68, 68, 0.1)",
      "rgba(255, 255, 255, 0)",
      "rgba(34, 197, 94, 0.1)",
    ],
  );
  
  // Get user swipe history to prevent showing already swiped cards
  const { data: serverSwipeHistory } = useQuery({
    queryKey: ['/api/user-swipes'],
    queryFn: async () => {
      try {
        console.log('[Discovery] Fetching user swipe history...');
        const data = await apiRequest('/api/user-swipes');
        console.log(`[Discovery] User swipe history fetched, count: ${data.length}`);
        return data;
      } catch (err) {
        console.error('[Discovery] User swipe history fetch error:', err);
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
    staleTime: 60 * 1000, // 1 minute - balance between freshness and performance
  });
  
  // Extract all swiped card IDs (combining client-side, server-side and localStorage)
  const allSwipedCardIds = useMemo(() => {
    // Get IDs from current session swipe history
    const sessionIds = swipeHistory
      .map(hist => hist.card?.id)
      .filter(Boolean) as string[];
    
    // Get IDs from server swipe history
    const serverIds = serverSwipeHistory 
      ? serverSwipeHistory.map(swipe => swipe.collaboration_id)
      : [];
    
    // Get IDs from localStorage (persistent storage)
    let persistentIds: string[] = [];
    try {
      const storedIds = localStorage.getItem('swipedCardIds');
      if (storedIds) {
        persistentIds = JSON.parse(storedIds);
      }
    } catch (e) {
      console.warn('[Discovery] Failed to retrieve persistent swiped card IDs:', e);
    }
    
    // Combine and deduplicate all sources
    const uniqueIdsSet = new Set([...sessionIds, ...serverIds, ...persistentIds]);
    const uniqueIds = Array.from(uniqueIdsSet);
    
    console.log('[Discovery] All swiped card IDs:', {
      fromState: sessionIds.length,
      fromServer: serverIds.length,
      fromStorage: persistentIds.length,
      uniqueIdsCount: uniqueIds.length
    });
    
    return uniqueIds;
  }, [swipeHistory, serverSwipeHistory]);
  
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
        
        // Filter out any potential matches for cards the user has already swiped on
        // Also remove any potential matches where collaboration_id is missing
        const filteredMatches = data.filter((match: any) => {
          const matchId = match.id;
          const swipeId = match.swipe_id;
          const collabId = match.collaboration_id;
          
          // Check if either the match ID or swipe ID is in the list of already swiped IDs
          const alreadySwiped = 
            (matchId && persistentSwipedIds.includes(matchId)) || 
            (swipeId && persistentSwipedIds.includes(swipeId));
            
          return matchId && !alreadySwiped && collabId;
        });
        
        console.log(`[Discovery] After filtering, ${filteredMatches.length} potential matches remain`);
        
        // Transform the potential matches data to match CardData structure
        return filteredMatches.map((match: any) => ({
          ...match,
          id: match.id,
          isPotentialMatch: true,
          collab_type: match.collaboration_type || match.collab_type || 'Collaboration',
          description: match.collaboration_description || match.description || '',
          topics: match.collaboration_topics || match.topics || [],
          creator_company_name: match.potentialMatchData?.company_name || match.company_name || '',
          requester_company: match.requester_company || match.company_name || '',
          requester_role: match.requester_role || match.company_job_title || '',
        }));
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
    staleTime: 60 * 1000 // 1 minute
  });
  
  // Function to AGGRESSIVELY ENSURE we're not showing already swiped cards
  const fetchNextBatch = async () => {
    // Prevent fetching if already in progress or if no more cards are available
    if (isFetchingNextBatchRef.current || !hasMore) {
      console.log('[Discovery] Skipping fetchNextBatch - already fetching or no more cards');
      return;
    }
    
    // If we already have more than 10 cards, don't fetch more yet
    if (cards.length > 10) {
      console.log('[Discovery] Skipping fetchNextBatch - already have enough cards cached');
      return;
    }
    
    try {
      setLoadingMore(true);
      isFetchingNextBatchRef.current = true;
      
      console.log(`[Discovery] Fetching next batch with cursor: ${nextCursor || 'initial'}`);
      
      // Get swipe IDs directly from the server - THE SINGLE SOURCE OF TRUTH
      // The server already tracks which cards have been swiped and excludes them
      let serverSwipedIds: string[] = [];
      try {
        const latestSwipes = await apiRequest('/api/user-swipes') as any[];
        if (latestSwipes && latestSwipes.length > 0) {
          serverSwipedIds = latestSwipes.map(swipe => swipe.collaboration_id);
          console.log(`[Discovery] Server reports ${serverSwipedIds.length} swipes`);
        } else {
          console.log('[Discovery] Server returned no swipes');
        }
      } catch (e) {
        console.warn('[Discovery] Failed to fetch swipes from server:', e);
      }
      
      // We only use the local session history for cards swiped in the current session
      // that might not have been saved to the server yet
      const sessionIds = swipeHistory
        .map(hist => hist.card?.id)
        .filter(Boolean) as string[];
      console.log(`[Discovery] Current session has ${sessionIds.length} cards in local swipe history`);
      
      // Server IDs + current session IDs
      const uniqueExclusionIds = Array.from(new Set([
        ...serverSwipedIds, 
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
        excludeIds: uniqueExclusionIds, // Log the actual IDs for debugging
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
        itemCount: response?.items?.length || 0
      });
      
      console.log('[Discovery] Fetched batch response:', {
        itemCount: response.items.length,
        hasMore: response.hasMore,
        nextCursor: response.nextCursor || 'none'
      });
      
      // Update state with new cards and pagination info
      if (response.items.length > 0) {
        console.log('[Discovery] Adding items to cards:', JSON.stringify(response.items));
        setCards(prevCards => {
          const newCards = [...prevCards, ...response.items];
          console.log('[Discovery] New cards state will have', newCards.length, 'cards');
          return newCards;
        });
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } else {
        // No more cards available
        console.log('[Discovery] No items in response, setting allCardsViewed=true');
        setAllCardsViewed(true);
        setHasMore(false);
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
    }
  };
  
  // Initial load of cards and potential matches
  useEffect(() => {
    // Initialize the card stack with potential matches and regular cards
    const initializeCards = async () => {
      setIsLoading(true);
      
      try {
        // Reset card state
        setCards([]);
        setAllCardsViewed(false);
        setNextCursor(undefined);
        setHasMore(true);
        
        // Log the discovered preferences filters to help diagnose
        console.log('[Discovery] Current discovery preferences:', {
          telegram: window.Telegram?.WebApp ? 'Available' : 'Not Available',
          initData: window.Telegram?.WebApp?.initData ? 'Present' : 'Missing'
        });
        
        // Combine potential matches with initial batch of regular cards
        if (potentialMatches && potentialMatches.length > 0) {
          console.log(`[Discovery] Adding ${potentialMatches.length} potential matches to card stack`);
          setCards(prevCards => [...potentialMatches, ...prevCards]);
        } else {
          console.log('[Discovery] No potential matches available');
        }
        
        // Fetch first batch of regular cards
        console.log('[Discovery] Initiating fetch of regular collaboration cards');
        await fetchNextBatch();
      } catch (error) {
        console.error('[Discovery] Error initializing cards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeCards();
  }, [potentialMatches]);
  

  
  // Auto-fetch more cards when we're running low
  useEffect(() => {
    const shouldFetchMore = cards.length > 0 && cards.length < 5 && hasMore && !loadingMore && !isLoading;
    const emptyNoMore = cards.length === 0 && !hasMore && !loadingMore && !isLoading;
    
    if (shouldFetchMore) {
      console.log('[Discovery] Card count below threshold, fetching more cards...');
      fetchNextBatch();
    } else if (emptyNoMore) {
      console.log('[Discovery] No more cards available to fetch');
      setAllCardsViewed(true);
    }
  }, [cards.length, hasMore, loadingMore, isLoading]);
  
  // Update the swipe history ref whenever the state changes
  useEffect(() => {
    swipeHistoryRef.current = swipeHistory;
  }, [swipeHistory]);
  
  // Initialize Telegram WebApp when component mounts
  useEffect(() => {
    // Check if we need to initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      try {
        // Signal that the WebApp is ready
        console.log('[Auth] Initializing Telegram WebApp');
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Check if initData is available
        const initDataAvailable = !!window.Telegram.WebApp.initData;
        console.log(`[Auth] Telegram initData is ${initDataAvailable ? 'available' : 'missing'} after initialization`);
        
        if (!initDataAvailable) {
          console.warn('[Auth] Telegram WebApp initData is missing after initialization');
        }
      } catch (e) {
        console.error('[Auth] Error initializing Telegram WebApp:', e);
      }
    } else {
      console.warn('[Auth] Telegram WebApp is not available - this app should be opened from Telegram');
    }
  }, []);
  
  // Add error handling for API authentication errors
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      // Check if the error is an authentication error
      if (event.error && (
        event.error.name === 'AuthenticationError' ||
        (event.error.message && event.error.message.includes('Unauthorized'))
      )) {
        console.log('[Auth] Authentication error detected:', event.error);
        setAuthError(true);
      }
    };
    
    // Handle unhandled rejections as well (for async errors)
    const rejectionHandler = (event: PromiseRejectionEvent) => {
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
  
  // Handle authentication retry
  const handleAuthRetry = () => {
    setAuthError(false);
    
    // Reset loading state
    setIsLoading(false);
    
    // If Telegram WebApp is available, try to refresh it
    if (window.Telegram?.WebApp) {
      try {
        console.log('[Auth] Attempting to refresh Telegram WebApp');
        
        // Ensure Telegram WebApp is fully initialized
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Check if init data is available after refresh
        const initDataAvailable = !!window.Telegram.WebApp.initData;
        console.log(`[Auth] After refresh, Telegram initData is ${initDataAvailable ? 'available' : 'missing'}`);
        
        if (!initDataAvailable) {
          console.warn('[Auth] Telegram WebApp initData still missing after refresh');
          // Try a direct window reload as a last resort if we're in a real browser
          if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
            console.log('[Auth] Attempting to reload the page to reinitialize Telegram WebApp');
            setTimeout(() => window.location.reload(), 500);
            return;
          }
        }
      } catch (e) {
        console.error('[Auth] Error refreshing Telegram WebApp:', e);
      }
    } else {
      console.warn('[Auth] Telegram WebApp is not available - this app needs to be opened from Telegram');
    }
    
    // Invalidate all queries to trigger refetching
    queryClient.invalidateQueries();
    
    // Attempt to reload the cards
    handleRefresh();
  };
  
  // Helper function already defined above with better variable name (fetchNextBatch)
  // Using that function instead of duplicating code

  // Handle swipe actions
  const handleSwipe = async (direction: "left" | "right"): Promise<void> => {
    try {
      console.log(`[Discovery] Swipe action: ${direction}`);
      
      // Ensure we have cards to swipe
      if (cards.length === 0) {
        console.warn('[Discovery] No cards available to swipe');
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
      
      // Add to local swipe history first
      const updatedHistory = [
        ...swipeHistory,
        { card, direction, index: swipeHistory.length }
      ];
      setSwipeHistory(updatedHistory);
      
      // Remove the card from the stack
      setCards(cards.slice(1));
      
      // RELIABILITY ENHANCEMENT: Store this swiped card ID in localStorage
      // This ensures we never show it again, even if the server call fails or session expires
      try {
        // Get existing swiped card IDs from localStorage or initialize empty array
        let persistentSwipedIds: string[] = [];
        const storedIds = localStorage.getItem('swipedCardIds');
        if (storedIds) {
          persistentSwipedIds = JSON.parse(storedIds);
        }
        
        // Add this card's ID if it's not already in the list
        if (card.id && !persistentSwipedIds.includes(card.id)) {
          persistentSwipedIds.push(card.id);
          localStorage.setItem('swipedCardIds', JSON.stringify(persistentSwipedIds));
          console.log(`[Discovery] Added card ID ${card.id} to persistent storage (total: ${persistentSwipedIds.length})`);
        }
        
        // If this is a potential match, also save the swipe_id to ensure we properly filter
        if (isPotentialMatch && card.swipe_id && !persistentSwipedIds.includes(card.swipe_id)) {
          persistentSwipedIds.push(card.swipe_id);
          localStorage.setItem('swipedCardIds', JSON.stringify(persistentSwipedIds));
          console.log(`[Discovery] Added swipe ID ${card.swipe_id} to persistent storage (total: ${persistentSwipedIds.length})`);
        }
      } catch (e) {
        console.warn('[Discovery] Failed to store swiped card ID in localStorage:', e);
      }
      
      // Prepare and send swipe data to the server
      const swipeData = isPotentialMatch
        ? {
            is_potential_match: true,
            swipe_id: card.id,
            direction
          }
        : {
            collaboration_id: card.id,
            direction
          };
      
      console.log('[Discovery] Sending swipe data to server:', swipeData);
      
      const swipeResult = await apiRequest('/api/swipes', 'POST', swipeData);
      console.log('[Discovery] Swipe recorded successfully:', swipeResult);
      
      // Check if we created a match and show match moment if needed
      if (direction === 'right' && (isPotentialMatch || swipeResult.match_created)) {
        setMatchData({
          title: card.collab_type,
          companyName: isPotentialMatch ? card.potentialMatchData?.company_name || '' : card.creator_company_name || '',
          collaborationType: card.collab_type || 'Collaboration'
        });
        
        // Update match context to indicate a new match was created
        console.log('[Discovery] Match created, updating context');
        setNewMatchCreated(true);
        
        // Show match moment after a short delay
        setTimeout(() => setShowMatch(true), 300);
      }
      
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      
      // Check if we need to load more cards
      if (cards.length < 3 && hasMore) {
        console.log('[Discovery] Cards running low, fetching next batch...');
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
    setSelectedCardDetails(card);
    setCardDialogOpen(true);
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
        
        if (potentialMatchesData && potentialMatchesData.length > 0) {
          // Transform and add potential matches to the card stack
          const formattedMatches = potentialMatchesData.map((match: any) => ({
            ...match,
            id: match.id,
            isPotentialMatch: true,
            collab_type: match.collab_type || 'Collaboration',
            creator_company_name: match.potentialMatchData?.company_name || '',
          }));
          
          setCards(formattedMatches);
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
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading collaboration cards...</p>
      </div>
    );
  }
  
  // Render empty state
  if (allCardsViewed && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No more cards to display</h2>
        <p className="text-muted-foreground mb-6">You've viewed all available collaborations that match your criteria.</p>
        
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <GlowButton 
            onClick={handleOpenFilters}
            icon={<Filter className="h-4 w-4" />}
            variant="default"
          >
            Adjust Filters
          </GlowButton>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Card Stack Container */}
      <div className="flex-grow relative flex items-center justify-center p-4">
        <div 
          className="w-full h-[500px] max-w-md mx-auto relative"
          style={{ perspective: "1000px" }} // 3D effect for cards
        >
          <CardStack 
            cards={cards}
            handleSwipe={handleSwipe}
            handleViewCardDetails={handleViewCardDetails}
            x={x}
            rotate={rotate}
            opacity={opacity}
          />
          
          {/* Loading More Indicator */}
          {loadingMore && cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom controls */}
      <div className="p-4 border-t bg-card/50 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleOpenFilters}
          className="rounded-full h-10 w-10"
        >
          <Filter className="h-5 w-5" />
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
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
      />
    </div>
  );
}