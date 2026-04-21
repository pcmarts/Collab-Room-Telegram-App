import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Share2, Copy, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Eyebrow } from '@/components/brand';
import { apiRequest } from '@/lib/queryClient';

interface ReferralInfo {
  success: boolean;
  referral_code: string;
  total_available: number;
  total_used: number;
  remaining: number;
  shareable_link: string;
}

interface ReferralCardProps {
  referralInfo?: ReferralInfo;
  isLoading: boolean;
  error?: Error;
}

const ReferralCard = ({ referralInfo, isLoading, error }: ReferralCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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
    if (!referralInfo?.referral_code) return;
    
    try {
      // Copy the referral code to clipboard
      await navigator.clipboard.writeText(referralInfo.referral_code);
      setCopied(true);
      toast({
        title: 'Copied to clipboard!',
        description: 'Your referral code has been copied.',
      });
      
      // Log the activity
      await apiRequest('/api/referrals/log-activity', 'POST', {
        activity_type: 'copy',
        details: { code: referralInfo.referral_code }
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
    if (!referralInfo?.shareable_link) return;
    
    try {
      // Log the activity first
      await apiRequest('/api/referrals/log-activity', 'POST', {
        activity_type: 'share',
        details: { platform: 'telegram' }
      });

      // Pre-populated message as specified in the PRD
      const messageText = `Hey, I think you should check out Collab Room!`;
      
      // Check if Telegram Web App is available
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Special handling for native Telegram sharing - this is the right method to use!
        // We need to invoke the sharing menu through the supported API
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
          // The most reliable way to launch Telegram's native sharing dialog in WebApp
          // Available in newer Telegram WebApp versions
          if (tg.showPopup && typeof tg.showPopup === 'function') {
            // When we show a popup, it has the callback function for when user clicks OK
            tg.showPopup({
              title: "Share Invitation",
              message: "Open Telegram's share menu?", 
              buttons: [{type: "default", text: "Share Now"}]
            }, () => {
              // After showing popup and user confirms, create the share URL
              const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralInfo.shareable_link)}&text=${encodeURIComponent(messageText)}`;
              
              // Use Telegram's internal URL handling - this will open the native share dialog
              tg.openTelegramLink(shareUrl);
            });
            return;
          } else {
            // Direct method to share using built-in share URL format
            // This is the core functionality we need - using proper Telegram URL scheme
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralInfo.shareable_link)}&text=${encodeURIComponent(messageText)}`;
            
            // This will open Telegram's native share dialog
            tg.openTelegramLink(shareUrl);
            return;
          }
        } else {
          // Fallback for older Telegram versions
          // Direct Telegram share URL handling
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralInfo.shareable_link)}&text=${encodeURIComponent(messageText)}`;
          
          // For older Telegram WebApp versions
          tg.openLink(shareUrl);
          return;
        }
      }
      
      // Fallback for non-Telegram environments: try Web Share API
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on The Collab Room',
          text: `${messageText} ${referralInfo.shareable_link}`,
          url: referralInfo.shareable_link
        });
        return;
      }
      
      // Last resort fallback - copy to clipboard
      const fullMessage = `${messageText} ${referralInfo.shareable_link}`;
      await navigator.clipboard.writeText(fullMessage);
      toast({
        title: 'Link copied to clipboard',
        description: 'Share this message with your friends.',
      });
    } catch (error) {
      console.error('Share error:', error);
      
      // Fallback to clipboard copying when sharing API isn't available
      try {
        const fullMessage = `Hey, I think you should check out Collab Room! ${referralInfo.shareable_link}`;
        await navigator.clipboard.writeText(fullMessage);
        toast({
          title: 'Link copied to clipboard',
          description: 'Share this message with your friends.',
        });
      } catch (clipboardError) {
        toast({
          title: 'Share failed',
          description: 'Could not share your referral link.',
          variant: 'destructive',
        });
      }
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-5">
        <Skeleton className="mb-2 h-3 w-16" />
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="mb-2 h-2 w-full" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    );
  }

  // If user has no referral code yet, show a message
  if (!referralInfo || !referralInfo.referral_code) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-5">
        <Eyebrow>Invite</Eyebrow>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-text">
          Referrals not available yet
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          Check back soon.
        </p>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round((referralInfo.total_used / referralInfo.total_available) * 100),
    100
  );

  return (
    <section className="relative overflow-hidden rounded-lg border border-hairline bg-surface p-5">
      {showCelebration && (
        <div className="celebration-animation pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/10">
          <div className="animate-bounce text-4xl">🎉</div>
        </div>
      )}

      <Eyebrow tone="brand">Your invite code</Eyebrow>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={referralInfo.referral_code}
          readOnly
          className="font-mono text-sm tabular"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          title="Copy referral code"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Friends skip the waiting list when they use your code.
      </p>

      <div className="mt-5 space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-text-muted">Invites used</span>
          <span className="font-medium tabular text-text">
            {referralInfo.total_used} / {referralInfo.total_available}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-1.5" />
        <p className="text-xs tabular text-text-subtle">
          {referralInfo.remaining > 0
            ? `${referralInfo.remaining} remaining.`
            : 'All invites used.'}
        </p>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
          Copy code
        </Button>
        <Button
          className="flex-1"
          onClick={handleShare}
          disabled={referralInfo.remaining < 1}
          data-share-button
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </section>
  );
};

export { ReferralCard };
export default ReferralCard;