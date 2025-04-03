import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Settings,
  SlidersVertical,
  Coffee,
  Calendar,
  RotateCcw,
  X,
  Heart,
  Info,
  Building,
  Twitter,
  Headphones,
  FileText,
  Video,
  Mail,
  BarChart,
  Radio,
  Megaphone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CollaborationDetailsDialog } from "@/components/CollaborationDetailsDialog";
import { NetworkStatus } from "@/components/NetworkStatus";
import { MatchNotification } from "@/components/MatchNotification";
import { GlowFilterButton } from "@/components/GlowFilterButton";
import { PotentialMatchCard } from "@/components/PotentialMatchCard";
import { RegularCard } from "@/components/cards";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Collaboration as BaseCollaboration } from "@shared/schema";
import { motion, useMotionValue, useTransform, useAnimationControls } from "framer-motion";

// Custom styling for MyCollab cards (with gradient background)
const MyCollabStyles = () => (
  <style jsx global>{`
    [data-mycollab="true"] {
      background: linear-gradient(to bottom right, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%);
      color: white;
      border-radius: var(--radius);
      padding: 1.5rem;
      height: 100%;
    }
  `}</style>
);

type CardData = {
  id?: string;
  companyName?: string;
  title?: string;
  description?: string;
  type?: string;
  collaborationType?: string;
  topics?: string[];
  preferredTopics?: string[];
  roleTitle?: string;
  date?: string;
  specific_date?: string;
  details?: {
    host_twitter_handle?: string;
    host_follower_count?: string;
    twittercomarketing_type?: string | string[];
    [key: string]: any;
  };
  [key: string]: any;
};

// We've simplified all card components to use a single RegularCard component.
// The RegularCard component handles different card types including Twitter co-marketing,
// displaying information like Twitter handles, follower counts, collaboration types, and dates.

interface Collaboration extends BaseCollaboration {
  isPotentialMatch?: boolean;
  potentialMatchData?: {
    matchScore: number;
    matchReasons: string[];
    userInterests: string[];
    collaborationTopics: string[];
  };
}

// Helper function to determine company name for display
const getCompanyName = (card: any): string => {
  return card.company_name || 
         (card.details && card.details.company_name) || 
         "Company";
};

// Helper function to get the collaboration type from a card
const getCollaborationTypeFromCard = (card: any): string => {
  if (!card || !card.collab_type) return "Collaboration";
  return card.collab_type;
};

