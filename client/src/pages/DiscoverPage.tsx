import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Info, Check, Calendar, Megaphone, HandshakeIcon } from "lucide-react";
import { CollaborationDialog } from "@/components/CollaborationDialog";
import { cn } from "@/lib/utils";

type CollaborationType = "marketing" | "conference" | "request";

interface CollaborationCard {
  id: string;
  type: CollaborationType;
  title: string;
  companyName: string;
  roleTitle: string;
  collaborationType: string;
  description: string;
  eventName?: string;
  availableTimes?: string[];
  requestingUser?: {
    name: string;
    role: string;
    company: string;
  };
}

const DUMMY_CARDS: CollaborationCard[] = [
  {
    id: "1",
    type: "marketing",
    title: "Looking for Podcast Guest",
    companyName: "Ethereum Foundation",
    roleTitle: "VP Marketing",
    collaborationType: "Podcast Guest Appearance",
    description: "Join our weekly podcast discussing the latest trends in blockchain technology and DeFi innovations.",
  },
  {
    id: "2",
    type: "conference",
    title: "Coffee Chat at ETH Lisbon",
    companyName: "Polygon",
    roleTitle: "Community Manager",
    collaborationType: "Conference Meeting",
    description: "Looking to connect with other community managers to discuss growth strategies.",
    eventName: "ETH Lisbon 2025",
    availableTimes: ["March 20th, 10:00-12:00", "March 21st, 14:00-16:00"],
  },
  {
    id: "3",
    type: "request",
    title: "Collaboration Request",
    companyName: "Rarible",
    roleTitle: "Content Director",
    collaborationType: "Blog Post Feature",
    description: "I'd love to collaborate on a joint blog post about the future of NFTs.",
    requestingUser: {
      name: "Sarah Chen",
      role: "Head of Content",
      company: "Rarible",
    },
  },
];

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
    ["rgba(239, 68, 68, 0.1)", "rgba(255, 255, 255, 0)", "rgba(34, 197, 94, 0.1)"]
  );

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!cardElem.current?.parentElement) return;

    setConstrained(false);
    const parentWidth = cardElem.current.parentElement.getBoundingClientRect().width;
    const childWidth = cardElem.current.getBoundingClientRect().width;
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

  const getCardIcon = (type: CollaborationType) => {
    switch (type) {
      case "marketing":
        return <Megaphone className="h-5 w-5 text-primary/60" />;
      case "conference":
        return <Calendar className="h-5 w-5 text-blue-500/60" />;
      case "request":
        return <HandshakeIcon className="h-5 w-5 text-orange-500/60" />;
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
              <Card className={cn(
                "w-full h-full p-6 select-none",
                {
                  "border-primary/20": cards[currentIndex + 1].type === "marketing",
                  "border-blue-500/20": cards[currentIndex + 1].type === "conference",
                  "border-orange-500/20": cards[currentIndex + 1].type === "request",
                }
              )}>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  {getCardIcon(cards[currentIndex + 1].type)}
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
            <Card className={cn(
              "w-full h-full p-6 select-none cursor-grab active:cursor-grabbing",
              {
                "border-primary/20 bg-card": currentCard.type === "marketing",
                "border-blue-500/20 bg-blue-50 dark:bg-blue-900/10": currentCard.type === "conference",
                "border-orange-500/20 bg-orange-50 dark:bg-orange-900/10": currentCard.type === "request",
              }
            )}>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                {getCardIcon(currentCard.type)}
                {currentCard.collaborationType}
              </div>
              <h3 className="text-2xl font-semibold mb-2">{currentCard.title}</h3>
              <div className="flex flex-col space-y-1">
                <p className="text-lg">{currentCard.companyName}</p>
                <p className="text-sm text-muted-foreground">{currentCard.roleTitle}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">{currentCard.description}</p>

              {currentCard.type === "conference" && currentCard.eventName && (
                <div className="mt-4 p-3 rounded-md bg-blue-100 dark:bg-blue-900/20">
                  <p className="font-medium text-sm">{currentCard.eventName}</p>
                  {currentCard.availableTimes?.map((time, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{time}</p>
                  ))}
                </div>
              )}

              {currentCard.type === "request" && currentCard.requestingUser && (
                <div className="mt-4 p-3 rounded-md bg-orange-100 dark:bg-orange-900/20">
                  <p className="font-medium text-sm">Requested by:</p>
                  <p className="text-sm">{currentCard.requestingUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {currentCard.requestingUser.role} at {currentCard.requestingUser.company}
                  </p>
                </div>
              )}

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