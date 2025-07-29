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
  const [prevLocation, setPrevLocation] = React.useState(location);
  const [direction, setDirection] = React.useState<'rightward' | 'leftward'>('rightward');

  // Define the order of main navigation routes (left to right)
  const routeOrder = ['/discover', '/my-collaborations', '/requests', '/matches'];

  React.useEffect(() => {
    if (location !== prevLocation) {
      const prevIndex = routeOrder.indexOf(prevLocation);
      const currentIndex = routeOrder.indexOf(location);
      
      // Only set direction for main navigation routes
      if (prevIndex !== -1 && currentIndex !== -1) {
        setDirection(currentIndex > prevIndex ? 'rightward' : 'leftward');
      }
      
      setPrevLocation(location);
    }
  }, [location, prevLocation]);

  return { direction, isMainNavigation: routeOrder.includes(location) };
};

// Enhanced directional page transition with simultaneous animations
export const DirectionalPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();
  const { direction, isMainNavigation } = useNavigationDirection();

  // Variants for simultaneous directional movement
  const variants = {
    initial: (dir: string) => {
      if (!isMainNavigation) {
        // Default behavior for non-main navigation routes
        return { x: '100%', opacity: 0.25 };
      }
      
      // Rightward: new page slides in from right (90% offset)
      // Leftward: new page slides in from left (-90% offset)
      return {
        x: dir === 'rightward' ? '90%' : '-90%',
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
      
      // Rightward: old page shifts left (10% offset)
      // Leftward: old page shifts right (10% offset)
      return {
        x: dir === 'rightward' ? '-10%' : '10%',
        opacity: 0.25,
      };
    },
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      <AnimatePresence mode="sync" initial={false} custom={direction}>
        <motion.div
          key={location}
          custom={direction}
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