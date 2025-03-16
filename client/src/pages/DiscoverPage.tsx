import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Info, Check } from "lucide-react";
import { CollaborationDialog } from "@/components/CollaborationDialog";

const DUMMY_CARDS = [
  {
    id: "1",
    title: "Looking for Podcast Guest",
    companyName: "Ethereum Foundation",
    roleTitle: "VP Marketing",
    collaborationType: "Podcast Guest Appearance",
    description: "Join our weekly podcast discussing the latest trends in blockchain technology and DeFi innovations.",
  },
  {
    id: "2",
    title: "Twitter Space Co-host Needed",
    companyName: "Polygon",
    roleTitle: "Community Manager",
    collaborationType: "Twitter Spaces Guest",
    description: "We're hosting a Twitter Space about the future of NFTs and digital collectibles.",
  },
  {
    id: "3",
    title: "Blog Collaboration Opportunity",
    companyName: "Rarible",
    roleTitle: "Content Director",
    collaborationType: "Blog Post Feature",
    description: "Looking for guest writers to contribute to our blog about decentralized finance.",
  },
];

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(DUMMY_CARDS);
  const [showDialog, setShowDialog] = useState(false);
  const cardElem = useRef(null);

  const x = useMotionValue(0);
  const controls = useAnimation();
  const [constrained, setConstrained] = useState(true);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const background = useTransform(
    x,
    [-200, 0, 200],
    ["rgba(239, 68, 68, 0.1)", "rgba(255, 255, 255, 0)", "rgba(34, 197, 94, 0.1)"]
  );

  const handleSwipe = async (direction: 'left' | 'right') => {
    setConstrained(false);
    const parentWidth = cardElem.current?.parentNode.getBoundingClientRect().width || 1000;
    const childWidth = cardElem.current?.getBoundingClientRect().width || 500;
    const flyAwayDistance = direction === "left"
      ? -parentWidth / 2 - childWidth / 2
      : parentWidth / 2 + childWidth / 2;

    await controls.start({
      x: flyAwayDistance,
      transition: { duration: 0.3 }
    });

    console.log(`Swiped ${direction} on card:`, cards[currentIndex]);

    setCurrentIndex((prev) => {
      if (prev === cards.length - 1) {
        setCards([...DUMMY_CARDS].sort(() => Math.random() - 0.5));
        return 0;
      }
      return prev + 1;
    });

    x.set(0);
    setConstrained(true);
    controls.set({ x: 0 });
  };

  const currentCard = cards[currentIndex];

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="container max-w-md mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Discover</h1>

        <div className="relative w-full aspect-[3/4]">
          {/* Background Card (Next in Stack) */}
          {currentIndex < cards.length - 1 && (
            <div className="absolute inset-0 transform scale-[0.95] opacity-50">
              <Card className="w-full h-full p-6 select-none">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {cards[currentIndex + 1].collaborationType}
                </div>
                <h3 className="text-2xl font-semibold mb-2">{cards[currentIndex + 1].title}</h3>
                <div className="flex flex-col space-y-1">
                  <p className="text-lg">{cards[currentIndex + 1].companyName}</p>
                  <p className="text-sm text-muted-foreground">{cards[currentIndex + 1].roleTitle}</p>
                </div>
              </Card>
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
              if (Math.abs(info.offset.x) > threshold) {
                handleSwipe(info.offset.x > 0 ? "right" : "left");
              }
            }}
            whileTap={{ cursor: "grabbing" }}
          >
            <Card className="w-full h-full p-6 select-none cursor-grab active:cursor-grabbing">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                {currentCard.collaborationType}
              </div>
              <h3 className="text-2xl font-semibold mb-2">{currentCard.title}</h3>
              <div className="flex flex-col space-y-1">
                <p className="text-lg">{currentCard.companyName}</p>
                <p className="text-sm text-muted-foreground">{currentCard.roleTitle}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{currentCard.description}</p>

              {/* Action Buttons */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex justify-between gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => handleSwipe("left")}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => setShowDialog(true)}
                  >
                    <Info className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => handleSwipe("right")}
                  >
                    <Check className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Swipe right to request collaboration</p>
          <p>Swipe left to pass</p>
        </div>

        {/* Detailed View Dialog */}
        <CollaborationDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          collaboration={currentCard}
        />
      </div>
    </div>
  );
}