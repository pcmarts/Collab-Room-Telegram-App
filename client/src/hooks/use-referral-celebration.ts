import { useState, useEffect, useCallback } from 'react';
import { useReferrals } from './use-referrals';

interface ReferredUser {
  id: string;
  first_name: string;
  last_name: string | null;
  handle: string;
  created_at: string;
}

/**
 * Hook to manage referral celebration state
 * 
 * This hook checks for newly joined users and can trigger a 
 * celebration popup when someone joins via the user's referral link.
 */
export function useReferralCelebration() {
  const { referredUsers, isLoading } = useReferrals();
  const [previousUsers, setPreviousUsers] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newUser, setNewUser] = useState<ReferredUser | null>(null);

  // Check for new referrals when users list updates
  useEffect(() => {
    if (isLoading || !referredUsers?.length) return;

    // Get current user IDs
    const currentUserIds = referredUsers.map(user => user.id);
    
    // If we have previous IDs to compare with
    if (previousUsers.length > 0) {
      // Find new users (not in previous list)
      const newUserIds = currentUserIds.filter(id => !previousUsers.includes(id));
      
      if (newUserIds.length > 0) {
        // We have new users! Find the most recent one to celebrate
        const mostRecentUser = [...referredUsers]
          .filter(user => newUserIds.includes(user.id))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (mostRecentUser) {
          setNewUser(mostRecentUser);
          setShowCelebration(true);
          
          // Log this event locally to prevent duplicate celebrations on reload
          try {
            localStorage.setItem(`celebrated_${mostRecentUser.id}`, 'true');
          } catch (e) {
            console.warn('Failed to save celebration state to localStorage', e);
          }
        }
      }
    }
    
    // Update previous users for next comparison
    setPreviousUsers(currentUserIds);
  }, [isLoading, referredUsers, previousUsers]);

  // Function to manually close the celebration modal
  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
  }, []);

  return {
    showCelebration,
    newUser,
    closeCelebration
  };
}