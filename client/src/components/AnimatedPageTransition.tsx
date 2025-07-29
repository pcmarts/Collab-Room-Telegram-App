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

// Hook to get direction of navigation for directional animations
export const useNavigationDirection = () => {
  const [location] = useLocation();
  const prevLocationRef = React.useRef(location);
  const [direction, setDirection] = React.useState<'rightward' | 'leftward'>('rightward');

  // Define the order of main navigation routes (left to right)
  const routeOrder = ['/discover', '/my-collaborations', '/requests', '/matches'];

  React.useEffect(() => {
    const prevLocation = prevLocationRef.current;
    
    if (location !== prevLocation) {
      const prevIndex = routeOrder.indexOf(prevLocation);
      const currentIndex = routeOrder.indexOf(location);
      
      // Only update direction for main navigation routes with valid indices
      if (prevIndex !== -1 && currentIndex !== -1 && prevIndex !== currentIndex) {
        const newDirection = currentIndex > prevIndex ? 'rightward' : 'leftward';
        setDirection(newDirection);
        console.log(`Navigation: ${prevLocation} → ${location} (${newDirection})`);
      }
      
      prevLocationRef.current = location;
    }
  }, [location, routeOrder]);

  return { 
    direction, 
    isMainNavigation: routeOrder.includes(location),
    routeOrder 
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

  // Variants for simultaneous directional movement
  const variants = {
    initial: (dir: string) => {
      if (!isMainNavigation) {
        // Default behavior for non-main navigation routes
        return { x: '100%', opacity: 0.25 };
      }
      
      // Rightward: new page slides in from right (95% offset)
      // Leftward: new page slides in from left (-95% offset)
      return {
        x: dir === 'rightward' ? '95%' : '-95%',
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
      
      // Rightward: old page shifts left (5% offset)
      // Leftward: old page shifts right (5% offset)
      return {
        x: dir === 'rightward' ? '-5%' : '5%',
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