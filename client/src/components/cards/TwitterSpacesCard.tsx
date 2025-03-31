import React from 'react';
import { Twitter, Calendar, Users } from "lucide-react";
import { FiExternalLink } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";

interface TwitterSpacesCardData {
  id?: string;
  companyName: string;
  companyWebsite?: string;  // Added company website field
  topic?: string;
  role?: string;
  hostHandle?: string;
  hostFollowerCount?: string;
  date?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    twitter_handle?: string;
    host_follower_count?: string;
    short_description?: string;
    topics?: string[];
    specific_date?: string;
    date_selection?: string;
    company_website?: string;  // Added company website in details
    [key: string]: any;
  };
}

interface TwitterSpacesCardProps {
  data: TwitterSpacesCardData;
}

export const TwitterSpacesCard: React.FC<TwitterSpacesCardProps> = ({ data }) => {
  const details = data.details || {};
  
  // Determine title/topic with fallbacks
  const title = details.short_description || data.topic || "Twitter Space";
  
  // Determine twitter handle with fallbacks
  const twitterHandle = details.twitter_handle 
    ? details.twitter_handle.replace('https://x.com/', '').replace('@', '')
    : (data.hostHandle || 'username').replace('@', '');
  
  // Format the full Twitter URL
  const twitterUrl = `https://twitter.com/${twitterHandle}`;
  
  // Determine follower count with fallbacks
  const followerCount = details.host_follower_count || data.hostFollowerCount || "0";

  // Determine company website with fallbacks
  const companyWebsite = details.company_website || data.companyWebsite;

  // Rendering helper for topics
  const renderTopics = () => {
    // First check for topics in main data
    if (data.topics && data.topics.length > 0) {
      return (
        <div className="flex flex-wrap gap-1 mb-1">
          {data.topics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      );
    }
    
    // Then check for preferredTopics (legacy support)
    if (data.preferredTopics && data.preferredTopics.length > 0) {
      return (
        <div className="flex flex-wrap gap-1 mb-1">
          {data.preferredTopics.map((topic, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      );
    }
    
    // Finally check for topics in details object
    if (details.topics && details.topics.length > 0) {
      return (
        <div className="flex flex-wrap gap-1 mb-1">
          {details.topics.map((topic: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      );
    }
    
    return null;
  };

  // Rendering helper for date
  const renderDate = () => {
    // First check primary date
    if (data.date) {
      return (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{data.date}</span>
        </div>
      );
    }
    
    // Then try to extract from details
    if (details) {
      const dateText = details.specific_date 
        ? details.specific_date 
        : details.date_selection === "specific_date" 
          ? "Date TBD" 
          : "Flexible date";
      
      return (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{dateText}</span>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <Badge variant="outline" className="bg-blue-500/10">
          <Twitter className="w-3 h-3 mr-1" />
          <span>Twitter Spaces</span>
        </Badge>
        {renderDate()}
      </div>
      
      <h3 className="text-lg font-semibold leading-snug">
        {companyWebsite ? (
          <a 
            href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline text-primary"
          >
            {data.companyName}
          </a>
        ) : (
          data.companyName
        )}
      </h3>
      
      <div className="space-y-0.5">
        <p className="text-sm">{title}</p>
        {data.role && (
          <p className="text-xs text-muted-foreground">
            {data.role}
          </p>
        )}
      </div>
      
      {renderTopics()}
      
      <div className="flex flex-col space-y-1 text-xs">
        <div className="flex items-center space-x-2">
          <Twitter className="w-3 h-3 text-primary" />
          <a 
            href={twitterUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline"
          >
            @{twitterHandle}
          </a>
        </div>
        
        <div className="flex items-center space-x-2">
          <Users className="w-3 h-3" />
          <span><strong>{followerCount}</strong> followers</span>
        </div>
        
        {twitterUrl && (
          <div className="flex items-center space-x-2 text-primary">
            <FiExternalLink className="w-3 h-3" />
            <a 
              href={twitterUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              View Twitter profile
            </a>
          </div>
        )}
      </div>
    </div>
  );
};