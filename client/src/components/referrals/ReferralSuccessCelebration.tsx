import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, Copy, Share2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DisplayHeading, Eyebrow } from '@/components/brand';

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
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader>
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-surface">
              <PartyPopper className="h-8 w-8 text-warm-bright" />
            </div>
          </div>
          <div className="flex justify-center">
            <Eyebrow tone="warm" dot>
              Approved
            </Eyebrow>
          </div>
          <DialogTitle className="sr-only">You're in</DialogTitle>
          <div className="mt-2 text-center">
            <DisplayHeading size="lg" accent="invited.">
              You're
            </DisplayHeading>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-center text-sm text-text-muted">
            Welcome in. You can now skip the line for up to 3 collaborators.
          </p>

          <div className="flex items-center justify-between rounded-md border border-warm-accent/20 bg-warm-surface px-3 py-2.5">
            <code className="font-mono text-sm tabular text-text">{referralCode}</code>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-warm-bright" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Explore
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share on Telegram
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ReferralSuccessCelebration };
export default ReferralSuccessCelebration;