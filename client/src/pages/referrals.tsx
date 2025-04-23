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
  
  return (
    <div className="container max-w-md mx-auto px-4 py-6">
      <PageHeader
        title="Invite Friends"
        description="Share your referral link to invite friends to The Collab Room"
      />
      
      <div className="space-y-6 mt-8">
        <ReferralCard 
          referralInfo={referralInfo}
          isLoading={isLoading}
          error={error as Error}
        />
        
        {/* Only show the info panel if the user has no referrals yet */}
        {(!referredUsers || referredUsers.length === 0) && (
          <ReferralInfoPanel />
        )}
        
        <ReferredUsersList 
          users={referredUsers}
          isLoading={isLoading}
        />
      </div>

      {/* Success celebration dialog */}
      {newUser && (
        <ReferralSuccessCelebration 
          isOpen={showCelebration}
          onClose={closeCelebration}
          userName={`${newUser.first_name} ${newUser.last_name || ''}`}
        />
      )}
    </div>
  );
}