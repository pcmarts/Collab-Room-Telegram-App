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
              
              <div className="flex flex-col items-center space-y-5 text-center relative z-10">                
                <div className="flex flex-col items-center space-y-1">
                  <h2 className="text-2xl font-bold text-[#FAFAFA]">
                    It's a Match!
                  </h2>
                </div>
                
                <div className="w-full p-5 rounded-lg bg-muted/30 border border-primary/10">
                  <h3 className="font-semibold text-lg text-[#FAFAFA]">{matchData.companyName}</h3>
                  <div className="flex justify-center mt-2">
                    <span className="inline-block px-3 py-1 text-xs bg-primary/10 text-[#FAFAFA] rounded-full">
                      {matchData.collaborationType}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full mt-4">
                  <div className="flex-1 relative">
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/20 text-[#FAFAFA]"
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
                      className="w-full relative z-10 text-[#FAFAFA]" 
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