import React from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchConfetti } from '@/components/ui/match-confetti';
import { GlowEffect } from '@/components/ui/glow-effect';

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
  
  // Define bright, festive confetti colors
  const confettiColors = [
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
  ];
  
  // Navigate to matches page and close the notification
  const goToMatches = () => {
    setLocation('/matches');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Confetti effect */}
          <MatchConfetti 
            active={isOpen} 
            colors={confettiColors} 
            particleCount={200}
            duration={6000}
          />
          
          {/* Dark overlay with blur */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Match card */}
            <motion.div 
              className="relative w-full max-w-md bg-background/90 backdrop-blur-sm rounded-xl border border-primary/20 shadow-2xl p-6 z-10 overflow-hidden"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 15 }}
            >
              {/* Background glow effect */}
              <GlowEffect
                colors={['#FF5733', '#F433FF', '#337DFF', '#33FF57']}
                mode="colorShift"
                blur="strong"
                scale={1.5}
                duration={4}
              />
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 z-10" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex flex-col items-center space-y-5 text-center relative z-10">
                {/* Achievement badge */}
                <div className="relative">
                  {/* Achievement ribbon */}
                  <motion.div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    Challenge Complete!
                  </motion.div>

                  {/* Animated confetti icon */}
                  <div className="relative w-16 h-16 mb-2 mt-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 3,
                          ease: "easeInOut" 
                        }}
                      >
                        <PartyPopper className="h-8 w-8 text-primary" />
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                    It's a Match!
                  </h2>
                  <p className="text-muted-foreground">You both showed interest in collaborating!</p>
                </div>
                
                <div className="w-full p-5 rounded-lg bg-muted/30 border border-primary/10">
                  <h3 className="font-semibold text-lg">{matchData.title || 'New Collaboration'}</h3>
                  <p className="text-sm text-muted-foreground">{matchData.companyName}</p>
                  <div className="flex justify-center mt-2">
                    <span className="inline-block px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">
                      {matchData.collaborationType}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full mt-4">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/20"
                      onClick={onClose}
                    >
                      Keep Browsing
                    </Button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <GlowEffect
                      colors={['#7B68EE', '#337DFF', '#33FFC4', '#F433FF']}
                      mode="pulse"
                      blur="soft"
                      scale={0.9}
                      duration={2}
                    />
                    <Button 
                      className="w-full relative z-10" 
                      onClick={goToMatches}
                    >
                      View Matches
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}