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
import { PotentialMatchCard } from "../components/PotentialMatchCard";
import { MatchMoment } from "../components/MatchMoment";
import { CollaborationDetailsDialog } from "../components/CollaborationDetailsDialog";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Define props for CardStack component
interface CardStackProps {
  cards: CardData[];
  handleSwipe: (direction: "left" | "right") => void;
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
        const scale = index === 0 ? 1 : 1 - index * 0.05;
        const translateY = index === 0 ? 0 : index * 10;
        
        // Select the appropriate constrained state based on index
        const constrained = index === 0 ? constrained0 : (index === 1 ? constrained1 : constrained2);
        const setConstrained = index === 0 ? setConstrained0 : (index === 1 ? setConstrained1 : setConstrained2);
        
        return card.isPotentialMatch ? (
          <PotentialMatchCard
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
        ) : (
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
  
  // State for cards and pagination
  const [cards, setCards] = useState<CardData[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  
  // Refs
  const swipeHistoryRef = useRef<SwipeHistoryItem[]>([]);
  const isFetchingNextBatchRef = useRef(false);
  
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
        throw err;
      }
    },
    staleTime: 60 * 1000, // 1 minute - balance between freshness and performance
  });
  
  // Extract all swiped card IDs (combining client-side and server-side)
  const allSwipedCardIds = useMemo(() => {
    // Get IDs from current session swipe history
    const sessionIds = swipeHistory
      .map(hist => hist.card?.id)
      .filter(Boolean) as string[];
    
    // Get IDs from server swipe history
    const serverIds = serverSwipeHistory 
      ? serverSwipeHistory.map(swipe => swipe.collaboration_id)
      : [];
    
    // Combine and deduplicate
    const uniqueIdsSet = new Set([...sessionIds, ...serverIds]);
    const uniqueIds = Array.from(uniqueIdsSet);
    
    console.log('[Discovery] All swiped card IDs:', {
      fromState: swipeHistory.length,
      fromServer: serverIds.length,
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
        
        // Transform the potential matches data to match CardData structure
        return data.map((match: any) => ({
          ...match,
          id: match.id,
          isPotentialMatch: true,
          collab_type: match.collab_type || 'Collaboration',
          creator_company_name: match.potentialMatchData?.company_name || '',
          // Include other needed fields
        }));
      } catch (err) {
        console.error('[Discovery] Potential matches fetch error:', err);
        return [];
      }
    },
    staleTime: 60 * 1000 // 1 minute
  });
  
  // Function to fetch the next batch of cards with cursor-based pagination
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
      
      // Construct the query parameters
      const params = new URLSearchParams();
      
      // Add cursor if available
      if (nextCursor) {
        params.append('cursor', nextCursor);
      }
      
      // Add limit
      params.append('limit', '10'); // Fetch 10 cards at a time
      
      // Fetch data with cursor-based pagination
      const response = await apiRequest(`/api/collaborations/search?${params.toString()}`, 'POST', {
        excludeIds: allSwipedCardIds // Send swiped card IDs in request body
      }) as PaginatedResponse;
      
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
        
        // Combine potential matches with initial batch of regular cards
        if (potentialMatches && potentialMatches.length > 0) {
          console.log(`[Discovery] Adding ${potentialMatches.length} potential matches to card stack`);
          setCards(prevCards => [...potentialMatches, ...prevCards]);
        }
        
        // Fetch first batch of regular cards
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
  
  // Handle swipe actions
  const handleSwipe = async (direction: "left" | "right") => {
    try {
      console.log(`[Discovery] Swipe action: ${direction}`);
      
      // Ensure we have cards to swipe
      if (cards.length === 0) {
        console.warn('[Discovery] No cards available to swipe');
        return;
      }
      
      const card = cards[0];
      
      // Skip if card is null (shouldn't happen, but just in case)
      if (!card) {
        console.warn('[Discovery] Attempted to swipe on null card');
        return;
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
    }
  };
  
  // View card details
  const handleViewCardDetails = (card: CardData) => {
    setSelectedCardDetails(card);
    setCardDialogOpen(true);
  };
  
  // Refresh discover feed
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Reset state
      setCards([]);
      setAllCardsViewed(false);
      setNextCursor(undefined);
      setHasMore(true);
      
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['/api/potential-matches'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
      
      // Fetch new cards
      await fetchNextBatch();
    } catch (error) {
      console.error('[Discovery] Error refreshing feed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to filters
  const handleOpenFilters = () => {
    setLocation('/discovery-filters');
  };
  
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
          className="w-full h-full max-w-md mx-auto relative"
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