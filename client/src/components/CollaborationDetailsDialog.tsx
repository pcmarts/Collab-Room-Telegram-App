import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  ChevronLeft,
  Linkedin,
  Coins,
  Layers,
  Info,
  Link,
  ArrowUpRight,
  ExternalLink
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
      linkedin_url?: string;
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
      note?: string;
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
  const collabType = collaboration.collab_type || "Collaboration";
  
  // Format company name from the appropriate source
  const companyName = 
    potentialMatchData.company_name || 
    companyData.name || 
    collaboration.companyName || 
    "Unknown Company";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 sticky top-0 bg-background z-10 border-b">
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
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-4">
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
              
              {/* Show personalized note if exists */}
              {isPotentialMatch && potentialMatchData.note && (
                <div className="mt-3 bg-primary/5 p-3 rounded-md border border-primary/10">
                  <h4 className="text-sm font-medium text-primary mb-1">Personalized Note</h4>
                  <p className="text-sm italic">{potentialMatchData.note}</p>
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
                    <a 
                      href={companyData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Don't prevent default so the link works normally
                      }}
                    >
                      {companyData.website.replace(/https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                )}
                
                {companyData.twitter_handle && (
                  <div className="flex items-center gap-1 text-xs">
                    <Twitter className="h-3 w-3 text-muted-foreground" />
                    <a 
                      href={companyData.twitter_handle.startsWith("http") 
                        ? companyData.twitter_handle 
                        : `https://twitter.com/${companyData.twitter_handle.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Don't prevent default so the link works normally
                      }}
                    >
                      {companyData.twitter_handle.replace(/https?:\/\/(www\.)?twitter\.com\//, "@")}
                    </a>
                  </div>
                )}
                
                {companyData.linkedin_url && (
                  <div className="flex items-center gap-1 text-xs">
                    <Linkedin className="h-3 w-3 text-muted-foreground" />
                    <a 
                      href={companyData.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Don't prevent default so the link works normally
                      }}
                    >
                      LinkedIn
                    </a>
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

                {companyData.has_token && companyData.token_ticker && (
                  <div className="flex items-center gap-1 text-xs">
                    <Coins className="h-3 w-3 text-muted-foreground" />
                    <span>${companyData.token_ticker}</span>
                  </div>
                )}
                
                {companyData.blockchain_networks && companyData.blockchain_networks.length > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    <span>Chain: {companyData.blockchain_networks.join(', ')}</span>
                  </div>
                )}
                
                {companyData.tags && companyData.tags.length > 0 && (
                  <div className="col-span-2 flex items-center gap-1 text-xs mt-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span>Sector: {companyData.tags.join(', ')}</span>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Collaboration details section - NEW */}
            <Card className="p-4 bg-card/50 border shadow-sm">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                <Info className="h-5 w-5" />
                Collaboration Details
              </h3>
              
              <Separator className="my-3" />
              
              {/* Collaboration Type */}
              <div className="mb-3">
                <h4 className="text-sm font-medium">Type</h4>
                <p className="text-sm">{collabType}</p>
              </div>
              
              {/* Collaboration Description */}
              <div className="mb-3">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              
              {/* Topics/Tags */}
              {topics && topics.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-1">Topics</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Date Information */}
              {(collaboration.date || details?.specific_date || details?.date) && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 inline" />
                    Date
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {collaboration.date || details?.specific_date || details?.date}
                  </p>
                </div>
              )}
              
              {/* Date Flexibility */}
              {details?.date_selection && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium">Date Flexibility</h4>
                  <p className="text-sm text-muted-foreground">
                    {details.date_selection === 'specific_date' 
                      ? 'Specific date requested'
                      : 'Flexible date'}
                  </p>
                </div>
              )}
              
              {/* Expected Audience Size */}
              {details?.expected_audience_size && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 inline" />
                    Expected Audience
                  </h4>
                  <p className="text-sm text-muted-foreground">{details.expected_audience_size}</p>
                </div>
              )}
              
              {/* Previous Stream Link */}
              {details?.previous_stream_link && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Link className="h-3.5 w-3.5 inline" />
                    Previous Stream
                  </h4>
                  <a 
                    href={details.previous_stream_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View Previous Stream
                    <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </div>
              )}
              
              {/* Twitter Spaces specific details */}
              {collaboration.collab_type?.includes('Twitter') && (
                <div className="space-y-2 mt-3">
                  {details?.host_twitter_handle && (
                    <div className="flex items-center gap-1 text-xs">
                      <Twitter className="h-3 w-3 text-muted-foreground" />
                      <span>Host: </span>
                      <a 
                        href={`https://twitter.com/${details.host_twitter_handle.replace('@', '')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {details.host_twitter_handle}
                      </a>
                    </div>
                  )}
                  
                  {details?.host_follower_count && (
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>Host followers: {details.host_follower_count}</span>
                    </div>
                  )}
                  
                  {details?.twittercomarketing_type && (
                    <div className="flex items-center gap-1 text-xs">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span>Twitter engagement type: {details.twittercomarketing_type}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Podcast specific details */}
              {collaboration.collab_type?.includes('Podcast') && (
                <div className="space-y-2 mt-3">
                  {details?.podcast_name && (
                    <div className="flex items-center gap-1 text-xs">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span>Podcast name: {details.podcast_name}</span>
                    </div>
                  )}
                  
                  {details?.podcast_episodes && (
                    <div className="flex items-center gap-1 text-xs">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span>Episode count: {details.podcast_episodes}</span>
                    </div>
                  )}
                  
                  {details?.podcast_duration && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Duration: {details.podcast_duration}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Additional dynamic details from the details object */}
              {details && Object.entries(details)
                .filter(([key, value]) => 
                  // Filter out already displayed fields and empty values
                  !['host_twitter_handle', 'host_follower_count', 'twittercomarketing_type', 
                    'podcast_name', 'podcast_episodes', 'podcast_duration', 
                    'date_selection', 'specific_date', 'date', 'expected_audience_size', 
                    'previous_stream_link'].includes(key) && 
                  value && typeof value !== 'object'
                )
                .map(([key, value]) => (
                  <div className="mb-2" key={key}>
                    <h4 className="text-sm font-medium">{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h4>
                    <p className="text-sm text-muted-foreground">{String(value)}</p>
                  </div>
                ))
              }
            </Card>
            
            {/* Close button */}
            <div className="pt-2 pb-4">
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}