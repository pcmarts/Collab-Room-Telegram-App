import React from 'react';
import { BookOpen, Calendar, Megaphone } from "lucide-react";
import { FiExternalLink } from "react-icons/fi";
import { BaseCollabCard } from './BaseCollabCard';

interface NewsletterCardData {
  id?: string;
  companyName: string;
  newsletterName?: string;
  totalSubscribers?: string;
  newsletterUrl?: string;
  date?: string;
  description?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    newsletter_name?: string;
    subscribers_count?: string;
    newsletter_url?: string;
    specific_date?: string;
    date_selection?: string;
    short_description?: string;
    topics?: string[];
    [key: string]: any;
  };
}

interface NewsletterCardProps {
  data: NewsletterCardData;
}

export const NewsletterCard: React.FC<NewsletterCardProps> = ({ data }) => {
  const details = data.details || {};
  
  // Determine title with fallbacks
  const title = details.newsletter_name || data.newsletterName || "Newsletter";
  
  // Determine subscribers count with fallbacks
  const subscriberCount = details.subscribers_count || data.totalSubscribers || "TBD";
  
  // Determine newsletter url with fallbacks
  const newsletterUrl = details.newsletter_url || data.newsletterUrl;

  // Determine date with fallbacks
  const dateText = data.date || 
    (details.specific_date 
      ? details.specific_date 
      : details.date_selection === "specific_date" 
        ? "Date TBD" 
        : "Flexible date");
  
  // Determine description with fallbacks
  const description = details.short_description || data.description || "";
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<BookOpen className="w-3 h-3 mr-1" />}
      badgeText="Newsletter"
      badgeClass="bg-emerald-500/10"
      title={title}
    >
      <div className="flex flex-col space-y-1 text-xs">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Megaphone className="w-3 h-3" />
          <span>{subscriberCount}</span>
        </div>
        
        {newsletterUrl && (
          <div className="flex items-center space-x-2 text-primary">
            <FiExternalLink className="w-3 h-3" />
            <a 
              href={newsletterUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
            >
              View
            </a>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{dateText}</span>
        </div>
        
        {description && (
          <p className="mt-1 text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </BaseCollabCard>
  );
};