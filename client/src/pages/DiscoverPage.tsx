import { useState } from "react"
import { SwipeableCard } from "@/components/SwipeableCard"

// Dummy data for testing
const DUMMY_CARDS = [
  {
    id: "1",
    title: "Looking for Podcast Guest",
    companyName: "Web3 Insights",
    roleTitle: "Head of Content",
    collaborationType: "Podcast Guest Appearance",
    description: "Join our weekly podcast discussing the latest trends in blockchain technology and DeFi innovations. We're looking for experts to share insights on recent developments. Episodes typically run for 45-60 minutes with a focus on educational content for our growing audience.",
  },
  {
    id: "2",
    title: "Twitter Space Co-host Needed",
    companyName: "CryptoTech Solutions",
    roleTitle: "Community Manager",
    collaborationType: "Twitter Spaces Guest",
    description: "We're hosting a Twitter Space about the future of NFTs and digital collectibles. Seeking a co-host with experience in the NFT space to help facilitate discussion and share expertise with our community.",
  },
  {
    id: "3",
    title: "Blog Collaboration Opportunity",
    companyName: "DeFi Daily",
    roleTitle: "Content Director",
    collaborationType: "Blog Post Feature",
    description: "Looking for guest writers to contribute to our blog about decentralized finance. Topics include yield farming, liquidity pools, and emerging DeFi protocols. Articles should be between 1000-2000 words with a focus on technical analysis.",
  },
];

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: "left" | "right") => {
    console.log(`Swiped ${direction} on card ${DUMMY_CARDS[currentIndex].id}`);

    if (direction === "right") {
      console.log("Match requested!");
    }

    setCurrentIndex((prev) => (prev === DUMMY_CARDS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="container max-w-md mx-auto py-6 relative min-h-[80vh]">
        <h1 className="text-2xl font-bold mb-6">Discover</h1>

        <div className="relative w-full aspect-[3/4] mx-auto">
          {DUMMY_CARDS.map((card, index) => (
            <SwipeableCard
              key={card.id}
              data={card}
              onSwipe={handleSwipe}
              active={index === currentIndex}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Swipe right to request collaboration</p>
          <p>Swipe left to pass</p>
          <p>Tap card to see more details</p>
        </div>
      </div>
    </div>
  );
}