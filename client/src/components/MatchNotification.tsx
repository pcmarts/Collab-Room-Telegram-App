import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Create an array of confetti particles
  const confettiParticles = Array.from({ length: 150 }).map((_, i) => {
    // Randomize properties for each particle
    const size = Math.random() * 10 + 4;
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    // Position particles across the whole screen
    const x = Math.random() * 100; // percent
    const y = Math.random() * 100; // percent
    const rotation = Math.random() * 360;
    const opacity = 0.5 + Math.random() * 0.5;
    const delay = Math.random() * 2;

    return { id: i, size, color, x, y, rotation, opacity, delay };
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50" style={{ perspective: "500px" }}>
          {/* Confetti particles */}
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                left: `${particle.x}%`,
                top: `-${particle.size}px`,
                zIndex: 100,
                opacity: particle.opacity,
              }}
              initial={{ y: "-10%", rotate: 0, scale: 0 }}
              animate={{ 
                y: "120%", 
                rotate: particle.rotation * 5,
                scale: [0, 1, 1, 0.5, 0],
                x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5,
                ease: "easeOut",
                delay: particle.delay,
                repeat: 3,
                repeatType: "loop"
              }}
            />
          ))}
          
          {/* Dark overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Match card */}
            <motion.div 
              className="relative w-full max-w-md bg-background rounded-lg shadow-xl p-6 z-10"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2" 
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
        </div>
      )}
    </AnimatePresence>
  );
}