import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useReferrals } from '@/hooks/use-referrals';
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

const ReferralCard = () => {
  const { toast } = useToast();
  const { referralInfo, isLoading, refetch } = useReferrals();
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
      // Check if Telegram Web App is available
      if (window.Telegram?.WebApp) {
        // Log the activity
        await apiRequest('/api/referrals/log-activity', 'POST', {
          activity_type: 'share',
          details: { platform: 'telegram' }
        });

        // Share using Telegram Web App
        window.Telegram.WebApp.openTelegramLink(referralInfo.shareable_link);
      } else {
        // Fallback for non-Telegram environment
        window.open(referralInfo.shareable_link, '_blank');
      }
    } catch (error) {
      toast({
        title: 'Share failed',
        description: 'Could not share your referral link.',
        variant: 'destructive',
      });
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