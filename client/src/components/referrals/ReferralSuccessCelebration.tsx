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

      // Pre-populated message as specified in the PRD
      const messageText = `Hey, I think you should check out Collab Room!`;
      
      // Check if Telegram Web App is available
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Special handling for native Telegram sharing - this is the right method to use!
        // We need to invoke the sharing menu through the supported API
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
          // Direct method to share using built-in share URL format
          // This is the core functionality we need - using proper Telegram URL scheme
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareableLink)}&text=${encodeURIComponent(messageText)}`;
          
          // This will open Telegram's native share dialog
          tg.openTelegramLink(shareUrl);
          
          // Close the dialog
          setTimeout(() => onOpenChange(false), 500);
          return;
        } else {
          // Fallback for older Telegram versions
          // Direct Telegram share URL handling
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareableLink)}&text=${encodeURIComponent(messageText)}`;
          
          // For older Telegram WebApp versions
          tg.openLink(shareUrl);
          
          // Close the dialog
          setTimeout(() => onOpenChange(false), 500);
          return;
        }
      }
      
      // Fallback for non-Telegram environments: try Web Share API
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on The Collab Room',
          text: `${messageText} ${shareableLink}`,
          url: shareableLink
        });
        onOpenChange(false);
        return;
      }
      
      // Last resort fallback - copy to clipboard
      const fullMessage = `${messageText} ${shareableLink}`;
      await navigator.clipboard.writeText(fullMessage);
      toast({
        title: 'Link copied to clipboard',
        description: 'Share this message with your friends.',
      });
      
      // Close the dialog after clipboard copy
      onOpenChange(false);
    } catch (error) {
      console.error('Share error:', error);
      
      // Fallback to clipboard copying when sharing API isn't available
      try {
        const fullMessage = `Hey, I think you should check out Collab Room! ${shareableLink}`;
        await navigator.clipboard.writeText(fullMessage);
        toast({
          title: 'Link copied to clipboard',
          description: 'Share this message with your friends.',
        });
        
        // Close the dialog
        onOpenChange(false);
      } catch (clipboardError) {
        toast({
          title: 'Share failed',
          description: 'Could not share your referral link.',
          variant: 'destructive',
        });
      }
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