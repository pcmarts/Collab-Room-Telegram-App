import { useState, useRef } from "react";
import { motion, useMotionValue, MotionValue, useTransform, AnimationControls } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Info, X, Check, Sparkles, Twitter, Calendar, Mic, Users, 
  Link, FileText, FileSearch, Mail, Radio, Star, Building, User,
  Globe, Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddNoteDialog } from "./AddNoteDialog";
import { toast } from "@/hooks/use-toast";
import { triggerHapticFeedback, triggerSwipeHaptic } from "../lib/haptics";

// Types
interface SwipeableCardProps {
  data: {
    id: string;
    collab_type: string;
    description?: string;
    details?: any;
    topics?: string[];
    creator_company_name?: string;
    date?: string;
    specific_date?: string;
    isPotentialMatch?: boolean;
    potentialMatchData?: {
      user_id: string;
      first_name: string;
      last_name?: string;
      company_name: string;
      company_description?: string;
      company_website?: string;
      company_twitter?: string;
      company_linkedin?: string;
      job_title?: string;
      twitter_followers?: string;
      company_twitter_followers?: string;
      swipe_created_at?: string;
      collaboration_id: string;
    };
    [key: string]: any;
  };
  handleSwipe: (direction: "left" | "right", note?: string) => Promise<void>;
  onInfoClick: () => void;
  zIndex: number;
  constrained: boolean;
  setConstrained?: (constrained: boolean) => void;
  x?: MotionValue<number>;
  controls?: AnimationControls;
  opacity?: MotionValue<number>;
  rotate?: MotionValue<number>;
}

