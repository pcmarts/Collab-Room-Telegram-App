import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ReferralInfo {
  success: boolean;
  referral_code: string;
  total_available: number;
  total_used: number;
  remaining: number;
  shareable_link: string;
}

interface ReferralListResponse {
  success: boolean;
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

// Hook to get referral information
export function useReferrals() {
  const queryClient = useQueryClient();
  
  // Fetch user's referral code data
  const referralCodeQuery = useQuery<ReferralInfo>({
    queryKey: ['/api/referrals/my-code'],
    queryFn: async () => {
      return apiRequest('/api/referrals/my-code', 'GET');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
  
  // Fetch user's referred users
  const referredUsersQuery = useQuery<ReferralListResponse>({
    queryKey: ['/api/referrals/my-referrals'],
    queryFn: async () => {
      return apiRequest('/api/referrals/my-referrals', 'GET');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
  
  return {
    referralInfo: referralCodeQuery.data,
    referredUsers: referredUsersQuery.data?.referred_users || [],
    isLoading: referralCodeQuery.isLoading || referredUsersQuery.isLoading,
    isError: referralCodeQuery.isError || referredUsersQuery.isError,
    error: referralCodeQuery.error || referredUsersQuery.error,
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
      const result = await apiRequest('/api/referrals/validate', 'POST', {
        referral_code: code
      });
      return result as { success: boolean; referrer?: { first_name: string; last_name: string | null } };
    }
  });
}

// Hook to log referral activities
export function useLogReferralActivity() {
  return useMutation({
    mutationFn: async (data: { activity_type: 'share' | 'copy' | 'view' | 'generate'; details?: Record<string, any> }) => {
      return await apiRequest('/api/referrals/log-activity', 'POST', data);
    }
  });
}