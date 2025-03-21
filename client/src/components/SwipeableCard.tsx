import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import { Card } from "@/components/ui/card";
import { GlowingBorderCard } from "./GlowingBorderCard";

interface SwipeableCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onVote: (result: boolean) => void;
  id?: string;
  glowColor?: string;
  [key: string]: any;
}

export const SwipeableCard = ({ children, style, onVote, id, glowColor, ...props }: SwipeableCardProps) => {
  // motion stuff
  const cardElem = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const controls = useAnimation();

  const [constrained, setConstrained] = useState<boolean>(true);
  const [direction, setDirection] = useState<"left" | "right" | undefined>(undefined);
  const [velocity, setVelocity] = useState<number>(0);

  const getVote = (childNode: HTMLElement, parentNode: HTMLElement) => {
    const childRect = childNode.getBoundingClientRect();
    const parentRect = parentNode.getBoundingClientRect();
    let result =
      parentRect.left >= childRect.right
        ? false
        : parentRect.right <= childRect.left
        ? true
        : undefined;
    return result;
  };

  // determine direction of swipe based on velocity
  const getDirection = (): "left" | "right" | undefined => {
    return velocity >= 1 ? "right" : velocity <= -1 ? "left" : undefined;
  };

  const getTrajectory = () => {
    setVelocity(x.getVelocity());
    setDirection(getDirection());
  };

  const flyAway = (min: number) => {
    const flyAwayDistance = (dir: "left" | "right") => {
      if (!cardElem.current || !cardElem.current.parentElement) return 0;
      
      const parentWidth = cardElem.current.parentElement.getBoundingClientRect().width;
      const childWidth = cardElem.current.getBoundingClientRect().width;
      
      return dir === "left"
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
        if (result !== undefined) {
          onVote(result);
        }
      }
    });

    return () => unsubscribeX();
  }, [onVote, x]);

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
      whileTap={{ scale: 1.1 }}
      {...props}
    >
      <GlowingBorderCard className="w-full h-full" glowColor={glowColor}>
        <div className="p-6 select-none">
          {children}
        </div>
      </GlowingBorderCard>
    </motion.div>
  );
};