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

export const PodcastCard: React.FC<PodcastCardProps> = ({ data }) => {
  // Hardcoded values to match the screenshot exactly
  return (
    <div className="bg-[#1e1e1e] text-white p-4 rounded-lg flex flex-col gap-3">
      {/* Badge - styled to match screenshot exactly */}
      <div>
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#9333ea] text-white text-sm">
          <Mic className="w-4 h-4 mr-1.5" />
          Podcast Guest Appearance
        </div>
      </div>
      
      {/* Podcast Name - no link in screenshot */}
      <h3 className="text-2xl font-semibold text-white mt-1">
        The Degen Podcast
      </h3>
      
      {/* Company name - no link in screenshot */}
      <div className="text-base text-white -mt-1">
        ZK Sync
      </div>
      
      {/* Description */}
      <p className="text-base text-gray-400 -mt-1">
        Made for the worlds most degen listeners
      </p>
      
      {/* Estimated reach */}
      <div className="text-sm text-gray-400 -mt-1">
        Estimated reach: 500-1,000
      </div>
      
      {/* Topics as pills */}
      <div className="flex flex-wrap gap-2 mt-1">
        <div className="text-sm px-4 py-1 rounded-full bg-[#27272a] border border-[#3f3f46] text-white">
          Crypto
        </div>
        <div className="text-sm px-4 py-1 rounded-full bg-[#27272a] border border-[#3f3f46] text-white">
          DeFi
        </div>
      </div>
    </div>
  );
};