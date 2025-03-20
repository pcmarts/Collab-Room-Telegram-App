import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Confetti particle component
const Confetti = ({ colors }: { colors: string[] }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    delay: number;
    duration: number;
    flutterX: number[];
    shape: 'circle' | 'square' | 'rectangle';
  }>>([]);

  useEffect(() => {
    // Generate a large number of falling confetti particles
    const newParticles = Array.from({ length: 250 }).map((_, i) => {
      // Start from the top with a random horizontal position
      const startX = Math.random() * 100; // Random horizontal position (0-100%)
      const startY = -10 - Math.random() * 20; // Start above the viewport (negative %)
      
      // Randomize properties for each particle
      const size = Math.random() * 12 + 5;
      
      // Random shape with more varied options
      const shapes: Array<'circle' | 'square' | 'rectangle'> = ['circle', 'square', 'rectangle'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      // Flutter pattern - subtle horizontal movement as the confetti falls
      const flutterIntensity = 15 + Math.random() * 20;
      const flutterPoints = 5; // Number of points in the flutter path
      const flutterX = Array.from({ length: flutterPoints }).map(() => 
        (Math.random() - 0.5) * flutterIntensity
      );
      
      return {
        id: i,
        x: startX,
        y: startY,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 3, // Staggered start for a continuous rain effect
        duration: 4 + Math.random() * 5, // Slower, more natural falling
        flutterX,
        shape
      };
    });
    
    setParticles(newParticles);
  }, [colors]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {particles.map((particle) => {
        // Special styling for rectangle shape
        const isRectangle = particle.shape === 'rectangle';
        const width = isRectangle ? particle.size * 0.6 : particle.size;
        const height = isRectangle ? particle.size * 2 : particle.size;
        
        return (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              width,
              height,
              backgroundColor: particle.color,
              borderRadius: particle.shape === 'circle' ? '50%' : '0',
              opacity: 0,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              boxShadow: `0 0 2px rgba(255,255,255,0.5)`,
            }}
            animate={{
              y: ['0%', '110%'], // Fall from initial position to bottom of screen
              x: particle.flutterX, // Flutter left and right while falling
              opacity: [0, 0.9, 0.9, 0.9, 0], // Fade in/out
              rotate: [`${Math.random() * 360}deg`, `${Math.random() * 360 + 720}deg`], // Spin as it falls
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "linear",
              times: [0, 1], // Control timing of the animation
              x: {
                duration: particle.duration,
                times: particle.flutterX && particle.flutterX.length > 0 ? 
                  Array.from({ length: particle.flutterX.length }).map(
                    (_, i) => i / (particle.flutterX.length - 1)
                  ) : [0, 1],
                ease: "easeInOut",
              },
              opacity: {
                duration: particle.duration,
                times: [0, 0.1, 0.8, 0.9, 1], // Control timing of opacity changes
              }
            }}
          />
        );
      })}
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
          {isOpen && <Confetti colors={confettiColors} />}
          
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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