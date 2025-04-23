import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Gift, Sparkles } from 'lucide-react';

interface ReferralSuccessCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

// Function to log analytics events
const logAnalyticsEvent = async (eventType: 'celebration_view', details?: Record<string, any>) => {
  try {
    await fetch('/api/referrals/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        details
      })
    });
    console.log(`Logged referral ${eventType} event`);
  } catch (err) {
    console.error(`Failed to log referral ${eventType} event:`, err);
  }
};

export function ReferralSuccessCelebration({ isOpen, onClose, userName = 'your friend' }: ReferralSuccessCelebrationProps) {
  // State to track confetti animation
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Trigger haptic feedback when opened
  useEffect(() => {
    if (isOpen) {
      // Log view event
      logAnalyticsEvent('celebration_view', {
        component: 'ReferralSuccessCelebration',
        user_name: userName
      });
      
      // Try to use Telegram haptic feedback if available
      if (window.Telegram?.WebApp?.HapticFeedback) {
        // Provide a success notification haptic
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        
        // After a short delay, also provide an impact
        setTimeout(() => {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }, 300);
      }
      
      // Reset animation after 5 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, userName]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-xs mx-auto">
        <div className={`confetti-container ${isAnimating ? 'animate' : ''}`}>
          {/* Generate confetti particles */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="confetti-particle"
              style={{
                background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                left: `${Math.random() * 100}%`,
                width: `${5 + Math.random() * 7}px`,
                height: `${5 + Math.random() * 7}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${1 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="flex justify-center my-4">
          <div className="bg-primary/20 p-4 rounded-full">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>
        
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Congratulations!</DialogTitle>
          <DialogDescription className="text-gray-400">
            {userName} has joined The Collab Room using your referral link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 my-4">
          <div className="flex items-center gap-2 bg-gray-900 p-3 rounded-lg">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-sm">Referral Completed Successfully</span>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-900 p-3 rounded-lg">
            <Gift className="h-5 w-5 text-primary" />
            <span className="text-sm">They now have instant access to the platform</span>
          </div>
        </div>
        
        <Button onClick={onClose} className="w-full">
          Awesome!
        </Button>
      </DialogContent>
    </Dialog>
  );
}