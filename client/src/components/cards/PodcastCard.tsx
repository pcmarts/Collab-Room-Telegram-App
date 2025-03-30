import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { format, isValid } from 'date-fns';

export interface PodcastCardProps {
  data: {
    id?: string;
    companyName: string;
    details?: {
      podcast_name?: string;
      podcast_description?: string;
      short_description?: string;
      estimated_reach?: string;
      podcast_link?: string;
      specific_date?: string;
      date_selection?: string;
      topics?: string[];
      company_twitter?: string;
      company_website?: string;
    };
    podcastName?: string;
    shortDescription?: string;
    description?: string;
    estimatedReach?: string;
    streamingLink?: string;
    date?: string;
    topics?: string[];
    preferredTopics?: string[];
    companyTwitter?: string;
    companyWebsite?: string;
    title?: string; // Added for compatibility
  };
}

export const PodcastCard: React.FC<PodcastCardProps> = ({ data }) => {
  console.log("PodcastCard data:", data);
  
  // Extract data from the details object or fall back to main properties
  const details = data.details || {};
  
  // Extract podcast name with fallbacks
  const podcastName = details.podcast_name || data.podcastName || data.title || "Podcast";
  
  // Extract company name
  const companyName = data.companyName || "Company";
  
  // Extract description with fallbacks
  const description = details.short_description || 
                      details.podcast_description || 
                      data.shortDescription || 
                      data.description || 
                      "No description available";
  
  // Extract estimated reach
  const estimatedReach = details.estimated_reach || data.estimatedReach || "TBD";
  
  // Format date if available and valid
  const date = details.specific_date || details.date_selection || data.date || "";
  let dateDisplay = "TBD";
  if (date) {
    const dateObj = new Date(date);
    if (isValid(dateObj)) {
      dateDisplay = format(dateObj, 'MMMM dd, yyyy');
    }
  }
  
  // Extract URLs for links
  const streamingLink = details.podcast_link || data.streamingLink || "";
  
  // Handle company website or twitter fallback
  const companyWebsite = details.company_website || data.companyWebsite || "";
  
  // Get Twitter URL if no website is available
  const twitterHandle = details.company_twitter || data.companyTwitter || "";
  let twitterUrl = "";
  if (twitterHandle) {
    twitterUrl = twitterHandle.startsWith("https://") 
      ? twitterHandle 
      : `https://twitter.com/${twitterHandle.replace('@', '')}`;
  }
  
  // Extract topics with fallbacks
  const topics = details.topics || data.topics || data.preferredTopics || [];
  
  return (
    <div className="space-y-3 bg-zinc-900 text-white p-4 rounded-lg">
      {/* Badge at the top */}
      <div className="mb-2">
        <Badge variant="secondary" className="bg-[#9333ea] text-white rounded-full">
          <Mic className="w-4 h-4 mr-1" />
          <span>Podcast Guest Appearance</span>
        </Badge>
      </div>
      
      {/* Podcast Name with conditional link */}
      <h3 className="text-xl font-semibold text-white">
        {streamingLink ? (
          <a 
            href={streamingLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            {podcastName}
          </a>
        ) : (
          podcastName
        )}
      </h3>
      
      {/* Company name with link to website or Twitter */}
      <div className="text-sm text-white">
        {companyWebsite ? (
          <a 
            href={companyWebsite} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            {companyName}
          </a>
        ) : twitterUrl ? (
          <a 
            href={twitterUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            {companyName}
          </a>
        ) : (
          companyName
        )}
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-400">
        {description}
      </p>
      
      {/* Estimated reach - only show if available */}
      {estimatedReach && estimatedReach !== "TBD" && (
        <div className="text-xs text-gray-400">
          Estimated reach: {estimatedReach}
        </div>
      )}
      
      {/* Date - only show if available */}
      {dateDisplay && dateDisplay !== "TBD" && (
        <div className="text-xs text-gray-400">
          Date: {dateDisplay}
        </div>
      )}
      
      {/* Topics as pills */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {topics.map((topic, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs rounded-full px-3 bg-zinc-800 text-white border-zinc-700"
            >
              {topic}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};