export function SwipeableCard({
  data,
  handleSwipe,
  onInfoClick,
  zIndex = 1,
  constrained = true,
  setConstrained,
  x,
  controls,
  opacity,
  rotate
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exitX, setExitX] = useState(0);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  
  // Debug information to console
  console.log("🔵🔵🔵 SWIPEABLE CARD DEBUG 🔵🔵🔵", {
    id: data.id,
    collab_type: data.collab_type,
    isTwitterCoMarketing: data.collab_type?.toLowerCase().includes('twitter') && 
                          data.collab_type?.toLowerCase().includes('co-marketing'),
    twitterDetails: data.details?.host_twitter_handle ? {
      handle: data.details.host_twitter_handle,
      followers: data.details.host_follower_count,
      twitterType: data.details.twittercomarketing_type
    } : 'No Twitter details',
    fullDetails: data.details
  });
  
  // Define direct button click handler
  const handleButtonClick = async (direction: "left" | "right", note?: string) => {
    try {
      // Trigger haptic feedback for button press
      triggerHapticFeedback('impact');
      
      // If it's a right swipe (request) and not a potential match, show the note dialog
      if (direction === "right" && !data.isPotentialMatch && !note) {
        setShowNoteDialog(true);
        return;
      }
      
      setExitX(direction === 'right' ? 1000 : -1000);
      await handleSwipe(direction, note);
      
      // Trigger directional haptic feedback for swipe action
      triggerSwipeHaptic(direction);
      
      // Show toast notification for successful right swipe (collaboration request)
      if (direction === "right") {
        toast({
          title: "Collaboration Request Sent",
          description: "The host will be notified of your interest.",
          variant: "default",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error handling button click:", error);
      
      // Show error toast
      toast({
        title: "Request Failed",
        description: "There was a problem sending your request. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  // Define swipe handlers with a click threshold
  const handleDragEnd = async (e: any, info: any) => {
    if (!constrained) return;
    
    const xOffset = info.offset.x;
    const dragDistance = Math.abs(info.offset.x);
    
    // Consider it a swipe only if dragged more than 100px
    if (dragDistance > 100) {
      const direction = xOffset > 0 ? "right" : "left";
      
      // Trigger haptic feedback for swipe action
      triggerSwipeHaptic(direction);
      
      // If it's a right swipe and not a potential match, show the note dialog instead of immediately swiping
      if (direction === "right" && !data.isPotentialMatch) {
        controls?.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
        setShowNoteDialog(true);
        return;
      }
      
      setExitX(xOffset > 0 ? 1000 : -1000);
      await handleSwipe(direction);
      
      // Show toast notification for successful right swipe (collaboration request)
      if (direction === "right") {
        toast({
          title: "Collaboration Request Sent",
          description: "The host will be notified of your interest.",
          variant: "default",
          duration: 3000,
        });
      }
    } else if (dragDistance < 10) {
      // If dragged less than 10px, it's considered a click, do nothing to allow link clicks
      controls?.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    } else {
      // Reset position if not swiped far enough but more than click threshold
      controls?.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };
  
  return (
    <motion.div
      ref={cardRef}
      style={{ 
        x: x,
        rotate: rotate,
        zIndex,
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0
      }}
      drag={constrained ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      dragTransition={{ power: 0.2, timeConstant: 400 }}
      dragMomentum={true}
      dragSnapToOrigin={false}
      // Using drag configuration instead of dragThreshold property
      onDragStart={() => setConstrained && setConstrained(false)}
      onDragEnd={(e, info) => handleDragEnd(e, info)}
      whileDrag={{ scale: 1.05 }}
      animate={controls}
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
                    : 'bg-primary/5'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{data.creator_company_name || "Company"}</h3>
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
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-1">{data.collab_type || "Collaboration"}</p>
                )}
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
          {data.collab_type === 'Newsletter Feature' && data.details?.newsletter_name && (
            <div className="flex flex-col space-y-2 p-3 bg-indigo-500/5 rounded-md border border-indigo-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">
                  {data.details.newsletter_name}
                </span>
              </div>
              
              {data.details?.total_subscribers && (
                <p className="text-xs text-muted-foreground">
                  <Users className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">{data.details.total_subscribers}</span> subscribers
                </p>
              )}
              
              {data.details?.audience_reach && (
                <p className="text-xs text-muted-foreground">
                  <Radio className="w-3 h-3 inline mr-1" />
                  <span className="font-medium">Reach:</span> {data.details.audience_reach}
                </p>
              )}
              
              {data.details?.newsletter_url && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Link className="w-3 h-3" />
                  <a 
                    href={data.details.newsletter_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto relative z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't prevent default so the link works normally
                    }}
                  >
                    {data.details.newsletter_url}
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
          
          {/* Potential Match Information */}
          {data.isPotentialMatch && data.potentialMatchData && (
            <div className="flex flex-col space-y-2 p-3 bg-rose-500/5 rounded-md border border-rose-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-700">
                  Potential Match
                </span>
              </div>
              
              {/* Display the note on the card if available */}
              {data.note && (
                <div className="bg-primary/5 p-2 rounded-md border border-primary/10 mb-1">
                  <p className="text-xs italic">{data.note}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>
                  {data.potentialMatchData.first_name} 
                  {data.potentialMatchData.last_name ? ` ${data.potentialMatchData.last_name}` : ''} 
                  {data.potentialMatchData.job_title ? ` • ${data.potentialMatchData.job_title}` : ''}
                </span>
              </div>
              
              <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                <Building className="w-3 h-3" />
                <span className="font-medium">{data.potentialMatchData.company_name}</span>
              </div>
              
              {/* Company description */}
              {data.potentialMatchData.company_description && (
                <div className="text-xs italic text-muted-foreground">
                  "{data.potentialMatchData.company_description}"
                </div>
              )}
              
              {/* Company links */}
              <div className="flex flex-wrap gap-2">
                {data.potentialMatchData.company_website && (
                  <a
                    href={data.potentialMatchData.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 pointer-events-auto relative z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't prevent default so the link works normally
                    }}
                  >
                    <Globe className="h-3 w-3 mr-0.5" />
                    Website
                  </a>
                )}
                
                {data.potentialMatchData.company_twitter && (
                  <a
                    href={`https://twitter.com/${data.potentialMatchData.company_twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 pointer-events-auto relative z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't prevent default so the link works normally
                    }}
                  >
                    <Twitter className="h-3 w-3 mr-0.5 text-[#1DA1F2]" />
                    @{data.potentialMatchData.company_twitter}
                  </a>
                )}
                
                {data.potentialMatchData.company_linkedin && (
                  <a
                    href={data.potentialMatchData.company_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 pointer-events-auto relative z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Don't prevent default so the link works normally
                    }}
                  >
                    <Linkedin className="h-3 w-3 mr-0.5 text-blue-700" />
                    LinkedIn
                  </a>
                )}
              </div>
              
              {data.potentialMatchData.twitter_followers && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Twitter className="w-3 h-3 text-[#1DA1F2]" />
                  <span><span className="font-medium">{data.potentialMatchData.twitter_followers}</span> followers</span>
                </div>
              )}
              
              {data.potentialMatchData.company_twitter_followers && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Twitter className="w-3 h-3 text-[#1DA1F2]" />
                  <span><span className="font-medium">{data.potentialMatchData.company_twitter_followers}</span> company followers</span>
                </div>
              )}
              
              {data.potentialMatchData.swipe_created_at && (
                <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Swiped {new Date(data.potentialMatchData.swipe_created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}
          
          <p className="text-sm mb-3 line-clamp-4">{data.description}</p>
          
          {/* Topics/tags */}
          {data.topics && data.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {data.topics.slice(0, 3).map((topic: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {data.topics.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{data.topics.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Card footer with action buttons */}
        <div className="px-4 py-3 border-t bg-card/50 flex justify-between items-center gap-2 relative z-30">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-red-200 hover:bg-red-50 hover:text-red-600 relative z-50"
            onClick={() => handleButtonClick("left")}
          >
            <X className="h-4 w-4 mr-1" />
            Pass
          </Button>
          
          <Button 
            variant={data.isPotentialMatch ? "default" : "outline"} 
            size="sm" 
            className={`w-full ${data.isPotentialMatch 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
              : 'border-green-200 hover:bg-green-50 hover:text-green-600'} relative z-50`}
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
            handleSwipe("right", note);
            // Show toast notification 
            toast({
              title: "Collaboration Request Sent",
              description: "A personalized note was included with your request.",
              variant: "default",
              duration: 3000,
            });
          }, 100);
        }}
        onSendWithoutNote={() => {
          console.log("Sending request without note from SwipeableCard");
          // Give the dialog time to fully close before executing the swipe
          setTimeout(() => {
            handleSwipe("right", "");
            // Show toast notification
            toast({
              title: "Collaboration Request Sent",
              description: "The host will be notified of your interest.",
              variant: "default",
              duration: 3000,
            });
          }, 100);
        }}
        recipientName={data.creator_company_name}
      />
    </motion.div>
  );
}