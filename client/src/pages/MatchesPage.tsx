import * as React from "react";
import { lazy, Suspense, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowButton } from "@/components/GlowButton";
import { MessageCircle, ChevronRight, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { getCollabTypeIcon } from "@/lib/collab-utils";
import { useMatchContext } from "@/contexts/MatchContext";
import { useLocation } from "wouter";
import { PageHeader } from "../components/PageHeader";
import { LogoAvatar } from "@/components/ui/logo-avatar";

// Define Match type for API response
interface Match {
  id: string;
  matchDate: string;
  status: string;
  collaborationType: string;
  description: string;
  details: any;
  matchedPerson: string;
  companyName: string;
  roleTitle: string;
  companyDescription?: string;
  userDescription?: string;
  username?: string; // Telegram username for chat links
  note?: string; // Personalized note from connection request

  // Additional user information
  linkedinUrl?: string;
  twitterUrl?: string;
  twitterHandle?: string;
  twitterFollowers?: string | number;
  email?: string;

  // Additional company information
  companyWebsite?: string;
  companyLinkedinUrl?: string;
  companyTwitterHandle?: string;
  companyTwitterFollowers?: string | number;
  companyLogoUrl?: string; // FIX: Add missing company logo URL field
  fundingStage?: string;
  hasToken?: boolean;
  tokenTicker?: string;
  blockchainNetworks?: string[];
  companyTags?: string[];
}

// Import Match Detail component lazily
const MatchDetail = lazy(() => import("@/components/MatchDetail"));

export default function MatchesPage() {
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const { newMatchCreated, refreshMatches } = useMatchContext();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isFirstRender, setIsFirstRender] = React.useState(true);
  
  // Immediately mark first render as complete to avoid any loading screens
  React.useEffect(() => {
    if (isFirstRender) {
      // Use requestAnimationFrame to update state right after browser paint
      requestAnimationFrame(() => setIsFirstRender(false));
    }
  }, [isFirstRender]);
  
  // Aggressively preload and cache data
  React.useEffect(() => {
    // Prefetch with highest priority
    const controller = new AbortController();
    const { signal } = controller;
    
    const prefetchWithPriority = async () => {
      try {
        // Create a timestamp for cache-busting
        const timestamp = new Date().getTime();
        
        // Fetch data with a timeout to prevent long-hanging requests
        const fetchPromise = apiRequest(`/api/matches?_=${timestamp}`);
        
        // Race the fetch with a timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Prefetch timeout')), 5000)
        );
        
        // Use Promise.race to implement a timeout
        const data = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Cache the successfully fetched data
        queryClient.setQueryData(['/api/matches'], data);
        console.log('Data prefetched and cached successfully');
      } catch (error) {
        if (!signal.aborted) {
          console.warn('Failed to prefetch matches data:', error);
        }
      }
    };
    
    // Start prefetching immediately
    prefetchWithPriority();
    
    // Clean up if component unmounts during prefetch
    return () => {
      controller.abort();
    };
  }, [queryClient]);

  // Optimized query with more aggressive caching and stale time
  const { 
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      try {
        console.log("⚡️ Fetching matches from API...");
        
        // Add cache-busting query parameter only once per request
        const timestamp = new Date().getTime();
        
        // Use standard apiRequest without signal
        const response = await apiRequest(`/api/matches?_=${timestamp}`);
        
        console.log(`⚡️ Found ${Array.isArray(response) ? response.length : 0} matches`);
        return response;
      } catch (err) {
        console.error("⚡️ Error fetching matches:", err);
        throw err;
      }
    },
    staleTime: 60 * 1000, // Keep data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30 * 1000),
    // Get data from cache immediately while updating in background
    placeholderData: (previousData) => previousData,
  });

  // Check if we have a new match created flag and refresh matches if needed
  React.useEffect(() => {
    if (newMatchCreated) {
      console.log("[MatchesPage] New match created, refreshing matches...");
      refreshMatches();
    }
  }, [newMatchCreated, refreshMatches]);

  // Apply scroll and style fixes - optimized to run only once
  React.useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    // Modify for this page to allow scrolling - apply all changes in a single batch
    requestAnimationFrame(() => {
      document.body.style.cssText = `
        overflow: auto;
        position: static;
        width: auto;
        height: auto;
      `;
      
      // Add scrollable-page class to html and body
      document.documentElement.classList.add("scrollable-page");
      document.body.classList.add("scrollable-page");
      
      // Also fix the root element
      const rootElement = document.getElementById("root");
      if (rootElement) {
        rootElement.style.cssText = `
          overflow: auto;
          height: auto;
          position: static;
          width: 100%;
        `;
      }
    });

    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove("scrollable-page");
      document.body.classList.remove("scrollable-page");
      
      const rootElement = document.getElementById("root");
      if (rootElement) {
        rootElement.style.overflow = "";
        rootElement.style.height = "";
        rootElement.style.position = "";
        rootElement.style.width = "";
      }
    };
  }, []);

  // Close the match detail dialog - memoized to prevent rerenders
  const handleCloseMatchDetail = useCallback(() => {
    setSelectedMatch(null);
  }, []);

  // Render Skeleton cards for loading state - memoized to improve performance
  const renderSkeletonCards = useMemo(() => (
    <div className="space-y-4 animate-fade-in">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <div className="p-4">
            <div className="flex flex-col mb-3 space-y-2">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48" />
                </div>
                <div className="flex items-center shrink-0">
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex justify-between gap-3 mt-3 pt-2 border-t border-border/50">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  ), []);

  // Render error message - memoized
  const renderErrorMessage = useMemo(() => (
    <Card className="p-6 m-4 text-center">
      <p className="text-muted-foreground mb-4">Error loading matches</p>
      <p className="text-sm text-destructive mb-4">
        {error instanceof Error ? error.message : "Unknown error"}
      </p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </Card>
  ), [error]);

  // Chat button handler - memoized
  const handleChatClick = useCallback((username: string | undefined) => {
    if (username) {
      window.open(`https://t.me/${username}`, "_blank");
    } else {
      alert("No Telegram username found for this contact");
    }
  }, []);

  // Pre-render the match cards with memoization to avoid unnecessary re-renders
  const matchCards = useMemo(() => {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No matches yet</p>
          <GlowButton onClick={() => setLocation("/discover")}>
            Start Discovering
          </GlowButton>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {matches.map((match) => (
          <Card key={match.id} className="overflow-visible">
            <div className="p-4">
              {/* Header with company logo, name and collaboration type */}
              <div className="flex items-start gap-3 mb-3">
                {/* Company Logo */}
                <LogoAvatar
                  name={match.companyName || "Company"}
                  logoUrl={match.companyLogoUrl}
                  className="w-12 h-12"
                  size="lg"
                />
                
                {/* Company name and collaboration type */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-base break-words pr-2">
                        {match.companyName}
                      </h3>
                    </div>
                    <div className="flex items-center shrink-0">
                      <div className="mr-1.5">
                        {getCollabTypeIcon(match.collaborationType)}
                      </div>
                      <Badge className="bg-primary/10 hover:bg-primary/15 text-primary border-0 whitespace-normal text-center">
                        {match.collaborationType}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact info - with full text visible */}
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-sm font-medium break-words">
                    {match.matchedPerson}
                  </p>
                  {match.roleTitle && (
                    <p className="text-sm text-muted-foreground break-words">
                      {match.roleTitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>Matched on {match.matchDate}</span>
                </div>
              </div>

              {/* Original note from collaboration request */}
              {match.note && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Original message:
                  </p>
                  <p className="text-sm break-words">
                    {match.note}
                  </p>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-between gap-3 mt-3 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMatch(match)}
                  className="flex-1"
                >
                  <Info className="w-4 h-4 mr-1.5" />
                  Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleChatClick(match.username)}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  Chat
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }, [matches, setLocation, handleChatClick]);

  // Determine what to render - show UI immediately without loading state for faster perception
  const content = error ? renderErrorMessage : 
                  (isLoading && !matches) ? renderSkeletonCards : 
                  matchCards;

  return (
    <div className="page-scrollable pb-20">
      <PageHeader title="My Matches" />

      <div className="px-4">
        {content}
      </div>

      {/* Match Detail Dialog with Suspense */}
      <Dialog
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedMatch
                ? `${selectedMatch.collaborationType} Details`
                : "Match Details"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detailed information about this collaboration match
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <Suspense fallback={
              <div className="flex justify-center items-center py-6">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <MatchDetail
                match={selectedMatch}
                onBack={handleCloseMatchDetail}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
