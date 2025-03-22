import React from 'react';
import { FileText, Calendar, Megaphone } from "lucide-react";
import { BaseCollabCard } from './BaseCollabCard';

interface ResearchReportCardData {
  id?: string;
  companyName: string;
  reportName?: string;
  researchTopic?: string;
  reportTargetReleaseDate?: string;
  reportReach?: string;
  date?: string;
  description?: string;
  topics?: string[];
  preferredTopics?: string[];
  details?: {
    report_name?: string;
    research_topic?: string;
    target_release_date?: string;
    estimated_reach?: string;
    short_description?: string;
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
  
  return (
    <BaseCollabCard
      data={data}
      badgeIcon={<FileText className="w-3 h-3 mr-1" />}
      badgeText="Research Report"
      badgeClass="bg-violet-500/10"
      title={title}
    >
      <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
        {topic && <p>{topic}</p>}
        
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
    </BaseCollabCard>
  );
};