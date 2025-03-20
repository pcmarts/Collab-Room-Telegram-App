import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Confetti particle component
const Confetti = ({ colors }: { colors: string[] }) => {
  const confettiParticles = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => {
      // Random position across the top of the screen
      const x = Math.random() * 100; // Random horizontal position (0-100%)
      
      // Randomize properties for each particle
      const size = Math.random() * 8 + 3;
      const shape = ['circle', 'square', 'rectangle'][Math.floor(Math.random() * 3)];
      const rotationStart = Math.random() * 360;
      const rotationEnd = rotationStart + Math.random() * 720;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const delay = Math.random() * 5; // Staggered start for continuous rain effect
      const duration = 6 + Math.random() * 6; // Longer, more varied falling speed for sustained effect
      
      // Flutter pattern - how much the particle moves side to side while falling
      const flutterIntensity = 15 + Math.random() * 20;
      const flutter = [(Math.random() - 0.5) * flutterIntensity, (Math.random() - 0.5) * flutterIntensity];
      
      // Special styling for rectangle shape
      const isRectangle = shape === 'rectangle';
      const width = isRectangle ? size * 0.6 : size;
      const height = isRectangle ? size * 2 : size;
      
      return {
        id: i,
        x,
        size,
        width,
        height,
        shape,
        rotationStart,
        rotationEnd,
        color,
        delay,
        duration,
        flutter
      };
    });
  }, [colors]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 9999999, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}>
      {confettiParticles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            width: particle.width,
            height: particle.height,
            backgroundColor: particle.color,
            borderRadius: particle.shape === 'circle' ? '50%' : '0',
            left: `${particle.x}%`,
            top: '-20px', // Start above the viewport
            boxShadow: `0 0 2px rgba(255,255,255,0.3)`,
            zIndex: 9999999, // Very high z-index to ensure it's above everything
            pointerEvents: 'none', // Make sure particles don't block interaction
          }}
          initial={{ opacity: 0, y: -20, rotate: particle.rotationStart }}
          animate={{ 
            opacity: [0, 0.9, 0.9, 0.9, 0],
            y: ['0vh', '120vh'], 
            x: particle.flutter,
            rotate: particle.rotationEnd
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "linear",
            opacity: {
              times: [0, 0.1, 0.7, 0.9, 1]
            }
          }}
        />
      ))}
    </div>
  );
};

interface MatchNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: {
    title: string;
    companyName: string;
    collaborationType: string;
    imageUrl?: string;
  };
}

export function MatchNotification({ isOpen, onClose, matchData }: MatchNotificationProps) {
  const [location, setLocation] = useLocation();
  // Portal root no longer needed since we render directly
  
  const [confettiColors] = useState([
    '#FF5733', // Orange
    '#33FFC4', // Turquoise
    '#337DFF', // Blue
    '#F433FF', // Pink
    '#FFF633', // Yellow
    '#33FF57', // Green
    '#FFD700', // Gold
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF1493', // Deep Pink
    '#7B68EE', // Medium Slate Blue
    '#FF8C00', // Dark Orange
  ]);
  
  // Navigate to matches page and close the notification
  const goToMatches = () => {
    setLocation('/matches');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Show confetti directly, no portal needed */}
          <Confetti colors={confettiColors} />
          
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ pointerEvents: "auto" }} // Ensure modal is clickable
          >
            <motion.div 
              className="relative w-full max-w-md bg-background rounded-lg shadow-xl p-6"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 z-10" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Sparkles className="h-6 w-6 text-primary" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-primary">It's a Match!</h2>
                    <motion.div
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                    >
                      <PartyPopper className="h-6 w-6 text-primary" />
                    </motion.div>
                  </div>
                  <p className="text-muted-foreground">You both showed interest in collaborating!</p>
                </div>
                
                <div className="w-full p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold text-lg">{matchData.title || 'New Collaboration'}</h3>
                  <p className="text-sm">{matchData.companyName}</p>
                  <span className="inline-block px-2 py-1 mt-2 text-xs bg-primary/10 text-primary rounded-full">
                    {matchData.collaborationType}
                  </span>
                </div>
                
                <div className="flex gap-3 w-full mt-4">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Keep Browsing
                  </Button>
                  <Button className="flex-1" onClick={goToMatches}>
                    View Matches
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}