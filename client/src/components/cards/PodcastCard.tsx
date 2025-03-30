import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";

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

// Helper function to get Twitter URL
const getTwitterUrl = (handle: string) => {
  if (!handle) return "";
  if (handle.startsWith("https://")) return handle;
  return `https://twitter.com/${handle.replace('@', '')}`;
};

export const PodcastCard: React.FC<PodcastCardProps> = ({ data }) => {
  console.log("PodcastCard received data:", data);
  
  // Handle data.details (JSON field)
  const details = data.details || {};
  console.log("PodcastCard details:", details);
  
  // Determine podcast name with fallbacks
  const podcastName = details.podcast_name || data.podcastName || "Podcast";
  
  // Determine description with fallbacks
  const description = details.short_description || 
                  details.podcast_description || 
                  data.shortDescription || 
                  data.description || 
                  "";
  
  // Determine reach with fallbacks
  const estimatedReach = details.estimated_reach || data.estimatedReach || "TBD";
  
  // Determine streaming link with fallbacks
  const streamingLink = details.podcast_link || data.streamingLink;
  
  // Determine twitter link
  const twitterHandle = details.company_twitter || data.companyTwitter || "";
  const twitterLink = getTwitterUrl(twitterHandle);
  
  // Determine company website link
  const companyWebsite = details.company_website || data.companyWebsite || "";
  
  // Determine date with fallbacks and format it
  const date = details.specific_date || details.date_selection || data.date || "";
  const dateDisplay = date ? new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : "";
  
  // Determine topics
  const topics = data.topics || 
                details.topics || 
                data.preferredTopics || 
                [];
                
  // Log the processed data
  console.log("PodcastCard processed data:", {
    podcastName,
    companyName: data.companyName,
    description,
    estimatedReach,
    streamingLink,
    twitterHandle,
    twitterLink,
    companyWebsite,
    dateDisplay,
    topics,
    fullData: data // Log the entire data object for debugging
  });

  return (
    <div className="space-y-3 bg-zinc-900 text-white p-4 rounded-lg">
      {/* Badge at the top - styled to match screenshot */}
      <div className="mb-2">
        <Badge variant="secondary" className="bg-[#9333ea] text-white rounded-full">
          <Mic className="w-4 h-4 mr-1" />
          <span>Podcast Guest Appearance</span>
        </Badge>
      </div>
      
      {/* Title - Podcast Name with streaming link */}
      <h3 className="text-xl font-semibold text-white">
        {streamingLink ? (
          <a 
            href={streamingLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            {podcastName || "Podcast Name"}
          </a>
        ) : (
          podcastName || "Podcast Name"
        )}
      </h3>
      
      {/* Company name with website or Twitter link */}
      <div className="text-sm text-white">
        {companyWebsite ? (
          <a 
            href={companyWebsite} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            {data.companyName}
          </a>
        ) : twitterLink ? (
          <a 
            href={twitterLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:underline"
          >
            {data.companyName}
          </a>
        ) : (
          data.companyName
        )}
      </div>
      
      {/* Short description */}
      <p className="text-sm text-gray-400">
        {description || "No description available"}
      </p>
      
      {/* Estimated reach */}
      {estimatedReach && (
        <div className="text-xs text-gray-400">
          Estimated reach: {estimatedReach}
        </div>
      )}
      
      {/* Date */}
      {dateDisplay && (
        <div className="text-xs text-gray-400">
          Date: {dateDisplay}
        </div>
      )}
      
      {/* Topics as pills */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {topics.map((topic, i) => (
            <Badge key={i} variant="outline" className="text-xs rounded-full px-3 bg-zinc-800 text-white border-zinc-700">
              {topic}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};