export default function DiscoverPage() {
  const [location, setLocation] = useLocation();
  
  // References
  const pageRef = useRef<HTMLDivElement>(null);
  const cardElem = useRef<HTMLDivElement>(null);
  
  // Animation state
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-100, 0, 100], [-10, 0, 10]);
  const opacity = useTransform(x, [-100, -50, 0, 50, 100], [0, 1, 1, 1, 0]);
  const background = useTransform(
    x, 
    [-100, 0, 100], 
    ["rgba(239, 68, 68, 0.1)", "rgba(255, 255, 255, 0)", "rgba(34, 197, 94, 0.1)"]
  );
  const controls = useAnimationControls();
  
  // UI state
  const [cards, setCards] = useState<Collaboration[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeHistory, setSwipeHistory] = useState<{index: number, id: string}[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [constrained, setConstrained] = useState(true);
  const [canUpdateCards, setCanUpdateCards] = useState(true);
  
  // Card animation and state
  const currentCard = cards[currentIndex];
  
  // Match notification state
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchData, setMatchData] = useState<{id: string, title: string}>({id: "", title: ""});
  
  // All cards viewed state
  const [allCardsViewed, setAllCardsViewedState] = useState<boolean>(() => {
    try {
      // Try to get the value from localStorage
      const storageKey = 'allCardsViewed';
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? JSON.parse(storedValue) : false;
    } catch (e) {
      return false;
    }
  });
  
  const setAllCardsViewed = (value: boolean) => {
    try {
      // Update state
      const storageKey = 'allCardsViewed';
      localStorage.setItem(storageKey, JSON.stringify(value));
      setAllCardsViewedState(value);
    } catch (e) {
      console.error("Error setting allCardsViewed state:", e);
    }
  };
  
  // API Fetching Logic
  const { data: potentialMatchesData, isLoading: isPotentialMatchesLoading } = useQuery({
    queryKey: ['/api/potential-matches'],
    refetchOnWindowFocus: false,
  });
  
  const { data: collaborationsData, isLoading: isCollaborationsLoading } = useQuery({
    queryKey: ['/api/collaborations/search'],
    refetchOnWindowFocus: false,
  });
  
  const { data: userSwipesData } = useQuery({
    queryKey: ['/api/user-swipes'],
    refetchOnWindowFocus: false,
  });
  
  const isLoading = isPotentialMatchesLoading || isCollaborationsLoading;
  
  // Get the user's previous swipes
  const allSwipedCardIds = useMemo(() => {
    if (!userSwipesData || !Array.isArray(userSwipesData)) return [];
    
    return userSwipesData.map(swipe => swipe.collaboration_id);
  }, [userSwipesData]);
  
  // Helper function to refresh the collaborations data
  const refreshCollaborations = async () => {
    const queryClient = useQueryClient();
    await queryClient.invalidateQueries({ queryKey: ['/api/collaborations/search'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/potential-matches'] });
    // Set all cards viewed back to false when refreshing
    setAllCardsViewed(false);
  };
  
  // Memorized computation of filtered cards
  const { filteredPotentialMatchCards, filteredRegularCards } = useMemo(() => {
    // Safety checks for data
    if (isLoading) {
      return { filteredPotentialMatchCards: [], filteredRegularCards: [] };
    }
    
    // Process potential matches
    const potentialMatches = Array.isArray(potentialMatchesData) 
      ? potentialMatchesData.filter(c => !allSwipedCardIds.includes(c.id))
      : [];
      
    // Process regular collaborations
    const regularCards = Array.isArray(collaborationsData)
      ? (collaborationsData as any).items.filter((c: any) => (
          // Don't show cards that have already been swiped
          !allSwipedCardIds.includes(c.id)
        ))
      : [];
    
    // Add isPotentialMatch flag to potential matches
    const enhancedPotentialMatches = potentialMatches.map(match => ({
      ...match,
      isPotentialMatch: true,
    }));
    
    // Filter regular cards (excluding any that are also potential matches)
    const potentialMatchIds = enhancedPotentialMatches.map(m => m.id);
    const filteredRegulars = regularCards.filter(
      (card: any) => !potentialMatchIds.includes(card.id)
    );
    
    return {
      filteredPotentialMatchCards: enhancedPotentialMatches,
      filteredRegularCards: filteredRegulars,
    };
  }, [potentialMatchesData, collaborationsData, allSwipedCardIds, isLoading]);
  
  // Combine potential matches and regular cards, with potential matches first
  useEffect(() => {
    if (canUpdateCards) {
      const newCards = [...filteredPotentialMatchCards, ...filteredRegularCards];
      
      if (newCards.length > 0) {
        setCards(newCards);
        // Reset current index if we previously ran out of cards
        if (allCardsViewed) {
          setCurrentIndex(0);
          setAllCardsViewed(false);
        }
      } else if (cards.length === 0) {
        // Only set all cards viewed if we had no cards to begin with
        setAllCardsViewed(true);
      }
    }
  }, [filteredPotentialMatchCards, filteredRegularCards, canUpdateCards, allCardsViewed, cards.length]);
  
  // Handle swipe logic
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentCard || currentIndex >= cards.length) return;
    
    const currentCardId = currentCard.id;
    
    // Update swipe history for undo functionality
    setSwipeHistory(prev => [...prev, {index: currentIndex, id: currentCardId}]);
    
    // Temporary prevent card updates during animation
    setCanUpdateCards(false);
    
    // Calculate target values for animation
    const targetX = direction === 'left' ? -200 : 200;
    
    // Animate card off screen
    await controls.start({
      x: targetX,
      transition: { duration: 0.2 }
    });
    
    // Reset animation for next card
    controls.set({ x: 0 });
    
    // Call the API to record the swipe
    try {
      const isLike = direction === 'right';
      
      // API call to record the swipe
      const response = await apiRequest(`/api/swipes`, {
        method: 'POST',
        body: JSON.stringify({
          collaboration_id: currentCardId,
          direction: isLike ? 'right' : 'left',
          is_like: isLike,
        }),
      });
      
      // Check if it's a match
      if (isLike && response.isMatch) {
        // Show match notification and temporarily pause swiping
        setMatchData({
          id: currentCardId,
          title: currentCard.title || "New Collaboration"
        });
        setShowMatchNotification(true);
        
        // Also invalidate matches query to refresh the match list
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      }
      
      // Debug log: successfully recorded swipe
      console.log(`Successfully swiped ${direction} on card ${currentCardId}`);
      
    } catch (error) {
      console.error("Error recording swipe:", error);
    }
    
    // Move to next card or handle end of deck
    if (currentIndex < cards.length - 1) {
      // Move to next card
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      // Reached the end of cards
      setAllCardsViewed(true);
    }
    
    // Allow card updates again
    setCanUpdateCards(true);
  };
  
  // Undo last swipe
  const handleUndo = async () => {
    if (swipeHistory.length === 0) return;
    
    // Get the last swiped card
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    // Remove from history
    setSwipeHistory(prev => prev.slice(0, -1));
    
    // Temporarily prevent card updates
    setCanUpdateCards(false);
    
    try {
      // Call the API to undo the swipe
      await apiRequest(`/api/swipes/${lastSwipe.id}`, {
        method: 'DELETE',
      });
      
      // Debug log
      console.log(`Successfully undid swipe on card ${lastSwipe.id}`);
      
      // Set the current index back to the previous card
      setCurrentIndex(lastSwipe.index);
      
      // If we were at "all cards viewed" state, exit that state
      if (allCardsViewed) {
        setAllCardsViewed(false);
      }
      
    } catch (error) {
      console.error("Error undoing swipe:", error);
    }
    
    // Allow card updates again
    setCanUpdateCards(true);
  };
  
  // Show info for current card
  const showCardInfo = () => {
    if (currentCard) {
      setShowDialog(true);
    }
  };
  
  // Render card content based on card type
  const renderCard = (card: any) => {
    // Handle the case where card might be null (at the end of the deck)
    if (!card) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-base font-medium mb-1">No More Cards</h3>
          <p className="text-sm text-muted-foreground mb-3">You've reached the end of available collaborations.</p>
          <div className="flex flex-col space-y-2">
            <Button 
              size="sm" 
              onClick={refreshCollaborations}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/discovery-filters')}
              className="text-xs"
            >
              <SlidersVertical className="h-3 w-3 mr-1" />
              Adjust Filters
            </Button>
          </div>
        </div>
      );
    }
    
    // Check if it's a potential match card
    if (card.isPotentialMatch && card.potentialMatchData) {
      // Use our dedicated PotentialMatchCard component
      return (
        <PotentialMatchCard
          data={{
            id: card.id,
            collab_type: card.collab_type,
            description: card.description,
            topics: card.topics,
            potentialMatchData: card.potentialMatchData
          }}
          handleSwipe={handleSwipe}
          onInfoClick={() => setShowDialog(true)}
          zIndex={1}
          constrained={constrained}
          setConstrained={setConstrained}
          x={x}
          controls={controls}
          opacity={opacity}
          rotate={rotate}
        />
      );
    }
    
    // Parse details if it's a string
    let details = {};
    try {
      if (typeof card.details === 'string') {
        details = JSON.parse(card.details);
      } else if (card.details) {
        details = card.details;
      }
    } catch (e) {
      console.error("Error parsing card details:", e);
    }
    
    // Check if this is a "mycollab" card (a collaboration created by the current user)
    const isMyCollab = false; // We don't have mycollab cards in the search results since they are filtered out by the API
    
    // Create a standardized card data object with fallbacks
    const cardData = {
      ...card,
      details,
      companyName: getCompanyName(card),
      title: card.title || 
             (details as any)?.title || 
             (details as any)?.podcast_name || 
             "Collaboration",
      description: card.description || 
                  (details as any)?.short_description || 
                  (details as any)?.description || 
                  "",
      type: card.collab_type, // Use the collaboration type from the database
      collaborationType: card.collab_type || "Collaboration", // For compatibility with the card components
    };
    
    // Add detailed logging to help debug card rendering issues
    console.log("========== CARD DEBUG INFO ==========");
    console.log(`Card ID: ${card.id}`);
    console.log(`Card Type (raw): ${card.collab_type}`);
    console.log(`Is Podcast Card? ${card.id === 'e1d8af65-5fd9-4585-be3a-f65d9ad7c565'}`);
    console.log(`Card Title: ${cardData.title}`);
    console.log(`Company Name: ${cardData.companyName}`);
    console.log(`Card Details:`, JSON.stringify(details, null, 2));
    
    // Special check for podcast collaboration with ID e1d8af65-5fd9-4585-be3a-f65d9ad7c565
    if (card.id === 'e1d8af65-5fd9-4585-be3a-f65d9ad7c565') {
      console.log('SPECIAL ATTENTION: Found podcast collaboration!');
      console.log(`Collab Type Lowercase: ${card.collab_type?.toLowerCase()}`);
      console.log(`Collab Type Case Insensitive Check: podcast = ${card.collab_type?.toLowerCase() === 'podcast'}`);
      
      // Type assertion for the podcast-specific details
      const podcastDetails = details as {
        podcast_name?: string;
        podcast_link?: string;
        estimated_reach?: string;
      };
      
      // Check for properties specific to podcast cards
      console.log(`Has podcast_name: ${!!podcastDetails.podcast_name}`);
      console.log(`Podcast Name: ${podcastDetails.podcast_name || 'N/A'}`);
      console.log(`Has podcast_link: ${!!podcastDetails.podcast_link}`);
      console.log(`Podcast Link: ${podcastDetails.podcast_link || 'N/A'}`);
      console.log(`Has estimated_reach: ${!!podcastDetails.estimated_reach}`);
      console.log(`Estimated Reach: ${podcastDetails.estimated_reach || 'N/A'}`);
    }
    
    // Type assertion for additional common details that might be in any card type
    const extendedDetails = details as {
      twitter_handle?: string;
      company_website?: string;
    };
    
    // Log additional card properties that might affect rendering
    console.log(`Has Twitter handle: ${!!(extendedDetails.twitter_handle || cardData.hostHandle)}`);
    console.log(`Twitter handle value: ${extendedDetails.twitter_handle || cardData.hostHandle || 'N/A'}`);
    console.log(`Has company website: ${!!(extendedDetails.company_website || cardData.companyWebsite)}`);
    console.log(`Company website value: ${extendedDetails.company_website || cardData.companyWebsite || 'N/A'}`);
    
    // Log data passed to card components
    console.log(`Card data being passed to component:`, JSON.stringify(cardData, null, 2));
    
    // Simplified approach: always use RegularCard for all card types
    console.log(`Using RegularCard for card type: ${card.collab_type}`);
    
    // For MyCollab cards, we need to wrap them with a data attribute
    // to target with custom CSS for the gradient background
    if (isMyCollab) {
      return (
        <div data-mycollab="true">
          <RegularCard data={cardData} />
        </div>
      );
    }
    
    return <RegularCard data={cardData} />;
  };

  return (
    <div className="telegram-app min-h-[100svh] bg-background flex flex-col" ref={pageRef}>
      {/* Include the CSS styling component */}
      <MyCollabStyles />
      
      <div className="container max-w-md mx-auto py-4 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-2 px-4">
          <h1 className="text-2xl font-bold p-2">Discover</h1>
          <div className="flex space-x-2">
            <GlowFilterButton onClick={() => setLocation('/discovery-filters')} />
          </div>
        </div>
        
        {/* Card Stack Area */}
        <div className="flex-grow flex flex-col relative">
          {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading collaborations...</p>
              </div>
            </div>
          ) : cards.length === 0 || allCardsViewed ? (
            <div className="flex-grow flex flex-col items-center justify-center p-4">
              <Card className="w-full max-w-md p-6 flex flex-col items-center text-center space-y-4">
                <h2 className="text-xl font-semibold">No More Cards</h2>
                <p className="text-muted-foreground mb-4">
                  You've viewed all available collaborations that match your preferences.
                </p>
                <Button 
                  onClick={refreshCollaborations}
                  className="w-full"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Refresh Collaborations
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/discovery-filters')}
                  className="w-full"
                >
                  <SlidersVertical className="mr-2 h-4 w-4" />
                  Adjust Filters
                </Button>
              </Card>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <div className="w-full max-w-md h-[500px] relative">
                
                {/* Peek at next card */}
                {currentIndex < cards.length - 1 && (
                  <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-card border rounded-lg p-5 shadow-sm opacity-50">
                      {renderCard(cards[currentIndex + 1])}
                    </div>
                  </div>
                )}

                {/* Current Card */}
                <motion.div
                  className="absolute inset-0"
                  ref={cardElem}
                  style={{
                    x,
                    rotate,
                    opacity,
                    background,
                  }}
                  animate={controls}
                  drag="x"
                  dragConstraints={constrained && { left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(_, info) => {
                    const threshold = 100;
                    if (info.offset.x > threshold) {
                      handleSwipe('right');
                    } else if (info.offset.x < -threshold) {
                      handleSwipe('left');
                    }
                  }}
                  whileTap={{ cursor: 'grabbing' }}
                >
                  <Card className="w-full h-full border rounded-lg p-5 bg-card cursor-grab relative shadow-md">
                    {/* Card Content */}
                    {renderCard(currentCard)}

                    {/* Action Buttons */}
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="flex justify-between gap-1">
                        {/* No (X) Button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => handleSwipe("left")}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                        
                        {/* Undo Button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm ${swipeHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleUndo}
                          disabled={swipeHistory.length === 0}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        
                        {/* Info Button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={showCardInfo}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        
                        {/* Yes (Heart) Button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                          onClick={() => handleSwipe("right")}
                        >
                          <Heart className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          )}
        </div>
        
        {/* Card Indicator */}
        {!isLoading && !allCardsViewed && cards.length > 0 && (
          <div className="flex justify-center mt-4 pb-2">
            <p className="text-sm text-muted-foreground">
              Card {currentIndex + 1} of {cards.length}
            </p>
          </div>
        )}
      </div>
      
      {/* Network Status indicator */}
      <NetworkStatus />
      
      {/* Details Dialog */}
      {currentCard && (
        <CollaborationDetailsDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          collaboration={{
            id: currentCard.id,
            title: currentCard.title || "Collaboration",
            companyName: getCompanyName(currentCard),
            description: currentCard.description || "",
            collaborationType: getCollaborationTypeFromCard(currentCard),
            topics: currentCard.topics || [],
            details: currentCard.details || {},
          }}
          onMatch={() => handleSwipe("right")}
          onIgnore={() => handleSwipe("left")}
        />
      )}
      
      {/* Match Notification */}
      <MatchNotification
        show={showMatchNotification}
        onClose={() => setShowMatchNotification(false)}
        matchData={matchData}
      />
    </div>
  );
}