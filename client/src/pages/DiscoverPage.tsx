import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
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
  Linkedin, Building, Mic, Radio, Video, FileText, BookOpen,
  RotateCcw, SlidersVertical
} from "lucide-react";
import { CollaborationDialog } from "@/components/CollaborationDialog";
import { NetworkStatus } from "@/components/NetworkStatus";
import { MatchNotification } from "@/components/MatchNotification";

import { Badge } from "@/components/ui/badge";
import { FiExternalLink } from "react-icons/fi";

// Blog Post Collaboration Card (Replacing Conference Coffee Card)
const BlogPostCollabCard = ({ data }) => {
  // Handle data.details (JSON field)
  const details = data.details || {};
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-secondary/10">
        <FileText className="w-3 h-3 mr-1" />
        Blog Post
      </Badge>
      <h3 className="text-lg font-semibold leading-snug">
        {details.blog_title || data.blogTitle || "Guest Blog Opportunity"}
      </h3>
      <div className="space-y-0.5">
        <p className="text-sm">{data.companyName}</p>
        <p className="text-xs text-muted-foreground">
          {details.role || data.role || ""}
        </p>
      </div>
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>
          {details.publication_date || data.publicationDate || 
            (details.specific_date ? details.specific_date : "TBD")}
        </span>
      </div>
      {/* Display topics if available */}
      {data.preferredTopics && data.preferredTopics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {data.preferredTopics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      )}
      {data.topics && data.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {data.topics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      )}
      {!data.topics && !data.preferredTopics && details.topics && details.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {details.topics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      )}
      {details.short_description && (
        <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
          {details.short_description}
        </p>
      )}
    </div>
  );
};

