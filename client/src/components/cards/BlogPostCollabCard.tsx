import React from 'react';
import { FileText, Calendar } from "lucide-react";
import { BaseCollabCard } from './BaseCollabCard';

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
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<FileText className="w-3 h-3 mr-1" />}
      badgeText="Blog Post"
      badgeClass="bg-secondary/10"
      title={title}
    >
      {description && (
        <p className="text-xs mt-1 text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}
    </BaseCollabCard>
  );
};