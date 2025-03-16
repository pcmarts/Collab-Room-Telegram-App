import { useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Info, Check, Coffee, Calendar, Megaphone, Twitter, Linkedin, Building } from "lucide-react";
import { CollaborationDialog } from "@/components/CollaborationDialog";
import { Badge } from "@/components/ui/badge";

// Updated dummy data structure to support different card types
const DUMMY_CARDS = [
  {
    id: "1",
    type: "marketing",
    title: "Looking for Podcast Guest",
    companyName: "Web3 Insights",
    roleTitle: "Head of Content",
    collaborationType: "Podcast Guest Appearance",
    description: "Join our weekly podcast discussing the latest trends in blockchain technology and DeFi innovations.",
    goals: "Share insights about DeFi innovations and reach new audience segments",
    expectations: "45-minute podcast session, preparation meeting required",
    companyTwitter: "web3insights",
    twitterFollowers: "25.6K",
    companyLinkedIn: "web3insights",
    companySector: "Web3 Media & Content",
  },
  {
    id: "2",
    type: "conference",
    title: "ETH Lisbon 2025 Coffee Chat",
    companyName: "CryptoTech Solutions",
    roleTitle: "Community Manager",
    eventName: "ETH Lisbon 2025",
    availability: "April 15-17, 2025",
    preferredTopics: ["DeFi", "NFT Gaming", "Web3 Social"],
    description: "Looking to connect with fellow Web3 enthusiasts during ETH Lisbon",
    companyTwitter: "cryptotechsol",
    twitterFollowers: "12.8K",
    companyLinkedIn: "cryptotech-solutions",
    companySector: "Blockchain Infrastructure",
  },
  {
    id: "3",
    type: "request",
    title: "Twitter Space Collaboration Request",
    companyName: "DeFi Daily",
    roleTitle: "Content Director",
    requestingUser: "Sarah Chen",
    requestReason: "Your expertise in DeFi would be valuable for our upcoming Twitter Space about emerging DeFi trends",
    description: "Would love to have you as a speaker in our Twitter Space about DeFi trends",
    companyTwitter: "defidaily",
    twitterFollowers: "45.2K",
    companyLinkedIn: "defi-daily",
    companySector: "DeFi News & Analysis",
  },
];

// Card type components
const MarketingCard = ({ data }) => (
  <div className="space-y-4">
    <Badge variant="outline" className="bg-primary/10">
      <Megaphone className="w-4 h-4 mr-1" />
      {data.collaborationType}
    </Badge>
    <h3 className="text-2xl font-semibold">{data.title}</h3>
    <div className="space-y-1">
      <p className="text-lg">{data.companyName}</p>
      <p className="text-sm text-muted-foreground">{data.roleTitle}</p>
    </div>
    <p className="text-sm text-muted-foreground">{data.description}</p>
  </div>
);

const ConferenceCard = ({ data }) => (
  <div className="space-y-4">
    <Badge variant="outline" className="bg-secondary/10">
      <Coffee className="w-4 h-4 mr-1" />
      Coffee Chat
    </Badge>
    <h3 className="text-2xl font-semibold">{data.eventName}</h3>
    <div className="space-y-1">
      <p className="text-lg">{data.companyName}</p>
      <p className="text-sm text-muted-foreground">{data.roleTitle}</p>
    </div>
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Calendar className="w-4 h-4" />
      <span>{data.availability}</span>
    </div>
  </div>
);

const RequestCard = ({ data }) => (
  <div className="space-y-4">
    <Badge variant="outline" className="bg-destructive/10">
      Collaboration Request
    </Badge>
    <h3 className="text-2xl font-semibold">{data.title}</h3>
    <div className="space-y-1">
      <p className="text-lg">From: {data.requestingUser}</p>
      <p className="text-sm text-muted-foreground">{data.companyName} - {data.roleTitle}</p>
    </div>
    <p className="text-sm text-muted-foreground">{data.description}</p>
  </div>
);

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(DUMMY_CARDS);
  const [showDialog, setShowDialog] = useState(false);
  const cardElem = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const controls = useAnimation();
  const [constrained, setConstrained] = useState(true);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
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

  const handleSwipe = async (direction: "left" | "right") => {
    setConstrained(false);
    const parentWidth =
      cardElem.current?.parentElement?.getBoundingClientRect().width || 1000;
    const childWidth = cardElem.current?.getBoundingClientRect().width || 500;
    const flyAwayDistance =
      direction === "left"
        ? -parentWidth / 2 - childWidth / 2
        : parentWidth / 2 + childWidth / 2;

    await controls.start({
      x: flyAwayDistance,
      transition: { duration: 0.3 },
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

  const renderCard = (card) => {
    switch (card.type) {
      case "marketing":
        return <MarketingCard data={card} />;
      case "conference":
        return <ConferenceCard data={card} />;
      case "request":
        return <RequestCard data={card} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="container max-w-md mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Discover</h1>

        <div className="relative w-full aspect-[3/4]">
          {/* Background Card (Next in Stack) */}
          {currentIndex < cards.length - 1 && (
            <div className="absolute inset-0 transform scale-[0.95] opacity-50">
              <Card className="w-full h-full p-6 select-none">
                {renderCard(cards[currentIndex + 1])}
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
              {renderCard(currentCard)}

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