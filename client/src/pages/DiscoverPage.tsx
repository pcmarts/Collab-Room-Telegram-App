import { useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
} from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, Info, Check, Coffee, Calendar, Megaphone, Twitter, 
  Linkedin, Building, Mic, Radio, Video, FileText, BookOpen
} from "lucide-react";
import { CollaborationDialog } from "@/components/CollaborationDialog";
import { NetworkStatus } from "@/components/NetworkStatus";

import { Badge } from "@/components/ui/badge";
import { FiExternalLink } from "react-icons/fi";

// Conference Coffee Card
const ConferenceCoffeeCard = ({ data }) => (
  <div className="space-y-2">
    <Badge variant="outline" className="bg-secondary/10">
      <Coffee className="w-3 h-3 mr-1" />
      Coffee Chat
    </Badge>
    <h3 className="text-lg font-semibold leading-snug">{data.conferenceName}</h3>
    <div className="space-y-0.5">
      <p className="text-sm">{data.companyName}</p>
      <p className="text-xs text-muted-foreground">{data.role}</p>
    </div>
    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      <Calendar className="w-3 h-3" />
      <span>{data.conferenceDate}</span>
    </div>
  </div>
);

// Podcast Guest Appearances Card
const PodcastCard = ({ data }) => (
  <div className="space-y-2">
    <Badge variant="outline" className="bg-primary/10">
      <Mic className="w-3 h-3 mr-1" />
      Podcast Guest
    </Badge>
    <h3 className="text-lg font-semibold leading-snug">{data.podcastName}</h3>
    <div className="space-y-0.5">
      <p className="text-sm">{data.companyName}</p>
    </div>
    <p className="text-xs text-muted-foreground line-clamp-2">{data.shortDescription}</p>
    {data.topics && data.topics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-1">
        {data.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
    )}
    <div className="flex flex-col space-y-1 text-xs">
      <div className="flex items-center space-x-2">
        <Megaphone className="w-3 h-3" />
        <span>{data.estimatedReach}</span>
      </div>
      {data.streamingLink && (
        <div className="flex items-center space-x-2 text-primary">
          <FiExternalLink className="w-3 h-3" />
          <a href={data.streamingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Listen to podcast
          </a>
        </div>
      )}
    </div>
  </div>
);

// Twitter Spaces Guest Card
const TwitterSpacesCard = ({ data }) => (
  <div className="space-y-2">
    <Badge variant="outline" className="bg-blue-500/10">
      <Twitter className="w-3 h-3 mr-1" />
      Twitter Spaces
    </Badge>
    <h3 className="text-lg font-semibold leading-snug">{data.topic}</h3>
    <div className="space-y-0.5">
      <div className="flex items-center space-x-1 text-primary">
        <Twitter className="w-3 h-3" />
        <span>@{data.hostHandle}</span>
      </div>
      <p className="text-xs text-muted-foreground">{data.hostFollowerCount} followers</p>
    </div>
    {data.topics && data.topics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-1">
        {data.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
    )}
    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      <Calendar className="w-3 h-3" />
      <span>{data.date}</span>
    </div>
  </div>
);

// Live Stream Guest Appearance Card
const LiveStreamCard = ({ data }) => (
  <div className="space-y-2">
    <Badge variant="outline" className="bg-red-500/10">
      <Video className="w-3 h-3 mr-1" />
      Live Stream
    </Badge>
    <h3 className="text-lg font-semibold leading-snug">{data.title}</h3>
    <div className="space-y-0.5">
      <p className="text-sm">{data.companyName}</p>
      <p className="text-xs text-muted-foreground">{data.expectedAudience}</p>
    </div>
    <div className="flex flex-wrap gap-1 mb-1">
      {data.topics && data.topics.map((topic, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {topic}
        </Badge>
      ))}
    </div>
    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
      <Calendar className="w-3 h-3" />
      <span>{data.date}</span>
    </div>
    {data.previousWebinarLink && (
      <div className="flex items-center space-x-2 text-xs text-primary">
        <FiExternalLink className="w-3 h-3" />
        <a href={data.previousWebinarLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
          Previous
        </a>
      </div>
    )}
  </div>
);

// Report and Research Features Card
const ResearchReportCard = ({ data }) => (
  <div className="space-y-2">
    <Badge variant="outline" className="bg-violet-500/10">
      <FileText className="w-3 h-3 mr-1" />
      Research Report
    </Badge>
    <h3 className="text-lg font-semibold leading-snug">{data.reportName}</h3>
    <div className="space-y-0.5">
      <p className="text-sm">{data.companyName}</p>
      <p className="text-xs text-muted-foreground">{data.researchTopic}</p>
    </div>
    {data.topics && data.topics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-1">
        {data.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
    )}
    <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
      <div className="flex items-center space-x-2">
        <Calendar className="w-3 h-3" />
        <span>{data.reportTargetReleaseDate}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Megaphone className="w-3 h-3" />
        <span>{data.reportReach}</span>
      </div>
    </div>
  </div>
);

// Newsletter Features or Guest Posts Card
const NewsletterCard = ({ data }) => (
  <div className="space-y-2">
    <Badge variant="outline" className="bg-emerald-500/10">
      <BookOpen className="w-3 h-3 mr-1" />
      Newsletter
    </Badge>
    <h3 className="text-lg font-semibold leading-snug">{data.newsletterName}</h3>
    <div className="space-y-0.5">
      <p className="text-sm">{data.companyName}</p>
    </div>
    <div className="flex flex-wrap gap-1 mb-1">
      {data.topics && data.topics.map((topic, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {topic}
        </Badge>
      ))}
    </div>
    <div className="flex flex-col space-y-1 text-xs">
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Megaphone className="w-3 h-3" />
        <span>{data.totalSubscribers}</span>
      </div>
      {data.newsletterUrl && (
        <div className="flex items-center space-x-2 text-primary">
          <FiExternalLink className="w-3 h-3" />
          <a href={data.newsletterUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
            View
          </a>
        </div>
      )}
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{data.date}</span>
      </div>
    </div>
  </div>
);

// Legacy/Generic Cards (for backward compatibility)
const MarketingCard = ({ data }) => (
  <div className="space-y-3">
    <Badge variant="outline" className="bg-primary/10">
      <Megaphone className="w-3 h-3 mr-1" />
      {data.collaborationType}
    </Badge>
    <h3 className="text-xl font-semibold leading-snug">{data.title}</h3>
    <div className="space-y-0.5">
      <p className="text-base">{data.companyName}</p>
      <p className="text-sm text-muted-foreground">{data.roleTitle}</p>
    </div>
    <p className="text-sm text-muted-foreground line-clamp-2">{data.description}</p>
    {data.topics && data.topics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {data.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
    )}
    {/* For legacy preferredTopics support */}
    {!data.topics && data.preferredTopics && data.preferredTopics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {data.preferredTopics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
    )}
  </div>
);

const ConferenceCard = ({ data }) => (
  <div className="space-y-3">
    <Badge variant="outline" className="bg-secondary/10">
      <Coffee className="w-3 h-3 mr-1" />
      Coffee Chat
    </Badge>
    <h3 className="text-xl font-semibold leading-snug">{data.eventName}</h3>
    <div className="space-y-0.5">
      <p className="text-base">{data.companyName}</p>
      <p className="text-sm text-muted-foreground">{data.roleTitle}</p>
    </div>
    {data.preferredTopics && data.preferredTopics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {data.preferredTopics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
    )}
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Calendar className="w-3 h-3" />
      <span>{data.availability}</span>
    </div>
  </div>
);

const RequestCard = ({ data }) => (
  <div className="space-y-3">
    <Badge variant="outline" className="bg-destructive/10">
      Collaboration Request
    </Badge>
    <h3 className="text-xl font-semibold leading-snug">{data.title}</h3>
    <div className="space-y-0.5">
      <p className="text-base">From: {data.requestingUser}</p>
      <p className="text-sm text-muted-foreground">{data.companyName} - {data.roleTitle}</p>
    </div>
    <p className="text-sm text-muted-foreground line-clamp-2">{data.description}</p>
  </div>
);

// Updated dummy data structure with all card types
const DUMMY_CARDS = [
  // Conference Coffee example
  {
    id: "1",
    type: "conference-coffee",
    conferenceName: "ETH Lisbon 2025",
    companyName: "CryptoTech Solutions",
    role: "Community Manager",
    conferenceDate: "April 15-17, 2025",
    preferredTopics: ["DeFi", "NFT Gaming", "Web3 Social"],
    description: "Looking to connect with fellow Web3 enthusiasts during ETH Lisbon",
    companyTwitter: "cryptotechsol",
    twitterFollowers: "12.8K",
    companyLinkedIn: "cryptotech-solutions",
    companySector: "Blockchain Infrastructure",
  },
  
  // Podcast Guest Appearance example
  {
    id: "2",
    type: "podcast",
    podcastName: "Web3 Insights Podcast",
    companyName: "Blockchain Media Group",
    shortDescription: "Join our weekly podcast discussing the latest trends in blockchain technology and DeFi innovations.",
    estimatedReach: "10,000+",
    streamingLink: "https://spotify.com/web3insights",
    goals: "Share insights about DeFi innovations and reach new audience segments",
    expectations: "45-minute podcast session, preparation meeting required",
    companyTwitter: "web3insights",
    twitterFollowers: "25.6K",
    companyLinkedIn: "web3insights",
    companySector: "Web3 Media & Content",
  },
  
  // Twitter Spaces Guest example
  {
    id: "3",
    type: "twitter-spaces",
    topic: "The Future of DeFi and Tokenization",
    hostHandle: "cryptoinsights",
    hostFollowerCount: "45.2K",
    date: "March 25, 2025",
    description: "Join our Twitter Space discussing emerging DeFi trends",
    companyTwitter: "cryptoinsights",
    companyName: "Crypto Insights",
    companySector: "DeFi News & Analysis",
    topics: ["DeFi", "Tokenization", "Market Trends"],
  },
  
  // Live Stream Guest Appearance example
  {
    id: "4",
    type: "livestream",
    title: "Web3 Gaming Revolution",
    companyName: "GameFi Alliance",
    topics: ["GameFi", "NFT Gaming", "Play-to-Earn"],
    expectedAudience: "5,000+ viewers",
    previousWebinarLink: "https://youtube.com/gamefialliance/previous",
    date: "April 10, 2025",
    description: "Join our livestream to discuss the future of blockchain gaming",
    companyTwitter: "gamefialliance",
    twitterFollowers: "18.3K",
  },
  
  // Research Report Feature example
  {
    id: "5",
    type: "research-report",
    reportName: "DeFi Market Trends 2025",
    companyName: "Crypto Research Partners",
    researchTopic: "DeFi Market Trends and Predictions",
    reportTargetReleaseDate: "Q2 2025",
    reportReach: "10,000+ industry professionals",
    description: "Looking for expert insights to include in our DeFi market report",
    companyTwitter: "cryptoresearch",
    twitterFollowers: "32.1K",
    topics: ["DeFi", "Market Analysis", "Future Trends"],
  },
  
  // Newsletter Feature example
  {
    id: "6",
    type: "newsletter",
    newsletterName: "Web3 Weekly",
    companyName: "Blockchain Insights",
    topics: ["Market Analysis", "Tokenomics", "Regulation"],
    totalSubscribers: "25,000+",
    newsletterUrl: "https://web3weekly.com",
    date: "Next issue: March 30, 2025",
    description: "Looking for guest writers for our weekly newsletter",
    companyTwitter: "web3weekly",
    twitterFollowers: "28.7K",
  },
  
  // Legacy examples for backward compatibility
  {
    id: "7",
    type: "marketing",
    title: "Looking for Podcast Guest",
    companyName: "Web3 Media Network",
    roleTitle: "Head of Content",
    collaborationType: "Podcast Guest Appearance",
    description: "Join our weekly podcast discussing the latest trends in blockchain technology and DeFi innovations.",
    goals: "Share insights about DeFi innovations and reach new audience segments",
    expectations: "45-minute podcast session, preparation meeting required",
    companyTwitter: "web3medianetwork",
    twitterFollowers: "22.3K",
    companyLinkedIn: "web3medianetwork",
    companySector: "Web3 Media & Content",
  },
  {
    id: "8",
    type: "conference",
    title: "Paris Blockchain Week Coffee Chat",
    companyName: "DeFi Solutions",
    roleTitle: "Product Manager",
    eventName: "Paris Blockchain Week",
    availability: "May 10-12, 2025",
    preferredTopics: ["DeFi", "DAOs", "Tokenization"],
    description: "Looking to connect with fellow Web3 enthusiasts during Paris Blockchain Week",
    companyTwitter: "defisolutions",
    twitterFollowers: "8.5K",
    companyLinkedIn: "defi-solutions",
    companySector: "DeFi Protocol",
  },
  {
    id: "9",
    type: "request",
    title: "Co-Marketing Opportunity",
    companyName: "Crypto Wallet Co",
    roleTitle: "Marketing Director",
    requestingUser: "Alex Zhao",
    requestReason: "Your platform would be a great fit for our wallet integration campaign",
    description: "Would love to discuss co-marketing opportunities for our wallet integration",
    companyTwitter: "cryptowallet",
    twitterFollowers: "65.4K",
    companyLinkedIn: "crypto-wallet-co",
    companySector: "Web3 Infrastructure",
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
      case "conference-coffee":
        return <ConferenceCoffeeCard data={card} />;
      case "podcast":
        return <PodcastCard data={card} />;
      case "twitter-spaces":
        return <TwitterSpacesCard data={card} />;
      case "livestream":
        return <LiveStreamCard data={card} />;
      case "research-report":
        return <ResearchReportCard data={card} />;
      case "newsletter":
        return <NewsletterCard data={card} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="container max-w-md mx-auto py-4">
        <h1 className="text-2xl font-bold mb-2">Discover</h1>
        <NetworkStatus className="mb-4" />

        <div className="relative w-[90%] mx-auto aspect-[3/4.25]">
          {/* Background Card (Next in Stack) */}
          {currentIndex < cards.length - 1 && (
            <div className="absolute inset-0 transform scale-[0.95] opacity-50">
              <Card className="w-full h-full p-5 select-none">
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
            <Card className="w-full h-full p-5 select-none cursor-grab active:cursor-grabbing">
              {renderCard(currentCard)}

              {/* Action Buttons */}
              <div className="absolute bottom-5 left-5 right-5">
                <div className="flex justify-between gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => handleSwipe("left")}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => setShowDialog(true)}
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                    onClick={() => handleSwipe("right")}
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
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