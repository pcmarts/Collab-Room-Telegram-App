import { useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

interface SwipeableCardProps {
  data: {
    id: string;
    title: string;
    companyName: string;
    description: string;
  };
  onSwipe: (direction: "left" | "right") => void;
  active: boolean;
}

export function SwipeableCard({ data, onSwipe, active }: SwipeableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Background color based on swipe direction
  const backgroundColor = useTransform(
    x,
    [-200, 0, 200],
    [
      "rgba(239, 68, 68, 0.1)", // Red for left swipe
      "rgba(0, 0, 0, 0)", // Transparent for center
      "rgba(34, 197, 94, 0.1)", // Green for right swipe
    ]
  );

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (Math.abs(info.offset.x) > swipeThreshold) {
      const direction = info.offset.x > 0 ? "right" : "left";
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
          rotateY: isFlipped ? 180 : 0,
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        drag={active && !isFlipped ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, rotate }}
        whileTap={{ scale: 0.95 }}
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <Card className="w-full h-full p-6 cursor-grab active:cursor-grabbing bg-card">
          {!isFlipped ? (
            // Front of the card
            <div className="flex flex-col h-full">
              <h3 className="text-2xl font-semibold mb-2">{data.title}</h3>
              <p className="text-lg text-muted-foreground mb-4">{data.companyName}</p>
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
