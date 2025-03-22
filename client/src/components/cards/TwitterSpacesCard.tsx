import React from 'react';
import { Twitter, Calendar } from "lucide-react";
import { BaseCollabCard } from './BaseCollabCard';

interface TwitterSpacesCardData {
  id?: string;
  companyName: string;
  topic?: string;
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
    ? details.twitter_handle.replace('https://x.com/', '')
    : (data.hostHandle || 'username');
  
  // Determine follower count with fallbacks
  const followerCount = details.host_follower_count || data.hostFollowerCount || "0";
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<Twitter className="w-3 h-3 mr-1" />}
      badgeText="Twitter Spaces"
      badgeClass="bg-blue-500/10"
      title={title}
    >
      <div className="flex items-center space-x-1 text-primary">
        <Twitter className="w-3 h-3" />
        <span>@{twitterHandle}</span>
      </div>
      <p className="text-xs text-muted-foreground">{followerCount} followers</p>
    </BaseCollabCard>
  );
};