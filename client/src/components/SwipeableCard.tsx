import { useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface SwipeableCardProps {
  data: {
    id: string;
    title: string;
    companyName: string;
    roleTitle: string;
    collaborationType: string;
    description: string;
  };
  onSwipe: (direction: "left" | "right") => void;
  active: boolean;
}

export function SwipeableCard({ data, onSwipe, active }: SwipeableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Background color based on swipe direction
  const backgroundColor = useTransform(
    x,
    [-200, 0, 200],
    [
      "rgba(239, 68, 68, 0.2)", // Red for left swipe
      "rgba(0, 0, 0, 0)", // Transparent for center
      "rgba(34, 197, 94, 0.2)", // Green for right swipe
    ]
  );

  const handleDragEnd = async (event: any, info: any) => {
    const swipeThreshold = 100;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? "right" : "left";

      // Show checkmark animation for right swipes
      if (direction === "right") {
        setShowCheckmark(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for animation
        setShowCheckmark(false);
      }

      onSwipe(direction);
    }
  };

  return (
    <motion.div
      style={{
        position: active ? "relative" : "absolute",
        width: "100%",
        height: "100%",
        opacity: opacity,
      }}
      animate={{ scale: active ? 1 : 0.9, top: active ? 0 : 10 }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor,
          perspective: "1000px",
        }}
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          transition: { duration: 0.6, type: "spring", stiffness: 300 }
        }}
        drag={active && !isFlipped ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        dragElastic={0.7}
        whileDrag={{ scale: 1.05 }}
        style={{ x, rotate }}
        whileTap={{ scale: 0.95 }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <Card className="w-full h-full p-6 cursor-grab active:cursor-grabbing bg-card relative">
          {/* Checkmark Animation */}
          <AnimatePresence>
            {showCheckmark && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-green-500/20 z-50 rounded-lg"
              >
                <Check className="w-24 h-24 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {!isFlipped ? (
            // Front of the card
            <div className="flex flex-col h-full">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                {data.collaborationType}
              </div>
              <h3 className="text-2xl font-semibold mb-2">{data.title}</h3>
              <div className="flex flex-col space-y-1 mb-4">
                <p className="text-lg">{data.companyName}</p>
                <p className="text-sm text-muted-foreground">{data.roleTitle}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-auto">Tap for more info</p>
            </div>
          ) : (
            // Back of the card
            <div 
              className="flex flex-col h-full transform rotate-180"
              onClick={() => setIsFlipped(false)}
            >
              <h3 className="text-xl font-semibold mb-4">{data.title}</h3>
              <p className="text-base">{data.description}</p>
              <p className="text-sm text-muted-foreground mt-auto">Tap to flip back</p>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}