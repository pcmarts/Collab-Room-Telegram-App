import React from 'react';
import { FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlogPostCardData {
  id?: string;
  companyName: string;
  title?: string;
  blogTitle?: string;
  role?: string;
  publicationDate?: string;
  date?: string;
  description?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    blog_title?: string;
    role?: string;
    publication_date?: string;
    specific_date?: string;
    date_selection?: string;
    short_description?: string;
    topics?: string[];
    [key: string]: any;
  };
}

interface BlogPostCardProps {
  data: BlogPostCardData;
}

export const BlogPostCollabCard: React.FC<BlogPostCardProps> = ({ data }) => {
  const details = data.details || {};
  
  // Determine title with fallbacks
  const title = details.blog_title || data.blogTitle || "Guest Blog Opportunity";
  
  // Determine role with fallbacks
  const role = details.role || data.role || "";
  
  // Determine publication date with fallbacks
  const publicationDate = details.publication_date || 
                        data.publicationDate || 
                        (details.specific_date ? details.specific_date : "TBD");
  
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
      <Badge variant="outline" className="bg-secondary/10">
        <FileText className="w-3 h-3 mr-1" />
        <span>Blog Post</span>
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
      {renderDate()}
      
      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{publicationDate}</span>
      </div>
      
      {description && (
        <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}
    </div>
  );
};