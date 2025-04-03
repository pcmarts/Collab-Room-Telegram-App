import React from 'react';
import { Megaphone, Calendar, Twitter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MarketingCardData {
  id?: string;
  companyName: string;
  title?: string;
  type?: string;
  collaborationType?: string;
  description?: string;
  role?: string;
  date?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    title?: string;
    short_description?: string;
    role?: string;
    specific_date?: string;
    date_selection?: string;
    topics?: string[];
    // Twitter co-marketing specific fields
    host_twitter_handle?: string;
    host_follower_count?: string;
    twittercomarketing_type?: string[];
    [key: string]: any;
  };
}

interface MarketingCardProps {
  data: MarketingCardData;
}

export const MarketingCard: React.FC<MarketingCardProps> = ({ data }) => {
  const details = data.details || {};
  
  // Determine title with fallbacks
  const title = details.title || data.title || "Collaboration Opportunity";
  
  // Determine type with fallbacks
  const type = data.type || data.collaborationType || "Collaboration";
  
  // Determine description with fallbacks
  const description = details.short_description || data.description || "";
  
  // Determine role with fallbacks
  const role = details.role || data.role || "";
  
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
    if (details.specific_date || details.date_selection) {
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
  
  // Helper for Twitter information
  const renderTwitterInfo = () => {
    if (details.host_twitter_handle) {
      // Extract username from Twitter URL if needed
      const username = details.host_twitter_handle.includes('x.com/') 
        ? details.host_twitter_handle.split('/').pop() 
        : details.host_twitter_handle.includes('twitter.com/')
          ? details.host_twitter_handle.split('/').pop()
          : details.host_twitter_handle.replace('@', '');
        
      return (
        <div className="flex flex-col space-y-2 mt-2 mb-2 p-2 bg-blue-500/5 rounded-md border border-blue-500/10">
          {username && (
            <div className="flex items-center space-x-1.5">
              <Twitter className="w-4 h-4 text-[#1DA1F2]" />
              <span className="text-sm font-medium text-[#1DA1F2]">@{username}</span>
            </div>
          )}
          {details.host_follower_count && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{details.host_follower_count}</span> followers
            </p>
          )}
          {details.twittercomarketing_type && details.twittercomarketing_type.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {details.twittercomarketing_type.map((marketingType, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-700">
                  {marketingType}
                </Badge>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Determine if this is a Twitter co-marketing card based on details
  const isTwitterCoMarketing = 
    // Check if it has Twitter handle in the details
    (details.host_twitter_handle) || 
    // Or check common Twitter collaboration types
    (type.toLowerCase().includes('twitter') && type.toLowerCase().includes('co-marketing')) ||
    (type.toLowerCase().includes('twitter') && type.toLowerCase().includes('comarketing')) ||
    // Or check if it has Twitter co-marketing type info
    (details.twittercomarketing_type && details.twittercomarketing_type.length > 0);

  return (
    <div className="space-y-2">
      {isTwitterCoMarketing ? (
        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-[#1DA1F2] p-1.5">
          <Twitter className="w-3.5 h-3.5 mr-1.5" />
          <span>Twitter Co-Marketing</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-primary/10">
          <Megaphone className="w-3 h-3 mr-1" />
          <span>{type}</span>
        </Badge>
      )}
      
      <h3 className="text-lg font-semibold leading-snug">
        {title}
      </h3>
      
      <div className="space-y-0.5">
        <p className="text-sm">{data.companyName}</p>
        {role && (
          <p className="text-xs text-muted-foreground">
            {role}
          </p>
        )}
      </div>
      
      {isTwitterCoMarketing ? renderTwitterInfo() : null}
      {renderTopics()}
      {renderDate()}
      
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};