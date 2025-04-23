import { useProfile } from '@/hooks/use-profile';
import { useReferrals } from '@/hooks/use-referrals';
import { ReferralCard } from '@/components/referrals/ReferralCard';
import { ReferredUsersList } from '@/components/referrals/ReferredUsersList';
import { PageHeader } from '@/components/page-header';
import { Loader2 } from 'lucide-react';

export default function ReferralsPage() {
  const { isLoading: isProfileLoading } = useProfile();
  const { referralInfo, referredUsers, isLoading, isError, error, refetch } = useReferrals();
  
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
        
        <ReferredUsersList 
          users={referredUsers}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}