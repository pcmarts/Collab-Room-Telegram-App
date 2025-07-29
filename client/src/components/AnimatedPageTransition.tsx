import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface AnimatedPageTransitionProps {
  children: React.ReactNode;
}

// Define the custom cubic-bezier easing curve [0.22, 1, 0.36, 1]
const customEasing = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Page transition variants for synchronized sliding effect
const pageVariants = {
  initial: {
    x: '100%',
    opacity: 0.25,
  },
  in: {
    x: '0%',
    opacity: 1,
  },
  out: {
    x: '-100%',
    opacity: 0.25,
  },
};

const pageTransition = {
  type: 'tween' as const,
  ease: customEasing,
  duration: 0.2,
};

export const AnimatedPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={location}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={{
            type: 'tween' as const,
            ease: customEasing,
            duration: 0.4,
          }}
          className="absolute inset-0 w-full bg-background"
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Synchronized page transition with simultaneous animations
// Current page slides left (opacity 100% -> 25%) while new page slides in from right (opacity 25% -> 100%)
export const SynchronizedPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={location}
          initial={{ x: '100%', opacity: 0.25 }}
          animate={{ x: '0%', opacity: 1 }}
          exit={{ x: '-100%', opacity: 0.25 }}
          transition={{
            type: 'tween',
            ease: customEasing,
            duration: 0.4,
          }}
          className="absolute inset-0 w-full bg-background"
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)', // Force hardware acceleration
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Simple navigation direction hook with immediate calculation
export const useNavigationDirection = () => {
  const [location] = useLocation();
  
  // Menu order array
  const menuOrder = ['/discover', '/my-collaborations', '/requests', '/matches'];
  
  // Store previous location with immediate update
  const prevLocationRef = React.useRef(location);
  const [prevLocation, setPrevLocation] = React.useState(location);
  
  // Update previous location when current changes
  React.useEffect(() => {
    if (location !== prevLocationRef.current) {
      setPrevLocation(prevLocationRef.current);
      prevLocationRef.current = location;
    }
  }, [location]);
  
  // Calculate direction immediately from positions
  const prevPos = menuOrder.indexOf(prevLocation);
  const currentPos = menuOrder.indexOf(location);
  
  // Simple direction calculation
  let direction: 'slide-right-to-left' | 'slide-left-to-right' = 'slide-right-to-left';
  
  if (prevPos !== -1 && currentPos !== -1 && prevPos !== currentPos) {
    // If current position is higher, we moved right → slide right-to-left
    // If current position is lower, we moved left → slide left-to-right
    direction = currentPos > prevPos ? 'slide-right-to-left' : 'slide-left-to-right';
    
    console.log(`SIMPLE: ${prevLocation}[${prevPos}] → ${location}[${currentPos}] = ${direction}`);
  }
  
  return {
    direction,
    isMainNavigation: menuOrder.includes(location),
    fromPage: prevLocation,
    toPage: location,
    fromPosition: prevPos,
    toPosition: currentPos
  };
};

// Enhanced directional page transition with simultaneous animations
export const DirectionalPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();
  const { 
    direction, 
    isMainNavigation, 
    fromPage, 
    toPage, 
    fromPosition, 
    toPosition 
  } = useNavigationDirection();
  
  // Store the direction for this specific transition to prevent changes mid-animation
  const transitionDirection = React.useRef(direction);
  
  // Update direction only when location changes
  React.useEffect(() => {
    transitionDirection.current = direction;
    
    // Additional detailed logging for animation debugging
    if (isMainNavigation && fromPage !== toPage) {
      console.log(`🎬 Animation: "${fromPage}" → "${toPage}" | Direction: ${direction} | Positions: ${fromPosition} → ${toPosition}`);
    }
  }, [location, direction, isMainNavigation, fromPage, toPage, fromPosition, toPosition]);

  // Variants for subtle simultaneous directional movement
  const variants = {
    initial: (dir: string) => {
      if (!isMainNavigation) {
        // Default behavior for non-main navigation routes
        return { x: '100%', opacity: 0.25 };
      }
      
      // CORRECTED slide logic:
      // slide-right-to-left: new page enters from right (20%)
      // slide-left-to-right: new page enters from left (-20%)
      return {
        x: dir === 'slide-right-to-left' ? '20%' : '-20%',
        opacity: 0.25,
      };
    },
    in: {
      x: '0%',
      opacity: 1,
    },
    out: (dir: string) => {
      if (!isMainNavigation) {
        // Default behavior for non-main navigation routes
        return { x: '-100%', opacity: 0.25 };
      }
      
      // CORRECTED slide logic:
      // slide-right-to-left: current page exits to left (-3%)
      // slide-left-to-right: current page exits to right (3%)
      return {
        x: dir === 'slide-right-to-left' ? '-3%' : '3%',
        opacity: 0.25,
      };
    },
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      <AnimatePresence mode="sync" initial={false} custom={transitionDirection.current}>
        <motion.div
          key={location}
          custom={transitionDirection.current}
          initial="initial"
          animate="in"
          exit="out"
          variants={variants}
          transition={{
            type: 'tween',
            ease: customEasing,
            duration: 0.4,
          }}
          className="absolute inset-0 w-full bg-background"
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)', // Force hardware acceleration
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};