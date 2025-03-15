import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
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
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-10, 0, 10]);

  // Background color based on swipe direction
  const background = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)", "rgba(34, 197, 94, 0.2)"]
  );

  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <motion.div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          x,
          rotate,
          background,
        }}
        drag={active ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: "grabbing" }}
        dragElastic={0.9}
        initial={false}
        animate={{
          scale: active ? 1 : 0.9,
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
      >
        <Card className="w-full h-full p-6 cursor-grab active:cursor-grabbing bg-card select-none">
          {!isFlipped ? (
            // Front of card
            <div className="flex flex-col h-full" onClick={() => setIsFlipped(true)}>
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
            // Back of card
            <div 
              className="flex flex-col h-full transform rotate-180 select-none"
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