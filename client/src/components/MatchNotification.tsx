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
    shape: 'circle' | 'square' | 'triangle';
  }>>([]);

  useEffect(() => {
    // Generate random confetti particles for a big explosion effect
    const newParticles = Array.from({ length: 200 }).map((_, i) => {
      // Random starting point near the center of the screen
      const startX = 50;
      const startY = 50;
      
      // Random end points (exploding outward)
      const angle = Math.random() * Math.PI * 2; // Full 360° explosion
      const distance = 30 + Math.random() * 100; // How far particles travel
      
      // Calculate end position using angle and distance
      const endX = Math.cos(angle) * distance;
      const endY = Math.sin(angle) * distance;
      
      // Random shape for variety
      const shapes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      return {
        id: i,
        x: endX,
        y: endY,
        size: Math.random() * 12 + 4, // Slightly larger particles
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3, // Shorter delay for more instant explosion
        duration: 0.8 + Math.random() * 1.2, // Faster animation
        shape
      };
    });
    
    setParticles(newParticles);
  }, [colors]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            width: particle.size,
            height: particle.shape !== 'triangle' ? particle.size : 0,
            borderWidth: particle.shape === 'triangle' ? `${particle.size}px ${particle.size}px 0` : 0,
            borderStyle: particle.shape === 'triangle' ? 'solid' : 'none',
            borderColor: particle.shape === 'triangle' ? `${particle.color} transparent transparent` : 'transparent',
            backgroundColor: particle.shape !== 'triangle' ? particle.color : 'transparent',
            borderRadius: particle.shape === 'circle' ? '50%' : '0',
            left: '50%',
            top: '50%',
            marginLeft: -particle.size / 2,
            marginTop: -particle.size / 2,
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: [0, 1, 1, 0],
            rotate: [0, particle.rotation],
            scale: [0.3, 1, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeOut",
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
  const [confettiColors] = useState([
    '#FF5733', // Orange
    '#33FFC4', // Turquoise
    '#337DFF', // Blue
    '#F433FF', // Pink
    '#FFF633', // Yellow
    '#33FF57', // Green
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