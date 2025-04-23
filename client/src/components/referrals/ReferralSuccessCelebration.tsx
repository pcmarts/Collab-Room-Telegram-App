import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ReferralSuccessCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string;
  shareableLink?: string;
}

const ReferralSuccessCelebration = ({
  open,
  onOpenChange,
  referralCode,
  shareableLink
}: ReferralSuccessCelebrationProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      // Copy the referral code to clipboard
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast({
        title: 'Copied to clipboard!',
        description: 'Your referral code has been copied.',
      });
      
      // Log the activity
      await apiRequest('/api/referrals/log-activity', 'POST', {
        activity_type: 'copy',
        details: { source: 'celebration_modal' }
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Handle Telegram share
  const handleShare = async () => {
    if (!shareableLink) return;
    
    try {
      // Log the activity
      await apiRequest('/api/referrals/log-activity', 'POST', {
        activity_type: 'share',
        details: { platform: 'telegram', source: 'celebration_modal' }
      });

      // Check if Telegram Web App is available
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(shareableLink);
      } else {
        window.open(shareableLink, '_blank');
      }
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Share failed',
        description: 'Could not share your referral link.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Your application is approved!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground">
            Welcome to Collab Room! You can now invite up to 3 friends to skip the waiting list.
          </p>
          
          <div className="border rounded-md p-3 bg-background flex items-center justify-between">
            <code className="font-mono text-sm">{referralCode}</code>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? (
                <span className="text-green-500">✓</span>
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Explore Collab Room
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" /> 
            Share on Telegram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ReferralSuccessCelebration };
export default ReferralSuccessCelebration;