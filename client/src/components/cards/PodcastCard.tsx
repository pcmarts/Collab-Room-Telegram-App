import React from 'react';
import { Mic, Megaphone } from "lucide-react";
import { FiExternalLink } from "react-icons/fi";
import { BaseCollabCard } from './BaseCollabCard';

interface PodcastCardData {
  id?: string;
  companyName: string;
  title?: string;
  podcastName?: string;
  shortDescription?: string;
  description?: string;
  estimatedReach?: string;
  streamingLink?: string;
  date?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    podcast_name?: string;
    podcast_description?: string;
    podcast_link?: string;
    short_description?: string;
    estimated_reach?: string;
    topics?: string[];
    [key: string]: any;
  };
}

interface PodcastCardProps {
  data: PodcastCardData;
}

export const PodcastCard: React.FC<PodcastCardProps> = ({ data }) => {
  const details = data.details || {};
  
  // Determine title with fallbacks
  const title = details.podcast_name || data.podcastName || "Podcast";
  
  // Determine description with fallbacks
  const description = details.short_description || 
                    details.podcast_description || 
                    data.shortDescription || 
                    data.description || 
                    "";
  
  // Determine reach with fallbacks
  const estimatedReach = details.estimated_reach || data.estimatedReach || "TBD";
  
  // Determine link with fallbacks
  const streamingLink = details.podcast_link || data.streamingLink;
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<Mic className="w-3 h-3 mr-1" />}
      badgeText="Podcast Guest"
      badgeClass="bg-primary/10"
      title={title}
    >
      <div className="flex flex-col space-y-1 text-xs">
        <div className="flex items-center space-x-2">
          <Megaphone className="w-3 h-3" />
          <span>{estimatedReach}</span>
        </div>
        
        {streamingLink && (
          <div className="flex items-center space-x-2 text-primary">
            <FiExternalLink className="w-3 h-3" />
            <a 
              href={streamingLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              Listen to podcast
            </a>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {description}
          </p>
        )}
      </div>
    </BaseCollabCard>
  );
};