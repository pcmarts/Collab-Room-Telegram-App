import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Zap, Users } from 'lucide-react';
import { useEffect } from 'react';

interface ReferralInfoPanelProps {
  className?: string;
}

// Function to log analytics events
const logAnalyticsEvent = async (eventType: 'view', details?: Record<string, any>) => {
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

export function ReferralInfoPanel({ className = '' }: ReferralInfoPanelProps) {
  // Log view event when component mounts
  useEffect(() => {
    logAnalyticsEvent('view', {
      component: 'ReferralInfoPanel'
    });
  }, []);

  return (
    <Card className={`bg-gray-950 text-white border-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle>Referral Program</CardTitle>
        <CardDescription className="text-gray-400">
          Invite friends and help them skip the waiting list
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="mr-3 bg-primary/20 p-2 rounded-full">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Limited Invitations</h4>
              <p className="text-xs text-gray-400">
                You can invite up to 3 friends to join The Collab Room.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-3 bg-primary/20 p-2 rounded-full">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Instant Access</h4>
              <p className="text-xs text-gray-400">
                Your invited friends get instant access, bypassing the waiting list.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="mr-3 bg-primary/20 p-2 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Track Your Invites</h4>
              <p className="text-xs text-gray-400">
                See who has joined through your referral link in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}