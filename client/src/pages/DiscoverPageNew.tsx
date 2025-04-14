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
  handleSwipe: (direction: "left" | "right", note?: string) => Promise<void>;
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
  
  // Handle empty state - don't render anything if there are no cards
  if (cards.length === 0) {
    console.log('[CardStack] No cards to render');
    return null;
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
  
  // Refs for tracking state across renders
  const cardsRef = useRef<CardData[]>([]);
  const swipeHistoryRef = useRef<SwipeHistoryItem[]>([]);
  const isFetchingNextBatchRef = useRef(false);
  const initialLoadCompletedRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  
  // Get access to the match context
  const { setNewMatchCreated } = useMatchContext();
  
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
        const transformedMatches = filteredMatches.map((match: any) => {
          // Debug the structure of incoming potential matches
          console.log('[Discovery] Processing potential match data:', {
            hasMatchData: !!match.potentialMatchData,
            matchId: match.id,
            userInfo: match.user_data || match.user || 'No user data',
            companyInfo: match.company_data || match.company || 'No company data'
          });
          
          // Construct the proper potentialMatchData object
          const potentialMatchData = {
            user_id: match.user_id || match.requester_id || '',
            first_name: match.first_name || match.requester_first_name || '',
            last_name: match.last_name || match.requester_last_name || '',
            company_name: match.company_name || match.requester_company || '',
            company_description: match.company_description || match.short_description || match.description || '',
            company_website: match.company_website || match.website || '',
            company_twitter: match.company_twitter || match.twitter_handle || '',
            company_linkedin: match.company_linkedin || match.linkedin || '',
            job_title: match.job_title || match.requester_role || '',
            twitter_followers: match.twitter_followers || '',
            company_twitter_followers: match.company_twitter_followers || '',
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
            creator_company_name: match.company_name || '',
            // Keep these for backward compatibility
            requester_company: match.requester_company || match.company_name || '',
            requester_role: match.requester_role || match.job_title || '',
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
    staleTime: 60 * 1000 // 1 minute
  });
  
  // Helper function to validate card data and filter out incomplete cards
  const validateCardData = (cards: CardData[]): CardData[] => {
    if (!cards || !Array.isArray(cards)) return [];
    
    console.log('[Discovery] Validating card data, original count:', cards.length);
    
    // Filter out cards with missing essential data
    const validCards = cards.filter(card => {
      // Required fields for a valid card
      const hasValidId = !!card.id;
      const hasValidTitle = !!card.title && card.title !== "Collaboration";
      const hasValidCompany = !!card.creator_company_name && card.creator_company_name !== "Company";
      const hasValidType = !!card.collab_type && card.collab_type !== "Collaboration";
      
      // Potential matches can have a slightly different structure
      if (card.isPotentialMatch) {
        const hasPotentialMatchData = !!card.potentialMatchData;
        return hasValidId && hasPotentialMatchData;
      }
      
      // All other cards need company name, title, and collab type
      const isValid = hasValidId && hasValidTitle && hasValidCompany && hasValidType;
      
      if (!isValid) {
        console.log('[Discovery] Filtering out incomplete card:', {
          id: card.id,
          hasValidTitle,
          hasValidCompany, 
          hasValidType,
          title: card.title,
          company: card.creator_company_name,
          type: card.collab_type
        });
      }
      
      return isValid;
    });
    
    console.log('[Discovery] Validation complete, removed:', cards.length - validCards.length);
    return validCards;
  };

  // Function to AGGRESSIVELY ENSURE we're not showing already swiped cards
  const fetchNextBatch = async () => {
    // Prevent fetching if already in progress or if no more cards are available
    if (isFetchingNextBatchRef.current) {
      console.log('[Discovery] Skipping fetchNextBatch - already fetching');
      return;
    }
    
    if (!hasMore && cards.length > 0) {
      console.log('[Discovery] Skipping fetchNextBatch - no more cards available');
      return;
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
        
        // Only set allCardsViewed=true if we have no cards at all
        if (cards.length === 0) {
          console.log('[Discovery] No cards available after fetch, setting allCardsViewed=true');
          setAllCardsViewed(true);
        }
        
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
      
      // Additional logging to verify loading state
      console.log('[Discovery] Completed fetchNextBatch, current state:', {
        cardCount: cards.length,
        loadingMore: false,
        hasMore,
        authError
      });
    }
  };
  
  // We do NOT use this for initial loads - the location change effect handles that
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
    
    // Return cleanup function
    return () => {
      console.log('[Discovery] Component unmounting, cleaning up');
    };
  }, []); // Empty dependency array - only runs once on mount
  

  
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
          telegramVersion: window.Telegram.WebApp.version,
          hasCookie: document.cookie.includes('connect.sid'),
          location: window.location.pathname,
          referrer: document.referrer,
          clientTime: new Date().toISOString()
        });
        
        if (!initDataAvailable) {
          console.error('[Auth] Telegram WebApp initData is missing - authentication will fail');
          // Set auth error immediately if no initData - this app requires Telegram initData
          setAuthError(true);
          
          // Attempt to trigger re-initialization from Telegram
          if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
            console.log('[Auth] Will attempt to reload the page to reinitialize Telegram WebApp in 2 seconds');
            setTimeout(() => window.location.reload(), 2000);
          }
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
  
  // Handle navigation to Discover page - specific effect to track location changes
  useEffect(() => {
    // Check if we're on the discover page
    const isOnDiscoverPage = location === '/discover';
    
    // Check if this is a navigation TO the Discover page from somewhere else
    const isNavigationToDiscoverPage = prevLocationRef.current !== '/discover' && isOnDiscoverPage;
    
    // Store the new location for future comparison
    const oldLocation = prevLocationRef.current;
    prevLocationRef.current = location;
    
    console.log('[Discovery] Location change detected:', {
      current: location,
      previous: oldLocation,
      isOnDiscoverPage,
      isNavigationToDiscoverPage,
      cardsCount: cardsRef.current.length,
      cardIds: cardsRef.current.map(c => c.id).slice(0, 3) // First 3 card IDs for debugging
    });
    
    // Skip remaining logic if we're not on the discover page
    if (!isOnDiscoverPage) {
      return;
    }
    
    // ALWAYS force a refresh when navigating to the Discover page
    // This is the key fix for the navigation issue
    if (isNavigationToDiscoverPage) {
      console.log('[Discovery] Navigation to Discover page detected, forcing data refresh');
      const now = Date.now();
      lastFetchTimeRef.current = now;
      
      // This delay is critical - it gives the component time to fully mount
      // before we try to refresh the data
      setTimeout(() => {
        // Force a complete reload of all data
        console.log('[Discovery] Executing forced refresh after navigation');
        setCards([]); // Clear cards first for clean state
        handleRefresh();
      }, 200);
    } 
    // If we're already on the Discover page but have no cards, also refresh
    else if (cardsRef.current.length === 0) {
      console.log('[Discovery] Already on Discover page but no cards, refreshing data');
      const now = Date.now();
      lastFetchTimeRef.current = now;
      
      setTimeout(() => {
        handleRefresh();
      }, 100);
    }
  }, [location]);

  // Add a focus/visibility listener to ensure cards load when user revisits the page
  useEffect(() => {
    // Function to handle when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Discovery] Page visibility changed to visible');
        
        // Only refresh if we're on the Discover page
        if (window.location.pathname === '/discover') {
          // Only reload if we have no cards or it's been more than 30 seconds
          const now = Date.now();
          const timeSinceLastFetch = now - lastFetchTimeRef.current;
          const shouldRefresh = 
            cardsRef.current.length === 0 || 
            timeSinceLastFetch > 30000; // 30 seconds
          
          if (shouldRefresh) {
            console.log('[Discovery] Refreshing cards on page revisit');
            lastFetchTimeRef.current = now;
            handleRefresh();
          } else {
            console.log('[Discovery] No need to refresh, recent fetch or cards exist');
          }
        }
      }
    };
    
    // Add the visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also handle browser focus events for some browsers
    window.addEventListener('focus', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
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
        
        // Check if init data is available after refresh - this is critical
        const initDataAvailable = !!window.Telegram.WebApp.initData;
        console.log(`[Auth] After refresh, Telegram initData is ${initDataAvailable ? 'available' : 'missing'}`);
        
        if (!initDataAvailable) {
          console.error('[Auth] Telegram WebApp initData still missing after refresh');
          // Set auth error again since we need initData
          setAuthError(true);
          
          // Try a direct window reload as a last resort
          if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
            console.log('[Auth] Attempting to reload the page to reinitialize Telegram WebApp');
            setTimeout(() => window.location.reload(), 500);
            return;
          }
        } else {
          // If initData is available, invalidate all queries to trigger refetching
          queryClient.invalidateQueries();
          
          // Attempt to reload the cards
          handleRefresh();
        }
      } catch (e) {
        console.error('[Auth] Error refreshing Telegram WebApp:', e);
        setAuthError(true);
      }
    } else {
      console.error('[Auth] Telegram WebApp is not available - this app must be opened from Telegram');
      setAuthError(true);
    }
  };
  
  // Helper function already defined above with better variable name (fetchNextBatch)
  // Using that function instead of duplicating code

  // Handle swipe actions
  const handleSwipe = async (direction: "left" | "right", note?: string): Promise<void> => {
    try {
      console.log(`[Discovery] Swipe action: ${direction}${note ? ' with note' : ''}`);
      
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
            direction,
            note // Include note in the request if provided
          };
      
      console.log('[Discovery] Sending swipe data to server:', swipeData);
      
      if (note) {
        console.log('[Discovery] Sending swipe with personalized note:', note);
      }
      
      const swipeResult = await apiRequest('/api/swipes', 'POST', swipeData);
      console.log('[Discovery] Swipe recorded successfully:', swipeResult);
      
      // Check if we created a match and show match moment if needed
      if (direction === 'right' && (isPotentialMatch || swipeResult.match_created)) {
        setMatchData({
          title: card.collab_type,
          companyName: isPotentialMatch ? card.potentialMatchData?.company_name || '' : card.creator_company_name || '',
          collaborationType: card.collab_type || 'Collaboration',
          userName: isPotentialMatch ? card.potentialMatchData?.first_name || '' : ''
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
            potentialMatchData: match.potentialMatchData || null,
          }));
          
          // Validate potential matches before setting cards
          const validMatches = formattedMatches.filter(match => {
            // Make sure we have valid potentialMatchData with required fields
            return match.id && 
                  match.potentialMatchData && 
                  match.potentialMatchData.company_name && 
                  match.potentialMatchData.user_id;
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
  
  // Render empty state
  if (allCardsViewed && cards.length === 0) {
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
        userName={matchData.userName}
      />
    </div>
  );
}