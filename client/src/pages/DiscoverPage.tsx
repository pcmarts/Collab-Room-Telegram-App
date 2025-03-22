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
  RotateCcw, SlidersVertical, Loader2, UserCheck
} from "lucide-react";
import { CollaborationDialog } from "@/components/CollaborationDialog";
import { NetworkStatus } from "@/components/NetworkStatus";
import { MatchNotification } from "@/components/MatchNotification";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Collaboration } from "@shared/schema";

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

// Helper function to get the appropriate icon for a collaboration type
const getCollabTypeIcon = (collabType: string) => {
  switch (collabType?.toLowerCase()) {
    case "podcast":
      return <Mic className="w-3 h-3" />;
    case "twitter-spaces":
    case "twitter spaces":
      return <Twitter className="w-3 h-3" />;
    case "livestream":
    case "live stream":
      return <Video className="w-3 h-3" />;
    case "research-report":
    case "research report":
      return <FileText className="w-3 h-3" />;
    case "newsletter":
      return <BookOpen className="w-3 h-3" />;
    case "blog-post":
    case "blog post":
      return <FileText className="w-3 h-3" />;
    default:
      return <Megaphone className="w-3 h-3" />;
  }
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
  
  // Fetch collaborations from real API
  const { data: collaborationsData, isLoading: isLoadingCollabs, isError: isCollabsError, error: collabsError } = useQuery({
    queryKey: ['/api/collaborations/search'],
    refetchOnWindowFocus: false,
    retry: 1, // Retry once in case of network issues
  });
  
  // Fetch potential matches (users who swiped right on host's collaborations)
  const { data: potentialMatchesData, isLoading: isLoadingMatches, isError: isMatchesError, error: matchesError } = useQuery({
    queryKey: ['/api/potential-matches'],
    queryFn: async () => {
      const response = await apiRequest('/api/potential-matches', 'GET');
      if (!response.ok) {
        throw new Error('Failed to fetch potential matches');
      }
      const data = await response.json();
      // Convert potential matches to a card format
      return data.map((match) => ({
        id: match.swipe_id, // Use the swipe ID as the unique identifier
        isPotentialMatch: true, // Flag to identify this as a potential match card
        collab_type: match.collaboration_type,
        description: match.collaboration_description || 'Interested in your collaboration',
        topics: match.collaboration_topics || [],
        // User who swiped right details
        potentialMatchData: {
          user_id: match.user_id,
          first_name: match.user_first_name,
          last_name: match.user_last_name,
          company_name: match.company_name, 
          job_title: match.company_job_title,
          twitter_followers: match.user_twitter_followers,
          company_twitter_followers: match.company_twitter_followers,
          swipe_created_at: match.swipe_created_at,
          collaboration_id: match.collaboration_id
        }
      }));
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
  // Combine loading and error states
  const isLoading = isLoadingCollabs || isLoadingMatches;
  const isError = isCollabsError || isMatchesError;
  const error = collabsError || matchesError;
  
  // Log any query errors
  useEffect(() => {
    if (isError) {
      console.error("Query error:", error);
    }
  }, [isError, error]);

  // Process the collaborations data
  const regularCards = collaborationsData || [];
  const potentialMatchCards = potentialMatchesData || [];
  // Combine cards, showing potential matches first
  const cards = [...potentialMatchCards, ...regularCards];

  // Initialize Telegram WebApp and handle viewport
  useEffect(() => {
    // Prevent scrolling and bouncing
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Ensure the WebApp expands to fullscreen and is properly initialized
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        // Initialize Telegram WebApp
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Adaptive viewport height calculation
        const updateTelegramViewportHeight = () => {
          try {
            // Use Telegram's stable viewport height if available
            if (window.Telegram?.WebApp?.viewportStableHeight) {
              const vh = window.Telegram.WebApp.viewportStableHeight * 0.01;
              document.documentElement.style.setProperty('--vh', `${vh}px`);
            } else {
              // Fallback to window height
              const vh = window.innerHeight * 0.01;
              document.documentElement.style.setProperty('--vh', `${vh}px`);
            }
          } catch (e) {
            console.error("Error updating Telegram viewport height:", e);
          }
        };
        
        // Set initial height
        updateTelegramViewportHeight();
        
        // Update on viewport changes
        const handleViewportChange = () => {
          updateTelegramViewportHeight();
        };
        
        // Handle Telegram viewport and resize events
        if (window.Telegram?.WebApp?.onEvent && typeof window.Telegram.WebApp.onEvent === 'function') {
          window.Telegram.WebApp.onEvent('viewportChanged', handleViewportChange);
        }
        
        // Also listen to regular resize events as backup
        window.addEventListener('resize', updateTelegramViewportHeight);
        
        return () => {
          try {
            if (window.Telegram?.WebApp?.offEvent && typeof window.Telegram.WebApp.offEvent === 'function') {
              window.Telegram.WebApp.offEvent('viewportChanged', handleViewportChange);
            }
            window.removeEventListener('resize', updateTelegramViewportHeight);
          } catch (e) {
            console.error("Error cleaning up Telegram viewport handlers:", e);
          }
        };
      } catch (e) {
        console.error("Error initializing Telegram WebApp:", e);
      }
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
    console.log("=== SWIPE ACTION START ===");
    console.log(`Swipe direction: ${direction}`);
    
    // Check if we have a card to swipe
    if (!currentCard) {
      console.log("No current card available, swipe aborted");
      return;
    }
    
    console.log("Current card:", {
      id: currentCard.id,
      type: currentCard.collab_type,
      creator_id: currentCard.creator_id,
      status: currentCard.status
    });
    
    setConstrained(false);
    const parentWidth =
      cardElem.current?.parentElement?.getBoundingClientRect().width || 1000;
    const childWidth = cardElem.current?.getBoundingClientRect().width || 500;
    const flyAwayDistance =
      direction === "left"
        ? -parentWidth / 2 - childWidth / 2
        : parentWidth / 2 + childWidth / 2;

    console.log("Animation details:", {
      parentWidth,
      childWidth,
      flyAwayDistance
    });

    await controls.start({
      x: flyAwayDistance,
      transition: { duration: 0.3 },
    });
    console.log("Card animation completed");

    console.log(`Swiped ${direction} on card index:`, currentIndex);

    // Save the current card to history before changing index
    setSwipeHistory(prev => [...prev, {
      card: cards[currentIndex],
      direction: direction,
      index: currentIndex
    }]);
    console.log("Updated swipe history, new length:", swipeHistory.length + 1);
    
    // Record the swipe in the database
    try {
      const currentCard = cards[currentIndex];
      if (currentCard && currentCard.id) {
        // Check if this is a potential match card
        if (currentCard.isPotentialMatch) {
          console.log(`Recording ${direction} swipe for potential match with ID: ${currentCard.id}`);
          console.log("API Request payload for potential match:", {
            swipe_id: currentCard.id,
            direction: direction
          });
          
          // For potential matches, we need different handling
          if (direction === "right") {
            // Call the API to record the "accept match" action
            // This would create a match between the two users
            console.log("Sending API request to create a match...");
            const matchResult = await apiRequest(
              '/api/swipes', 
              'POST',
              {
                swipe_id: currentCard.id, // The original swipe ID
                direction: direction,
                is_potential_match: true
              }
            );
            
            console.log('Match decision recorded successfully:', matchResult);
          } else {
            // If swiped left on a potential match, we just record the rejection
            console.log("Rejecting potential match");
            const rejectResult = await apiRequest(
              '/api/swipes', 
              'POST',
              {
                swipe_id: currentCard.id,
                direction: direction,
                is_potential_match: true
              }
            );
            
            console.log('Match rejection recorded successfully:', rejectResult);
          }
        } else {
          // This is a regular collaboration card
          console.log(`Recording ${direction} swipe for collaboration ID: ${currentCard.id}`);
          console.log("API Request payload:", {
            collaboration_id: currentCard.id,
            direction: direction
          });
          
          // Call the API to record the swipe
          console.log("Sending API request to /api/swipes...");
          const swipeResult = await apiRequest(
            '/api/swipes', 
            'POST',
            {
              collaboration_id: currentCard.id,
              direction: direction
            }
          );
          
          console.log('Swipe recorded successfully:', swipeResult);
        }
      } else {
        console.error("Cannot record swipe - missing card ID:", currentCard);
      }
    } catch (error) {
      console.error('Failed to record swipe:', error);
      console.error('Error details:', JSON.stringify(error));
    }

    // Check if it's a right swipe and handle match display
    if (direction === "right") {
      // Get the current card data
      const card = cards[currentIndex];
      
      // Different handling based on whether this is a potential match or regular collaboration
      if (card.isPotentialMatch) {
        // For potential matches, a right swipe immediately creates a match
        // since the other person already swiped right on your collaboration
        const { first_name, last_name, company_name } = card.potentialMatchData;
        const fullName = last_name ? `${first_name} ${last_name}` : first_name;
        
        // Set the match data
        setMatchData({
          title: `Match with ${fullName}`,
          companyName: company_name,
          collaborationType: card.collab_type || "Collaboration"
        });
        
        console.log("MATCH CREATED with potential match! Showing match notification with data:", card);
        
        // Show the match notification (after a slight delay to let the card animation finish)
        setTimeout(() => {
          setShowMatch(true);
        }, 400);
      } else {
        // For regular collaborations, we need to check if there's a match
        // Normally this would be returned from the API when swiping
        // For now, we'll still use random probability until the matching system is fully implemented
        const isMatch = Math.random() < 0.7; // 70% chance of match for easier testing
        
        if (isMatch) {
          // Parse details if it's a string
          const details = typeof card.details === 'string' 
            ? JSON.parse(card.details) 
            : (card.details || {});
          
          // Set the match data with fallbacks to ensure we always have data
          setMatchData({
            title: card.title || 
                   details.title || 
                   details.podcast_name || 
                   details.short_description || 
                   "New Collaboration",
            companyName: getCompanyName(card),
            collaborationType: getCollaborationTypeFromCard(card)
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
    }

    setCurrentIndex((prev) => {
      if (prev === cards.length - 1) {
        // We reached the end of the cards
        return prev; // Stay on the last card instead of resetting
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
    
    // Set the current index back to the previous card
    setCurrentIndex(lastAction.index);
  };

  // Helper function to get company name from details
  const getCompanyName = (card: Collaboration): string => {
    if (!card) return "";
    
    // Try to extract company name from details
    try {
      if (card.details && typeof card.details === 'object') {
        return card.details.company_name || 
               card.details.companyName || 
               "Company";
      }
    } catch (e) {
      console.error("Error parsing company name from details:", e);
    }
    
    return "Company";
  };
  
  // Helper function to get collaboration type from card for display
  const getCollaborationTypeFromCard = (card: Collaboration): string => {
    if (!card) return "Collaboration";
    
    // Use the collab_type property if available
    return card.collab_type || "Collaboration";
  };

  const currentCard = cards[currentIndex];

  // Loading and error states
  if (isLoading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading collaborations...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center">
        <div className="text-center p-6">
          <X className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Collaborations</h3>
          <p className="mb-4">We couldn't load the collaborations. Please try again later.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Function to refresh collaborations
  const refreshCollaborations = () => {
    // Reset current index
    setCurrentIndex(0);
    // Clear swipe history
    setSwipeHistory([]);
    // Refetch the data
    queryClient.invalidateQueries({ queryKey: ['/api/collaborations/search'] });
  };

  // Function to render the empty state
  const renderEmptyState = (message: string = "No collaborations available right now. Check back later or adjust your filter settings.") => {
    return (
      <div className="min-h-[100svh] flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <h3 className="text-xl font-semibold mb-2">No Collaborations Available</h3>
          <p className="mb-6">{message}</p>
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Button onClick={refreshCollaborations}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setLocation('/discovery-filters')} variant="outline">
              <SlidersVertical className="w-4 h-4 mr-2" />
              Adjust Filters
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // No collaborations available
  if (cards.length === 0) {
    return renderEmptyState();
  }
  
  // If user has viewed all cards (reached the end)
  if (currentIndex === cards.length - 1 && swipeHistory.length > 0 && swipeHistory.length >= cards.length) {
    return renderEmptyState("You've viewed all available collaborations. Check back later or adjust your filters to see more.");
  }

  const renderCard = (card: any) => {
    // Handle the case where card might be null (at the end of the deck)
    if (!card) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-base font-medium mb-1">No More Cards</h3>
          <p className="text-sm text-muted-foreground mb-3">You've reached the end of available collaborations.</p>
          <div className="flex flex-col space-y-2">
            <Button 
              size="sm" 
              onClick={refreshCollaborations}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/discovery-filters')}
              className="text-xs"
            >
              <SlidersVertical className="h-3 w-3 mr-1" />
              Adjust Filters
            </Button>
          </div>
        </div>
      );
    }
    
    // Check if it's a potential match card
    if (card.isPotentialMatch && card.potentialMatchData) {
      const { first_name, last_name, company_name, job_title } = card.potentialMatchData;
      const fullName = last_name ? `${first_name} ${last_name}` : first_name;
      
      return (
        <div className="w-full h-full bg-background p-6 rounded-xl border-2 border-blue-200">
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <Badge variant="outline" className="bg-primary/10 mb-2">
                <UserCheck className="w-3 h-3 mr-1" />
                Potential Match
              </Badge>
              <h3 className="text-lg font-semibold mb-1">
                {fullName} is interested in your collaboration
              </h3>
              <p className="text-sm text-muted-foreground">
                {job_title} at {company_name}
              </p>
            </div>
            
            <div className="mb-4 flex-1">
              <div className="rounded-lg bg-card p-3 mb-4">
                <p className="text-sm font-medium mb-1">Collaboration Type</p>
                <div className="flex items-center">
                  {getCollabTypeIcon(card.collab_type)}
                  <span className="ml-1 text-sm">{card.collab_type}</span>
                </div>
              </div>
              
              {card.topics && card.topics.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Topics of Interest:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {card.topics.map((topic: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 bg-transparent text-gray-500 border border-[#6B7280] text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-sm">
                Swipe right to match with {first_name} or left to pass.
              </p>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium">Swipe right to connect</h4>
                  <p className="text-xs text-muted-foreground">
                    A match will be created when both parties swipe right
                  </p>
                </div>
                <Check className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Parse details if it's a string
    let details = {};
    try {
      if (typeof card.details === 'string') {
        details = JSON.parse(card.details);
      } else if (card.details) {
        details = card.details;
      }
    } catch (e) {
      console.error("Error parsing card details:", e);
    }
    
    // Check if this is a "mycollab" card (a collaboration created by the current user)
    const isMyCollab = false; // We don't have mycollab cards in the search results since they are filtered out by the API
    
    // Create a standardized card data object with fallbacks
    const cardData = {
      ...card,
      details,
      companyName: getCompanyName(card),
      title: card.title || 
             (details as any)?.title || 
             (details as any)?.podcast_name || 
             "Collaboration",
      description: card.description || 
                  (details as any)?.short_description || 
                  (details as any)?.description || 
                  "",
      type: card.collab_type, // Use the collaboration type from the database
      collaborationType: card.collab_type || "Collaboration", // For compatibility with the card components
    };
    
    // Create the appropriate component based on collab_type
    let cardContent;
    switch (card.collab_type?.toLowerCase()) {
      case "podcast":
        cardContent = <PodcastCard data={cardData} />;
        break;
      case "twitter-spaces":
      case "twitter spaces":
        cardContent = <TwitterSpacesCard data={cardData} />;
        break;
      case "livestream":
      case "live stream":
        cardContent = <LiveStreamCard data={cardData} />;
        break;
      case "research-report":
      case "research report":
        cardContent = <ResearchReportCard data={cardData} />;
        break;
      case "newsletter":
        cardContent = <NewsletterCard data={cardData} />;
        break;
      case "blog-post":
      case "blog post":
        cardContent = <BlogPostCollabCard data={cardData} />;
        break;
      default:
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
        
        {/* Adjust card position to be higher on the page */}
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
        {currentCard && (
          <CollaborationDialog
            isOpen={showDialog}
            onClose={() => setShowDialog(false)}
            collaboration={{
              // Required props 
              companyName: getCompanyName(currentCard),
              // Optional props with actual data
              title: currentCard.title || "Collaboration Opportunity",
              collaborationType: currentCard.collab_type || "Collaboration",
              description: currentCard.description || "",
              // Ensure collaborationType is always a string
              type: currentCard.collab_type || undefined,
              // Remove potentially problematic properties
              details: undefined, // We've already extracted what we need
              // Keep the rest of the properties
              id: currentCard.id,
              creator_id: currentCard.creator_id,
              status: currentCard.status || "active",
              topics: currentCard.topics || []
            }}
          />
        )}
        
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