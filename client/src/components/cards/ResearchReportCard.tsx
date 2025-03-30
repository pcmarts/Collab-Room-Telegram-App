import React from 'react';
import { FileText, Calendar, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResearchReportCardData {
  id?: string;
  companyName: string;
  reportName?: string;
  researchTopic?: string;
  reportTargetReleaseDate?: string;
  reportReach?: string;
  date?: string;
  role?: string;
  description?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    report_name?: string;
    research_topic?: string;
    target_release_date?: string;
    estimated_reach?: string;
    short_description?: string;
    specific_date?: string;
    date_selection?: string;
    topics?: string[];
    [key: string]: any;
  };
}

interface ResearchReportCardProps {
  data: ResearchReportCardData;
}

export const ResearchReportCard: React.FC<ResearchReportCardProps> = ({ data }) => {
  const details = data.details || {};
  
  // Determine title with fallbacks
  const title = details.report_name || data.reportName || "Research Report";
  
  // Determine topic with fallbacks
  const topic = details.research_topic || data.researchTopic || "";
  
  // Determine release date with fallbacks
  const releaseDate = details.target_release_date || data.reportTargetReleaseDate || "TBD";
  
  // Determine reach with fallbacks
  const reach = details.estimated_reach || data.reportReach || "TBD";
  
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
      <Badge variant="outline" className="bg-violet-500/10">
        <FileText className="w-3 h-3 mr-1" />
        <span>Research Report</span>
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
        {topic && (
          <p className="text-xs text-muted-foreground">
            {topic}
          </p>
        )}
      </div>
      
      {renderTopics()}
      {renderDate()}
      
      <div className="flex flex-col space-y-1 text-xs text-muted-foreground">        
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3" />
          <span>{releaseDate}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Megaphone className="w-3 h-3" />
          <span>{reach}</span>
        </div>
        
        {description && (
          <p className="mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};