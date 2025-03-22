import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export interface BaseCardProps {
  data: {
    id?: string;
    companyName: string;
    description?: string;
    role?: string;
    date?: string;
    topics?: string[];
    preferredTopics?: string[];
    details?: any;
  };
  badgeIcon?: React.ReactNode;
  badgeText: string;
  badgeClass?: string;
  title: string;
  children?: React.ReactNode;
}

export const BaseCollabCard: React.FC<BaseCardProps> = ({
  data,
  badgeIcon,
  badgeText,
  badgeClass = "bg-primary/10",
  title,
  children
}) => {
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
    if (data.details && data.details.topics && data.details.topics.length > 0) {
      return (
        <div className="flex flex-wrap gap-1 mb-1">
          {data.details.topics.map((topic: string, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      );
    }
    
    return null;
  };

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
    if (data.details) {
      const dateText = data.details.specific_date 
        ? data.details.specific_date 
        : data.details.date_selection === "specific_date" 
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
      <Badge variant="outline" className={badgeClass}>
        {badgeIcon}
        <span className="ml-1">{badgeText}</span>
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
      {renderDate()}
      
      {data.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {data.description}
        </p>
      )}
      
      {children}
    </div>
  );
};