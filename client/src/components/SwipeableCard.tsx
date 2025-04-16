import React, { useState } from "react";
import { motion, useMotionValue, useTransform, MotionValue } from "framer-motion";
import {
  Calendar,
  Check,
  Info,
  Link,
  Mail,
  Mic,
  Twitter,
  Users,
  Video,
  X,
  FileText,
  FileSearch,
  Building,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AddNoteDialog from "./AddNoteDialog";

export interface SwipeableCardProps {
  data: {
    id: string;
    creator_company_name?: string;
    creator_company_logo_url?: string;
    creator_id?: string;
    title?: string;
    collab_type?: string;
    description?: string;
    date?: string;
    specific_date?: string;
    isPotentialMatch?: boolean;
    isActive?: boolean;
    details?: Record<string, any>;
    // Add company_data for enriched company information
    company_data?: {
      id?: string;
      name?: string;
      logo_url?: string;
      description?: string;
      sector?: string;
      twitter_handle?: string;
    };
    potentialMatchData?: {
      id?: string;
      company_name?: string;
      company_logo_url?: string;
      company_description?: string;
      industry?: string;
    };
  };
  // Support both naming conventions for the swipe handler
  onSwipe?: (direction: "left" | "right", note?: string) => void;
  handleSwipe?: (direction: "left" | "right", note?: string) => void; 
  onInfoClick?: () => void;
  handleDetailsClick?: (id: string) => void;
  
  // Props for stacked card animation
  zIndex?: number;
  constrained?: boolean;
  setConstrained?: (constrained: boolean) => void;
  x?: MotionValue<number>;
  rotate?: MotionValue<number>;
  opacity?: MotionValue<number>;
}

export default function SwipeableCard({
  data,
  onSwipe,
  handleSwipe: propHandleSwipe,  // Renamed to avoid conflict
  onInfoClick,
  handleDetailsClick,
  zIndex,
  constrained,
  setConstrained,
  x: propX,
  rotate: propRotate,
  opacity: propOpacity,
}: SwipeableCardProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const x = propX || useMotionValue(0);
  const rotate = propRotate || useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const opacity = propOpacity || useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const dragConstraintsRef = React.useRef(null);

  // Use either onSwipe or handleSwipe prop based on which is provided
  const handleSwipeAction = (direction: "left" | "right", note?: string) => {
    if (propHandleSwipe) {
      propHandleSwipe(direction, note);
    } else if (onSwipe) {
      onSwipe(direction, note);
    }
  };
  
  // For compatibility with existing code that might call handleSwipe
  const handleSwipe = handleSwipeAction;

  const handleButtonClick = (direction: "left" | "right") => {
    if (direction === "right") {
      setShowNoteDialog(true);
    } else {
      handleSwipeAction(direction);
    }
  };

  const viewDetailsHandler = () => {
    if (handleDetailsClick && data.id) {
      try {
        console.log(`[SwipeableCard] Navigating to details for collaboration: ${data.id}`);
        handleDetailsClick(data.id);
      } catch (error) {
        console.error(`[SwipeableCard] Error navigating to details for collaboration ${data.id}:`, error);
      }
    } else {
      console.warn(`[SwipeableCard] Cannot navigate to details: ${!handleDetailsClick ? 'handleDetailsClick is not defined' : 'data.id is not available'}`);
    }
  };

  return (
    <motion.div 
      className="w-full h-full absolute inset-0"
      style={{ 
        zIndex: zIndex || 1,
        x,
        rotate,
        opacity
      }}
    >
      <Card className="h-full w-full overflow-hidden flex flex-col p-0 relative border-2 shadow-xl rounded-xl isolate">
        {/* Overlay effects for swipe direction */}
        <motion.div 
          className="absolute inset-0 bg-red-500/20 z-20" 
          style={{ opacity: useTransform(x || useMotionValue(0), [-200, -5, 0], [0.8, 0, 0]) }} 
        >
          <div className="absolute right-4 top-4 bg-red-500 text-white p-2 rounded-full">
            <X className="h-6 w-6" />
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 bg-green-500/20 z-20" 
          style={{ opacity: useTransform(x || useMotionValue(0), [0, 5, 200], [0, 0, 0.8]) }} 
        >
          <div className="absolute left-4 top-4 bg-green-500 text-white p-2 rounded-full">
            <Check className="h-6 w-6" />
          </div>
        </motion.div>
        
        {/* Card header with company info */}
        <div className={`px-4 py-3 border-b relative z-30 ${
          data.collab_type?.toLowerCase().includes('twitter') || data.collab_type?.toLowerCase().includes('co-marketing')
            ? 'bg-blue-500/5' 
            : data.collab_type === 'Podcast Guest Appearance'
              ? 'bg-purple-500/5'
              : data.collab_type === 'Blog Post Feature'
                ? 'bg-emerald-500/5'
                : data.collab_type === 'Report & Research Feature'
                  ? 'bg-amber-500/5'
                  : data.collab_type === 'Newsletter Feature'
                    ? 'bg-indigo-500/5'
                    : data.collab_type === 'Live Stream Guest Appearance'
                      ? 'bg-red-500/5'
                      : 'bg-primary/5'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {/* Company Logo */}
              {!data.isPotentialMatch && (
                data.creator_company_logo_url ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border border-border/40">
                    <img 
                      src={(data.creator_company_logo_url?.replace('_normal', '_400x400')) || ''} 
                      alt={data.creator_company_name || "Company"} 
                      className="h-full w-full object-cover"
                      onLoad={() => {
                        console.log(`[SwipeableCard] Logo loaded successfully for ${data.creator_company_name || "Company"}`);
                      }}
                      onError={(e) => {
                        console.log(`[SwipeableCard] Logo error for ${data.creator_company_name || "Company"}, URL was: ${data.creator_company_logo_url || "no URL"}`);
                        // Fallback 1: Try without _400x400 suffix first
                        const target = e.target as HTMLImageElement;
                        if (data.creator_company_logo_url && target.src.includes('_400x400')) {
                          console.log(`[SwipeableCard] Trying fallback to original URL: ${data.creator_company_logo_url}`);
                          target.src = data.creator_company_logo_url;
                          return;
                        }
                        
                        // Fallback 2: If company data exists, try using the logo directly from company_data
                        if (data.company_data?.logo_url) {
                          console.log(`[SwipeableCard] Using logo from company_data: ${data.company_data.logo_url}`);
                          target.src = data.company_data.logo_url;
                          return;
                        }
                        
                        // Fallback 3: For XBorg specifically, use the known logo URL
                        if (data.creator_company_name?.toLowerCase().includes('xborg')) {
                          const xborgLogo = "https://pbs.twimg.com/profile_images/1701203495284518912/Ujc9Oow6.jpg";
                          console.log(`[SwipeableCard] Using hardcoded XBorg logo: ${xborgLogo}`);
                          target.src = xborgLogo;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
                    <Building className="h-4 w-4 text-primary/70" />
                  </div>
                )
              )}
              
              {/* Potential Match Company Logo */}
              {data.isPotentialMatch && (
                data.potentialMatchData?.company_logo_url ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border border-border/40">
                    <img 
                      src={data.potentialMatchData?.company_logo_url?.replace('_normal', '_400x400') || ''} 
                      alt={data.potentialMatchData?.company_name || 'Company'} 
                      className="h-full w-full object-cover"
                      onLoad={() => {
                        console.log(`[SwipeableCard] Potential match logo loaded for ${data.potentialMatchData?.company_name || "Company"}`);
                      }}
                      onError={(e) => {
                        console.log(`[SwipeableCard] Potential match logo error for ${data.potentialMatchData?.company_name || "Company"}, URL was: ${data.potentialMatchData?.company_logo_url || "no URL"}`);
                        
                        // Fallback 1: Try without _400x400 suffix first
                        const target = e.target as HTMLImageElement;
                        if (data.potentialMatchData?.company_logo_url && target.src.includes('_400x400')) {
                          console.log(`[SwipeableCard] Trying fallback to original URL: ${data.potentialMatchData.company_logo_url}`);
                          target.src = data.potentialMatchData.company_logo_url;
                          return;
                        }
                        
                        // Fallback 2: If specific company data exists in data.company_data
                        if (data.company_data?.logo_url) {
                          console.log(`[SwipeableCard] Using logo from company_data: ${data.company_data.logo_url}`);
                          target.src = data.company_data.logo_url;
                          return;
                        }
                        
                        // Fallback 3: For XBorg specifically, use the known logo URL
                        if (data.potentialMatchData?.company_name?.toLowerCase().includes('xborg')) {
                          const xborgLogo = "https://pbs.twimg.com/profile_images/1701203495284518912/Ujc9Oow6.jpg";
                          console.log(`[SwipeableCard] Using hardcoded XBorg logo: ${xborgLogo}`);
                          target.src = xborgLogo;
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 bg-rose-500/10 flex items-center justify-center">
                    <Building className="h-4 w-4 text-rose-500/70" />
                  </div>
                )
              )}
              
              {/* Company Name and Type */}
              <div>
                <h3 className="font-bold text-lg line-clamp-1">
                  {data.isPotentialMatch ? data.potentialMatchData?.company_name : (data.creator_company_name || "Company")}
                </h3>
                <div className="flex items-center gap-1.5">
                  {/* Twitter Co-Marketing Badge */}
                  {(data.collab_type?.toLowerCase().includes('twitter') || 
                   data.collab_type?.toLowerCase().includes('co-marketing')) ? (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-[#1DA1F2]">
                    <Twitter className="w-3 h-3 mr-1" />
                    {data.collab_type || "Twitter Co-Marketing"}
                  </Badge>
                ) : data.collab_type === 'Podcast Guest Appearance' ? (
                  <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/20 text-purple-700">
                    <Mic className="w-3 h-3 mr-1" />
                    {data.collab_type}
                  </Badge>
                ) : data.collab_type === 'Blog Post Feature' ? (
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-700">
                    <FileText className="w-3 h-3 mr-1" />
                    {data.collab_type}
                  </Badge>
                ) : data.collab_type === 'Report & Research Feature' ? (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/20 text-amber-700">
                    <FileSearch className="w-3 h-3 mr-1" />
                    {data.collab_type}
                  </Badge>
                ) : data.collab_type === 'Newsletter Feature' ? (
                  <Badge variant="outline" className="text-xs bg-indigo-500/10 border-indigo-500/20 text-indigo-700">
                    <Mail className="w-3 h-3 mr-1" />
                    {data.collab_type}
                  </Badge>
                ) : data.collab_type === 'Live Stream Guest Appearance' ? (
                  <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/20 text-red-700">
                    <Video className="w-3 h-3 mr-1" />
                    {data.collab_type}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-1">{data.collab_type || "Collaboration"}</p>
                )}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary relative z-50"
              onClick={onInfoClick}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Card content */}
        <div className="p-4 flex-grow overflow-auto">
          {/* Twitter Co-Marketing Details */}
          {(data.collab_type?.toLowerCase().includes('twitter') || 
            data.collab_type?.toLowerCase().includes('co-marketing')) && 
           data.details?.host_twitter_handle && (
            <div className="flex flex-col space-y-2 p-3 bg-blue-500/5 rounded-md border border-blue-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <a 
                  href={`https://twitter.com/${data.details.host_twitter_handle.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#1DA1F2] hover:underline pointer-events-auto relative z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{data.details.host_twitter_handle.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '')}
                </a>
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
                    : [data.details.twittercomarketing_type]).map((type: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-700">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Twitter Spaces Guest */}
          {data.collab_type === 'Twitter Spaces Guest' && data.details?.twitter_handle && (
            <div className="flex flex-col space-y-2 p-3 bg-blue-500/5 rounded-md border border-blue-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <a 
                  href={`https://twitter.com/${data.details.twitter_handle.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#1DA1F2] hover:underline pointer-events-auto relative z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {data.details.twitter_handle.includes('@') ? data.details.twitter_handle : '@' + data.details.twitter_handle.replace('https://twitter.com/', '').replace('https://x.com/', '')}
                </a>
              </div>
              
              {data.details?.host_follower_count && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{data.details.host_follower_count}</span> followers
                </p>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Podcast Guest Appearance */}
          {data.collab_type === 'Podcast Guest Appearance' && data.details?.podcast_name && (
            <div className="flex flex-col space-y-2 p-3 bg-purple-500/5 rounded-md border border-purple-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <Mic className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">
                  {data.details.podcast_name}
                </span>
              </div>
              
              {data.details?.estimated_reach && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.estimated_reach}</span> estimated listeners
                </p>
              )}
              
              {data.details?.podcast_link && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Link className="w-3 h-3" />
                  <a 
                    href={data.details.podcast_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto relative z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't prevent default so the link works normally
                    }}
                  >
                    {data.details.podcast_link}
                  </a>
                </div>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Blog Post Feature */}
          {data.collab_type === 'Blog Post Feature' && data.details?.blog_name && (
            <div className="flex flex-col space-y-2 p-3 bg-emerald-500/5 rounded-md border border-emerald-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {data.details.blog_name}
                </span>
              </div>
              
              {data.details?.est_readers && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.est_readers}</span> estimated readers
                </p>
              )}
              
              {data.details?.blog_topic && (
                <p className="text-xs">
                  <span className="font-medium">Topic:</span> {data.details.blog_topic}
                </p>
              )}
              
              {data.details?.blog_link && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Link className="w-3 h-3" />
                  <a 
                    href={data.details.blog_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto relative z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't prevent default so the link works normally
                    }}
                  >
                    {data.details.blog_link}
                  </a>
                </div>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.estimated_release_date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.estimated_release_date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Report & Research Feature */}
          {data.collab_type === 'Report & Research Feature' && (
            <div className="flex flex-col space-y-2 p-3 bg-amber-500/5 rounded-md border border-amber-500/10 mb-3">
              {data.details?.research_topic && Array.isArray(data.details.research_topic) && data.details.research_topic.length > 0 && (
                <div className="flex items-center space-x-1.5">
                  <FileSearch className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">
                    Research Topics: {data.details.research_topic.join(', ')}
                  </span>
                </div>
              )}
              
              {data.details?.target_audience && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">Target:</span> {data.details.target_audience}
                </p>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.estimated_release_date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.estimated_release_date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Newsletter Feature */}
          {data.collab_type === 'Newsletter Feature' && (
            <div className="flex flex-col space-y-2 p-3 bg-indigo-500/5 rounded-md border border-indigo-500/10 mb-3">
              {data.details?.newsletter_name && (
                <div className="flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">
                    {data.details.newsletter_name}
                  </span>
                </div>
              )}
              
              {data.details?.newsletter_subscribers && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.newsletter_subscribers}</span> subscribers
                </p>
              )}
              
              {data.details?.newsletter_topic && (
                <p className="text-xs">
                  <span className="font-medium">Topic:</span> {data.details.newsletter_topic}
                </p>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.newsletter_date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.newsletter_date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Live Stream Guest Appearance */}
          {data.collab_type === 'Live Stream Guest Appearance' && (
            <div className="flex flex-col space-y-2 p-3 bg-red-500/5 rounded-md border border-red-500/10 mb-3">
              {data.details?.livestream_platform && (
                <div className="flex items-center space-x-1.5">
                  <Video className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    Platform: {data.details.livestream_platform}
                  </span>
                </div>
              )}
              
              {data.details?.host_name && (
                <p className="text-xs">
                  <span className="font-medium">Host:</span> {data.details.host_name}
                </p>
              )}
              
              {data.details?.estimated_audience && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.estimated_audience}</span> estimated viewers
                </p>
              )}
              
              {/* Show date if available */}
              {(data.date || data.specific_date || data.details?.livestream_date) && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{data.date || data.specific_date || data.details?.livestream_date}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Collaboration Description */}
          <div className="mb-3">
            <div className="mb-2">
              <h3 className="font-bold text-sm">
                {data.title || (data.isPotentialMatch ? "Potential Collaboration" : "Collaboration Details")}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
              {data.description || "No description available."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 w-full text-xs pointer-events-auto relative z-50"
              onClick={(e) => {
                e.stopPropagation();
                viewDetailsHandler();
              }}
            >
              View Full Details
            </Button>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="p-3 border-t flex justify-between items-center gap-3">
          <Button 
            size="default"
            variant="outline"
            className="flex-1 bg-transparent border-red-500/20 text-red-500 hover:bg-red-500/5"
            onClick={() => handleButtonClick("left")}
          >
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>
          <Button 
            size="default"
            variant={data.isPotentialMatch ? "secondary" : "default"}
            className={`flex-1 ${data.isPotentialMatch ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
            onClick={() => handleButtonClick("right")}
          >
            {data.isPotentialMatch ? (
              <Sparkles className="h-4 w-4 mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            {data.isPotentialMatch ? 'Match' : 'Request'}
          </Button>
        </div>
      </Card>
      
      {/* Add note dialog */}
      <AddNoteDialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        onSendWithNote={(note) => {
          console.log("Sending request with note from SwipeableCard:", note);
          // Give the dialog time to fully close before executing the swipe
          setTimeout(() => {
            handleSwipeAction("right", note);
          }, 300);
        }}
      />
    </motion.div>
  );
}