import { useState } from "react"
import { SwipeableCard } from "@/components/SwipeableCard"
import { motion, AnimatePresence } from "framer-motion"

// Dummy data for testing
const DUMMY_CARDS = [
  {
    id: "1",
    title: "Looking for Podcast Guest",
    companyName: "Web3 Insights",
    description: "Join our weekly podcast discussing the latest trends in blockchain technology and DeFi innovations. We're looking for experts to share insights on recent developments.",
  },
  {
    id: "2",
    title: "Twitter Space Co-host Needed",
    companyName: "CryptoTech Solutions",
    description: "We're hosting a Twitter Space about the future of NFTs and digital collectibles. Seeking a co-host with experience in the NFT space.",
  },
  {
    id: "3",
    title: "Blog Collaboration Opportunity",
    companyName: "DeFi Daily",
    description: "Looking for guest writers to contribute to our blog about decentralized finance. Topics include yield farming, liquidity pools, and emerging DeFi protocols.",
  },
];

export default function DiscoverPage() {
  const [cards, setCards] = useState(DUMMY_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: "left" | "right") => {
    // Log the swipe action
    console.log(`Swiped ${direction} on card ${cards[currentIndex].id}`);

    // In a real app, we would handle the match request here
    if (direction === "right") {
      // Handle match request
      console.log("Match requested!");
    }

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reset to beginning when we run out of cards
      setCurrentIndex(0);
    }
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="container max-w-md mx-auto py-6 relative min-h-[80vh]">
        <h1 className="text-2xl font-bold mb-6">Discover</h1>

        <div className="relative w-full aspect-[3/4] mx-auto">
          <AnimatePresence>
            {cards.map((card, index) => (
              <div 
                key={card.id}
                className={`absolute inset-0 ${index < currentIndex ? 'hidden' : ''}`}
              >
                <SwipeableCard
                  data={card}
                  onSwipe={handleSwipe}
                  active={index === currentIndex}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Swipe right to request collaboration</p>
          <p>Swipe left to pass</p>
          <p>Tap card to see more details</p>
        </div>
      </div>
    </div>
  )
}