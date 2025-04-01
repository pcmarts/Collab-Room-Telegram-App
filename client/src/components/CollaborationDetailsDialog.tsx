import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Globe,
  Twitter,
  Briefcase,
  DollarSign,
  Tag,
  Hash,
  Clock,
  Users,
  Building,
  ChevronLeft
} from "lucide-react";

interface CollaborationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaboration?: {
    id?: string;
    title?: string;
    collab_type?: string;
    description?: string;
    date?: string;
    topics?: string[];
    companyName?: string;
    company_data?: {
      name?: string;
      short_description?: string;
      twitter_handle?: string;
      twitter_followers?: string;
      website?: string;
      funding_stage?: string;
      has_token?: boolean;
      token_ticker?: string;
      blockchain_networks?: string[];
      job_title?: string;
      tags?: string[];
    };
    details?: Record<string, any>;
    isPotentialMatch?: boolean;
    potentialMatchData?: {
      user_id?: string;
      first_name?: string;
      last_name?: string;
      company_name?: string;
      job_title?: string;
    };
    type?: string;
  };
}

export function CollaborationDetailsDialog({
  isOpen,
  onClose,
  collaboration
}: CollaborationDetailsDialogProps) {
  if (!collaboration) return null;

  // Extract fields with fallbacks
  const title = collaboration.title || collaboration.collab_type || "Collaboration";
  const description = collaboration.description || "No description provided";
  const topics = collaboration.topics || [];
  const companyData = collaboration.company_data || {};
  const details = collaboration.details || {};
  const isPotentialMatch = collaboration.isPotentialMatch || false;
  const potentialMatchData = collaboration.potentialMatchData || {};
  
  // Format company name from the appropriate source
  const companyName = 
    potentialMatchData.company_name || 
    companyData.name || 
    collaboration.companyName || 
    "Unknown Company";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute left-2 top-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="pt-2">{title}</DialogTitle>
          <DialogDescription>
            {isPotentialMatch ? "This user is interested in your collaboration" : "Collaboration details"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Company info section */}
          <Card className="p-4 bg-card/50 border shadow-sm">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-muted-foreground" />
              {companyName}
            </h3>
            
            {isPotentialMatch && potentialMatchData.first_name && (
              <div className="flex items-center mt-1 text-sm text-primary">
                <Users className="h-4 w-4 mr-1" />
                <span>
                  {potentialMatchData.first_name} {potentialMatchData.last_name || ""}
                  {potentialMatchData.job_title && ` • ${potentialMatchData.job_title}`}
                </span>
              </div>
            )}
            
            {companyData.short_description && (
              <p className="text-sm mt-2 text-muted-foreground">
                {companyData.short_description}
              </p>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              {companyData.website && (
                <div className="flex items-center gap-1 text-xs">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate" title={companyData.website}>
                    {companyData.website.replace(/https?:\/\/(www\.)?/, "")}
                  </span>
                </div>
              )}
              
              {companyData.twitter_handle && (
                <div className="flex items-center gap-1 text-xs">
                  <Twitter className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate" title={companyData.twitter_handle}>
                    {companyData.twitter_handle.replace(/https?:\/\/(www\.)?twitter\.com\//, "@")}
                  </span>
                </div>
              )}
              
              {companyData.funding_stage && (
                <div className="flex items-center gap-1 text-xs">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span>{companyData.funding_stage}</span>
                </div>
              )}
              
              {companyData.job_title && (
                <div className="flex items-center gap-1 text-xs">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate" title={companyData.job_title}>
                    {companyData.job_title}
                  </span>
                </div>
              )}
            </div>
          </Card>
          
          {/* Collaboration details */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="text-sm whitespace-pre-line">{description}</p>
            
            {topics && topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                <div className="w-full flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Tag className="h-3 w-3" />
                  <span>Topics:</span>
                </div>
                {topics.map((topic, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Type-specific details */}
            {collaboration.collab_type === "Twitter Spaces Guest" && details.host_follower_count && (
              <div className="flex items-center gap-1 text-xs mt-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>Host followers: {details.host_follower_count}</span>
              </div>
            )}
            
            {collaboration.collab_type === "Co-Marketing on Twitter" && details.host_follower_count && (
              <div className="flex items-center gap-1 text-xs mt-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>Host followers: {details.host_follower_count}</span>
              </div>
            )}
            
            {/* Close button */}
            <div className="pt-4">
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}