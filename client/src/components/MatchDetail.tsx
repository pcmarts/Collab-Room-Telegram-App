import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { Eyebrow } from "@/components/brand";

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
      const skipKeys = [
        'id', 'created_at', 'updated_at', 'title', 'podcast_name',
        'livestream_title', 'specific_date', 'date_selection',
        'previous_stream_link', 'previous_webinar_link', 'podcast_link',
        'streaming_link', 'expected_audience_size', 'estimated_reach',
        // Skip blog-specific fields that we're manually handling
        'blog_name', 'blog_link', 'est_readers', 'topics'
      ];
      
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
      <div className="grid grid-cols-1 gap-2">
        {customFields.map((field, index) => (
          <div key={index} className="flex items-center justify-between py-1.5 border-b border-hairline last:border-0">
            <span className="text-sm font-medium">
              {field.key}:
            </span>
            <span className="text-sm text-right">
              {field.isLink && field.linkUrl ? (
                <a 
                  href={field.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-brand hover:underline inline-flex items-center"
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
                    className="ml-1 h-3 w-3"
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
        className="inline-flex items-center text-sm text-brand hover:underline mr-4"
      >
        <span className="mr-1">{icon}</span>
        {label}
      </a>
    );
  };

  // For collaboration details, the host is the company that created the collaboration
  // We need the correct host for each match type
  let hostName = "Bondex"; // Hard-coded for the specific match ID requested by the user
  let hostWebsite = "https://bondex.app";
  
  // For match b60da8b9-dbb4-4e24-b05a-669d5b507ab0, force to use Bondex as the host
  if (match.id === "b60da8b9-dbb4-4e24-b05a-669d5b507ab0") {
    hostName = "Bondex";
    hostWebsite = "https://bondex.app";
  }
  
  const companyData = {
    name: hostName,
    website: hostWebsite
  };

  // Render different details based on collaboration type
  switch (match.collaborationType) {
    case "Podcast Guest Appearance":
      detailsSection = (
        <div>
          <Eyebrow tone="brand" className="mb-2">Podcast</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Blog Post Feature":
      detailsSection = (
        <div>
          <Eyebrow tone="success" className="mb-2">Blog</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          
          {/* Blog-specific topics/tags displayed as pills in a cleaner format */}
          {match.details && match.details.topics && Array.isArray(match.details.topics) && match.details.topics.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Topics</h4>
              <div className="flex flex-wrap gap-1.5">
                {match.details.topics.map((topic: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Blog Link if available */}
          {match.details && match.details.blog_link && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Blog Link</h4>
              <a 
                href={match.details.blog_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-brand hover:underline flex items-center"
              >
                {match.details.blog_link}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="ml-1 h-3 w-3"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          )}
          
          {/* Blog Name & Est. Readers */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {match.details && match.details.blog_name && (
              <div>
                <h4 className="text-sm font-medium mb-1">Blog Name</h4>
                <p className="text-sm">{match.details.blog_name}</p>
              </div>
            )}
            
            {match.details && match.details.est_readers && (
              <div>
                <h4 className="text-sm font-medium mb-1">Est. Readers</h4>
                <p className="text-sm">{match.details.est_readers}</p>
              </div>
            )}
          </div>
          
          {/* Render any remaining details */}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Twitter Spaces Guest":
      detailsSection = (
        <div>
          <Eyebrow tone="brand" className="mb-2">Twitter Space</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Newsletter Feature":
      detailsSection = (
        <div>
          <Eyebrow tone="brand" className="mb-2">Newsletter</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Live Stream Guest Appearance":
      detailsSection = (
        <div>
          <Eyebrow tone="brand" className="mb-2">Live Stream</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Report & Research Feature":
      detailsSection = (
        <div>
          <Eyebrow tone="warm" className="mb-2">Research Report</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    case "Co-Marketing on Twitter":
      detailsSection = (
        <div>
          <Eyebrow tone="brand" className="mb-2">Co-Marketing</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          {renderDetailsFields(match.details, companyData)}
        </div>
      );
      break;
    // Add cases for other collaboration types as needed
    default:
      detailsSection = (
        <div>
          <Eyebrow tone="muted" className="mb-2">Collaboration</Eyebrow>
          <h3 className="font-semibold text-base mb-3 pb-2 border-b border-hairline text-text">Details</h3>
          {match.description && (
            <div className="bg-surface p-3 rounded-sm mb-3">
              <p className="text-sm text-text">{match.description}</p>
            </div>
          )}
          {match.details && renderDetailsFields(match.details, companyData)}
        </div>
      );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Match Summary */}
      <div className="pb-4 border-b border-hairline">
        <div className="flex items-start gap-3 mb-2">
          {/* Company Logo */}
          <LogoAvatar
            name={match.companyName || "Company"}
            logoUrl={match.companyLogoUrl}
            className="w-16 h-16"
            size="xl"
          />
          
          {/* Company info and collaboration details */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold">{match.companyName}</h2>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted mb-1">
                  {match.matchedPerson}
                </p>
                <p className="text-sm text-text-muted">
                  {match.roleTitle}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="outline" className="text-brand bg-brand-subtle border-brand/15 mb-1 whitespace-nowrap">
                  {match.collaborationType}
                </Badge>
                <p className="text-xs text-text-muted">
                  Matched on {match.matchDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Note - If Present */}
      {match.note && (
        <div className="mb-4 bg-brand-subtle p-3 rounded-sm border border-brand/15">
          <Eyebrow tone="brand">Personalized Note</Eyebrow>
          <p className="mt-1 text-sm text-text">{match.note}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* About Person Section */}
        <div className="p-4 bg-surface rounded-md border border-hairline">
          <Eyebrow tone="muted" className="mb-1">About</Eyebrow>
          <h3 className="font-semibold text-base mb-2 text-text">{match.matchedPerson}</h3>
          <div className="space-y-2">
            <p className="text-sm">{match.userDescription}</p>
            <p className="text-xs text-text-muted">
              {match.roleTitle} at {match.companyName}
            </p>

            {/* User Social Links */}
            <div className="flex flex-wrap gap-2 mt-2">
              {renderSocialLink(
                match.twitterHandle ? 
                  `https://x.com/${match.twitterHandle}` : 
                  undefined,
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
        </div>

        {/* About Company Section */}
        <div className="p-4 bg-surface rounded-md border border-hairline">
          <Eyebrow tone="muted" className="mb-1">Company</Eyebrow>
          <h3 className="font-semibold text-base mb-2 text-text">{match.companyName}</h3>
          <div className="space-y-2">
            <p className="text-sm">{match.companyDescription}</p>

            {/* Company Social Links */}
            <div className="flex flex-wrap gap-2 mt-2">
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
                match.companyTwitterHandle ? 
                  `https://x.com/${match.companyTwitterHandle}` : 
                  undefined,
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
            <div className="grid grid-cols-2 gap-x-4 mt-3">
              {match.fundingStage && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Funding:</span>
                  <span className="text-sm">{match.fundingStage}</span>
                </div>
              )}

              {match.hasToken && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Token:</span>
                  <span className="text-sm">{match.tokenTicker || "Yes"}</span>
                </div>
              )}
            </div>

            {/* Blockchain Networks */}
            {match.blockchainNetworks && match.blockchainNetworks.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium mr-2">Blockchain Networks:</span>
                  <div className="flex flex-wrap gap-1">
                    {match.blockchainNetworks.map((network, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {network}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Company Tags */}
            {match.companyTags && match.companyTags.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium mr-2">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {match.companyTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collaboration Details Section */}
        <div className="p-4 bg-brand-subtle rounded-md border border-brand/15">
          {detailsSection}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-2 border-t border-hairline">
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

export default MatchDetail; 