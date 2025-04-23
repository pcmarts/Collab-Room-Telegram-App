import { useQuery } from '@tanstack/react-query';
import { useReferrals } from '@/hooks/use-referrals';
import { useReferralCelebration } from '@/hooks/use-referral-celebration';
import { ReferralCard } from '@/components/referrals/ReferralCard';
import { ReferredUsersList } from '@/components/referrals/ReferredUsersList';
import { ReferralInfoPanel } from '@/components/referrals/ReferralInfoPanel';
import { ReferralSuccessCelebration } from '@/components/referrals/ReferralSuccessCelebration';
import { PageHeader } from '@/components/page-header';
import { Loader2 } from 'lucide-react';

// Define useProfile hook inline since it's having import issues
const useProfile = () => {
  return useQuery({
    queryKey: ['/api/profile'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
};

export default function ReferralsPage() {
  const { isLoading: isProfileLoading } = useProfile();
  const { referralInfo, referredUsers, isLoading, isError, error, refetch } = useReferrals();
  const { showCelebration, newUser, closeCelebration } = useReferralCelebration();
  
  if (isProfileLoading || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check if referrals are enabled/available
  const isReferralEnabled = !!referralInfo;
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Fixed header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 pt-4 pb-2">
        <PageHeader
          title="Invite Friends"
          description="Share your referral link to invite friends to The Collab Room"
        />
      </div>
      
      {/* Main scrollable content area */}
      <div className="overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        <div className="container max-w-md mx-auto px-4 pb-32 space-y-6">
          {/* Referral Card Component - this is always shown if referrals are enabled */}
          {isReferralEnabled && (
            <ReferralCard 
              referralInfo={referralInfo}
              isLoading={isLoading}
              error={error as Error}
            />
          )}
          
          {/* Info Panel - only shown when user has no referrals yet */}
          {isReferralEnabled && (!referredUsers || referredUsers.length === 0) && (
            <ReferralInfoPanel />
          )}
          
          {/* List of referred users */}
          {isReferralEnabled && (
            <ReferredUsersList 
              users={referredUsers}
              isLoading={isLoading}
            />
          )}
          
          {/* If referrals are not enabled, show a message */}
          {!isReferralEnabled && !isLoading && (
            <div className="p-8 bg-muted/30 rounded-lg text-center mt-8">
              <h3 className="font-medium text-lg mb-2">Referrals Coming Soon</h3>
              <p className="text-muted-foreground">
                The referral program will be available soon. 
                Check back later to invite your friends!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Success celebration dialog */}
      {newUser && referralInfo && (
        <ReferralSuccessCelebration 
          open={showCelebration}
          onOpenChange={closeCelebration}
          referralCode={referralInfo.referral_code}
          shareableLink={referralInfo.shareable_link}
        />
      )}
    </div>
  );
}