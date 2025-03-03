import { supabase } from '@shared/supabase';

export async function signInWithTelegram() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'telegram',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw error;
  }

  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}
