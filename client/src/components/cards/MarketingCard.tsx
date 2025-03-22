import React from 'react';
import { Megaphone } from "lucide-react";
import { BaseCollabCard } from './BaseCollabCard';

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
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<Megaphone className="w-3 h-3 mr-1" />}
      badgeText={type}
      badgeClass="bg-primary/10"
      title={title}
    >
      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {description}
        </p>
      )}
    </BaseCollabCard>
  );
};