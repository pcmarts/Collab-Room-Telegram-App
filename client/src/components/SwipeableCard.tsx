import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CollaborationType = "marketing" | "conference" | "request";

interface SwipeableCardProps {
  children: React.ReactNode;
  style?: any;
  onVote: (vote: boolean) => void;
  type: CollaborationType;
  id?: string;
}

export const SwipeableCard = ({ children, style, onVote, type, id, ...props }: SwipeableCardProps) => {
  const cardElem = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

  const [constrained, setConstrained] = useState(true);
  const [direction, setDirection] = useState<"left" | "right" | undefined>();
  const [velocity, setVelocity] = useState<number>(0);

  const getVote = (childNode: HTMLElement, parentNode: HTMLElement) => {
    const childRect = childNode.getBoundingClientRect();
    const parentRect = parentNode.getBoundingClientRect();
    return parentRect.left >= childRect.right
      ? false
      : parentRect.right <= childRect.left
      ? true
      : undefined;
  };

  const getDirection = () => {
    return velocity >= 1 ? "right" : velocity <= -1 ? "left" : undefined;
  };

  const getTrajectory = () => {
    setVelocity(x.getVelocity());
    setDirection(getDirection());
  };

  const flyAway = (min: number) => {
    const flyAwayDistance = (direction: "left" | "right") => {
      if (!cardElem.current?.parentElement) return 0;
      const parentWidth = cardElem.current.parentElement.getBoundingClientRect().width;
      const childWidth = cardElem.current.getBoundingClientRect().width;
      return direction === "left"
        ? -parentWidth / 2 - childWidth / 2
        : parentWidth / 2 + childWidth / 2;
    };

    if (direction && Math.abs(velocity) > min) {
      setConstrained(false);
      controls.start({
        x: flyAwayDistance(direction)
      });
    }
  };

  useEffect(() => {
    const unsubscribeX = x.onChange(() => {
      if (cardElem.current && cardElem.current.parentElement) {
        const childNode = cardElem.current;
        const parentNode = cardElem.current.parentElement;
        const result = getVote(childNode, parentNode);
        result !== undefined && onVote(result);
      }
    });

    return () => unsubscribeX();
  });

  const cardStyles = {
    marketing: "border-primary/20 bg-card hover:border-primary/40",
    conference: "border-blue-500/20 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-500/40",
    request: "border-orange-500/20 bg-orange-50 dark:bg-orange-900/10 hover:border-orange-500/40"
  };

  return (
    <motion.div
      animate={controls}
      dragConstraints={constrained && { left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={1}
      ref={cardElem}
      style={{ x, position: "absolute", width: "100%", height: "100%" }}
      drag="x"
      onDrag={getTrajectory}
      onDragEnd={() => flyAway(500)}
      whileTap={{ scale: 1.02 }}
      {...props}
    >
      <Card className={cn(
        "w-full h-full p-6 select-none transition-colors duration-200",
        cardStyles[type]
      )}>
        {children}
      </Card>
    </motion.div>
  );
};