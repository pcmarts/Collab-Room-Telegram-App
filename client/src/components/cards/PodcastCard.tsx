import React from 'react';
import { Mic, Megaphone, Calendar } from "lucide-react";
import { FiExternalLink } from "react-icons/fi";
import { FaTwitter } from "react-icons/fa";
import { BaseCollabCard } from './BaseCollabCard';
import { Badge } from "@/components/ui/badge";

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
    company_twitter?: string;
    date?: string;
    topics?: string[];
    [key: string]: any;
  };
}

interface PodcastCardProps {
  data: PodcastCardData;
}

export const PodcastCard: React.FC<PodcastCardProps> = ({ data }) => {
  const details = data.details || {};
  
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
  const twitterLink = details.company_twitter || "";
  
  // Determine date with fallbacks
  const dateDisplay = details.date || data.date || (details.specific_date ? details.specific_date : "");
  
  // Determine topics
  const topics = data.topics || 
                details.topics || 
                data.preferredTopics || 
                [];
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<Mic className="w-3 h-3 mr-1" />}
      badgeText="Podcast Guest Appearance"
      badgeClass="bg-primary/10"
      title={podcastName}
    >
      {/* Short description shown directly after the title */}
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}
      
      <div className="flex flex-col space-y-2 text-xs">
        {/* Company name with Twitter link */}
        <div className="flex items-center space-x-1">
          {twitterLink ? (
            <a 
              href={twitterLink.startsWith('https://') ? twitterLink : `https://twitter.com/${twitterLink.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center"
            >
              {data.companyName} <FaTwitter className="w-3 h-3 ml-1" />
            </a>
          ) : (
            <span>{data.companyName}</span>
          )}
        </div>
        
        {/* Estimated reach */}
        <div className="flex items-center space-x-2">
          <Megaphone className="w-3 h-3" />
          <span>Est. Reach: {estimatedReach}</span>
        </div>
        
        {/* Date if available */}
        {dateDisplay && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>{dateDisplay}</span>
          </div>
        )}
        
        {/* Streaming link */}
        {streamingLink && (
          <div className="flex items-center space-x-2 text-primary">
            <FiExternalLink className="w-3 h-3" />
            <a 
              href={streamingLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              {streamingLink.includes('spotify') ? 'Listen on Spotify' : 
               streamingLink.includes('youtube') ? 'Watch on YouTube' : 'Listen to podcast'}
            </a>
          </div>
        )}
      </div>
      
      {/* Topics as pills at the bottom */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {topics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      )}
    </BaseCollabCard>
  );
};