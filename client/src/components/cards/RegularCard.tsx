import { Badge } from "@/components/ui/badge";
import { Twitter, Calendar, Megaphone, Headphones, FileText, Mail, Video, BarChart } from "lucide-react";

// Basic card data interface
export interface CardData {
  id?: string;
  companyName?: string;
  title?: string;
  description?: string;
  type?: string;
  collaborationType?: string;
  topics?: string[];
  preferredTopics?: string[];
  roleTitle?: string;
  date?: string;
  specific_date?: string;
  details?: {
    host_twitter_handle?: string;
    host_follower_count?: string;
    twittercomarketing_type?: string | string[];
    [key: string]: any;
  };
  [key: string]: any;
}

// Helper function to get the icon for a collaboration type
const getCollaborationTypeIcon = (type: string | undefined) => {
  if (!type) return Megaphone;
  
  const typeLower = type.toLowerCase();
  
  if (typeLower.includes('twitter') && (typeLower.includes('co-marketing') || typeLower.includes('comarketing'))) {
    return Twitter;
  } else if (typeLower.includes('twitter')) {
    return Twitter;
  } else if (typeLower.includes('podcast')) {
    return Headphones;
  } else if (typeLower.includes('blog')) {
    return FileText;
  } else if (typeLower.includes('livestream') || typeLower.includes('live stream')) {
    return Video;
  } else if (typeLower.includes('newsletter')) {
    return Mail;
  } else if (typeLower.includes('research') || typeLower.includes('report')) {
    return BarChart;
  }
  
  return Megaphone;
};

// Helper function to get badge styling based on collaboration type
const getCollaborationBadgeClass = (type: string | undefined): string => {
  if (!type) return "bg-primary/10 border-primary/20";
  
  const typeLower = type.toLowerCase();
  
  if (typeLower.includes('twitter') && (typeLower.includes('co-marketing') || typeLower.includes('comarketing'))) {
    return "bg-blue-500/10 border-blue-500/30 text-[#1DA1F2]";
  } else if (typeLower.includes('twitter')) {
    return "bg-blue-500/10 border-blue-500/30";
  } else if (typeLower.includes('podcast')) {
    return "bg-purple-500/10 border-purple-500/30";
  } else if (typeLower.includes('blog')) {
    return "bg-emerald-500/10 border-emerald-500/30";
  } else if (typeLower.includes('livestream') || typeLower.includes('live stream')) {
    return "bg-red-500/10 border-red-500/30";
  } else if (typeLower.includes('newsletter')) {
    return "bg-emerald-500/10 border-emerald-500/30";
  } else if (typeLower.includes('research') || typeLower.includes('report')) {
    return "bg-violet-500/10 border-violet-500/30";
  }
  
  return "bg-primary/10 border-primary/20";
};

// Regular Card Component
export const RegularCard = ({ data }: { data: CardData }) => {
  console.log("✅ REGULARCARD COMPONENT BEING USED!", { 
    title: data.title, 
    type: data.collaborationType,
    hasTwitterDetails: !!data.details?.host_twitter_handle
  });
  
  // Check if it has Twitter marketing details
  const isTwitterCoMarketing = 
    data.details?.host_twitter_handle || 
    (data.collaborationType?.toLowerCase().includes('twitter') && 
     (data.collaborationType?.toLowerCase().includes('co-marketing') || 
      data.collaborationType?.toLowerCase().includes('comarketing'))) ||
    data.details?.twittercomarketing_type;
  
  // Get appropriate icon and badge styling based on collaboration type
  const CollabIcon = getCollaborationTypeIcon(data.collaborationType);
  const badgeClass = getCollaborationBadgeClass(data.collaborationType);
  
  const formatTwitterHandle = (handle: string) => {
    // Remove @ prefix and URL parts if present
    return handle
      .replace('@', '')
      .replace('https://twitter.com/', '')
      .replace('https://x.com/', '');
  };
  
  return (
    <div className="space-y-3">
      <Badge variant="outline" className={`${badgeClass} p-1.5`}>
        <CollabIcon className="w-3.5 h-3.5 mr-1.5" />
        <span>{data.collaborationType || "Collaboration"}</span>
      </Badge>
      
      <h3 className="text-xl font-semibold leading-snug">{data.title}</h3>
      
      <div className="space-y-0.5">
        <p className="text-base">{data.companyName}</p>
        <p className="text-sm text-muted-foreground">{data.roleTitle}</p>
      </div>
      
      {/* Twitter specific info - show prominently for Twitter co-marketing */}
      {isTwitterCoMarketing && data.details?.host_twitter_handle && (
        <div className="flex flex-col space-y-2 p-3 bg-blue-500/5 rounded-md border border-blue-500/10 mt-2 mb-2">
          <div className="flex items-center space-x-1.5">
            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
            <span className="text-sm font-medium text-[#1DA1F2]">
              @{formatTwitterHandle(data.details.host_twitter_handle)}
            </span>
          </div>
          
          {data.details?.host_follower_count && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{data.details.host_follower_count}</span> followers
            </p>
          )}
          
          {data.details?.twittercomarketing_type && (
            <div className="flex flex-wrap gap-1 mt-1">
              {(Array.isArray(data.details.twittercomarketing_type) 
                ? data.details.twittercomarketing_type 
                : [data.details.twittercomarketing_type]).map((type, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-700">
                  {type}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Show date if available */}
          {(data.date || data.specific_date) && (
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3" />
              <span>{data.date || data.specific_date}</span>
            </div>
          )}
        </div>
      )}
      
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
};