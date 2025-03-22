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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Collaboration } from "@shared/schema";
import { LoadingScreen } from "@/components/LoadingScreen";

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
  const [showDialog, setShowDialog] = useState(false);
  // Store history of swiped cards for undo functionality
  const [swipeHistory, setSwipeHistory] = useState<Array<{card: Collaboration, direction: "left" | "right", index: number}>>([]);
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
  
  // Load cards from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/discovery/cards'],
    queryFn: async () => {
      const result = await apiRequest('/api/discovery/cards');
      return result as Collaboration[];
    }
  });
  
  // Safely access cards array
  const cards = Array.isArray(data) ? data : [];
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

  // Mutation for swipe action
  const queryClient = useQueryClient();
  const swipeMutation = useMutation({
    mutationFn: async ({ collaborationId, direction }: { collaborationId: string, direction: "left" | "right" }) => {
      const response = await apiRequest('/api/swipes', {
        method: 'POST',
        body: JSON.stringify({
          collaboration_id: collaborationId,
          direction
        })
      });
      return response;
    },
    onSuccess: (data: any) => {
      // If the swipe resulted in a match, show the match notification
      if (data && data.isMatch) {
        console.log("MATCH FOUND! API confirmed match with data:", data);
        
        // Show the match notification
        setTimeout(() => {
          setShowMatch(true);
        }, 400);
      }
      
      // Invalidate the cards query to refresh the list if needed
      queryClient.invalidateQueries({ queryKey: ['/api/discovery/cards'] });
    }
  });
  
  // Mutation for undo last swipe
  const undoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/swipes/undo', {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      // Refresh card list after undoing a swipe
      queryClient.invalidateQueries({ queryKey: ['/api/discovery/cards'] });
    }
  });

  const handleSwipe = async (direction: "left" | "right") => {
    if (!cards.length || isLoading) return;
    
    const currentCard = cards[currentIndex];
    
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

    console.log(`Swiped ${direction} on card:`, currentCard);

    // Save the current card to history before changing index
    setSwipeHistory(prev => [...prev, {
      card: currentCard,
      direction: direction,
      index: currentIndex
    }]);

    // Call the API to record the swipe and check for matches
    if (currentCard && currentCard.id) {
      try {
        await swipeMutation.mutateAsync({
          collaborationId: currentCard.id,
          direction
        });
        
        // If this is a right swipe, prepare match data to display if a match is found
        if (direction === "right") {
          // Parse the details safely
          let details = {};
          if (currentCard.details) {
            try {
              if (typeof currentCard.details === 'string') {
                details = JSON.parse(currentCard.details);
              } else {
                details = currentCard.details;
              }
            } catch (e) {
              console.error("Failed to parse card details:", e);
            }
          }
          
          // Get collaboration type from collab_type field or details
          const collabType = currentCard.collab_type || 
            (details && details.collaboration_type);
          
          // Prepare the match notification data
          setMatchData({
            title: getCardTitle(currentCard, details),
            companyName: getCompanyName(currentCard),
            collaborationType: collabType || "Collaboration"
          });
        }
      } catch (error) {
        console.error("Error recording swipe:", error);
      }
    }

    // Move to next card
    setCurrentIndex((prev) => {
      if (prev >= cards.length - 1) {
        return prev; // Stay on last card if we're out of cards
      }
      return prev + 1;
    });

    x.set(0);
    setConstrained(true);
    controls.set({ x: 0 });
  };

  // Helper functions for card data
  const getCardTitle = (card: any, details: any = {}) => {
    // Try to extract title from various possible locations depending on collab type
    if (card.collab_type === "Blog Post Feature") {
      return details.blog_title || "Blog Post";
    } else if (card.collab_type === "Podcast Guest Appearance") {
      return details.podcast_name || "Podcast";
    } else if (card.collab_type === "Twitter Spaces Guest") {
      return details.short_description || "Twitter Space";
    } else if (card.collab_type === "Live Stream Guest Appearance") {
      return details.title || "Live Stream";
    } else if (card.collab_type === "Report & Research Feature") {
      return details.report_name || "Research Report";
    } else if (card.collab_type === "Newsletter Feature") {
      return details.newsletter_name || "Newsletter";
    } else if (card.collab_type === "Co-Marketing on Twitter") {
      return "Twitter Co-Marketing";
    }
    
    // Fallbacks
    return details.title || card.description?.substring(0, 30) || "Collaboration";
  };
  
  const getCompanyName = (card: any) => {
    // In the real data, company name might come from a company table join
    // For now use placeholder until we figure out the exact data structure
    return card.company_name || "Company";
  };
  
  // Function to determine the collaboration type from a card
  const getCollaborationTypeFromCard = (card: any) => {
    if (!card) return "Collaboration";
    
    // Try to get the type directly from the collab_type field
    if (card.collab_type) return card.collab_type;
    
    // Otherwise determine based on card type if that exists
    switch (card.type) {
      case "podcast":
        return "Podcast Guest Appearance";
      case "twitter-spaces":
        return "Twitter Spaces Guest";
      case "livestream":
        return "Live Stream Guest Appearance";
      case "research-report":
        return "Report & Research Feature";
      case "newsletter":
        return "Newsletter Feature";
      case "blog-post":
      case "conference-coffee":
        return "Blog Post Feature";
      case "marketing":
        return "Co-Marketing on Twitter";
      default:
        return "Collaboration";
    }
  };

  // Function to handle undo action
  const handleUndo = async () => {
    // Check if we have any cards in the history
    if (swipeHistory.length === 0) return;
    
    try {
      // Call the API to undo the last swipe
      await undoMutation.mutateAsync();
      
      // Get the last swiped card
      const lastAction = swipeHistory[swipeHistory.length - 1];
      
      // Remove the last action from history
      setSwipeHistory(prev => prev.slice(0, -1));
      
      // Set the current index back to the previous card
      setCurrentIndex(lastAction.index);
      
      console.log("Successfully undid last swipe");
    } catch (error) {
      console.error("Error undoing swipe:", error);
    }
  };

  const currentCard = cards[currentIndex];



  const renderCard = (card: any) => {
    // Handle the case where card might be null (at the end of the deck)
    if (!card) {
      return <div className="w-full h-full flex items-center justify-center p-8 text-center text-muted-foreground">No more cards to show</div>;
    }
    
    // Check if this is a "My Collaboration" type card for styling purposes
    const isMyCollab = card.collab_type === "My Collaboration";
    
    // Parse the details object if it's a string
    let details = {};
    if (card.details) {
      try {
        if (typeof card.details === 'string') {
          details = JSON.parse(card.details);
        } else {
          details = card.details;
        }
      } catch (e) {
        console.error("Failed to parse card details:", e);
      }
    }
    
    // Map the real collaboration data to the card components
    // Create adapter object with needed properties
    const cardData = {
      ...card,
      companyName: card.company_name || "Company",
      topics: card.topics || [],
      preferredTopics: details.topics || [],
      description: card.description || "",
      role: details.role || "",
      shortDescription: details.short_description || "",
      publicationDate: details.publication_date || details.specific_date || "",
      
      // Additional properties for specific card types
      podcastName: details.podcast_name || "",
      estimatedReach: details.estimated_reach || "",
      streamingLink: details.podcast_link || "",
      
      topic: details.short_description || "",
      hostHandle: details.twitter_handle || "",
      hostFollowerCount: details.host_follower_count || "",
      date: details.specific_date || "",
      
      expectedAudience: details.expected_audience_size || "",
      previousWebinarLink: details.previous_stream_link || "",
      
      reportName: details.report_name || "",
      researchTopic: details.research_topic || "",
      reportReach: details.estimated_reach || "",
      reportTargetReleaseDate: details.target_release_date || "",
      
      newsletterName: details.newsletter_name || "",
      totalSubscribers: details.subscribers_count || "",
      newsletterUrl: details.newsletter_url || "",
      
      blogTitle: details.blog_title || ""
    };
    
    // Create the appropriate component based on collaboration type
    let cardContent;
    switch (card.collab_type) {
      case "Co-Marketing on Twitter":
        cardContent = <MarketingCard data={cardData} />;
        break;
      case "Blog Post Feature":
        cardContent = <BlogPostCollabCard data={cardData} />;
        break;
      case "Podcast Guest Appearance":
        cardContent = <PodcastCard data={cardData} />;
        break;
      case "Twitter Spaces Guest":
        cardContent = <TwitterSpacesCard data={cardData} />;
        break;
      case "Live Stream Guest Appearance":
        cardContent = <LiveStreamCard data={cardData} />;
        break;
      case "Report & Research Feature":
        cardContent = <ResearchReportCard data={cardData} />;
        break;
      case "Newsletter Feature":
        cardContent = <NewsletterCard data={cardData} />;
        break;
      case "My Collaboration":
        cardContent = <MyCollabCard data={cardData} />;
        break;
      default:
        // Fallback to a default marketing card
        cardContent = <MarketingCard data={cardData} />;
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
            variant="secondary" 
            onClick={() => setLocation('/discovery-filters')}
            aria-label="Filter"
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center space-x-2"
          >
            <SlidersVertical className="h-5 w-5" />
            <span>Filters</span>
          </Button>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="flex-grow flex flex-col justify-center items-center">
            <LoadingScreen />
            <p className="text-center mt-4 text-muted-foreground">Loading collaborations...</p>
          </div>
        ) : error ? (
          <div className="flex-grow flex flex-col justify-center items-center p-6 text-center">
            <div className="bg-red-100 p-4 rounded-lg text-red-800 mb-4">
              <p>Error loading cards</p>
              <p className="text-sm mt-2">{error.toString()}</p>
            </div>
            <Button onClick={() => refetch()} className="mt-2">
              Retry
            </Button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex-grow flex flex-col justify-center items-center p-6 text-center">
            <div className="p-6 rounded-lg text-muted-foreground">
              <p className="mb-2 text-lg">No more cards to discover</p>
              <p className="text-sm">Check back later for new collaborations or update your filters</p>
              <Button 
                onClick={() => setLocation('/discovery-filters')} 
                className="mt-4 flex items-center gap-2"
              >
                <SlidersVertical className="h-4 w-4" />
                <span>Adjust Filters</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Card Stack - only show when we have cards and aren't loading */
          <div className="flex-grow flex flex-col justify-center">
            <div className="relative w-[90%] mx-auto aspect-[3/4] mb-6">
              {/* Background Card (Next in Stack) */}
              {currentIndex < cards.length - 1 && (
                <div className="absolute inset-0 transform scale-[0.95] opacity-50">
                  <Card className="w-full h-full p-5 select-none">
                    {renderCard(cards[currentIndex + 1])}
                  </Card>
                </div>
              )}

              {/* Current Card */}
              {currentCard && (
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
                    style={currentCard.collab_type === "My Collaboration" ? 
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
                          disabled={swipeMutation.isPending}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                        
                        {/* Undo Button */}
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm ${swipeHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleUndo}
                          disabled={swipeHistory.length === 0 || undoMutation.isPending}
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
                          disabled={swipeMutation.isPending}
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>
          
            {/* Instructions - moved to bottom of flex container right above menu */}
            <div className="text-center text-sm text-muted-foreground mb-4">
              <p>→ Swipe right to request collaboration</p>
              <p>← Swipe left to pass</p>
            </div>
          </div>
        )}

        {/* Detailed View Dialog */}
        <CollaborationDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          collaboration={currentCard || {}}
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