import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ChevronRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Extended dummy data with more details
const DUMMY_MATCHES = [
  {
    id: "1",
    title: "Podcast Guest",
    companyName: "Web3 Insights",
    roleTitle: "VP of Marketing",
    matchDate: "March 15, 2025",
    collaborationType: "Podcast Guest",
    matchedPerson: "Alex Thompson",
    description: "Join our weekly podcast discussing the latest in Web3 technology and decentralized finance.",
    companyDescription: "Web3 Insights is a leading media company focusing on blockchain technology and crypto innovations.",
    userDescription: "Alex is a seasoned tech executive who has been in the Web3 space for over 5 years.",
    podcastDetails: {
      name: "The Web3 Revolution",
      audience: "15,000+ weekly listeners",
      episodes: "Currently in Season 3",
      format: "Interview-style discussion, 45-60 minutes"
    }
  },
  {
    id: "2",
    title: "Web3 Gaming Blog Post",
    companyName: "CryptoTech Solutions",
    roleTitle: "Technical Content Writer",
    matchDate: "March 14, 2025",
    collaborationType: "Blog Post",
    matchedPerson: "Maria Garcia",
    description: "Looking for expert writers to create technical content about NFT gaming and Play-to-Earn ecosystems.",
    companyDescription: "CryptoTech Solutions builds infrastructure for blockchain gaming and NFT marketplaces.",
    userDescription: "Maria is a content specialist focusing on gaming and blockchain technologies.",
    blogDetails: {
      audience: "25,000+ monthly readers",
      wordCount: "1,500-2,000 words",
      topics: "GameFi, NFTs, Play-to-Earn models",
      distribution: "Cross-posted on Medium, CryptoTech blog"
    }
  },
  {
    id: "3",
    title: "Twitter Space Co-host",
    companyName: "DeFi Daily",
    roleTitle: "Content Director",
    matchDate: "March 13, 2025",
    collaborationType: "Twitter Space",
    matchedPerson: "James Wilson",
    description: "Co-host a Twitter Space discussing DeFi trends and market analysis.",
    companyDescription: "DeFi Daily delivers the latest news and insights in decentralized finance.",
    userDescription: "James leads content strategy and community engagement for DeFi publications.",
    twitterDetails: {
      audience: "8,000+ average listeners",
      duration: "60-90 minutes",
      topics: "DeFi protocols, yield farming, market trends",
      format: "Panel discussion with audience Q&A"
    }
  },
  {
    id: "4",
    title: "Research Report Collaboration",
    companyName: "Blockchain Analytics",
    roleTitle: "Market Researcher",
    matchDate: "March 17, 2025",
    collaborationType: "Research Report",
    matchedPerson: "Sarah Johnson",
    description: "Seeking partners to collaborate on an industry research report about institutional blockchain adoption.",
    companyDescription: "Blockchain Analytics provides data-driven research and insights for the crypto industry.",
    userDescription: "Sarah specializes in market research and data analysis for blockchain technologies.",
    reportDetails: {
      audience: "Enterprise clients and institutional investors",
      length: "25-30 pages with data visualization",
      timeline: "4 weeks to completion",
      distribution: "Published on company website and distributed to 5,000+ subscribers"
    }
  },
  {
    id: "5",
    title: "Live Stream Panel",
    companyName: "Crypto Education Hub",
    roleTitle: "Industry Expert",
    matchDate: "March 18, 2025",
    collaborationType: "Live Stream",
    matchedPerson: "Michael Chen",
    description: "Participate in a panel discussion about the future of decentralized exchanges and AMMs.",
    companyDescription: "Crypto Education Hub provides educational content and events for cryptocurrency enthusiasts.",
    userDescription: "Michael is a recognized expert in decentralized exchange technology and token economics.",
    eventDetails: {
      audience: "Live audience of 1,000+ viewers",
      duration: "2 hours with Q&A session",
      platform: "YouTube Live and Twitch",
      panelists: "3-4 industry experts"
    }
  },
  {
    id: "6",
    title: "Newsletter Feature",
    companyName: "Web3 Weekly",
    roleTitle: "Guest Contributor",
    matchDate: "March 19, 2025",
    collaborationType: "Newsletter",
    matchedPerson: "Emma Rodriguez",
    description: "Write a feature article for our weekly newsletter about emerging Web3 social platforms.",
    companyDescription: "Web3 Weekly delivers curated insights about blockchain innovation to 30,000+ subscribers.",
    userDescription: "Emma is a thought leader in decentralized social media and community building.",
    newsletterDetails: {
      subscribers: "30,000+ industry professionals",
      wordCount: "800-1,200 words",
      topics: "Social tokens, community DAOs, decentralized identity",
      distribution: "Email, Telegram channel, and website archive"
    }
  },
];

