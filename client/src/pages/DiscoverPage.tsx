import { useState, useRef, useEffect, useMemo } from "react";
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
import { CollaborationDetailsDialog } from "@/components/CollaborationDetailsDialog";
import { NetworkStatus } from "@/components/NetworkStatus";
import { MatchNotification } from "@/components/MatchNotification";
import { GlowFilterButton } from "@/components/GlowFilterButton";
import { PotentialMatchCard } from "@/components/PotentialMatchCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Collaboration as BaseCollaboration } from "@shared/schema";

// Extended Collaboration type to include the company name and data from our API
interface Collaboration extends BaseCollaboration {
  creator_company_name?: string;
  company_data?: {
    id: string;
    name?: string;
    short_description?: string;
    long_description?: string;
    website?: string;
    job_title?: string;
    twitter_handle?: string;
    twitter_followers?: string;
    linkedin_url?: string;
    funding_stage?: string;
    has_token?: boolean;
    token_ticker?: string;
    blockchain_networks?: string[];
    tags?: string[];
  };
}

// Define a generic card data interface that all specialized cards can use
interface CardData {
  id?: string;
  companyName?: string;
  title?: string;
  description?: string;
  type?: string;
  collaborationType?: string;
  topics?: string[];
  companyWebsite?: string;
  hostHandle?: string;
  estimatedReach?: string;
  podcastName?: string;
  podcastLink?: string;
  // Allow additional properties for specialized card types
  details?: Record<string, any>;
  [key: string]: any;
}

import { Badge } from "@/components/ui/badge";
import { FiExternalLink } from "react-icons/fi";

