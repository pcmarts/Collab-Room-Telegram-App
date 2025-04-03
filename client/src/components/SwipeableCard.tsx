import { useState, useRef } from "react";
import { motion, useMotionValue, MotionValue, useTransform, AnimationControls } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, X, Check, Sparkles, Twitter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    [key: string]: any;
  };
  handleSwipe: (direction: "left" | "right") => Promise<void>;
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
  const handleButtonClick = async (direction: "left" | "right") => {
    try {
      setExitX(direction === 'right' ? 1000 : -1000);
      await handleSwipe(direction);
    } catch (error) {
      console.error("Error handling button click:", error);
    }
  };
  
  // Define swipe handlers
  const handleDragEnd = async (e: any, info: any) => {
    if (!constrained) return;
    
    const xOffset = info.offset.x;
    const direction = xOffset > 100 ? "right" : xOffset < -100 ? "left" : undefined;
    
    if (direction) {
      setExitX(xOffset > 0 ? 1000 : -1000);
      await handleSwipe(direction);
    } else {
      // Reset position if not swiped far enough
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
          data.collab_type?.toLowerCase().includes('twitter') && 
          data.collab_type?.toLowerCase().includes('co-marketing') 
            ? 'bg-blue-500/5' 
            : 'bg-primary/5'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{data.creator_company_name || "Company"}</h3>
              <div className="flex items-center gap-1.5">
                {data.collab_type?.toLowerCase().includes('twitter') && 
                 data.collab_type?.toLowerCase().includes('co-marketing') ? (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-[#1DA1F2]">
                    <Twitter className="w-3 h-3 mr-1" />
                    {data.collab_type || "Twitter Co-Marketing"}
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
          {data.collab_type?.toLowerCase().includes('twitter') && 
           data.collab_type?.toLowerCase().includes('co-marketing') && 
           data.details?.host_twitter_handle && (
            <div className="flex flex-col space-y-2 p-3 bg-blue-500/5 rounded-md border border-blue-500/10 mb-3">
              <div className="flex items-center space-x-1.5">
                <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                <span className="text-sm font-medium text-[#1DA1F2]">
                  @{data.details.host_twitter_handle.replace('@', '').replace('https://twitter.com/', '')}
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
            variant="outline" 
            size="sm" 
            className="w-full border-green-200 hover:bg-green-50 hover:text-green-600 relative z-50"
            onClick={() => handleButtonClick("right")}
          >
            <Check className="h-4 w-4 mr-1" />
            Connect
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}