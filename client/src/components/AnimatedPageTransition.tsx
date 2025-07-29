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

// Reliable direction calculation hook - calculates fresh each time
export const useNavigationDirection = () => {
  const [location] = useLocation();
  
  // Menu positions: 0=Discover, 1=My Collabs, 2=Requests, 3=Matches
  const menuOrder = ['/discover', '/my-collaborations', '/requests', '/matches'];
  
  const prevLocationRef = React.useRef(location);
  
  // Calculate direction fresh each time instead of storing in state
  const getDirection = React.useCallback(() => {
    const prevLocation = prevLocationRef.current;
    const currentLocation = location;
    
    const prevPosition = menuOrder.indexOf(prevLocation);  
    const currentPosition = menuOrder.indexOf(currentLocation);
    
    // Default direction for non-menu or invalid routes
    if (prevPosition === -1 || currentPosition === -1) {
      return 'slide-right-to-left';
    }
    
    // Calculate direction from positions directly
    const movingRight = currentPosition > prevPosition;
    const direction = movingRight ? 'slide-right-to-left' : 'slide-left-to-right';
    
    console.log(`🎯 DIRECT CALC: "${prevLocation}"(${prevPosition}) → "${currentLocation}"(${currentPosition}) = ${direction}`);
    
    return direction;
  }, [location, menuOrder]);
  
  // Update ref when location changes
  React.useEffect(() => {
    const prevLocation = prevLocationRef.current;
    if (prevLocation !== location) {
      console.log(`📍 Location changed: ${prevLocation} → ${location}`);
      prevLocationRef.current = location;
    }
  }, [location]);

  const direction = getDirection();
  
  return { 
    direction, 
    isMainNavigation: menuOrder.includes(location),
    fromPage: prevLocationRef.current,
    toPage: location,
    fromPosition: menuOrder.indexOf(prevLocationRef.current),
    toPosition: menuOrder.indexOf(location)
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