import { useLocation } from "wouter";
import {
  Calendar,
  ExternalLink,
  Globe,
  Linkedin,
  Twitter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";

interface CollaborationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCollaboration?: () => void;
  onShowSignupDialog?: () => void;
  currentUserId?: string;
  isAuthenticated?: boolean;
  isUserApproved?: boolean;
  collaboration?: {
    id?: string;
    title?: string;
    collab_type?: string;
    description?: string;
    date?: string;
    date_type?: string;
    specific_date?: string;
    topics?: string[];
    companyName?: string;
    company_logo_url?: string;
    creator_id?: string;
    status?: string;
    twitter_followers?: string;
    company_twitter_followers?: string;
    funding_stage?: string;
    company_tags?: string[];
    requestStatus?: "pending" | "matched" | "hidden" | "skipped" | null;
    company_data?: {
      name?: string;
      short_description?: string;
      long_description?: string;
      twitter_handle?: string;
      twitter_followers?: string;
      website?: string;
      linkedin_url?: string;
      funding_stage?: string;
      has_token?: boolean;
      token_ticker?: string;
      blockchain_networks?: string[];
      job_title?: string;
      tags?: string[];
      logo_url?: string;
    };
    details?: Record<string, any>;
    isPotentialMatch?: boolean;
    potentialMatchData?: {
      user_id?: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
      job_title?: string;
      note?: string;
    };
    type?: string;
    collaboration?: {
      id?: string;
      title?: string;
      collab_type?: string;
      description?: string;
      date?: string;
      date_type?: string;
      specific_date?: string;
      topics?: string[];
      creator_id?: string;
      details?: Record<string, any>;
      creator_company_name?: string;
    };
  };
}

// Keys in the generic `details` object that are either handled elsewhere
// (rendered as typed fields above) or intentionally hidden from the user.
const HANDLED_DETAIL_KEYS = new Set([
  "twittercomarketing_type",
  "host_twitter_handle",
  "host_follower_count",
  "podcast_name",
  "podcast_url",
  "episode_duration",
  "podcast_audience_size",
  "platform",
  "stream_url",
  "stream_duration",
  "report_type",
  "publication_name",
  "date_type",
  "specific_date",
  "estimated_release_date",
]);

function formatDetailLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDetailValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function isExternalUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