interface MatchDetailProps {
  match: typeof DUMMY_MATCHES[0];
  onBack: () => void;
}

function MatchDetail({ match, onBack }: MatchDetailProps) {
  let detailsSection;
  
  // Render different details based on collaboration type
  switch (match.collaborationType) {
    case "Podcast Guest":
      if (match.podcastDetails) {
        detailsSection = (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Podcast Details</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{match.podcastDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Audience:</span>
                <span className="text-sm font-medium">{match.podcastDetails.audience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Episodes:</span>
                <span className="text-sm font-medium">{match.podcastDetails.episodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Format:</span>
                <span className="text-sm font-medium">{match.podcastDetails.format}</span>
              </div>
            </div>
          </div>
        );
      }
      break;
    case "Blog Post":
      if (match.blogDetails) {
        detailsSection = (
          <div className="space-y-4 mt-4">
            <h3 className="font-medium">Blog Details</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Audience:</span>
                <span className="text-sm font-medium">{match.blogDetails.audience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Word Count:</span>
                <span className="text-sm font-medium">{match.blogDetails.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Topics:</span>
                <span className="text-sm font-medium">{match.blogDetails.topics}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Distribution:</span>
                <span className="text-sm font-medium">{match.blogDetails.distribution}</span>
              </div>
            </div>
          </div>
        );
      }
      break;
    // Add cases for other collaboration types as needed
    default:
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Collaboration Details</h3>
          <p className="text-sm">{match.description}</p>
        </div>
      );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{match.matchedPerson}</h2>
          <p className="text-sm text-muted-foreground">{match.roleTitle}, {match.companyName}</p>
          <p className="text-xs text-muted-foreground mt-1">Matched on {match.matchDate}</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground bg-transparent">{match.collaborationType}</Badge>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">About the Collaboration</h3>
          <p className="text-sm mt-1">{match.description}</p>
        </div>
        
        <div>
          <h3 className="font-medium">About {match.matchedPerson}</h3>
          <p className="text-sm mt-1">{match.userDescription}</p>
          <p className="text-xs text-muted-foreground mt-1">{match.roleTitle} at {match.companyName}</p>
        </div>
        
        <div>
          <h3 className="font-medium">About {match.companyName}</h3>
          <p className="text-sm mt-1">{match.companyDescription}</p>
        </div>
        
        {detailsSection}
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Matches
        </Button>
        <Button onClick={() => window.open('https://t.me/thisispaulm', '_blank')}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat
        </Button>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<typeof DUMMY_MATCHES[0] | null>(null);
  
  // This disables the default fixed positioning and overflow hidden
  // so that we can have a normal scrolling container with a scrollbar
  useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    // Modify for this page to allow scrolling
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
    
    // Add scrollable-page class to html and body
    document.documentElement.classList.add('scrollable-page');
    document.body.classList.add('scrollable-page');
    
    // Also fix the root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.overflow = 'auto';
      rootElement.style.height = 'auto';
      rootElement.style.position = 'static';
      rootElement.style.width = '100%';
    }
    
    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove('scrollable-page');
      document.body.classList.remove('scrollable-page');
      
      if (rootElement) {
        rootElement.style.overflow = '';
        rootElement.style.height = '';
        rootElement.style.position = '';
        rootElement.style.width = '';
      }
    };
  }, []);
  
  // Close the match detail dialog
  const handleCloseMatchDetail = () => {
    setSelectedMatch(null);
  };
  
  return (
    <div className="page-scrollable pb-20">
      <h1 className="text-2xl font-bold p-6">My Matches</h1>
      
      <div className="px-4">
        {DUMMY_MATCHES.length > 0 ? (
          <div className="space-y-4">
            {DUMMY_MATCHES.map((match) => (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{match.matchedPerson}</CardTitle>
                      <CardDescription>{match.roleTitle}, {match.companyName}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">Matched on {match.matchDate}</p>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground bg-transparent">{match.collaborationType}</Badge>
                  </div>
                </CardHeader>
                <CardFooter className="flex justify-between pt-2">
                  <Button
                    size="sm"
                    onClick={() => window.open('https://t.me/thisispaulm', '_blank')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No matches yet</p>
            <Button variant="outline">Start Discovering</Button>
          </Card>
        )}
      </div>
      
      {/* Match Detail Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedMatch ? `${selectedMatch.title} - ${selectedMatch.collaborationType} Details` : 'Match Details'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detailed information about this collaboration match
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && <MatchDetail match={selectedMatch} onBack={handleCloseMatchDetail} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}