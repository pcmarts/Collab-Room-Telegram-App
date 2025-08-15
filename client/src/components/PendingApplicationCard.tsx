import { Clock, ExternalLink, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { CollaborationTypePill } from "@/components/CollaborationFormV2/components/CollaborationTypePill";

export interface PendingApplication {
  id: string;
  collaboration_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  collaboration: {
    id: string;
    collab_type: string;
    description?: string;
    creator_company_name?: string;
    creator_company_logo_url?: string;
    topics?: string[];
  };
  note?: string;
}

interface PendingApplicationCardProps {
  application: PendingApplication;
  onViewDetails?: (collaborationId: string) => void;
}

export function PendingApplicationCard({ application, onViewDetails }: PendingApplicationCardProps) {
  const { collaboration } = application;
  
  // Calculate time since application
  const timeAgo = (date: string) => {
    const now = new Date();
    const applicationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  return (
    <Card className="w-full max-w-md mx-auto border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          
          {/* Content */}
          <div className="flex-grow min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200">
                Application Pending
              </Badge>
              <span className="text-xs text-muted-foreground">
                {timeAgo(application.created_at)}
              </span>
            </div>
            
            {/* Collaboration Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LogoAvatar 
                  name={collaboration.creator_company_name || "Company"}
                  logoUrl={collaboration.creator_company_logo_url}
                  size="sm"
                />
                <div className="min-w-0 flex-grow">
                  <p className="text-sm font-medium truncate">
                    {collaboration.creator_company_name || "Company"}
                  </p>
                  <CollaborationTypePill 
                    typeId={collaboration.collab_type}
                  />
                </div>
              </div>
              
              {/* Description */}
              {collaboration.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {collaboration.description}
                </p>
              )}
              
              {/* Topics */}
              {collaboration.topics && collaboration.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {collaboration.topics.slice(0, 3).map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs py-0">
                      {topic}
                    </Badge>
                  ))}
                  {collaboration.topics.length > 3 && (
                    <Badge variant="outline" className="text-xs py-0">
                      +{collaboration.topics.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails?.(collaboration.id)}
                className="flex items-center gap-1 text-xs h-7"
              >
                <Eye className="w-3 h-3" />
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PendingApplicationCard;