export function CollaborationDetailsDialog({
  isOpen,
  onClose,
  onRequestCollaboration,
  onShowSignupDialog,
  currentUserId,
  isAuthenticated = false,
  isUserApproved = true,
  collaboration,
}: CollaborationDetailsDialogProps) {
  const [, setLocation] = useLocation();

  if (!collaboration) return null;

  // For potential matches, fields may be nested one level deep.
  const collabData = collaboration.isPotentialMatch && collaboration.collaboration
    ? {
        ...collaboration,
        title: collaboration.collaboration.title || collaboration.title,
        description:
          collaboration.collaboration.description || collaboration.description,
        collab_type:
          collaboration.collaboration.collab_type || collaboration.collab_type,
        topics: collaboration.collaboration.topics || collaboration.topics,
        details: collaboration.collaboration.details || collaboration.details,
      }
    : collaboration;

  const collabType = collabData.collab_type || "Collaboration";
  const title = collabData.title && collabData.title !== collabType
    ? collabData.title
    : collabType;
  const description = collabData.description?.trim() || "";
  const topics = collabData.topics || [];
  const companyData = collabData.company_data || {};
  const details = collabData.details || {};
  const potentialMatchData = collabData.potentialMatchData || {};

  const companyName =
    potentialMatchData.company_name ||
    companyData.name ||
    collaboration.companyName ||
    "Unknown Company";

  const isOwnCollaboration = Boolean(
    isAuthenticated &&
      currentUserId &&
      (collabData.creator_id === currentUserId ||
        collaboration.collaboration?.creator_id === currentUserId),
  );

  // --- Date ---
  const dateDisplay: string | null = (() => {
    if (collabData.date_type === "specific_date" && collabData.specific_date) {
      return new Date(collabData.specific_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (collabData.date_type === "any_future_date") return "Any future date";
    if (collabData.date_type) return "To be discussed";
    return null;
  })();

  // --- Requirements ---
  const hasRequirements = Boolean(
    collabData.twitter_followers ||
      collabData.company_twitter_followers ||
      collabData.funding_stage ||
      (collabData.company_tags && collabData.company_tags.length > 0),
  );

  // --- Type-specific details (cherry-picked + generic fallback) ---
  const typedDetailRows: { label: string; value: React.ReactNode }[] = [];

  if (collabType.includes("Twitter")) {
    if (details.twittercomarketing_type) {
      typedDetailRows.push({
        label: "Co-marketing",
        value: formatDetailValue(details.twittercomarketing_type),
      });
    }
    if (details.host_twitter_handle) {
      typedDetailRows.push({
        label: "Host",
        value: (
          <a
            href={details.host_twitter_handle}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            {details.host_twitter_handle}
          </a>
        ),
      });
    }
    if (details.host_follower_count) {
      typedDetailRows.push({
        label: "Host followers",
        value: details.host_follower_count,
      });
    }
  }

  if (collabType.includes("Podcast")) {
    if (details.podcast_name) {
      typedDetailRows.push({
        label: "Podcast",
        value: details.podcast_url ? (
          <a
            href={details.podcast_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand hover:underline"
          >
            {details.podcast_name}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          details.podcast_name
        ),
      });
    }
    if (details.episode_duration) {
      typedDetailRows.push({
        label: "Duration",
        value: details.episode_duration,
      });
    }
    if (details.podcast_audience_size) {
      typedDetailRows.push({
        label: "Audience",
        value: details.podcast_audience_size,
      });
    }
  }

  if (collabType.includes("Live Stream")) {
    if (details.platform) {
      typedDetailRows.push({
        label: "Platform",
        value: details.stream_url ? (
          <a
            href={details.stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-brand hover:underline"
          >
            {details.platform}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          details.platform
        ),
      });
    }
    if (details.stream_duration) {
      typedDetailRows.push({
        label: "Duration",
        value: details.stream_duration,
      });
    }
  }

  if (collabType.includes("Report")) {
    if (details.report_type) {
      typedDetailRows.push({
        label: "Type",
        value: details.report_type,
      });
    }
    if (details.publication_name) {
      typedDetailRows.push({
        label: "Publication",
        value: details.publication_name,
      });
    }
  }

  // Generic fallback for anything not yet handled
  Object.entries(details).forEach(([key, value]) => {
    if (HANDLED_DETAIL_KEYS.has(key)) return;
    if (!value || (Array.isArray(value) && value.length === 0)) return;
    typedDetailRows.push({
      label: formatDetailLabel(key),
      value: isExternalUrl(value) ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand hover:underline"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        formatDetailValue(value)
      ),
    });
  });

  // --- Primary CTA state ---
  const requestStatus = collaboration.requestStatus;
  const ctaDisabled =
    isOwnCollaboration ||
    (!isUserApproved && isAuthenticated) ||
    requestStatus === "pending" ||
    requestStatus === "matched";

  const ctaLabel = (() => {
    if (isOwnCollaboration) return "Your collab";
    if (!isUserApproved && isAuthenticated) return "Application in review";
    if (requestStatus === "pending") return "Request sent";
    if (requestStatus === "matched") return "Open chat";
    return "Request to collab";
  })();

  const handlePrimary = () => {
    if (ctaDisabled && requestStatus !== "matched") return;
    if (requestStatus === "matched") {
      onClose();
      setLocation("/matches");
      return;
    }
    if (!isAuthenticated) {
      if (onShowSignupDialog) {
        onShowSignupDialog();
        onClose();
      }
      return;
    }
    if (onRequestCollaboration) {
      onRequestCollaboration();
      onClose();
    }
  };

  // --- Twitter URL normalization ---
  const twitterHref = companyData.twitter_handle
    ? companyData.twitter_handle.startsWith("https://")
      ? companyData.twitter_handle
      : `https://x.com/${companyData.twitter_handle.replace("@", "")}`
    : null;

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="full"
      eyebrow={collabType.toUpperCase()}
      title={title}
      subtitle={companyName}
      bodyClassName="px-5 py-5 pb-8"
      footer={
        <BottomSheet.ActionBar>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {!isOwnCollaboration && (
            <Button
              onClick={handlePrimary}
              disabled={
                ctaDisabled && requestStatus !== "matched"
              }
              aria-label={`${ctaLabel} — ${companyName}`}
            >
              {ctaLabel}
            </Button>
          )}
        </BottomSheet.ActionBar>
      }
    >
      {/* Company card — the one place a boundary earns its place */}
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4">
        <LogoAvatar
          name={companyName}
          logoUrl={collaboration.company_logo_url || companyData.logo_url}
          className="h-12 w-12 shrink-0"
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-tight text-text">
            {companyName}
          </p>
          {companyData.short_description ? (
            <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-text-muted">
              {companyData.short_description}
            </p>
          ) : null}
          <CompanyLinks
            websiteUrl={companyData.website}
            twitterUrl={twitterHref}
            linkedinUrl={companyData.linkedin_url}
          />
        </div>
      </div>

      {/* Personalized note — only for potential-match context */}
      {collabData.isPotentialMatch && potentialMatchData.note ? (
        <BottomSheet.Section eyebrow="Personalized note">
          <blockquote className="border-l-2 border-brand pl-3 text-[0.9375rem] italic text-text">
            {potentialMatchData.note}
          </blockquote>
        </BottomSheet.Section>
      ) : null}

      {description ? (
        <BottomSheet.Section eyebrow="About">
          <p className="text-[0.9375rem] leading-relaxed text-text">
            {description}
          </p>
        </BottomSheet.Section>
      ) : null}

      {dateDisplay ? (
        <BottomSheet.Section
          eyebrow={
            collabType.toLowerCase().includes("report")
              ? "Release"
              : "When"
          }
        >
          <p className="inline-flex items-center gap-2 text-[0.9375rem] text-text">
            <Calendar className="h-4 w-4 text-text-muted" />
            {dateDisplay}
          </p>
        </BottomSheet.Section>
      ) : null}

      {topics.length > 0 ? (
        <BottomSheet.Section eyebrow="Topics">
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic, i) => (
              <Badge
                key={`${topic}-${i}`}
                variant="outline"
                className="px-2 py-0.5 text-xs"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </BottomSheet.Section>
      ) : null}

      {hasRequirements ? (
        <BottomSheet.Section eyebrow="Requirements">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.9375rem]">
            {collabData.twitter_followers ? (
              <DetailRow label="Your Twitter">
                {collabData.twitter_followers}
              </DetailRow>
            ) : null}
            {collabData.company_twitter_followers ? (
              <DetailRow label="Company Twitter">
                {collabData.company_twitter_followers}
              </DetailRow>
            ) : null}
            {collabData.funding_stage ? (
              <DetailRow label="Funding">
                {collabData.funding_stage}
              </DetailRow>
            ) : null}
            {collabData.company_tags && collabData.company_tags.length > 0 ? (
              <DetailRow label="Sectors">
                <div className="flex flex-wrap gap-1.5">
                  {collabData.company_tags.map((tag, i) => (
                    <Badge
                      key={`${tag}-${i}`}
                      variant="outline"
                      className="px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </DetailRow>
            ) : null}
          </dl>
        </BottomSheet.Section>
      ) : null}

      {typedDetailRows.length > 0 ? (
        <BottomSheet.Section eyebrow="Details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.9375rem]">
            {typedDetailRows.map((row, i) => (
              <DetailRow key={`${row.label}-${i}`} label={row.label}>
                {row.value}
              </DetailRow>
            ))}
          </dl>
        </BottomSheet.Section>
      ) : null}

      {companyData.long_description &&
      companyData.long_description !== companyData.short_description ? (
        <BottomSheet.Section eyebrow={`About ${companyName}`}>
          <p className="text-[0.9375rem] leading-relaxed text-text">
            {companyData.long_description}
          </p>
        </BottomSheet.Section>
      ) : null}

      {collabData.status && collabData.status !== "active" ? (
        <BottomSheet.Section eyebrow="Status">
          <Badge
            variant="secondary"
            className="px-2.5 py-0.5 text-xs capitalize"
          >
            {collabData.status}
          </Badge>
        </BottomSheet.Section>
      ) : null}
    </BottomSheet>
  );
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <>
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-[0.9375rem] text-text">{children}</dd>
    </>
  );
}

interface CompanyLinksProps {
  websiteUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
}

function CompanyLinks({
  websiteUrl,
  twitterUrl,
  linkedinUrl,
}: CompanyLinksProps) {
  const links: { href: string; label: string; Icon: typeof Globe }[] = [];
  if (websiteUrl) links.push({ href: websiteUrl, label: "Website", Icon: Globe });
  if (twitterUrl) links.push({ href: twitterUrl, label: "Twitter", Icon: Twitter });
  if (linkedinUrl)
    links.push({ href: linkedinUrl, label: "LinkedIn", Icon: Linkedin });

  if (links.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
      {links.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-brand"
        >
          <Icon className="h-3 w-3" />
          {label}
        </a>
      ))}
    </div>
  );
}
