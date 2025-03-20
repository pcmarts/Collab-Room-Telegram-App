import React, { useEffect } from 'react';
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
  
  // Create animated sparkles effect
  useEffect(() => {
    if (!isOpen) return;
    
    // This is a purely visual effect so no cleanup needed
  }, [isOpen]);

  // Navigate to matches page and close the notification
  const goToMatches = () => {
    setLocation('/matches');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
      )}
    </AnimatePresence>
  );
}