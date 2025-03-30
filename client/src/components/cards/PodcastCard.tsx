import React from 'react';
import { Mic, Megaphone, Calendar, Twitter } from "lucide-react";
import { FiExternalLink } from "react-icons/fi";
import { FaTwitter } from "react-icons/fa";
import { BaseCollabCard } from './BaseCollabCard';
import { Badge } from "@/components/ui/badge";

interface PodcastCardData {
  id?: string;
  companyName: string;
  companyTwitter?: string;
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
  console.log("PodcastCard received data:", data);
  console.log("PodcastCard details:", typeof data.details, data.details);
  
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
  
  // Determine twitter link with fallbacks
  const twitterLink = details.company_twitter || 
                      data.companyTwitter || 
                      (data.details && (data as any).details.twitter_handle) || 
                      "";
  
  // Determine date with fallbacks
  const dateDisplay = details.date || data.date || (details.specific_date ? details.specific_date : "");
  
  // Determine topics
  const topics = data.topics || 
                details.topics || 
                data.preferredTopics || 
                [];
  
  return (
    <div className="space-y-3">
      {/* Badge at the top */}
      <div className="mb-2">
        <Badge variant="secondary" className="bg-primary/20 text-primary dark:text-white dark:bg-primary/50">
          <Mic className="w-4 h-4 mr-1" />
          <span>Podcast Guest Appearance</span>
        </Badge>
      </div>
      
      {/* Title - Podcast Name with streaming link */}
      <h3 className="text-xl font-semibold">
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
      
      {/* Company name with Twitter link */}
      <div className="text-sm">
        {twitterLink ? (
          <a 
            href={twitterLink.startsWith('https://') ? twitterLink : `https://twitter.com/${twitterLink.replace('@', '')}`}
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
      
      {/* Short description directly below company */}
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {/* Topics as pills */}
      {topics && topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {topics.map((topic, i) => (
            <Badge key={i} variant="outline" className="text-xs rounded-full px-3 bg-background/50">
              {topic}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};