import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

      // Check if Telegram Web App is available and has the share features
      if (window.Telegram?.WebApp) {
        // Try using Telegram direct sharing if available
        const tg = window.Telegram.WebApp;
        
        // Try opening the link directly in Telegram
        if (typeof tg.openTelegramLink === 'function') {
          tg.openTelegramLink(referralInfo.shareable_link);
          return;
        }
        
        // Fallback to the expansion approach - give user more screen space
        if (typeof tg.expand === 'function') {
          tg.expand();
          // Just copy the link to clipboard as well
          await navigator.clipboard.writeText(referralInfo.shareable_link);
          toast({
            title: 'Link copied to clipboard',
            description: 'You can now share it with your friends.',
          });
          return;
        }
      }
      
      // Last resort fallback - browser behavior
      await navigator.clipboard.writeText(referralInfo.shareable_link);
      toast({
        title: 'Link copied to clipboard',
        description: 'You can now share it with your friends.',
      });
      
      // If available, also try to use the native share API
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on The Collab Room',
          text: 'Use my referral code to join The Collab Room!',
          url: referralInfo.shareable_link
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      // Show a helpful toast
      toast({
        title: 'Direct sharing failed',
        description: 'The link has been copied to your clipboard instead.',
      });
      
      // Make sure the user has the link even if sharing failed
      try {
        await navigator.clipboard.writeText(referralInfo.shareable_link);
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
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </CardFooter>
      </Card>
    );
  }

  // If user has no referral code yet, show a message
  if (!referralInfo || !referralInfo.referral_code) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invite Friends</CardTitle>
          <CardDescription>Referrals are not available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Referral features will be available soon. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress percentage
  const progressPercentage = Math.min(
    Math.round((referralInfo.total_used / referralInfo.total_available) * 100),
    100
  );

  return (
    <Card className="w-full relative overflow-hidden">
      {showCelebration && (
        <div className="celebration-animation absolute inset-0 z-10 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="text-4xl animate-bounce">🎉</div>
        </div>
      )}
      
      <CardHeader>
        <CardTitle>Invite Friends</CardTitle>
        <CardDescription>
          Share your referral code to invite friends to The Collab Room
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Input 
              value={referralInfo.referral_code}
              readOnly
              className="font-mono text-sm"
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
          
          <p className="text-xs text-muted-foreground">
            Your friends will get immediate access when they use your code!
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Invites used</span>
            <span className="font-medium">{referralInfo.total_used} of {referralInfo.total_available}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {referralInfo.remaining > 0 
              ? `You have ${referralInfo.remaining} invites remaining.`
              : 'You have used all your invites.'}
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          className="w-full mr-2"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Code
        </Button>
        
        <Button 
          className="w-full"
          onClick={handleShare}
          disabled={referralInfo.remaining < 1}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
};

export { ReferralCard };
export default ReferralCard;