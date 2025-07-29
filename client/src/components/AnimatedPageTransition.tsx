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
    <div className="relative w-full min-h-screen overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="absolute inset-0 w-full bg-background"
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Synchronized page transition that creates smooth slide animation
// Current page slides left (opacity 100% -> 25%) while new page slides in from right (opacity 25% -> 100%)
export const SynchronizedPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          initial={{ x: '100%', opacity: 0.25 }}
          animate={{ x: '0%', opacity: 1 }}
          exit={{ x: '-100%', opacity: 0.25 }}
          transition={{
            type: 'tween',
            ease: customEasing,
            duration: 0.2,
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

// Hook to get direction of navigation for more advanced animations
export const useNavigationDirection = () => {
  const [location] = useLocation();
  const [prevLocation, setPrevLocation] = React.useState(location);
  const [direction, setDirection] = React.useState<'forward' | 'backward'>('forward');

  // Define the order of main navigation routes
  const routeOrder = ['/discover', '/my-collaborations', '/requests', '/matches'];

  React.useEffect(() => {
    if (location !== prevLocation) {
      const prevIndex = routeOrder.indexOf(prevLocation);
      const currentIndex = routeOrder.indexOf(location);
      
      if (prevIndex !== -1 && currentIndex !== -1) {
        setDirection(currentIndex > prevIndex ? 'forward' : 'backward');
      }
      
      setPrevLocation(location);
    }
  }, [location, prevLocation]);

  return direction;
};

// Enhanced version with directional awareness
export const DirectionalPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();
  const direction = useNavigationDirection();

  const variants = {
    initial: (direction: string) => ({
      x: direction === 'forward' ? '100%' : '-100%',
      opacity: 0.25,
    }),
    in: {
      x: 0,
      opacity: 1,
    },
    out: (direction: string) => ({
      x: direction === 'forward' ? '-100%' : '100%',
      opacity: 0.25,
    }),
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
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
            duration: 0.2,
          }}
          className="absolute inset-0 w-full h-full bg-background"
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};