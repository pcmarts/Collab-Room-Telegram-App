import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw, Share, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface ReferralCardProps {
  className?: string;
  referralInfo?: {
    referral_code: string;
    total_available: number;
    total_used: number;
    remaining: number;
  };
  isLoading?: boolean;
  error?: Error | null;
}

export function ReferralCard({ className = '', referralInfo, isLoading, error }: ReferralCardProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Prepare referral link
  const baseUrl = window.location.origin;
  const referralLink = referralInfo ? 
    `https://t.me/collabroom_test_bot?start=r_${referralInfo.referral_code}` : '';
    
  // Log view event when component mounts and has referral data
  useEffect(() => {
    if (!isLoading && referralInfo && referralInfo.referral_code) {
      logAnalyticsEvent('view', {
        component: 'ReferralCard',
        referral_code: referralInfo.referral_code,
        total_used: referralInfo.total_used,
        total_available: referralInfo.total_available
      });
    }
  }, [isLoading, referralInfo]);
  
  // Function to log analytics events
  const logAnalyticsEvent = async (eventType: 'generate' | 'share' | 'copy' | 'view', details?: Record<string, any>) => {
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
      // Don't show toast for analytics errors
    }
  };
  
  // Function to copy referral link to clipboard
  const handleCopyLink = async () => {
    if (!referralLink) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      
      // Log analytics event
      logAnalyticsEvent('copy', {
        referral_code: referralInfo?.referral_code,
        method: 'clipboard'
      });
      
      toast({
        title: "Link Copied",
        description: "Referral link copied to clipboard!"
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Try again later.",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };
  
  // Function to generate referral code
  const handleGenerateReferralCode = () => {
    // This function would be used if we needed to generate a code
    // But in our case, codes are automatically generated in the database
    queryClient.invalidateQueries({ queryKey: ['/api/referrals/my-code'] });
  };
  
  // Function to share via Telegram
  const handleShare = async () => {
    if (!referralLink) return;
    
    setIsSharing(true);
    try {
      // Check if Telegram webapp is available
      if (window.Telegram?.WebApp) {
        // Prepare share text
        const shareText = `Join me on The Collab Room! Use my referral link to get instant access: ${referralLink}`;
        
        // Try to use native Telegram sharing functionality
        try {
          // The WebApp.share() method returns a Promise that resolves to true if the user shared the message
          const shared = await window.Telegram.WebApp.share(shareText);
          
          if (shared) {
            console.log('Successfully shared via Telegram');
            // Trigger haptic feedback if available
            if (window.Telegram.WebApp.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
            
            // Log analytics event for successful share
            logAnalyticsEvent('share', {
              referral_code: referralInfo?.referral_code,
              method: 'telegram_native',
              success: true
            });
            
            toast({
              title: "Successfully Shared",
              description: "Your referral link has been shared!"
            });
            
            // Log the share event
            console.log('Referral link shared via Telegram', { code: referralInfo?.referral_code });
          } else {
            // Log analytics event for canceled share
            logAnalyticsEvent('share', {
              referral_code: referralInfo?.referral_code,
              method: 'telegram_native',
              success: false,
              reason: 'user_canceled'
            });
            console.log('User canceled sharing');
            toast({
              title: "Sharing Canceled",
              description: "You canceled sharing the referral link."
            });
          }
        } catch (shareError) {
          console.error('Error using Telegram share:', shareError);
          
          // Fallback to using Telegram openTelegramLink if available
          if ('openTelegramLink' in window.Telegram.WebApp) {
            try {
              // Try to open a deep link to share via Telegram
              window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on The Collab Room!')}`);
              
              // Log analytics event
              logAnalyticsEvent('share', {
                referral_code: referralInfo?.referral_code,
                method: 'telegram_deep_link',
                success: true
              });
            } catch (linkError) {
              console.error('Error using openTelegramLink:', linkError);
              
              // Log the error
              logAnalyticsEvent('share', {
                referral_code: referralInfo?.referral_code,
                method: 'telegram_deep_link',
                success: false,
                error: linkError.message
              });
              
              // Fallback to clipboard
              handleCopyLink();
            }
          } else {
            // Fallback to clipboard
            handleCopyLink();
            toast({
              title: "Sharing Feature Unavailable",
              description: "Link copied to clipboard instead. You can paste it in Telegram manually."
            });
          }
        }
      } else {
        // Fallback to copy if Telegram WebApp is not available
        handleCopyLink();
        toast({
          title: "Telegram Sharing Unavailable",
          description: "Link copied to clipboard instead. You can paste it in Telegram manually."
        });
      }
    } catch (err) {
      console.error('Share error:', err);
      // Fallback to copy
      handleCopyLink();
      toast({
        title: "Telegram Sharing Unavailable",
        description: "Link copied to clipboard instead. You can paste it in Telegram manually."
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2 bg-gray-800" />
          <Skeleton className="h-4 w-1/2 bg-gray-800" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4 bg-gray-800" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full bg-gray-800" />
        </CardFooter>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={`bg-gray-950 text-white border-red-900 ${className}`}>
        <CardHeader>
          <CardTitle>Error Loading Referrals</CardTitle>
          <CardDescription className="text-gray-400">
            We couldn't load your referral information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Try refreshing the page or contact support if the issue persists.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="secondary" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/referrals/my-code'] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If no referral code yet, show generate button
  if (!referralInfo || !referralInfo.referral_code) {
    return (
      <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
        <CardHeader>
          <CardTitle>Invite Friends</CardTitle>
          <CardDescription className="text-gray-400">
            Generate a referral code to invite friends to The Collab Room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-4">
            You can invite up to 3 friends to join. They'll get instant access when they use your referral link!
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleGenerateReferralCode}
          >
            Generate Referral Link
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle>Invite Friends</CardTitle>
        <CardDescription className="text-gray-400">
          Share your referral link with friends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Referrals Available</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div 
                  className="bg-primary rounded-full h-2.5" 
                  style={{ width: `${(referralInfo.total_used / referralInfo.total_available) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium">
                {referralInfo.total_used}/{referralInfo.total_available}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-2">Your referral link:</p>
            <div className="p-3 bg-gray-900 rounded border border-gray-800 text-sm truncate">
              {referralLink}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={handleCopyLink}
          disabled={isCopying}
        >
          {isCopying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Copying...
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" /> Copy Link
            </>
          )}
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sharing...
            </>
          ) : (
            <>
              <Share className="mr-2 h-4 w-4" /> Share
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}