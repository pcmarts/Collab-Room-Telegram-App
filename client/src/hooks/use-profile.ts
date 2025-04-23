import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  first_name: string;
  last_name: string | null;
  handle: string;
  email: string | null;
  telegram_id: string;
  twitter_url: string | null;
  linkedin_url: string | null;
  bio: string | null;
  role: string;
  status: string;
  created_at: Date;
}

interface Company {
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  twitter_handle: string | null;
  linkedin_url: string | null;
  description: string | null;
  sector: string | null;
  company_size: string | null;
  funding_stage: string | null;
  token_status: string | null;
  token_ticker: string | null;
  token_type: string | null;
  founder_type: string | null;
  created_at: Date;
}

interface ProfileData {
  user: User;
  company: Company;
}

export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}