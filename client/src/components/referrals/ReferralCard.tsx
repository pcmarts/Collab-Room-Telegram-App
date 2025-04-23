import { useState } from 'react';
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
  
  // Function to copy referral link to clipboard
  const handleCopyLink = async () => {
    if (!referralLink) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
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
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openTelegramLink(referralLink);
      } else {
        // Fallback to copy
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