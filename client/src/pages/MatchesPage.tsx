import * as React from "react";
import { lazy, Suspense, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useMatchContext } from "@/contexts/MatchContext";
import { useLocation } from "wouter";
import { PageHeader } from "../components/PageHeader";
import { Eyebrow } from "@/components/brand";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { MessageCircle, Info, Linkedin, Twitter, Loader2 } from "lucide-react";

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
  username?: string;
  note?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  twitterHandle?: string;
  twitterFollowers?: string | number;
  email?: string;
  companyWebsite?: string;
  companyLinkedinUrl?: string;
  companyTwitterHandle?: string;
  companyTwitterFollowers?: string | number;
  companyLogoUrl?: string;
  fundingStage?: string;
  hasToken?: boolean;
  tokenTicker?: string;
  blockchainNetworks?: string[];
  companyTags?: string[];
}

const MatchDetail = lazy(() => import("@/components/MatchDetail"));

export default function MatchesPage() {
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const { newMatchCreated, refreshMatches } = useMatchContext();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: matches, isLoading, error } = useQuery({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const timestamp = new Date().getTime();
      return apiRequest(`/api/matches?_=${timestamp}`);
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attempt) => Math.min(attempt > 1 ? 2000 : 1000, 30 * 1000),
    placeholderData: (previousData) => previousData,
  });

  React.useEffect(() => {
    if (newMatchCreated) refreshMatches();
  }, [newMatchCreated, refreshMatches]);

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    requestAnimationFrame(() => {
      document.body.style.cssText = `
        overflow: auto;
        position: static;
        width: auto;
        height: auto;
      `;
      document.documentElement.classList.add("scrollable-page");
      document.body.classList.add("scrollable-page");
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

  const handleCloseMatchDetail = useCallback(() => setSelectedMatch(null), []);
  const handleChatClick = useCallback((username: string | undefined) => {
    if (username) window.open(`https://t.me/${username}`, "_blank");
  }, []);

  const skeletonRows = useMemo(
    () => (
      <div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 py-5 border-b border-hairline"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-32" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
    []
  );

  const errorState = useMemo(
    () => (
      <div className="py-12">
        <h3 className="text-lg font-semibold tracking-tight text-text">
          Couldn't load matches
        </h3>
        <p className="mt-1 text-sm text-text-muted">
          {error instanceof Error ? error.message : "Try again in a moment."}
        </p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    ),
    [error]
  );

  const content = useMemo(() => {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return (
        <div className="py-12">
          <Eyebrow tone="muted">Inbox</Eyebrow>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-text">
            No matches yet.
          </h3>
          <p className="mt-1 text-sm text-text-muted max-w-[42ch]">
            When a host accepts your request, you'll land here with a direct
            Telegram chat.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={() => setLocation("/discover")}
          >
            Browse opportunities
          </Button>
        </div>
      );
    }

    return (
      <div>
        {matches.map((match: Match) => (
          <article
            key={match.id}
            className="border-b border-hairline py-5 last:border-b-0"
          >
            <div className="flex items-start gap-3">
              <LogoAvatar
                name={match.companyName || "Company"}
                logoUrl={match.companyLogoUrl}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="truncate text-md font-semibold text-text">
                    {match.companyName}
                  </h3>
                  <span className="shrink-0 text-xs tabular text-text-subtle">
                    {match.matchDate}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-text-muted">
                  {match.collaborationType}
                </p>

                <div className="mt-2">
                  <p className="text-sm text-text">{match.matchedPerson}</p>
                  {match.roleTitle && (
                    <p className="text-sm text-text-muted">{match.roleTitle}</p>
                  )}
                  {(match.linkedinUrl || match.twitterUrl) && (
                    <div className="mt-1 flex items-center gap-4">
                      {match.linkedinUrl && (
                        <a
                          href={
                            match.linkedinUrl.startsWith("http")
                              ? match.linkedinUrl
                              : `https://${match.linkedinUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text"
                        >
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </a>
                      )}
                      {match.twitterUrl && (
                        <a
                          href={
                            match.twitterUrl.startsWith("http")
                              ? match.twitterUrl
                              : `https://${match.twitterUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text"
                        >
                          <Twitter className="h-3 w-3" />
                          Twitter
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {match.note && (
                  <blockquote className="mt-3 rounded-sm bg-surface px-3 py-2 text-sm text-text-muted">
                    <Eyebrow tone="muted">Message</Eyebrow>
                    <p className="mt-1 text-text">{match.note}</p>
                  </blockquote>
                )}

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedMatch(match)}
                    className="flex-1"
                  >
                    <Info className="h-4 w-4" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleChatClick(match.username)}
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Open chat
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }, [matches, setLocation, handleChatClick]);

  return (
    <div className="page-scrollable pb-20">
      <PageHeader title="Matches" />
      <div className="px-4 pt-2">
        {error ? errorState : isLoading && !matches ? skeletonRows : content}
      </div>

      <Dialog
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
            <Suspense
              fallback={
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
                </div>
              }
            >
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
