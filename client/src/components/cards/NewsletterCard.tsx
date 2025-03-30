import React from 'react';
import { BookOpen, Calendar, Megaphone } from "lucide-react";
import { FiExternalLink } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";

interface NewsletterCardData {
  id?: string;
  companyName: string;
  newsletterName?: string;
  totalSubscribers?: string;
  newsletterUrl?: string;
  date?: string;
  role?: string;
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
  
  return (
    <div className="space-y-2">
      <Badge variant="outline" className="bg-emerald-500/10">
        <BookOpen className="w-3 h-3 mr-1" />
        <span>Newsletter</span>
      </Badge>
      
      <h3 className="text-lg font-semibold leading-snug">
        {title}
      </h3>
      
      <div className="space-y-0.5">
        <p className="text-sm">{data.companyName}</p>
        {data.role && (
          <p className="text-xs text-muted-foreground">
            {data.role}
          </p>
        )}
      </div>
      
      {renderTopics()}
      
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
    </div>
  );
};