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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location}
          initial={{ x: '100%', opacity: 0.25 }}
          animate={{ x: '0%', opacity: 1 }} // FIXED: Changed from 0.25 to 1 for full visibility
          exit={{ x: '-100%', opacity: 0.25 }}
          transition={{
            type: 'tween',
            ease: customEasing,
            duration: 0.3, // REDUCED: Faster for better click responsiveness
          }}
          className="absolute inset-0 w-full bg-background"
          style={{ 
            // REMOVED: Properties that can interfere with touch events
            touchAction: 'manipulation', // ADDED: Improves touch responsiveness
            WebkitTapHighlightColor: 'transparent', // ADDED: Removes tap highlighting
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// HARDCODED ANIMATION RULES FOR ALL MENU TRANSITIONS
const ANIMATION_RULES = {
  // FROM /discover
  '/discover': {
    '/my-collaborations': { newFrom: '100%', oldTo: '-10%', direction: 'rightward' }, // discover → my-collabs (rightward)
    '/requests': { newFrom: '100%', oldTo: '-10%', direction: 'rightward' },           // discover → requests (rightward)
    '/matches': { newFrom: '100%', oldTo: '-10%', direction: 'rightward' },            // discover → matches (rightward)
  },
  
  // FROM /my-collaborations  
  '/my-collaborations': {
    '/discover': { newFrom: '-100%', oldTo: '10%', direction: 'leftward' },            // my-collabs → discover (leftward)
    '/requests': { newFrom: '100%', oldTo: '-10%', direction: 'rightward' },           // my-collabs → requests (rightward)
    '/matches': { newFrom: '100%', oldTo: '-100', direction: 'rightward' },            // my-collabs → matches (rightward)
  },
  
  // FROM /requests
  '/requests': {
    '/discover': { newFrom: '-100%', oldTo: '10%', direction: 'leftward' },            // requests → discover (leftward)
    '/my-collaborations': { newFrom: '-10%', oldTo: '10%', direction: 'leftward' },   // requests → my-collabs (leftward)
    '/matches': { newFrom: '100%', oldTo: '-10%', direction: 'rightward' },            // requests → matches (rightward)
  },
  
  // FROM /matches
  '/matches': {
    '/discover': { newFrom: '-100%', oldTo: '10%', direction: 'leftward' },            // matches → discover (leftward)
    '/my-collaborations': { newFrom: '-100%', oldTo: '10%', direction: 'leftward' },   // matches → my-collabs (leftward)
    '/requests': { newFrom: '-100%', oldTo: '10%', direction: 'leftward' },            // matches → requests (leftward)
  },
} as const;

// DEFAULT ANIMATION (for non-menu routes)
const DEFAULT_ANIMATION = { newFrom: '100%', oldTo: '-10%', direction: 'default' };

// Function to get animation rule for transition
const getAnimationRule = (fromPage: string, toPage: string) => {
  const rule = ANIMATION_RULES[fromPage as keyof typeof ANIMATION_RULES]?.[toPage as keyof typeof ANIMATION_RULES['/discover']] || DEFAULT_ANIMATION;
  
  console.log(`🎯 ANIMATION RULE: ${fromPage} → ${toPage}`);
  console.log(`   📥 New page enters from: ${rule.newFrom}`);
  console.log(`   📤 Old page exits to: ${rule.oldTo}`);
  console.log(`   🧭 Direction: ${rule.direction}`);
  
  return rule;
};

// Enhanced directional page transition with hardcoded rules
export const DirectionalPageTransition: React.FC<AnimatedPageTransitionProps> = ({ children }) => {
  const [location] = useLocation();
  
  // Menu order array
  const menuOrder = ['/discover', '/my-collaborations', '/requests', '/matches'];
  const isMainNavigation = menuOrder.includes(location);
  
  // Track previous location to determine animation direction
  const prevLocationRef = React.useRef(location);
  React.useEffect(() => {
    // This updates *after* the render, so on next render, ref has previous value
    prevLocationRef.current = location;
  });

  // Calculate the rule for the CURRENT transition (from prev to current)
  const fromPage = prevLocationRef.current;
  const toPage = location;
  const animationRule = getAnimationRule(fromPage, toPage);

  // OPTIMIZED: Create variants once and pass rule via custom prop to avoid constant recreation
  const variants = React.useMemo(() => ({
    initial: (rule: typeof DEFAULT_ANIMATION) => {
      if (!isMainNavigation) return { x: '100%', opacity: 0.3 };
      
      console.log(`📥 NEW PAGE (${toPage}) enters from: ${rule.newFrom}`);
      return { x: rule.newFrom, opacity: 0.3 };
    },
    in: {
      x: '0%',
      opacity: 1,
    },
    out: (rule: typeof DEFAULT_ANIMATION) => {
      if (!isMainNavigation) return { x: '-100%', opacity: 0.3 };
      
      console.log(`📤 OLD PAGE (${fromPage}) exits to: ${rule.oldTo}`);
      return { x: rule.oldTo, opacity: 0.3 };
    },
  }), [isMainNavigation]); // FIXED: Removed fromPage, toPage to prevent constant recreation

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-background">
      {/* Changed to "wait" mode to prevent overlapping elements that can interfere with clicks */}
      <AnimatePresence mode="wait" initial={false} custom={animationRule}>
        <motion.div
          key={location}
          custom={animationRule} // Pass rule to variants
          initial="initial"
          animate="in"
          exit="out"
          variants={variants}
          transition={{
            type: 'tween',
            ease: customEasing,
            duration: 0.2, // REDUCED: Faster animations to prevent click blocking
          }}
          className="absolute inset-0 w-full bg-background"
          style={{ 
            // REMOVED: willChange, backfaceVisibility, and translateZ that can interfere with touch
            touchAction: 'manipulation', // ADDED: Improves touch responsiveness
            WebkitTapHighlightColor: 'transparent', // ADDED: Removes tap highlighting that can interfere
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};