// Podcast Guest Appearances Card
const PodcastCard = ({ data }) => {
  // Handle data.details (JSON field)
  const details = data.details || {};
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-primary/10">
        <Mic className="w-3 h-3 mr-1" />
        Podcast Guest
      </Badge>
      <h3 className="text-lg font-semibold leading-snug">
        {details.podcast_name || data.podcastName || "Podcast"}
      </h3>
      <div className="space-y-0.5">
        <p className="text-sm">{data.companyName}</p>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {details.short_description || details.podcast_description || data.shortDescription || ""}
      </p>
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
          <span>{details.estimated_reach || data.estimatedReach || "TBD"}</span>
        </div>
        {(details.podcast_link || data.streamingLink) && (
          <div className="flex items-center space-x-2 text-primary">
            <FiExternalLink className="w-3 h-3" />
            <a 
              href={details.podcast_link || data.streamingLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              Listen to podcast
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Twitter Spaces Guest Card
const TwitterSpacesCard = ({ data }) => {
  // Handle data.details (JSON field)
  const details = data.details || {};
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-blue-500/10">
        <Twitter className="w-3 h-3 mr-1" />
        Twitter Spaces
      </Badge>
      {/* Use consistent field names: short_description for the topic */}
      <h3 className="text-lg font-semibold leading-snug">
        {details.short_description || data.topic || "Twitter Space"}
      </h3>
      <div className="space-y-0.5">
        <div className="flex items-center space-x-1 text-primary">
          <Twitter className="w-3 h-3" />
          <span>@{details.twitter_handle ? details.twitter_handle.replace('https://x.com/', '') : (data.hostHandle || 'username')}</span>
        </div>
        <p className="text-xs text-muted-foreground">{details.host_follower_count || data.hostFollowerCount || "0"} followers</p>
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
        <span>{data.date || "Coming soon"}</span>
      </div>
    </div>
  );
};

// Live Stream Guest Appearance Card
const LiveStreamCard = ({ data }) => {
  // Handle data.details (JSON field)
  const details = data.details || {};
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-red-500/10">
        <Video className="w-3 h-3 mr-1" />
        Live Stream
      </Badge>
      <h3 className="text-lg font-semibold leading-snug">
        {details.title || data.title || "Live Stream"}
      </h3>
      <div className="space-y-0.5">
        <p className="text-sm">{data.companyName}</p>
        <p className="text-xs text-muted-foreground">
          {details.expected_audience_size || data.expectedAudience || "TBD"}
        </p>
      </div>
      <div className="flex flex-wrap gap-1 mb-1">
        {data.topics && data.topics.length > 0 && data.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
        {!data.topics && details.topics && details.topics.length > 0 && details.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>
          {data.date || 
            (details.specific_date ? details.specific_date : 
              (details.date_selection === "specific_date" ? "Date TBD" : "Flexible date"))}
        </span>
      </div>
      {(details.previous_stream_link || data.previousWebinarLink) && (
        <div className="flex items-center space-x-2 text-xs text-primary">
          <FiExternalLink className="w-3 h-3" />
          <a 
            href={details.previous_stream_link || data.previousWebinarLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            Previous
          </a>
        </div>
      )}
      {details.short_description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {details.short_description}
        </p>
      )}
    </div>
  );
};

// Report and Research Features Card
const ResearchReportCard = ({ data }) => {
  // Handle data.details (JSON field)
  const details = data.details || {};
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-violet-500/10">
        <FileText className="w-3 h-3 mr-1" />
        Research Report
      </Badge>
      <h3 className="text-lg font-semibold leading-snug">
        {details.report_name || data.reportName || "Research Report"}
      </h3>
      <div className="space-y-0.5">
        <p className="text-sm">{data.companyName}</p>
        <p className="text-xs text-muted-foreground">
          {details.research_topic || data.researchTopic || ""}
        </p>
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
      {!data.topics && details.topics && details.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {details.topics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3" />
          <span>
            {details.target_release_date || data.reportTargetReleaseDate || "TBD"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Megaphone className="w-3 h-3" />
          <span>{details.estimated_reach || data.reportReach || "TBD"}</span>
        </div>
        {details.short_description && (
          <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
            {details.short_description}
          </p>
        )}
      </div>
    </div>
  );
};

// Newsletter Features or Guest Posts Card
const NewsletterCard = ({ data }) => {
  // Handle data.details (JSON field)
  const details = data.details || {};
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-emerald-500/10">
        <BookOpen className="w-3 h-3 mr-1" />
        Newsletter
      </Badge>
      <h3 className="text-lg font-semibold leading-snug">
        {details.newsletter_name || data.newsletterName || "Newsletter"}
      </h3>
      <div className="space-y-0.5">
        <p className="text-sm">{data.companyName}</p>
      </div>
      <div className="flex flex-wrap gap-1 mb-1">
        {data.topics && data.topics.length > 0 && data.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
        {!data.topics && details.topics && details.topics.length > 0 && details.topics.map((topic, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>
      <div className="flex flex-col space-y-1 text-xs">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Megaphone className="w-3 h-3" />
          <span>{details.subscribers_count || data.totalSubscribers || "TBD"}</span>
        </div>
        {(details.newsletter_url || data.newsletterUrl) && (
          <div className="flex items-center space-x-2 text-primary">
            <FiExternalLink className="w-3 h-3" />
            <a 
              href={details.newsletter_url || data.newsletterUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              View
            </a>
          </div>
        )}
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>
            {data.date || 
              (details.specific_date ? details.specific_date : 
                (details.date_selection === "specific_date" ? "Date TBD" : "Flexible date"))}
          </span>
        </div>
        {details.short_description && (
          <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
            {details.short_description}
          </p>
        )}
      </div>
    </div>
  );
};

// My Collaboration Card - Shows when another user is requesting to collaborate on the active user's own collaboration
const MyCollabCard = ({ data }) => (
  <div className="space-y-4 relative text-gray-100 p-0">    
    {/* Badge */}
    <Badge className="bg-blue-700 text-white border-0 py-1 px-3 rounded-full">
      <Building className="w-3 h-3 mr-1" />
      <span className="font-medium">My Collab</span>
    </Badge>
    
    {/* Title */}
    <h3 className="text-xl font-semibold leading-snug text-white">{data.title}</h3>
    
    {/* Company info */}
    <div className="space-y-3">
      <p className="text-base px-3 py-1.5 rounded-md inline-flex items-center gap-1 bg-opacity-20 bg-slate-600">
        <Building className="w-3 h-3" />
        {data.companyName}
      </p>
      
      {/* Requester info */}
      <div className="bg-opacity-20 bg-slate-500 p-3 rounded-md">
        <p className="text-sm font-medium text-white mb-1">Requester Details:</p>
        <p className="text-sm text-gray-200">Role: {data.requesterRole}</p>
        <p className="text-sm text-gray-200">Company: {data.requesterCompany}</p>
      </div>
    </div>
    
    {/* Description */}
    <p className="text-sm text-gray-300 line-clamp-2">{data.description}</p>
    
    {/* Topics */}
    {data.topics && data.topics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {data.topics.map((topic, i) => (
          <Badge key={i} variant="outline" className="text-xs text-gray-200 border-slate-600 bg-transparent">
            {topic}
          </Badge>
        ))}
      </div>
    )}
    
    {/* For legacy preferredTopics support */}
    {!data.topics && data.preferredTopics && data.preferredTopics.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {data.preferredTopics.map((topic, i) => (
          <Badge key={i} variant="outline" className="text-xs text-gray-200 border-slate-600 bg-transparent">
            {topic}
          </Badge>
        ))}
      </div>
    )}
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
  // Blog Post Collaboration example
  {
    id: "1",
    type: "log-post", // Keeping type for compatibility with existing code
    blogTitle: "Reasons for Web3 in Gaming",
    companyName: "CryptoTech Solutions",
    role: "Technical Content Writer",
    publicationDate: "April 15, 2025",
    preferredTopics: ["DeFi", "NFT Gaming", "Web3 Social"],
    description: "Looking for guest content writer for our technical blog on blockchain gaming",
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
  
  // My Collaboration Card (when another user requests to collaborate with the active user's collaboration)
  {
    id: "7a",
    type: "mycollab",
    title: "Web3 Insights Podcast Guest Opportunity",
    companyName: "My Blockchain Media",
    requesterRole: "Tech Lead",
    requesterCompany: "DeFi Innovations Inc",
    description: "You created this collaboration opportunity. Someone is requesting to join as a guest on your podcast to discuss DeFi innovation.",
    topics: ["DeFi", "Blockchain", "Web3"],
    collaborationType: "Podcast Guest",
    companyTwitter: "myblockchainmedia",
    twitterFollowers: "18.5K",
    companyLinkedIn: "my-blockchain-media",
    companySector: "Media & Content",
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

// Helper function to get collaboration type name from card type
const getCollaborationTypeFromCard = (card: any): string => {
  // Log the card.type for debugging
  console.log("Getting collaboration type for card type:", card.type);
  
  switch (card.type) {
    case "marketing":
      return "Marketing Collaboration";
    case "conference":
      return "Conference Coffee";
    case "blog-post":
      return "Blog Post";
    case "podcast":
      return "Podcast Guest";
    case "twitter-spaces":
      return "Twitter Spaces";
    case "livestream":
      return "Live Stream";
    case "research-report":
      return "Research Report";
    case "newsletter":
      return "Newsletter Feature";
    case "request":
      return "Collaboration Request";
    case "mycollab":
      return "My Collaboration";
    default:
      return "Collaboration";
  }
};

// Add global CSS for MyCollab styling
const MyCollabStyles = () => {
  // This component injects the necessary CSS for my-collab styling
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    
    // Add CSS rules that target the cards with data-mycollab="true"
    styleEl.textContent = `
      /* Apply gradient to MyCollab cards */
      [data-mycollab="true"] + * .card {
        background: linear-gradient(to bottom right, rgba(76, 29, 149, 1), rgba(0, 0, 0, 1)) !important;
        background-color: black !important;
        color: white !important;
      }
      
      /* Style the root card container for MyCollab cards */
      .card:has([data-mycollab="true"]),
      [data-mycollab="true"] ~ .card {
        background: linear-gradient(to bottom right, rgba(76, 29, 149, 1), rgba(0, 0, 0, 1)) !important;
        background-color: black !important;
        color: white !important;
      }
    `;
    
    // Add the style element to the document head
    document.head.appendChild(styleEl);
    
    // Cleanup function to remove the style element when component unmounts
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  return null;
};

export default function DiscoverPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(DUMMY_CARDS);
  const [showDialog, setShowDialog] = useState(false);
  // Store history of swiped cards for undo functionality
  const [swipeHistory, setSwipeHistory] = useState<Array<{card: any, direction: "left" | "right", index: number}>>([]);
  // Match moment states
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<{
    title: string;
    companyName: string;
    collaborationType: string;
  }>({
    title: '',
    companyName: '',
    collaborationType: ''
  });
  const cardElem = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();

  // Initialize Telegram WebApp and handle viewport
  useEffect(() => {
    // Prevent scrolling and bouncing
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Ensure the WebApp expands to fullscreen and is properly initialized
    if (window.Telegram?.WebApp) {
      // Initialize Telegram WebApp
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Adaptive viewport height calculation
      const updateTelegramViewportHeight = () => {
        // Use Telegram's stable viewport height if available
        if (window.Telegram.WebApp.viewportStableHeight) {
          const vh = window.Telegram.WebApp.viewportStableHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        } else {
          // Fallback to window height
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
      };
      
      // Set initial height
      updateTelegramViewportHeight();
      
      // Update on viewport changes
      const handleViewportChange = () => {
        updateTelegramViewportHeight();
      };
      
      // Handle Telegram viewport and resize events
      if (typeof window.Telegram.WebApp.onEvent === 'function') {
        window.Telegram.WebApp.onEvent('viewportChanged', handleViewportChange);
      }
      
      // Also listen to regular resize events as backup
      window.addEventListener('resize', updateTelegramViewportHeight);
      
      return () => {
        if (typeof window.Telegram.WebApp.offEvent === 'function') {
          window.Telegram.WebApp.offEvent('viewportChanged', handleViewportChange);
        }
        window.removeEventListener('resize', updateTelegramViewportHeight);
      };
    } else {
      // Not in Telegram WebApp, use regular viewport handling
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);
      
      return () => window.removeEventListener('resize', setViewportHeight);
    }
  }, []);

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

    // Save the current card to history before changing index
    setSwipeHistory(prev => [...prev, {
      card: cards[currentIndex],
      direction: direction,
      index: currentIndex
    }]);

    // Check if it's a right swipe and simulate a match with high probability for testing
    if (direction === "right") {
      // In a real app, this would be a server call to check for mutual matches
      const isMatch = Math.random() < 0.7; // 70% chance of match for easier testing
      
      if (isMatch) {
        // Get the current card data
        const card = cards[currentIndex];
        
        // Set the match data with fallbacks to ensure we always have data
        const cardDetails = card.details || {};
        
        setMatchData({
          title: card.title || 
                 card.blogTitle || 
                 cardDetails.blog_title || 
                 card.podcastName || 
                 cardDetails.podcast_name || 
                 card.topic || 
                 cardDetails.short_description || 
                 card.reportName || 
                 cardDetails.report_name || 
                 card.newsletterName || 
                 cardDetails.newsletter_name || 
                 "New Collaboration",
          companyName: card.companyName || "Company",
          collaborationType: card.collaborationType || getCollaborationTypeFromCard(card)
        });
        
        console.log("MATCH FOUND! Showing match notification with data:", card);
        
        // Show the match notification (after a slight delay to let the card animation finish)
        setTimeout(() => {
          setShowMatch(true);
        }, 400);
      } else {
        console.log("No match this time (random chance)");
      }
    }

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

  // Function to handle undo action
  const handleUndo = async () => {
    // Check if we have any cards in the history
    if (swipeHistory.length === 0) return;
    
    // Get the last swiped card
    const lastAction = swipeHistory[swipeHistory.length - 1];
    
    // Remove the last action from history
    setSwipeHistory(prev => prev.slice(0, -1));
    
    // If we're at index 0 and the cards were reshuffled, we need to restore the original deck
    if (currentIndex === 0 && lastAction.index === cards.length - 1) {
      // This is a simplification - in a real app you'd need to store the original deck
      setCards(DUMMY_CARDS);
    }
    
    // Set the current index back to the previous card
    setCurrentIndex(lastAction.index);
  };

  const currentCard = cards[currentIndex];



  const renderCard = (card) => {
    // Check if this is a "mycollab" type card for styling purposes
    const isMyCollab = card.type === "mycollab";
    
    // Handle the case where card might be null (at the end of the deck)
    if (!card) {
      return <div className="w-full h-full flex items-center justify-center p-8 text-center text-muted-foreground">No more cards to show</div>;
    }
    
    // Create the appropriate component
    let cardContent;
    switch (card.type) {
      case "marketing":
        cardContent = <MarketingCard data={card} />;
        break;
      case "conference":
        cardContent = <ConferenceCard data={card} />;
        break;
      case "request":
        cardContent = <RequestCard data={card} />;
        break;
      case "mycollab":
        cardContent = <MyCollabCard data={card} />;
        break;
      case "conference-coffee":
        // Keeping this case for backward compatibility, but displaying as blog post
        cardContent = <BlogPostCollabCard data={card} />;
        break;
      case "podcast":
        cardContent = <PodcastCard data={card} />;
        break;
      case "twitter-spaces":
        cardContent = <TwitterSpacesCard data={card} />;
        break;
      case "livestream":
        cardContent = <LiveStreamCard data={card} />;
        break;
      case "research-report":
        cardContent = <ResearchReportCard data={card} />;
        break;
      case "newsletter":
        cardContent = <NewsletterCard data={card} />;
        break;
      default:
        cardContent = <MarketingCard data={card} />;
        break;
    }
    
    // For MyCollab cards, we need to wrap them with a data attribute
    // to target with custom CSS for the gradient background
    if (isMyCollab) {
      return (
        <div data-mycollab="true">
          {cardContent}
        </div>
      );
    }
    
    return cardContent;
  };

  return (
    <div className="telegram-app min-h-[100svh] bg-background flex flex-col" ref={pageRef}>
      {/* Include the CSS styling component */}
      <MyCollabStyles />
      
      <div className="container max-w-md mx-auto py-4 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-2 px-4">
          <h1 className="text-2xl font-bold p-2">Discover</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/discovery-filters')}
            aria-label="Filter"
          >
            <SlidersVertical className="h-5 w-5" />
          </Button>
        </div>
        
        {/* This flex-grow + justify-end pushes card down and creates space at the top */}
        <div className="flex-grow flex flex-col justify-end">
          <div className="relative w-[90%] mx-auto aspect-[3/3.3] mb-6">
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
              <Card 
                className="w-full h-full p-5 select-none cursor-grab active:cursor-grabbing"
                style={currentCard?.type === "mycollab" ? 
                  {background: "linear-gradient(to bottom right, rgba(76, 29, 149, 1), rgba(0, 0, 0, 1))"} : 
                  undefined
                }
              >
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
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    
                    {/* Info Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={() => setShowDialog(true)}
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                    
                    {/* Yes (Check) Button */}
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
        
          {/* Instructions - moved to bottom of flex container right above menu */}
          <div className="text-center text-sm text-muted-foreground mb-4">
            <p>→ Swipe right to request collaboration</p>
            <p>← Swipe left to pass</p>
          </div>
        </div>
        {/* Detailed View Dialog */}
        <CollaborationDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          collaboration={currentCard}
        />
        
        {/* Match Notification */}
        <MatchNotification
          isOpen={showMatch}
          onClose={() => setShowMatch(false)}
          matchData={matchData}
        />
      </div>
    </div>
  );
}