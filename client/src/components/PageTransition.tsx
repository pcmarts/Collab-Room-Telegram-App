import { useState, useEffect, ReactNode, useRef } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: ReactNode;
  transitionKey?: string;
}

// Hook to manage route transitions
export function useRouteTransition() {
  const [location] = useLocation();
  const [previousLocation, setPreviousLocation] = useState<string>("/discover");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"slide-in-right" | "slide-out-right" | "none">("none");

  useEffect(() => {
    // Don't animate on initial load
    if (previousLocation === location) return;

    setIsTransitioning(true);

    // Determine animation direction
    if (previousLocation === "/discover" && location === "/dashboard") {
      setTransitionDirection("slide-in-right"); // Dashboard slides in from right
    } else if (previousLocation === "/dashboard" && location === "/discover") {
      setTransitionDirection("slide-out-right"); // Dashboard slides out to right
    } else {
      setTransitionDirection("none");
    }

    // Complete transition after animation
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setPreviousLocation(location);
    }, 300);

    return () => clearTimeout(timer);
  }, [location, previousLocation]);

  return { isTransitioning, transitionDirection, location, previousLocation };
}

// Page transition wrapper component
export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const { isTransitioning, transitionDirection } = useRouteTransition();
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const prevTransitionKey = useRef(transitionKey);

  useEffect(() => {
    // Update displayed children when transitioning starts or key changes
    if (!isTransitioning || prevTransitionKey.current !== transitionKey) {
      setDisplayedChildren(children);
      prevTransitionKey.current = transitionKey;
    }
  }, [children, isTransitioning, transitionKey]);

  const getTransitionClass = () => {
    if (!isTransitioning) {
      return "translate-x-0";
    }

    switch (transitionDirection) {
      case "slide-in-right":
        return "translate-x-full";
      case "slide-out-right":
        return "translate-x-full";
      default:
        return "translate-x-0";
    }
  };

  return (
    <div className="relative w-full h-full">
      <div 
        className={`w-full h-full transition-transform duration-300 ease-in-out ${getTransitionClass()}`}
      >
        {displayedChildren}
      </div>
    </div>
  );
}