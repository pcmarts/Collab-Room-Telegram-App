import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, UserPlus, Users, ArrowRight } from 'lucide-react';
import { useReferrals } from '@/hooks/use-referrals';

interface ReferralInfoPanelProps {
  onShare?: () => void;
}

const ReferralInfoPanel = ({ onShare }: ReferralInfoPanelProps) => {
  const { referralInfo } = useReferrals();
  
  // Check if all referrals are used
  const allReferralsUsed = referralInfo && referralInfo.total_used >= referralInfo.total_available;
  
  // NoReferralsYet empty state
  if (!allReferralsUsed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
          <CardDescription>
            Invite friends and help grow The Collab Room community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Three-step explanation of how referrals work */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Step 1: Share */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/65">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">1. Share</h3>
              <p className="text-sm text-muted-foreground">Share your unique referral link with friends</p>
            </div>
            
            {/* Step 2: Friends Join */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/65">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">2. Friends Join</h3>
              <p className="text-sm text-muted-foreground">They get instant access to The Collab Room</p>
            </div>
            
            {/* Step 3: Track */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/65">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">3. Track</h3>
              <p className="text-sm text-muted-foreground">See who joined through your referrals</p>
            </div>
          </div>
          
          {/* Call-to-action button */}
          <Button 
            className="w-full" 
            onClick={onShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Your Referral Link
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // AllReferralsUsed empty state
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>All Referrals Used</CardTitle>
        <CardDescription>
          Thank you for helping grow our community!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/65 rounded-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          
          <h3 className="text-lg font-medium mb-2">You're a community builder!</h3>
          <p className="text-muted-foreground mb-4">
            You've used all {referralInfo?.total_available} of your referral slots.
            Thank you for helping us grow The Collab Room community!
          </p>
          
          <Button variant="outline" className="mt-2">
            View Your Referred Friends
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export { ReferralInfoPanel };
export default ReferralInfoPanel;