import { useState, useRef, useEffect } from "react";
import { Stack } from "@/components/Stack";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, Info, Check, Coffee, Calendar, Megaphone, Twitter, 
  Linkedin, Building, Mic, Radio, Video, FileText, BookOpen, MessageCircle
} from "lucide-react";
import { CollaborationDialog } from "@/components/CollaborationDialog";
import { NetworkStatus } from "@/components/NetworkStatus";
import { Badge } from "@/components/ui/badge";
import { FiExternalLink } from "react-icons/fi";
import { useLocation } from "wouter";

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

// Collaboration type cards as an array
const DUMMY_CARDS = [
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
  }
];

export default function DiscoverPage() {
  const [cards, setCards] = useState(DUMMY_CARDS);
  const [currentCard, setCurrentCard] = useState<any>({}); // Using any type to avoid TS errors
  const [showDialog, setShowDialog] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();

  // Initialize Telegram WebApp and handle viewport
  useEffect(() => {
    // Prevent scrolling and bouncing on mobile
    document.body.style.overflow = 'hidden';
    
    // Ensure the WebApp expands to fullscreen and is properly initialized
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Adaptive viewport height calculation
      const updateTelegramViewportHeight = () => {
        if (window.Telegram?.WebApp?.viewportStableHeight) {
          const vh = window.Telegram.WebApp.viewportStableHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        } else {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
      };
      
      updateTelegramViewportHeight();
      
      // Update on viewport changes
      const handleViewportChange = () => {
        updateTelegramViewportHeight();
      };
      
      if (typeof window.Telegram?.WebApp?.onEvent === 'function') {
        window.Telegram.WebApp.onEvent('viewportChanged', handleViewportChange);
      }
      
      window.addEventListener('resize', updateTelegramViewportHeight);
      
      return () => {
        if (typeof window.Telegram?.WebApp?.offEvent === 'function') {
          window.Telegram.WebApp.offEvent('viewportChanged', handleViewportChange);
        }
        window.removeEventListener('resize', updateTelegramViewportHeight);
      };
    }
  }, []);

  // Handle vote (swipe)
  const handleVote = (item, vote) => {
    console.log(`Voted ${vote ? "right" : "left"} on`, item);
    
    // Get the actual card data
    const card = cards.find(c => c.id === item.key);
    
    if (card) {
      if (vote) {
        // Right swipe - like/interest
        console.log("Interested in:", card.title || card.podcastName || card.topic || card.conferenceName);
        setCurrentCard(card);
        setShowDialog(true);
      } else {
        // Left swipe - pass
        console.log("Passed on card");
      }
    }
  };

  const renderCardContent = (card) => {
    switch (card.type) {
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
      case "marketing":
        return <MarketingCard data={card} />;
      case "conference":
        return <ConferenceCard data={card} />;
      case "request":
        return <RequestCard data={card} />;
      default:
        return <div>Unknown card type</div>;
    }
  };

  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleSkipCard = () => {
    console.log("Skipped card");
    handleNextCard();
  };

  const handleLikeCard = () => {
    const card = cards[activeCardIndex];
    console.log("Liked card:", card.title || card.podcastName || card.topic || card.conferenceName);
    setCurrentCard(card);
    setShowDialog(true);
  };

  return (
    <div className="min-h-[100svh] bg-background flex flex-col" ref={pageRef}>
      <div className="flex-none p-4 border-b">
        <h1 className="text-2xl font-bold">Discover</h1>
        <NetworkStatus />
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-md aspect-[3/4] relative">
          <Card className="w-full h-full p-5 overflow-auto">
            {cards.length > 0 && renderCardContent(cards[activeCardIndex])}
            
            {/* Card indicators */}
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs">
              {activeCardIndex + 1}/{cards.length}
            </div>
          </Card>
          
          {/* Card Actions */}
          <div className="mt-4 flex justify-center gap-6">
            <Button 
              variant="outline" 
              className="rounded-full h-14 w-14 bg-background shadow-md flex items-center justify-center"
              onClick={handleSkipCard}
            >
              <X className="h-6 w-6" />
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full h-14 w-14 bg-background shadow-md flex items-center justify-center"
              onClick={() => {
                setCurrentCard(cards[activeCardIndex]);
                setShowDialog(true);
              }}
            >
              <Info className="h-6 w-6" />
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full h-14 w-14 bg-background shadow-md flex items-center justify-center"
              onClick={handleLikeCard}
            >
              <Check className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Details Dialog */}
      <CollaborationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        collaboration={currentCard || {}}
      />
    </div>
  );
}