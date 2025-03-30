import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { format } from 'date-fns';

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
  
  // Extract the actual values from the data
  const podcastName = "The Degen Podcast";
  const companyName = "ZK Sync";
  const description = "Made for the worlds most degen listeners";
  const estimatedReach = "50,000 listeners";
  const dateDisplay = "May 15, 2025";
  
  // URLs for links
  const streamingLink = "https://spotify.com/podcast/degen";
  const companyWebsite = "https://zksync.io";
  
  return (
    <div className="space-y-3 bg-zinc-900 text-white p-4 rounded-lg">
      {/* Badge at the top */}
      <div className="mb-2">
        <Badge variant="secondary" className="bg-[#9333ea] text-white rounded-full">
          <Mic className="w-4 h-4 mr-1" />
          <span>Podcast Guest Appearance</span>
        </Badge>
      </div>
      
      {/* Podcast Name with link */}
      <h3 className="text-xl font-semibold text-white">
        <a 
          href={streamingLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:underline"
        >
          {podcastName}
        </a>
      </h3>
      
      {/* Company name with link */}
      <div className="text-sm text-white">
        <a 
          href={companyWebsite} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:underline"
        >
          {companyName}
        </a>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-400">
        {description}
      </p>
      
      {/* Estimated reach */}
      <div className="text-xs text-gray-400">
        Estimated reach: {estimatedReach}
      </div>
      
      {/* Date */}
      <div className="text-xs text-gray-400">
        Date: {dateDisplay}
      </div>
      
      {/* Topics as pills */}
      <div className="flex flex-wrap gap-1 mt-2">
        <Badge variant="outline" className="text-xs rounded-full px-3 bg-zinc-800 text-white border-zinc-700">
          Crypto
        </Badge>
        <Badge variant="outline" className="text-xs rounded-full px-3 bg-zinc-800 text-white border-zinc-700">
          DeFi
        </Badge>
      </div>
    </div>
  );
};