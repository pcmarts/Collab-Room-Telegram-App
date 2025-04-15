import * as React from "react";
import { useEffect, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { getCollabTypeIcon } from "@/lib/collab-utils";
import { useMatchContext } from "@/contexts/MatchContext";
import { useLocation } from "wouter";

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
  fundingStage?: string;
  hasToken?: boolean;
  tokenTicker?: string;
  blockchainNetworks?: string[];
  companyTags?: string[];
}

interface MatchDetailProps {
  match: Match;
  onBack: () => void;
}

function MatchDetail({ match, onBack }: MatchDetailProps) {
  let detailsSection;

  // Helper function to format common field types
  const formatFieldValue = (key: string, value: any) => {
    // Format date fields to be more user-friendly
    if (key.includes('date') && typeof value === 'string') {
      if (value === 'any_future_date') {
        return 'Any date in the future';
      } else if (value.includes('_')) {
        return value.replace(/_/g, ' ');
      }
      return value;
    }
    return String(value);
  };

  // Define a type for our field structure
  interface DetailField {
    key: string;
    value: string;
    isLink?: boolean;
    linkUrl?: string;
  }

  // Helper function to render details from the details object
  const renderDetailsFields = (details: any, companyData?: any) => {
    if (!details) return null;
    
    // Extract important values first
    const host = companyData?.name;
    const hostWebsite = companyData?.website;
    
    // Special handling for the livestream/podcast links
    const streamLink = details.previous_stream_link || details.previous_webinar_link || 
                        details.podcast_link || details.streaming_link;
    
    // Combine date fields into a single entry
    let dateInfo: DetailField | null = null;
    if (details.specific_date && details.date_selection) {
      // If we have both specific date and date selection, use specific date if it's specific
      dateInfo = details.specific_date !== 'TBD' ? 
                 { key: 'Date', value: details.specific_date } : 
                 { key: 'Date', value: formatFieldValue('date_selection', details.date_selection) };
    } else if (details.specific_date) {
      dateInfo = { key: 'Date', value: formatFieldValue('specific_date', details.specific_date) };
    } else if (details.date_selection) {
      dateInfo = { key: 'Date', value: formatFieldValue('date_selection', details.date_selection) };
    }

    // Create a custom ordered list of fields to display
    const customFields: DetailField[] = [];
    
    // Add host if available
    if (host) {
      customFields.push({
        key: 'Host',
        value: host,
        isLink: !!hostWebsite,
        linkUrl: hostWebsite
      });
    }
    
    // Add title if available (podcast name, livestream title, etc.)
    if (details.title || details.podcast_name || details.livestream_title) {
      customFields.push({
        key: 'Title',
        value: String(details.title || details.podcast_name || details.livestream_title)
      });
    }
    
    // Add date if available
    if (dateInfo) {
      customFields.push(dateInfo);
    }
    
    // Add stream/podcast link if available
    if (streamLink) {
      customFields.push({
        key: details.podcast_link ? 'Podcast Link' : 'Previous Stream',
        value: 'View',
        isLink: true,
        linkUrl: streamLink
      });
    }
    
    // Add audience size if available
    if (details.expected_audience_size || details.estimated_reach) {
      customFields.push({
        key: 'Audience Size',
        value: String(details.expected_audience_size || details.estimated_reach)
      });
    }
    
    // Add remaining fields that weren't handled specially
    Object.entries(details).forEach(([key, value]) => {
      // Skip keys we've already processed or don't want to show
      const skipKeys = ['id', 'created_at', 'updated_at', 'title', 'podcast_name',
                        'livestream_title', 'specific_date', 'date_selection',
                        'previous_stream_link', 'previous_webinar_link', 'podcast_link',
                        'streaming_link', 'expected_audience_size', 'estimated_reach'];
      
      if (!skipKeys.includes(key) && value) {
        // Format the key for display
        const formattedKey = key
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        
        customFields.push({
          key: formattedKey,
          value: formatFieldValue(key, value)
        });
      }
    });

    return (
      <div className="grid grid-cols-1 gap-3">
        {customFields.map((field, index) => (
          <div key={index} className="border-b border-muted pb-2">
            <span className="text-sm font-medium block mb-1">
              {field.key}:
            </span>
            <span className="text-sm block">
              {field.isLink && field.linkUrl ? (
                <a 
                  href={field.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline inline-flex items-center"
                >
                  {field.value}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="ml-1 h-4 w-4"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              ) : (
                field.value
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render a social link if available
  const renderSocialLink = (
    url: string | undefined | null,
    label: string,
    icon: JSX.Element,
  ) => {
    if (!url) return null;

    return (
      <a
        href={url.startsWith("http") ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-primary hover:underline mr-4"
      >
        <span className="mr-1">{icon}</span>
        {label}
      </a>
    );
  };

  // For collaboration details, the host is the company that created the collaboration,
  // not the current user's company (which is stored in match.companyName)
  // In the case of matches, we're looking at someone else's collaboration, not our own
  const companyData = {
    name: match.details?.host_company || match.details?.company_name || match.companyName,
    website: match.details?.company_website || match.companyWebsite
  };

  // Render different details based on collaboration type
  switch (match.collaborationType) {
    case "Podcast Guest Appearance":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Podcast Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Blog Post Feature":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Blog Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Twitter Spaces Guest":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Twitter Space Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Newsletter Feature":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Newsletter Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Live Stream Guest Appearance":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Live Stream Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Report & Research Feature":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Research Report Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Co-Marketing on Twitter":
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Twitter Co-Marketing Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    // Add cases for other collaboration types as needed
    default:
      detailsSection = (
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Collaboration Details</h3>
          {match.description && (
            <div className="bg-muted/30 p-3 rounded-md mb-3">
              <p className="text-sm">{match.description}</p>
            </div>
          )}
          {match.details && renderDetailsFields(match.details, companyData)}
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{match.companyName}</h2>
          <p className="text-sm text-muted-foreground">
            {match.matchedPerson}, {match.roleTitle}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Matched on {match.matchDate}
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-muted-foreground bg-transparent"
        >
          {match.collaborationType}
        </Badge>
      </div>

      <div className="space-y-4">
             {match.note && (
          <div className="bg-primary/5 p-3 rounded-md border border-primary/10">
            <h3 className="font-medium text-sm text-primary mb-1">
              Personalized Note
            </h3>
            <p className="text-sm italic">{match.note}</p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-medium">About {match.matchedPerson}</h3>
          <p className="text-sm">{match.userDescription}</p>
          <p className="text-xs text-muted-foreground">
            {match.roleTitle} at {match.companyName}
          </p>

          {/* User Social Links */}
          <div className="flex flex-wrap mt-2">
            {renderSocialLink(
              match.twitterHandle ||
                (match.twitterHandle &&
                  `https://twitter.com/${match.twitterHandle}`),
              match.twitterHandle ? `@${match.twitterHandle}` : "Twitter",
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>,
            )}

            {renderSocialLink(
              match.linkedinUrl,
              "LinkedIn",
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>,
            )}

            {renderSocialLink(
              match.email && `mailto:${match.email}`,
              match.email || "",
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>,
            )}

            {renderSocialLink(
              match.username && `https://t.me/${match.username}`,
              `@${match.username || ""}`,
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.846 1.467 1.618 2.92 2.286 4.48.613.141 1.026-.367 1.294-.653.343-.322.685-.777.273-1.344-1.103-1.56-3.105-4.015-3.516-4.769 2.686-1.702 5.573-3.493 8.139-5.191 1.231-.607 2.223 1.038.483 1.653-3.537 1.119-7.905 4.27-9.109 5.868 2.512.662 4.428 1.289 6.563 1.846.958.237 1.656-.515 1.832-1.15.059-.307.126-.875-.191-1.344-1.218-1.686-3.704-4.91-4.144-5.766 2.239-.756 4.649-1.572 6.979-2.358 2.003-.656 4.157-1.498 5.428-1.873.146-.519.092-1.084-.267-1.544z"
                  fill="currentColor"
                ></path>
              </svg>,
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">About {match.companyName}</h3>
          <p className="text-sm">{match.companyDescription}</p>

          {/* Company Social Links */}
          <div className="flex flex-wrap mt-2">
            {renderSocialLink(
              match.companyWebsite,
              "Website",
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>,
            )}

            {renderSocialLink(
              match.companyTwitterHandle &&
                `https://twitter.com/${match.companyTwitterHandle}`,
              match.companyTwitterHandle
                ? `@${match.companyTwitterHandle}`
                : "Twitter",
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>,
            )}


            {renderSocialLink(
              match.companyLinkedinUrl,
              "LinkedIn",
              <svg
                className="w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>,
            )}
          </div>

          {/* Additional Company Information */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {match.fundingStage && (
              <div className="col-span-1">
                <span className="text-xs text-muted-foreground">
                  Funding Stage:
                </span>
                <p className="text-sm font-medium">{match.fundingStage}</p>
              </div>
            )}

            {match.hasToken && (
              <div className="col-span-1">
                <span className="text-xs text-muted-foreground">Token:</span>
                <p className="text-sm font-medium">
                  {match.tokenTicker || "Yes"}
                </p>
              </div>
            )}
          </div>

          {/* Blockchain Networks */}
          {match.blockchainNetworks && match.blockchainNetworks.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground block mb-1">
                Blockchain Networks:
              </span>
              <div className="flex flex-wrap gap-1">
                {match.blockchainNetworks.map((network, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {network}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Company Tags */}
          {match.companyTags && match.companyTags.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-muted-foreground block mb-1">
                Company Tags:
              </span>
              <div className="flex flex-wrap gap-1">
                {match.companyTags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
              window.open(`https://t.me/${match.username}`, "_blank");
            } else {
              alert("No Telegram username found for this contact");
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
  const [, setLocation] = useLocation();

  // Fetch matches from API
  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      try {
        // Add cache-busting query parameter only once per request
        const timestamp = new Date().getTime();

        // Direct use of queryClient's default queryFn which properly handles JSON parsing
        const response = await apiRequest(`/api/matches?_=${timestamp}`);
        return response;
      } catch (err) {
        console.error("Error fetching matches:", err);
        throw err;
      }
    },
    staleTime: 30000, // Keep data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1, // Only retry once to prevent infinite loops
  });

  // Check if we have a new match created flag and refresh matches if needed
  useEffect(() => {
    if (newMatchCreated) {
      console.log("[MatchesPage] New match created, refreshing matches...");
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
    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.width = "auto";
    document.body.style.height = "auto";

    // Add scrollable-page class to html and body
    document.documentElement.classList.add("scrollable-page");
    document.body.classList.add("scrollable-page");

    // Also fix the root element
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.overflow = "auto";
      rootElement.style.height = "auto";
      rootElement.style.position = "static";
      rootElement.style.width = "100%";
    }

    // Restore original style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove("scrollable-page");
      document.body.classList.remove("scrollable-page");

      if (rootElement) {
        rootElement.style.overflow = "";
        rootElement.style.height = "";
        rootElement.style.position = "";
        rootElement.style.width = "";
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
          <p className="text-sm text-destructive mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
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
                      <CardTitle className="text-lg">
                        {match.companyName}
                      </CardTitle>
                      <CardDescription>
                        {match.matchedPerson}, {match.roleTitle}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        Matched on {match.matchDate}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-2">
                        {getCollabTypeIcon(match.collaborationType)}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground bg-transparent"
                      >
                        {match.collaborationType}
                      </Badge>
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
                        window.open(`https://t.me/${match.username}`, "_blank");
                      } else {
                        alert("No Telegram username found for this contact");
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
            <GlowButton onClick={() => setLocation("/discover")}>
              Start Discovering
            </GlowButton>
          </Card>
        )}
      </div>

      {/* Match Detail Dialog */}
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
            <MatchDetail
              match={selectedMatch}
              onBack={handleCloseMatchDetail}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
