import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlowButton } from "@/components/GlowButton";
import { MessageCircle, ChevronRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { getCollabTypeIcon } from "@/lib/collab-utils";
import { useMatchContext } from "@/contexts/MatchContext";

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
  username?: string;     // Telegram username for chat links
}

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
}

function MatchDetail({ match, onBack }: MatchDetailProps) {
  let detailsSection;
  
  // Helper function to render details from the details object
  const renderDetailsFields = (details: any) => {
    if (!details) return null;
    
    return (
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(details).map(([key, value]) => {
          // Skip rendering certain keys that are already displayed elsewhere
          if (['id', 'created_at', 'updated_at'].includes(key)) return null;
          
          // Format the key for display
          const formattedKey = key
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          return (
            <div key={key} className="flex justify-between">
              <span className="text-sm text-muted-foreground">{formattedKey}:</span>
              <span className="text-sm font-medium">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render different details based on collaboration type
  switch (match.collaborationType) {
    case "Podcast Guest Appearance":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Podcast Details</h3>
          {renderDetailsFields(match.details)}
        </div>
      );
      break;
    case "Blog Post Feature":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Blog Details</h3>
          {renderDetailsFields(match.details)}
        </div>
      );
      break;
    case "Twitter Spaces Guest":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Twitter Space Details</h3>
          {renderDetailsFields(match.details)}
        </div>
      );
      break;
    case "Newsletter Feature":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Newsletter Details</h3>
          {renderDetailsFields(match.details)}
        </div>
      );
      break;
    case "Live Stream Guest Appearance":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Live Stream Details</h3>
          {renderDetailsFields(match.details)}
        </div>
      );
      break;
    case "Report & Research Feature":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Research Report Details</h3>
          {renderDetailsFields(match.details)}
        </div>
      );
      break;
    case "Co-Marketing on Twitter":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Twitter Co-Marketing Details</h3>
          {renderDetailsFields(match.details)}
        </div>
      );
      break;
    // Add cases for other collaboration types as needed
    default:
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Collaboration Details</h3>
          <p className="text-sm">{match.description}</p>
          {match.details && renderDetailsFields(match.details)}
        </div>
      );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{match.companyName}</h2>
          <p className="text-sm text-muted-foreground">{match.matchedPerson}, {match.roleTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">Matched on {match.matchDate}</p>
        </div>
        <Badge variant="outline" className="text-muted-foreground bg-transparent">{match.collaborationType}</Badge>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">About the Collaboration</h3>
          <p className="text-sm mt-1">{match.description}</p>
        </div>
        
        <div>
          <h3 className="font-medium">About {match.matchedPerson}</h3>
          <p className="text-sm mt-1">{match.userDescription}</p>
          <p className="text-xs text-muted-foreground mt-1">{match.roleTitle} at {match.companyName}</p>
        </div>
        
        <div>
          <h3 className="font-medium">About {match.companyName}</h3>
          <p className="text-sm mt-1">{match.companyDescription}</p>
        </div>
        
        {detailsSection}
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Matches
        </Button>
        <Button 
          onClick={() => {
            if (match.username) {
              window.open(`https://t.me/${match.username}`, '_blank');
            } else {
              alert('No Telegram username found for this contact');
            }
          }}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat
        </Button>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const { newMatchCreated, refreshMatches } = useMatchContext();
  
  // Fetch matches from API
  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['/api/matches'], 
    queryFn: async () => {
      try {
        // Add cache-busting query parameter only once per request
        const timestamp = new Date().getTime();
        
        // Direct use of queryClient's default queryFn which properly handles JSON parsing
        const response = await apiRequest(`/api/matches?_=${timestamp}`);
        return response;
      } catch (err) {
        console.error('Error fetching matches:', err);
        throw err;
      }
    },
    staleTime: 30000, // Keep data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1 // Only retry once to prevent infinite loops
  });
  
  // Check if we have a new match created flag and refresh matches if needed
  useEffect(() => {
    if (newMatchCreated) {
      console.log('[MatchesPage] New match created, refreshing matches...');
      refreshMatches();
    }
  }, [newMatchCreated, refreshMatches]);
  
  // This disables the default fixed positioning and overflow hidden
  // so that we can have a normal scrolling container with a scrollbar
  useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    // Modify for this page to allow scrolling
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
    
    // Add scrollable-page class to html and body
    document.documentElement.classList.add('scrollable-page');
    document.body.classList.add('scrollable-page');
    
    // Also fix the root element
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.style.overflow = 'auto';
      rootElement.style.height = 'auto';
      rootElement.style.position = 'static';
      rootElement.style.width = '100%';
    }
    
    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove('scrollable-page');
      document.body.classList.remove('scrollable-page');
      
      if (rootElement) {
        rootElement.style.overflow = '';
        rootElement.style.height = '';
        rootElement.style.position = '';
        rootElement.style.width = '';
      }
    };
  }, []);
  
  // Close the match detail dialog
  const handleCloseMatchDetail = () => {
    setSelectedMatch(null);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="page-scrollable pb-20">
        <h1 className="text-2xl font-bold p-6">My Matches</h1>
        <div className="px-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <CardFooter className="flex justify-between pt-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="page-scrollable pb-20">
        <h1 className="text-2xl font-bold p-6">My Matches</h1>
        <Card className="p-6 m-4 text-center">
          <p className="text-muted-foreground mb-4">Error loading matches</p>
          <p className="text-sm text-destructive mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="page-scrollable pb-20">
      <h1 className="text-2xl font-bold p-6">My Matches</h1>
      
      <div className="px-4">
        {matches && Array.isArray(matches) && matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{match.companyName}</CardTitle>
                      <CardDescription>{match.matchedPerson}, {match.roleTitle}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">Matched on {match.matchDate}</p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2">
                        {getCollabTypeIcon(match.collaborationType)}
                      </div>
                      <Badge variant="outline" className="text-muted-foreground bg-transparent">{match.collaborationType}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (match.username) {
                        window.open(`https://t.me/${match.username}`, '_blank');
                      } else {
                        alert('No Telegram username found for this contact');
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No matches yet</p>
            <GlowButton onClick={() => window.location.href = '/discover'}>
              Start Discovering
            </GlowButton>
          </Card>
        )}
      </div>
      
      {/* Match Detail Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">
              {selectedMatch ? `${selectedMatch.collaborationType} Details` : 'Match Details'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detailed information about this collaboration match
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && <MatchDetail match={selectedMatch} onBack={handleCloseMatchDetail} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}