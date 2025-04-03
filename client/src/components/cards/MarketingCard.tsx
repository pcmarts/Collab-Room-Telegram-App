import React from 'react';
import { Megaphone, Calendar, Twitter, Users, BarChart } from "lucide-react";
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
    twitter_handle?: string;
    twitter_followers?: number;
    twitter_engagement_rate?: string;
    expected_reach?: string;
    campaign_duration?: string;
    tweet_frequency?: string;
    hashtags?: string[];
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
    // First check for campaign duration in twitter details
    if (type.toLowerCase().includes('twitter') && details.campaign_duration) {
      return (
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Campaign: {details.campaign_duration}</span>
        </div>
      );
    }
    
    // Check primary date
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

  // Rendering helper for Twitter specific details
  const renderTwitterDetails = () => {
    if (!type.toLowerCase().includes('twitter')) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {details.twitter_handle && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Twitter className="w-3 h-3 text-[#1DA1F2]" />
            <span>@{details.twitter_handle}</span>
          </div>
        )}
        
        {details.twitter_followers && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{Number(details.twitter_followers).toLocaleString()} followers</span>
          </div>
        )}
        
        {details.twitter_engagement_rate && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <BarChart className="w-3 h-3" />
            <span>{details.twitter_engagement_rate} engagement</span>
          </div>
        )}
        
        {details.expected_reach && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Megaphone className="w-3 h-3" />
            <span>Est. reach: {details.expected_reach}</span>
          </div>
        )}
        
        {details.tweet_frequency && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Frequency: {details.tweet_frequency}</span>
          </div>
        )}
      </div>
    );
  };

  // Rendering helper for hashtags
  const renderHashtags = () => {
    if (!type.toLowerCase().includes('twitter') || !details.hashtags || details.hashtags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mb-1">
        {details.hashtags.map((hashtag: string, i: number) => (
          <Badge key={i} variant="outline" className="text-xs text-[#1DA1F2] border-[#1DA1F2]/30">
            #{hashtag}
          </Badge>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className={`${type.toLowerCase().includes('twitter') ? 'bg-[#1DA1F2]/10' : 'bg-primary/10'}`}>
        {type.toLowerCase().includes('twitter') ? 
          <Twitter className="w-3 h-3 mr-1 text-[#1DA1F2]" /> : 
          <Megaphone className="w-3 h-3 mr-1" />
        }
        <span>{type}</span>
      </Badge>
      
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
      
      {renderTopics()}
      {renderHashtags()}
      {renderDate()}
      {renderTwitterDetails()}
      
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};