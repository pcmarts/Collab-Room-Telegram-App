import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

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

  const handleDragEnd = (event: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  if (!active) return null;

  return (
    <motion.div
      drag={!isFlipped ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      animate={{ 
        rotateY: isFlipped ? 180 : 0,
        transition: { duration: 0.5 }
      }}
      className="absolute inset-0 touch-none"
      style={{ perspective: "1000px" }}
    >
      <Card className="w-full h-full p-6 select-none bg-card">
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
  );
}