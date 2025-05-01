import { memo } from "react";

// Ultra-lightweight splash screen component that visually matches the HTML splash screen
// Using memo to prevent unnecessary re-renders for absolute optimal performance
const SplashScreen = memo(() => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 animate-fade-in">
      <div className="w-20 h-20 mb-5">
        {/* Identical simple SVG to match the HTML splash screen */}
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" className="text-primary" />
          <path 
            d="M30 50C30 40 40 30 50 30C60 30 70 40 70 50C70 60 60 70 50 70" 
            stroke="currentColor" 
            strokeWidth="5"
            className="text-primary"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">CollabRoom</h1>
    </div>
  );
});

// Add displayName for better debugging in React DevTools
SplashScreen.displayName = "SplashScreen";

export default SplashScreen;