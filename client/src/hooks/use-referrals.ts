import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ReferralInfo {
  referral_code: string;
  total_available: number;
  total_used: number;
  remaining: number;
  referred_users: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
    handle: string;
    created_at: string;
  }>;
}

// Hook to get referral information and referred users
export function useReferrals() {
  const queryClient = useQueryClient();
  
  // Fetch user's referral data
  const referralQuery = useQuery<ReferralInfo>({
    queryKey: ['/api/referrals/my-code'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
  
  // Fetch user's referrals list
  const referralsListQuery = useQuery<ReferralInfo>({
    queryKey: ['/api/referrals/my-referrals'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
  
  return {
    referralInfo: referralQuery.data,
    referredUsers: referralsListQuery.data?.referred_users || [],
    isLoading: referralQuery.isLoading || referralsListQuery.isLoading,
    isError: referralQuery.isError || referralsListQuery.isError,
    error: referralQuery.error || referralsListQuery.error,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/my-code'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/my-referrals'] });
    }
  };
}

// Hook to validate a referral code
export function useValidateReferralCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest(`/api/referrals/validate/${code}`, {
        method: 'GET'
      });
    }
  });
}

// Hook to use a referral code
export function useReferralCode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { referral_code: string, user_id: string }) => {
      return await apiRequest('/api/referrals/use-code', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    }
  });
}