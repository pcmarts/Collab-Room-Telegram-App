import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiRequest";

/**
 * Hook to preload discovery page data in the background
 * This hook can be used during app initialization to preload data
 * before the user navigates to the discovery page
 */
export function usePreloadDiscovery() {
  const queryClient = useQueryClient();
  const [preloadStatus, setPreloadStatus] = useState<{
    swipes: "idle" | "loading" | "success" | "error";
    potentialMatches: "idle" | "loading" | "success" | "error";
    collaborations: "idle" | "loading" | "success" | "error";
  }>({
    swipes: "idle",
    potentialMatches: "idle",
    collaborations: "idle",
  });

  const [isComplete, setIsComplete] = useState(false);

  // Preload user swipe history
  useEffect(() => {
    const preloadSwipeHistory = async () => {
      try {
        console.log("[Preload] Starting to preload user swipe history...");
        setPreloadStatus(prev => ({ ...prev, swipes: "loading" }));
        
        // Preload the swipe history data into the query cache
        await queryClient.prefetchQuery({
          queryKey: ['/api/user-swipes'],
          queryFn: async () => {
            try {
              console.log('[Preload] Fetching user swipe history...');
              const data = await apiRequest('/api/user-swipes');
              console.log(`[Preload] User swipe history fetched, count: ${data.length}`);
              return data;
            } catch (err) {
              console.error('[Preload] User swipe history fetch error:', err);
              throw err;
            }
          },
          staleTime: Infinity, // Never consider data stale to prevent auto-refresh
        });
        
        setPreloadStatus(prev => ({ ...prev, swipes: "success" }));
      } catch (error) {
        console.error("[Preload] Error preloading swipe history:", error);
        setPreloadStatus(prev => ({ ...prev, swipes: "error" }));
      }
    };

    preloadSwipeHistory();
  }, [queryClient]);

  // Preload potential matches
  useEffect(() => {
    const preloadPotentialMatches = async () => {
      try {
        console.log("[Preload] Starting to preload potential matches...");
        setPreloadStatus(prev => ({ ...prev, potentialMatches: "loading" }));
        
        // Preload the potential matches data into the query cache
        await queryClient.prefetchQuery({
          queryKey: ['/api/potential-matches'],
          queryFn: async () => {
            try {
              console.log('[Preload] Fetching potential matches...');
              const data = await apiRequest('/api/potential-matches');
              console.log(`[Preload] Potential matches fetched, count: ${data.length}`);
              return data;
            } catch (err) {
              console.error('[Preload] Potential matches fetch error:', err);
              throw err;
            }
          },
          staleTime: Infinity, // Never consider data stale to prevent auto-refresh
        });
        
        setPreloadStatus(prev => ({ ...prev, potentialMatches: "success" }));
      } catch (error) {
        console.error("[Preload] Error preloading potential matches:", error);
        setPreloadStatus(prev => ({ ...prev, potentialMatches: "error" }));
      }
    };

    preloadPotentialMatches();
  }, [queryClient]);

  // Preload collaboration cards
  useEffect(() => {
    const preloadCollaborations = async () => {
      try {
        console.log("[Preload] Starting to preload collaboration cards...");
        setPreloadStatus(prev => ({ ...prev, collaborations: "loading" }));
        
        // Create the request body with empty excludeIds array
        const requestBody = { excludeIds: [] };
        
        // Preload collaboration cards with a POST request
        await queryClient.prefetchQuery({
          queryKey: ['/api/collaborations/search', requestBody],
          queryFn: async () => {
            try {
              console.log('[Preload] Fetching initial collaboration cards...');
              const data = await apiRequest('/api/collaborations/search?limit=10', 'POST', requestBody);
              console.log(`[Preload] Collaboration cards fetched, count: ${data?.items?.length || 0}`);
              return data;
            } catch (err) {
              console.error('[Preload] Collaboration cards fetch error:', err);
              throw err;
            }
          },
          staleTime: Infinity, // Never consider data stale to prevent auto-refresh
        });
        
        setPreloadStatus(prev => ({ ...prev, collaborations: "success" }));
      } catch (error) {
        console.error("[Preload] Error preloading collaborations:", error);
        setPreloadStatus(prev => ({ ...prev, collaborations: "error" }));
      }
    };

    preloadCollaborations();
  }, [queryClient]);

  // Check if preloading is complete
  useEffect(() => {
    const isAllComplete = 
      (preloadStatus.swipes === "success" || preloadStatus.swipes === "error") &&
      (preloadStatus.potentialMatches === "success" || preloadStatus.potentialMatches === "error") &&
      (preloadStatus.collaborations === "success" || preloadStatus.collaborations === "error");
    
    if (isAllComplete && !isComplete) {
      console.log("[Preload] All discovery data preloading complete", preloadStatus);
      setIsComplete(true);
    }
  }, [preloadStatus, isComplete]);

  return { 
    preloadStatus,
    isComplete,
    // Include more detailed data if any preloads completed successfully
    hasSuccessful: 
      preloadStatus.swipes === "success" || 
      preloadStatus.potentialMatches === "success" || 
      preloadStatus.collaborations === "success"
  };
}