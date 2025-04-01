import { useState, useRef } from "react";
import { motion, useMotionValue, MotionValue, useTransform, AnimationControls } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, X, Check, Sparkles } from "lucide-react";
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
      <Card className="h-full w-full overflow-hidden flex flex-col p-0 relative border-2 shadow-xl rounded-xl">
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
        <div className="px-4 py-3 bg-primary/5 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">{data.creator_company_name || "Company"}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{data.collab_type || "Collaboration"}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={onInfoClick}
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Card content */}
        <div className="p-4 flex-grow overflow-auto">
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
        <div className="px-4 py-3 border-t bg-card/50 flex justify-between items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={() => handleSwipe("left")}
          >
            <X className="h-4 w-4 mr-1" />
            Pass
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-green-200 hover:bg-green-50 hover:text-green-600"
            onClick={() => handleSwipe("right")}
          >
            <Check className="h-4 w-4 mr-1" />
            Connect
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}