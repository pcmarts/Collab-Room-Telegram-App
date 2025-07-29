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

// Simple navigation direction hook
export const useNavigationDirection = () => {
  const [location] = useLocation();
  
  // Define menu order from left to right
  const menuOrder = ['/discover', '/my-collaborations', '/requests', '/matches'];
  
  // Store previous location to determine direction
  const prevLocationRef = React.useRef(location);
  const [direction, setDirection] = React.useState<'left-to-right' | 'right-to-left'>('left-to-right');
  
  React.useEffect(() => {
    const prevLocation = prevLocationRef.current;
    const currentLocation = location;
    
    if (prevLocation !== currentLocation) {
      const prevIndex = menuOrder.indexOf(prevLocation);
      const currentIndex = menuOrder.indexOf(currentLocation);
      
      // Only calculate direction for main menu routes
      if (prevIndex !== -1 && currentIndex !== -1) {
        // If clicking menu item to the right → animation goes right to left
        // If clicking menu item to the left → animation goes left to right
        const newDirection = currentIndex > prevIndex ? 'right-to-left' : 'left-to-right';
        setDirection(newDirection);
        console.log(`Menu navigation: ${prevLocation} → ${currentLocation} | Direction: ${newDirection}`);
      }
      
      prevLocationRef.current = currentLocation;
    }
  }, [location]);

  return { 
    direction, 
    isMainNavigation: menuOrder.includes(location) 
  };
};

// Enhanced directional page transition with simultaneous animations
export const DirectionalPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();
  const { direction, isMainNavigation } = useNavigationDirection();
  
  // Store the direction for this specific transition to prevent changes mid-animation
  const transitionDirection = React.useRef(direction);
  
  // Update direction only when location changes
  React.useEffect(() => {
    transitionDirection.current = direction;
  }, [location, direction]);

  // Variants for subtle simultaneous directional movement
  const variants = {
    initial: (dir: string) => {
      if (!isMainNavigation) {
        // Default behavior for non-main navigation routes
        return { x: '100%', opacity: 0.25 };
      }
      
      // Simple logic:
      // left-to-right: new page starts from left (-20%)
      // right-to-left: new page starts from right (20%)
      return {
        x: dir === 'left-to-right' ? '-20%' : '20%',
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
      
      // Simple logic:
      // left-to-right: current page shifts right (3%)
      // right-to-left: current page shifts left (-3%)
      return {
        x: dir === 'left-to-right' ? '3%' : '-3%',
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