import React from 'react';
import { Video, Calendar } from "lucide-react";
import { FiExternalLink } from "react-icons/fi";
import { BaseCollabCard } from './BaseCollabCard';

interface LiveStreamCardData {
  id?: string;
  companyName: string;
  title?: string;
  expectedAudience?: string;
  previousWebinarLink?: string;
  date?: string;
  description?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    title?: string;
    expected_audience_size?: string;
    previous_stream_link?: string;
    short_description?: string;
    specific_date?: string;
    date_selection?: string;
    topics?: string[];
    [key: string]: any;
  };
}

interface LiveStreamCardProps {
  data: LiveStreamCardData;
}

export const LiveStreamCard: React.FC<LiveStreamCardProps> = ({ data }) => {
  const details = data.details || {};
  
  // Determine title with fallbacks
  const title = details.title || data.title || "Live Stream";
  
  // Determine audience size with fallbacks
  const audienceSize = details.expected_audience_size || data.expectedAudience || "TBD";
  
  // Determine previous stream link with fallbacks
  const streamLink = details.previous_stream_link || data.previousWebinarLink;
  
  // Determine description with fallbacks
  const description = details.short_description || data.description || "";
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<Video className="w-3 h-3 mr-1" />}
      badgeText="Live Stream"
      badgeClass="bg-red-500/10"
      title={title}
    >
      <div className="flex flex-col space-y-1 text-xs">
        <p className="text-muted-foreground">
          {audienceSize}
        </p>
        
        {streamLink && (
          <div className="flex items-center space-x-2 text-primary">
            <FiExternalLink className="w-3 h-3" />
            <a 
              href={streamLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              Previous
            </a>
          </div>
        )}
        
        {description && (
          <p className="text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        )}
      </div>
    </BaseCollabCard>
  );
};