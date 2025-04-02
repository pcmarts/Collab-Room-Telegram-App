import { useState, useRef } from "react";
import { motion, useMotionValue, MotionValue, useTransform, AnimationControls } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, X, Check, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

// Types
interface PotentialMatchCardProps {
  data: {
    id: string;
    collab_type: string;
    description?: string;
    details?: any;
    topics?: string[];
    potentialMatchData: {
      user_id: string;
      first_name: string;
      last_name?: string;
      company_name: string;
      job_title?: string;
      twitter_followers?: string;
      company_twitter_followers?: string;
      swipe_created_at?: string;
      collaboration_id: string;
    };
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

export function PotentialMatchCard({
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
}: PotentialMatchCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exitX, setExitX] = useState(0);
  
  // Extract potential match data
  const matchData = data.potentialMatchData || {};
  
  // Format the user's name
  const userName = [matchData.first_name, matchData.last_name].filter(Boolean).join(' ');
  
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
        height: "100%"
      }}
      drag={constrained ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={() => setConstrained && setConstrained(false)}
      onDragEnd={(e, info) => handleDragEnd(e, info)}
      whileDrag={{ scale: 1.05 }}
      animate={controls}
    >
      <Card className="h-full w-full overflow-hidden flex flex-col p-0 relative border-2 border-primary/30 shadow-xl rounded-xl bg-gradient-to-b from-primary/5 to-background isolate">
        {/* Special badge for potential matches */}
        <div className="absolute top-2 right-2 z-30">
          <Badge variant="default" className="flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3" />
            Potential Match
          </Badge>
        </div>
        
        {/* Overlay effects for swipe direction */}
        <motion.div 
          className="absolute inset-0 bg-red-500/20 z-20" 
          style={{ opacity: useTransform(x || useMotionValue(0), [-200, -5, 0], [0.8, 0, 0]) }} 
        >
          <div className="absolute right-4 top-12 bg-red-500 text-white p-2 rounded-full">
            <X className="h-6 w-6" />
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute inset-0 bg-green-500/20 z-20" 
          style={{ opacity: useTransform(x || useMotionValue(0), [0, 5, 200], [0, 0, 0.8]) }} 
        >
          <div className="absolute left-4 top-12 bg-green-500 text-white p-2 rounded-full">
            <Check className="h-6 w-6" />
          </div>
        </motion.div>
        
        {/* Card header with company and user info */}
        <div className="px-4 py-3 bg-primary/10 border-b relative z-30">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{matchData.company_name || "Company"}</h3>
              <div className="flex items-center gap-1">
                <p className="text-sm text-primary font-medium line-clamp-1">{userName || "User"}</p>
                {matchData.job_title && (
                  <p className="text-xs text-muted-foreground">• {matchData.job_title}</p>
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
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary">
              Interested in your {data.collab_type}
            </Badge>
          </div>
          
          <p className="text-sm mb-4 line-clamp-3">{data.description}</p>
          
          {/* Additional match info */}
          <div className="space-y-2 mt-2">
            {matchData.twitter_followers && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>User followers: {matchData.twitter_followers}</span>
              </div>
            )}
            
            {matchData.company_twitter_followers && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Company followers: {matchData.company_twitter_followers}</span>
              </div>
            )}
          </div>
          
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
            Decline
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-primary hover:bg-primary/90 relative z-50"
            onClick={() => handleButtonClick("right")}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Match Now
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}