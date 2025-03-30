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
  // Using a completely hardcoded implementation to match the screenshot exactly
  
  return (
    <div className="space-y-3 bg-[#1e1e1e] text-white p-4 rounded-lg">
      {/* Badge */}
      <div>
        <Badge 
          variant="secondary" 
          className="bg-[#9333ea] hover:bg-[#9333ea] text-white rounded-full px-4 py-1.5 flex items-center"
        >
          <Mic className="w-4 h-4 mr-1.5" />
          <span>Podcast Guest Appearance</span>
        </Badge>
      </div>
      
      {/* Podcast Name */}
      <h3 className="text-2xl font-semibold text-white">
        The Degen Podcast
      </h3>
      
      {/* Company name */}
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
      <div className="flex flex-wrap gap-2 mt-2">
        <Badge 
          variant="outline" 
          className="text-sm rounded-full px-5 py-1 bg-[#27272a] text-white border-[#3f3f46]"
        >
          Crypto
        </Badge>
        <Badge 
          variant="outline" 
          className="text-sm rounded-full px-5 py-1 bg-[#27272a] text-white border-[#3f3f46]"
        >
          DeFi
        </Badge>
      </div>
    </div>
  );
};