// Blog Post Collaboration Card (Replacing Conference Coffee Card)
const BlogPostCollabCard = ({ data }: { data: CardData }) => {
  // Handle data.details (JSON field) with type assertion for Blog Post specific fields
  const details = data.details || {} as {
    blog_title?: string;
    role?: string;
    publication_date?: string;
    specific_date?: string;
    short_description?: string;
    website_url?: string;
    topics?: string[];
  };
  
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
const PodcastCard = ({ data }: { data: CardData }) => {
  // Handle data.details (JSON field) with type assertion for podcast-specific fields
  const details = data.details || {} as {
    podcast_name?: string;
    podcast_description?: string;
    short_description?: string;
    estimated_reach?: string;
    podcast_link?: string;
  };
  
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
const TwitterSpacesCard = ({ data }: { data: CardData }) => {
  // Handle data.details (JSON field) with type assertion for Twitter Spaces specific fields
  const details = data.details || {} as {
    short_description?: string;
    twitter_handle?: string;
    host_follower_count?: string;
    space_name?: string;
    space_date?: string;
    estimated_reach?: string;
    topics?: string[];
  };
  
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
const LiveStreamCard = ({ data }: { data: CardData }) => {
  // Handle data.details (JSON field) with type assertion for Live Stream specific fields
  const details = data.details || {} as {
    title?: string;
    expected_audience_size?: string;
    specific_date?: string;
    date_selection?: string;
    previous_stream_link?: string;
    short_description?: string;
    topics?: string[];
  };
  
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
const ResearchReportCard = ({ data }: { data: CardData }) => {
  // Handle data.details (JSON field) with type assertion for Research Report specific fields
  const details = data.details || {} as {
    report_name?: string;
    research_topic?: string;
    target_release_date?: string;
    estimated_reach?: string;
    short_description?: string;
    topics?: string[];
  };
  
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
const NewsletterCard = ({ data }: { data: CardData }) => {
  // Handle data.details (JSON field) with type assertion for Newsletter specific fields
  const details = data.details || {} as {
    newsletter_name?: string;
    subscribers_count?: string;
    newsletter_url?: string;
    specific_date?: string;
    date_selection?: string;
    short_description?: string;
    topics?: string[];
  };
  
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
const MyCollabCard = ({ data }: { data: CardData }) => (
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
const MarketingCard = ({ data }: { data: CardData }) => (
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

const ConferenceCard = ({ data }: { data: CardData }) => (
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

const RequestCard = ({ data }: { data: CardData }) => (
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

// Using only real API data - dummy data has been removed

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
  // Define swipe history type with proper interface
  interface SwipeHistoryItem {
    card: any;
    direction: "left" | "right";
    index: number;
  }
  
  // Track if all cards have been viewed (to avoid unnecessary API calls)
  // Initialize from localStorage if available with user-specific key
  const [allCardsViewed, setAllCardsViewedState] = useState<boolean>(() => {
    try {
      // Get user-specific localStorage key
      const userId = userProfileData?.user?.id;
      const storageKey = userId ? `allCardsViewed_${userId}` : 'allCardsViewed';
      
      // Check if we've stored the "all cards viewed" state in localStorage
      const storedValue = localStorage.getItem(storageKey);
      console.log(`Reading allCardsViewed from localStorage with key ${storageKey}: ${storedValue}`);
      return storedValue === 'true';
    } catch (e) {
      // If any error occurs reading from localStorage, default to false
      console.error('Error reading from localStorage:', e);
      return false;
    }
  });
  
  // Override setState to also update localStorage with user-specific key
  const setAllCardsViewed = (value: boolean) => {
    try {
      // Get user-specific localStorage key
      const userId = userProfileData?.user?.id;
      const storageKey = userId ? `allCardsViewed_${userId}` : 'allCardsViewed';
      
      // Update localStorage when state changes
      localStorage.setItem(storageKey, String(value));
      console.log(`Saved allCardsViewed=${value} to localStorage with key ${storageKey}`);
    } catch (e) {
      console.error('Failed to save allCardsViewed state to localStorage:', e);
    }
    // Update React state
    setAllCardsViewedState(value);
  };
  
  // Store history of swiped cards for the current session
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);
  
  // Create a ref for swipe history to use in effects and callbacks
  const swipeHistoryRef = useRef<SwipeHistoryItem[]>([]);
  
  // Fetch the user's swipe history from the server first
  // This is the primary query that will determine if we should load other data
  const { 
    data: serverSwipeHistory, 
    isLoading: isLoadingSwipeHistory
  } = useQuery({
    queryKey: ['/api/user-swipes'],
    queryFn: async () => {
      try {
        console.log('Fetching user swipe history...');
        const data = await apiRequest('/api/user-swipes');
        console.log('User swipe history fetched successfully, count:', data.length);
        return data;
      } catch (err) {
        console.error('User swipe history fetch error:', err);
        throw err;
      }
    },
    // Always need swipe history to determine if we should load other data
    staleTime: 10 * 60 * 1000, // 10 minutes - reduce refetching
  });
  
  // Update the ref whenever the state changes
  useEffect(() => {
    swipeHistoryRef.current = swipeHistory;
  }, [swipeHistory]);
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
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);
  
  // Use server swipe history to check if we need to fetch more data
  // This effect ensures we check swipe history and prevent unnecessary queries
  // We no longer set the allCardsViewed flag based on a simple threshold
  // Instead, we'll compare the number of cards available to the number swiped
  // This is handled in the cards useMemo block where we have access to both values

  // Fetch collaborations from real API
  const { data: collaborationsData, isLoading: isLoadingCollabs, isError: isCollabsError, error: collabsError } = useQuery({
    queryKey: ['/api/collaborations/search'],
    queryFn: async () => {
      try {
        console.log('Fetching collaborations...');
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/collaborations/search');
        console.log('Collaborations fetched successfully, count:', data.length);
        return data;
      } catch (err) {
        console.error('Collaboration fetch error:', err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    retry: 1, // Retry once in case of network issues
    // Completely disable this query when allCardsViewed is true
    // Also wait for server swipe history to load before making this call
    enabled: !allCardsViewed && !isLoadingSwipeHistory
  });
  
  // Fetch potential matches (users who swiped right on host's collaborations)
  const { data: potentialMatchesData, isLoading: isLoadingMatches, isError: isMatchesError, error: matchesError } = useQuery({
    queryKey: ['/api/potential-matches'],
    queryFn: async () => {
      try {
        console.log('Fetching potential matches...');
        // Use the standardized apiRequest function to ensure Telegram headers are included
        const data = await apiRequest('/api/potential-matches');
        console.log('Potential matches fetched successfully, count:', Array.isArray(data) ? data.length : 'not an array');
        
        // If data is empty array, return it directly
        if (!data || !Array.isArray(data) || data.length === 0) {
          return [];
        }
        
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
      } catch (err) {
        console.error('Potential matches fetch error:', err);
        // Return empty array instead of throwing to avoid error screen when only potential matches fail
        // This allows regular collaborations to still be shown
        return [];
      }
    },
    refetchOnWindowFocus: false,
    retry: 1,
    // Completely disable this query when allCardsViewed is true
    // Also wait for server swipe history to load before making this call
    enabled: !allCardsViewed && !isLoadingSwipeHistory
  });
  
  // Combine loading and error states
  const isLoading = isLoadingCollabs || isLoadingMatches || isLoadingSwipeHistory;
  // Only flag error if collaborations query fails (we can still show the UI with just collaborations)
  const isError = isCollabsError;
  const error = collabsError;
  
  // Log any query errors
  useEffect(() => {
    if (isError) {
      console.error("Query error:", error);
    }
  }, [isError, error]);

  // Track location changes to refresh data when returning from filters page
  const queryClient = useQueryClient();
  useEffect(() => {
    // Track the current location
    const currentLocation = location;
    
    // If we previously were at /filters and now we're back at /discover, refresh the data
    if (previousLocation === '/filters' && currentLocation === '/discover') {
      console.log('Returning from filters page, refreshing data...');
      // Invalidate the queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['/api/collaborations/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/potential-matches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
    }
    
    // Update the previous location state
    setPreviousLocation(currentLocation);
  }, [location, previousLocation, queryClient]);

  // Extract all swiped card IDs (from both client-side history and server-side history)
  const allSwipedCardIds = useMemo(() => {
    // Get IDs from current session swipe history
    const sessionIds = [...swipeHistoryRef.current, ...swipeHistory]
      .map(hist => hist.card?.id)
      .filter(Boolean) as string[];
    
    // Get IDs from server swipe history
    const serverIds = serverSwipeHistory 
      ? serverSwipeHistory.map(swipe => swipe.collaboration_id)
      : [];
    
    // Log server swipe history for debugging
    if (serverSwipeHistory && serverSwipeHistory.length > 0) {
      console.log('Server swipe history:', serverSwipeHistory);
    }
    
    // Combine all IDs and remove duplicates using Set
    // Use Array.from() to convert Set to array to avoid TypeScript error
    const uniqueIdsSet = new Set([...sessionIds, ...serverIds]);
    const uniqueIds = Array.from(uniqueIdsSet);
    
    console.log('All swiped card IDs:', {
      fromRef: swipeHistoryRef.current.length, 
      fromState: swipeHistory.length,
      fromServer: serverIds.length,
      uniqueIds: uniqueIds,
      uniqueIdsCount: uniqueIds.length
    });
    
    return uniqueIds;
  }, [swipeHistory, swipeHistoryRef.current, serverSwipeHistory]);
  
  // Process and filter the cards in a single useMemo for better performance and consistency
  const { filteredPotentialMatchCards, filteredRegularCards } = useMemo(() => {
    // Process potential match cards
    const potentialMatches = Array.isArray(potentialMatchesData) 
      ? potentialMatchesData.map(card => ({
          ...card,
          isPotentialMatch: true
        }))
      : [];
      
    // Process regular collaboration cards  
    const regularCards = Array.isArray(collaborationsData)
      ? collaborationsData.map(card => ({
          ...card,
          isPotentialMatch: false
        }))
      : [];
    
    // Log data for debugging
    console.log("Loaded card data:", {
      regularCardsCount: regularCards.length,
      potentialMatchesCount: potentialMatches.length,
      swipedCardsCount: allSwipedCardIds.length,
      swipedCardIds: allSwipedCardIds,
      hasCollaborationsData: !!collaborationsData,
      hasPotentialMatchesData: !!potentialMatchesData
    });
    
    // Filter out cards that have been swiped on in the current session
    const filteredPotentialMatches = potentialMatches.filter(
      card => !allSwipedCardIds.includes(card.id)
    );
    
    const filteredRegulars = regularCards.filter(
      card => !allSwipedCardIds.includes(card.id)
    );
    
    console.log(`Filtered cards:`, {
      potentialMatchesRemaining: filteredPotentialMatches.length,
      regularCardsRemaining: filteredRegulars.length,
      filteredOutCount: (potentialMatches.length + regularCards.length) - 
                        (filteredPotentialMatches.length + filteredRegulars.length)
    });
    
    // Check if we should set allCardsViewed flag with reliable logic
    const totalCards = potentialMatches.length + regularCards.length;
    const totalFilteredCards = filteredPotentialMatches.length + filteredRegulars.length;
    const totalSwipedCards = allSwipedCardIds.length;
    
    // ONLY set allCardsViewed when filtering leaves us with zero cards
    // This is the most reliable approach that won't trigger prematurely
    if (totalCards > 0 && totalFilteredCards === 0 && !isLoading) {
      console.log(`All cards viewed check: totalCards=${totalCards}, totalSwipedCards=${totalSwipedCards}, filtered=${totalFilteredCards}, ratio=${totalSwipedCards/totalCards}`);
      console.log("No cards remain after filtering - setting allCardsViewed=true");
      setAllCardsViewed(true);
    }
    
    return {
      filteredPotentialMatchCards: filteredPotentialMatches,
      filteredRegularCards: filteredRegulars
    };
  }, [collaborationsData, potentialMatchesData, allSwipedCardIds, isLoading]);
  
  // Combine cards, showing potential matches first - using useMemo for performance
  const cards = useMemo(() => {
    return [...filteredPotentialMatchCards, ...filteredRegularCards];
  }, [filteredPotentialMatchCards, filteredRegularCards]);

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
    const newSwipeHistoryItem = {
      card: cards[currentIndex],
      direction: direction,
      index: currentIndex
    };
    
    // Update both the state and the ref directly for immediate consistency
    setSwipeHistory(prev => [...prev, newSwipeHistoryItem]);
    
    // Also update the ref immediately so it's available for filtering right away
    swipeHistoryRef.current = [...swipeHistoryRef.current, newSwipeHistoryItem];
    
    console.log("Updated swipe history:", {
      stateLength: swipeHistory.length + 1,
      refLength: swipeHistoryRef.current.length,
      cardId: cards[currentIndex]?.id,
      cardType: cards[currentIndex]?.isPotentialMatch ? 'potential match' : 'regular collab'
    });
    
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
            
            // Invalidate the user-swipes query to ensure we get the latest data
            queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
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
            
            // Invalidate the user-swipes query to ensure we get the latest data
            queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
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
          
          // Invalidate the user-swipes query to ensure we get the latest data
          queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
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
        // For regular collaborations, a match will be determined by the server
        // only if the host has already swiped right on one of this user's collaborations
        console.log("Regular collaboration swipe - waiting for server match notification");
        
        // We no longer simulate random matches here, as the backend will create
        // a match if appropriate and notify the user
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
    
    console.log('Undo action:', {
      lastAction,
      currentSwipeHistoryLength: swipeHistory.length,
      currentRefLength: swipeHistoryRef.current.length
    });
    
    // Remove the last action from history
    setSwipeHistory(prev => prev.slice(0, -1));
    
    // Also update the ref immediately
    swipeHistoryRef.current = swipeHistoryRef.current.slice(0, -1);
    
    // Set the current index back to the previous card
    setCurrentIndex(lastAction.index);
    
    console.log('After undo:', {
      newSwipeHistoryLength: swipeHistory.length - 1,
      newRefLength: swipeHistoryRef.current.length,
      newIndex: lastAction.index
    });
  };

  // Helper function to get company name from collaboration
  const getCompanyName = (card: Collaboration): string => {
    if (!card) return "";
    
    // Add logging to debug the company data
    console.log("Getting company name for card:", {
      card_id: card.id,
      has_company_data: !!card.company_data,
      company_data_name: card.company_data?.name,
      creator_company_name: card.creator_company_name
    });
    
    // Try to extract company name from details
    try {
      // First check if company_data is available (directly from the database)
      if (card.company_data && card.company_data.name) {
        return card.company_data.name;
      }
      
      // Then check if the creator's company information is available
      if (card.creator_company_name) {
        return card.creator_company_name;
      }
      
      // Then check the details object
      if (card.details && typeof card.details === 'object') {
        const details = card.details as Record<string, any>;
        if (details.company_name) return details.company_name;
        if (details.companyName) return details.companyName;
      }
      
      // Finally, provide a fallback name
      return "Company";
    } catch (e) {
      console.error("Error extracting company name:", e);
      return "Company";
    }
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

  // Function to refresh collaborations with more robust handling
  const refreshCollaborations = () => {
    console.log('=== REFRESH ACTION START ===');
    console.log('Current state before refresh:', {
      currentIndex,
      swipeHistoryLength: swipeHistory.length,
      cardCount: cards.length,
      allCardsViewed
    });
    
    // Reset the allCardsViewed flag to allow new fetches
    setAllCardsViewed(false);
    
    // First clear the swipe history
    setSwipeHistory([]);
    
    // Reset current index
    setCurrentIndex(0);
    
    // Update the swipe history ref directly in addition to the state
    swipeHistoryRef.current = [];
    
    // Force immediate refetch to ensure we get fresh data
    queryClient.resetQueries({ queryKey: ['/api/collaborations/search'] });
    queryClient.resetQueries({ queryKey: ['/api/potential-matches'] });
    queryClient.resetQueries({ queryKey: ['/api/user-swipes'] });
    
    // Then trigger a refetch with invalidation (these are different operations)
    queryClient.invalidateQueries({ queryKey: ['/api/collaborations/search'] });
    queryClient.invalidateQueries({ queryKey: ['/api/potential-matches'] });
    queryClient.invalidateQueries({ queryKey: ['/api/user-swipes'] });
    
    console.log('Cache cleared and queries invalidated');
    console.log('Refreshing both collaboration cards and potential matches...');
    
    // Force a delay to ensure the state updates are applied
    setTimeout(() => {
      console.log('Refresh state check:', {
        allCardsViewedFlag: allCardsViewed, // Should be false now
        swipeHistoryLength: swipeHistory.length,
        swipeHistoryRefLength: swipeHistoryRef.current.length,
        cardCount: cards.length,
        currentIndex
      });
    }, 300);
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

  // Handle scenarios where we need to show the empty state
  
  // If explicitly marked as "all cards viewed", show appropriate state
  if (allCardsViewed) {
    console.log("All cards viewed flag is true - showing empty state");
    return renderEmptyState("You've viewed all available collaborations. Check back later or adjust your filters to see more.");
  }
  
  // Show fallback rendering without error state if successful data load but no cards
  if (collaborationsData && Array.isArray(collaborationsData) && filteredRegularCards.length === 0) {
    console.log("Successfully loaded data but no collaborations available");
    return renderEmptyState("No collaborations available right now. Check back later or adjust your filter settings.");
  }
  
  // No collaborations available
  if (cards.length === 0) {
    return renderEmptyState();
  }
  
  // If user has viewed all cards (reached the end)
  if (currentIndex === cards.length - 1 && swipeHistory.length > 0 && swipeHistory.length >= cards.length) {
    // Set the allCardsViewed flag for future API optimization
    setAllCardsViewed(true);
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
      // Use our dedicated PotentialMatchCard component
      return (
        <PotentialMatchCard
          collab_type={card.collab_type}
          description={card.description}
          topics={card.topics}
          potentialMatchData={card.potentialMatchData}
        />
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
    
    // Add detailed logging to help debug card rendering issues
    console.log("========== CARD DEBUG INFO ==========");
    console.log(`Card ID: ${card.id}`);
    console.log(`Card Type (raw): ${card.collab_type}`);
    console.log(`Is Podcast Card? ${card.id === 'e1d8af65-5fd9-4585-be3a-f65d9ad7c565'}`);
    console.log(`Card Title: ${cardData.title}`);
    console.log(`Company Name: ${cardData.companyName}`);
    console.log(`Card Details:`, JSON.stringify(details, null, 2));
    
    // Special check for podcast collaboration with ID e1d8af65-5fd9-4585-be3a-f65d9ad7c565
    if (card.id === 'e1d8af65-5fd9-4585-be3a-f65d9ad7c565') {
      console.log('SPECIAL ATTENTION: Found podcast collaboration!');
      console.log(`Collab Type Lowercase: ${card.collab_type?.toLowerCase()}`);
      console.log(`Collab Type Case Insensitive Check: podcast = ${card.collab_type?.toLowerCase() === 'podcast'}`);
      
      // Type assertion for the podcast-specific details
      const podcastDetails = details as {
        podcast_name?: string;
        podcast_link?: string;
        estimated_reach?: string;
      };
      
      // Check for properties specific to podcast cards
      console.log(`Has podcast_name: ${!!podcastDetails.podcast_name}`);
      console.log(`Podcast Name: ${podcastDetails.podcast_name || 'N/A'}`);
      console.log(`Has podcast_link: ${!!podcastDetails.podcast_link}`);
      console.log(`Podcast Link: ${podcastDetails.podcast_link || 'N/A'}`);
      console.log(`Has estimated_reach: ${!!podcastDetails.estimated_reach}`);
      console.log(`Estimated Reach: ${podcastDetails.estimated_reach || 'N/A'}`);
    }
    
    // Type assertion for additional common details that might be in any card type
    const extendedDetails = details as {
      twitter_handle?: string;
      company_website?: string;
    };
    
    // Log additional card properties that might affect rendering
    console.log(`Has Twitter handle: ${!!(extendedDetails.twitter_handle || cardData.hostHandle)}`);
    console.log(`Twitter handle value: ${extendedDetails.twitter_handle || cardData.hostHandle || 'N/A'}`);
    console.log(`Has company website: ${!!(extendedDetails.company_website || cardData.companyWebsite)}`);
    console.log(`Company website value: ${extendedDetails.company_website || cardData.companyWebsite || 'N/A'}`);
    
    // Log data passed to card components
    console.log(`Card data being passed to component:`, JSON.stringify(cardData, null, 2));
    
    // Create the appropriate component based on collab_type
    let cardContent;
    let cardType = card.collab_type?.toLowerCase() || 'unknown';
    
    console.log(`Selecting card component for type: ${cardType}`);
    
    // Define a mapping between database collaboration types and card components
    // This makes it easy to add new types or modify existing ones in a single place
    const CARD_TYPE_MAPPING: Record<string, React.FC<{ data: CardData }>> = {
      // Podcast variations
      "podcast": PodcastCard,
      "podcast guest appearance": PodcastCard,
      "podcast interview": PodcastCard,
      "podcast feature": PodcastCard,
      
      // Twitter Spaces variations
      "twitter-spaces": TwitterSpacesCard,
      "twitter spaces": TwitterSpacesCard, 
      "twitter spaces guest": TwitterSpacesCard,
      "twitter space": TwitterSpacesCard,
      
      // Twitter Co-Marketing variations
      "twitter co-marketing": MarketingCard,
      "twitter comarketing": MarketingCard,
      "co-marketing on twitter": MarketingCard,
      "comarketing on twitter": MarketingCard,
      
      // Livestream variations
      "livestream": LiveStreamCard,
      "live stream": LiveStreamCard,
      "video livestream": LiveStreamCard,
      
      // Research report variations
      "research-report": ResearchReportCard,
      "research report": ResearchReportCard,
      "market report": ResearchReportCard,
      
      // Newsletter variations
      "newsletter": NewsletterCard,
      "email newsletter": NewsletterCard,
      "newsletter feature": NewsletterCard,
      
      // Blog post variations
      "blog-post": BlogPostCollabCard,
      "blog post": BlogPostCollabCard,
      "blog post feature": BlogPostCollabCard,
      "guest blog": BlogPostCollabCard,
    };
    
    // Logging to help with debugging
    console.log('CARD TYPE SELECTION:', cardType);
    if (CARD_TYPE_MAPPING[cardType]) {
      console.log(`Found matching card component for type: ${cardType}`);
    } else {
      console.log(`No specialized card found for type '${cardType}', using MarketingCard as fallback`);
    }
    
    // Function to find the best card component using fuzzy matching
    // This helps handle minor variations in naming that aren't explicitly mapped
    const findBestCardComponent = (type: string): React.FC<{ data: CardData }> => {
      // 1. Direct match (fastest path)
      if (CARD_TYPE_MAPPING[type]) {
        return CARD_TYPE_MAPPING[type];
      }
      
      // 2. Try to find a partial match
      const typeWords = type.split(/[\s-]+/).filter(word => word.length > 2);
      
      // Check for keyword matches in the collaboration type
      if (typeWords.some(word => word === 'podcast')) {
        return PodcastCard;
      }
      
      // First check for Twitter co-marketing to ensure it doesn't match with Twitter Spaces
      if ((typeWords.includes('twitter') && (typeWords.includes('co-marketing') || typeWords.includes('comarketing'))) ||
          (typeWords.includes('twitter') && typeWords.includes('marketing'))) {
        return MarketingCard;
      }
      
      // Then check for Twitter Spaces
      if (typeWords.some(word => word === 'twitter' || word === 'spaces')) {
        // Check if it's a Twitter Spaces or a Twitter co-marketing collab based on details
        const details = cardData.details;
        if (details && details.host_twitter_handle && details.twittercomarketing_type) {
          return MarketingCard;
        }
        return TwitterSpacesCard;
      }
      
      if (typeWords.some(word => word === 'livestream' || word === 'stream' || word === 'live')) {
        return LiveStreamCard;
      }
      
      if (typeWords.some(word => word === 'blog' || word === 'post')) {
        return BlogPostCollabCard;
      }
      
      if (typeWords.some(word => word === 'research' || word === 'report')) {
        return ResearchReportCard;
      }
      
      if (typeWords.some(word => word === 'newsletter' || word === 'email')) {
        return NewsletterCard;
      }
      
      // 3. If no matches are found, use the default card
      return MarketingCard;
    };
    
    // Use the fuzzy matching function to find the best component
    const CardComponent = findBestCardComponent(cardType);
    cardContent = <CardComponent data={cardData} />;
    
    console.log(`Rendering ${CardComponent.name} component for type "${cardType}"`);
    
    // Log if a fuzzy match was used instead of an exact match
    if (!CARD_TYPE_MAPPING[cardType]) {
      console.log(`Note: Using fuzzy matching to determine card component for "${cardType}"`);
    }
    
    console.log("====================================");
    
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
          <GlowFilterButton 
            onClick={() => setLocation('/discovery-filters')}
            className="ml-2"
          />
        </div>
        
        {/* Adjust card position to be higher on the page */}
        <div className="flex-grow flex flex-col justify-center">
          <div className="relative w-[90%] mx-auto aspect-[3/4] mb-6">
            {/* Background Card (Next in Stack) */}
            {currentIndex < cards.length - 1 && (
              <div className="absolute inset-0 transform scale-[0.95] opacity-50">
                <div className="w-full h-full p-5 select-none rounded-lg border bg-card text-card-foreground shadow-sm">
                  {renderCard(cards[currentIndex + 1])}
                </div>
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
              <div 
                className="w-full h-full p-5 select-none cursor-grab active:cursor-grabbing rounded-lg border bg-card text-card-foreground shadow-sm"
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
                      onClick={() => {
                        console.log("Current Card Data:", JSON.stringify(currentCard, null, 2));
                        setShowDialog(true);
                      }}
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
              </div>
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
          <CollaborationDetailsDialog
            isOpen={showDialog}
            onClose={() => setShowDialog(false)}
            collaboration={{
              // Basic collaboration info
              id: currentCard.id,
              title: currentCard.title || "Collaboration Opportunity",
              collab_type: currentCard.collab_type || "Collaboration",
              description: currentCard.description || "",
              date: currentCard.specific_date || "",
              topics: currentCard.topics || [],
              
              // Company Info - these are legacy fields, but we'll keep them for compatibility
              companyName: getCompanyName(currentCard),
              companyWebsite: currentCard.details?.company_website || currentCard.details?.website,
              companyTwitter: currentCard.details?.twitter_handle || currentCard.details?.companyTwitter,
              twitterFollowers: currentCard.company_twitter_followers || currentCard.details?.twitter_followers,
              companyLinkedIn: currentCard.details?.linkedin_url || currentCard.details?.companyLinkedIn,
              companySector: currentCard.details?.sector || currentCard.company_tags?.[0],
              fundingStage: currentCard.funding_stage,
              blockchainNetworks: currentCard.company_blockchain_networks || currentCard.required_blockchain_networks,
              hasToken: currentCard.company_has_token || currentCard.required_token_status,
              tokenTicker: currentCard.company_token_ticker,
              
              // Pass the detailed data for the collaboration
              details: currentCard.details || {},
              
              // Pass company data directly from the API
              // Explicitly log what we're passing to help debug
              company_data: {
                id: currentCard.company_data?.id,
                name: currentCard.company_data?.name,
                short_description: currentCard.company_data?.short_description,
                long_description: currentCard.company_data?.long_description,
                website: currentCard.company_data?.website,
                job_title: currentCard.company_data?.job_title,
                twitter_handle: currentCard.company_data?.twitter_handle,
                twitter_followers: currentCard.company_data?.twitter_followers,
                linkedin_url: currentCard.company_data?.linkedin_url,
                funding_stage: currentCard.company_data?.funding_stage,
                has_token: currentCard.company_data?.has_token,
                token_ticker: currentCard.company_data?.token_ticker,
                blockchain_networks: currentCard.company_data?.blockchain_networks,
                tags: currentCard.company_data?.tags
              },
              
              // Backward compatibility
              type: currentCard.collab_type
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