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
  ExternalLink,
  FileSearch,
  FileText,
  Mic,
  Video,
  Mail
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
    
    // Add nested full collaboration data structure for potential matches
    collaboration?: {
      id?: string;
      title?: string;
      collab_type?: string;
      description?: string;
      date?: string;
      topics?: string[];
      creator_id?: string;
      details?: Record<string, any>;
      creator_company_name?: string;
    };
  };
}

export function CollaborationDetailsDialog({
  isOpen,
  onClose,
  collaboration
}: CollaborationDetailsDialogProps) {
  if (!collaboration) return null;
  
  // Debug log to see what data we're receiving
  console.log('[CollabDetails] Full collaboration data received:', collaboration);
  
  // Get collaboration data from the appropriate source
  let collabData = collaboration;
  
  // For potential matches, check if we have collaboration data in the collaboration field
  if (collaboration.isPotentialMatch && collaboration.collaboration) {
    console.log('[CollabDetails] Found potential match with collaboration data');
    // Merge the collaboration data with the main object, but let the collaboration field take precedence
    collabData = {
      ...collaboration,
      title: collaboration.collaboration.title || collaboration.title,
      description: collaboration.collaboration.description || collaboration.description,
      collab_type: collaboration.collaboration.collab_type || collaboration.collab_type,
      topics: collaboration.collaboration.topics || collaboration.topics,
      details: collaboration.collaboration.details || collaboration.details
    };
    console.log('[CollabDetails] Merged collaboration data:', collabData);
  }

  // Extract fields with fallbacks
  const title = collabData.title || collabData.collab_type || "Collaboration";
  const description = collabData.description || "No description provided";
  const topics = collabData.topics || [];
  const companyData = collabData.company_data || {};
  const details = collabData.details || {};
  const isPotentialMatch = collabData.isPotentialMatch || false;
  const potentialMatchData = collabData.potentialMatchData || {};
  const collabType = collabData.collab_type || "Collaboration";
  
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
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-4">
            {/* Company info section - FIRST */}
            <Card className="p-4 bg-card/50 border shadow-sm">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                {companyName}
              </h3>
              
              {/* Job title - Enhanced for potential matches */}
              {isPotentialMatch && potentialMatchData.job_title && (
                <div className="flex items-center mt-1 text-sm text-primary font-medium">
                  <Briefcase className="h-4 w-4 mr-1 text-primary/70" />
                  <span>
                    {potentialMatchData.job_title}
                  </span>
                </div>
              )}
              
              <Separator className="my-3" />
              
              {/* Company description - highlighted and more prominent */}
              {companyData.short_description && (
                <div className="mt-3 p-3 bg-secondary/10 rounded-md border border-secondary/20">
                  <p className="text-sm">{companyData.short_description}</p>
                </div>
              )}
              
              {/* Show personalized note if exists */}
              {isPotentialMatch && potentialMatchData.note && (
                <div className="mt-3 bg-primary/5 p-3 rounded-md border border-primary/10">
                  <h4 className="text-sm font-medium text-primary mb-1">Personalized Note</h4>
                  <p className="text-sm italic">{potentialMatchData.note}</p>
                </div>
              )}
              
              {/* Company social links and details */}
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
                      }}
                    >
                      {companyData.website.replace(/https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                )}
                
                {companyData.twitter_handle && (
                  <div className="flex items-center gap-1 text-xs">
                    <Twitter className="h-3 w-3 text-[#1DA1F2]" />
                    <a 
                      href={companyData.twitter_handle.startsWith('https://') 
                        ? companyData.twitter_handle 
                        : `https://x.com/${companyData.twitter_handle.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      @{companyData.twitter_handle.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '')}
                    </a>
                  </div>
                )}
                
                {companyData.linkedin_url && (
                  <div className="flex items-center gap-1 text-xs">
                    <Linkedin className="h-3 w-3 text-[#0077B5]" />
                    <a 
                      href={companyData.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                
                {companyData.twitter_followers && (
                  <div className="flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{companyData.twitter_followers} Twitter followers</span>
                  </div>
                )}
                
                {companyData.funding_stage && (
                  <div className="flex items-center gap-1 text-xs">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span>{companyData.funding_stage}</span>
                  </div>
                )}
                
                {companyData.has_token && (
                  <div className="flex items-center gap-1 text-xs">
                    <Coins className="h-3 w-3 text-muted-foreground" />
                    <span>
                      Token {companyData.token_ticker ? `(${companyData.token_ticker})` : ""}
                    </span>
                  </div>
                )}
                
                {companyData.blockchain_networks && companyData.blockchain_networks.length > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Layers className="h-3 w-3 text-muted-foreground" />
                    <span>
                      {Array.isArray(companyData.blockchain_networks) 
                        ? companyData.blockchain_networks.join(', ') 
                        : companyData.blockchain_networks}
                    </span>
                  </div>
                )}
              </div>
              
              {companyData.tags && companyData.tags.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-medium mb-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(companyData.tags) 
                      ? companyData.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      : (
                        <Badge variant="outline" className="text-xs">
                          {String(companyData.tags)}
                        </Badge>
                      )
                    }
                  </div>
                </div>
              )}
            </Card>
            
            {/* Collaboration details section - SECOND */}
            <Card className="p-4 bg-card/50 border shadow-sm">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                Your Collab Details
              </h3>
              
              <Separator className="my-3" />
              
              {/* Title first */}
              {title && title !== collabType && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium">Title</h4>
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                </div>
              )}
              
              {/* Collaboration Type as Pill/Badge */}
              <div className="mb-3">
                <h4 className="text-sm font-medium">Type</h4>
                <div className="mt-1">
                  {collabType?.includes('Twitter Co-Marketing') || collabType?.includes('Co-Marketing on Twitter') ? (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-700">
                      <Twitter className="w-3 h-3 mr-1" />
                      Twitter Co-Marketing
                      {details?.twittercomarketing_type && (
                        <span className="ml-1">
                          ({typeof details.twittercomarketing_type === 'string' 
                            ? details.twittercomarketing_type
                            : Array.isArray(details.twittercomarketing_type) 
                              ? details.twittercomarketing_type.join(', ') 
                              : String(details.twittercomarketing_type)
                          })
                        </span>
                      )}
                    </Badge>
                  ) : collabType === 'Twitter Spaces Guest' ? (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-700">
                      <Twitter className="w-3 h-3 mr-1" />
                      Twitter Spaces Guest
                    </Badge>
                  ) : collabType === 'Podcast Guest Appearance' ? (
                    <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/20 text-purple-700">
                      <Mic className="w-3 h-3 mr-1" />
                      Podcast Guest Appearance
                    </Badge>
                  ) : collabType === 'Live Stream Guest Appearance' ? (
                    <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/20 text-red-700">
                      <Video className="w-3 h-3 mr-1" />
                      {collabType}
                    </Badge>
                  ) : collabType === 'Blog Post Feature' ? (
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-700">
                      <FileText className="w-3 h-3 mr-1" />
                      Blog Post Feature
                    </Badge>
                  ) : collabType === 'Newsletter Feature' ? (
                    <Badge variant="outline" className="text-xs bg-indigo-500/10 border-indigo-500/20 text-indigo-700">
                      <Mail className="w-3 h-3 mr-1" />
                      Newsletter Feature
                    </Badge>
                  ) : collabType === 'Report & Research Feature' ? (
                    <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/20 text-amber-700">
                      <FileSearch className="w-3 h-3 mr-1" />
                      Report & Research Feature
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {collabType}
                    </Badge>
                  )}
                </div>
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
                        href={details.host_twitter_handle.startsWith('https://') 
                          ? details.host_twitter_handle 
                          : `https://x.com/${details.host_twitter_handle.replace('@', '')}`}
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
                  
                  {/* We're already showing this at the top for Twitter co-marketing */}
                  {details?.twittercomarketing_type && !collabType?.includes('Co-Marketing on Twitter') && (
                    <div className="flex items-center gap-1 text-xs">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span>Twitter engagement type: {
                        typeof details.twittercomarketing_type === 'string' 
                          ? details.twittercomarketing_type
                          : Array.isArray(details.twittercomarketing_type)
                            ? details.twittercomarketing_type.join(', ')
                            : String(details.twittercomarketing_type)
                      }</span>
                    </div>
                  )}
                  
                  {/* Additional Twitter date info */}
                  {details?.collaboration_date && (
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>Collaboration date: {details.collaboration_date}</span>
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
                    'previous_stream_link', 'collaboration_date'].includes(key) && 
                  value && typeof value !== 'object'
                )
                .map(([key, value]) => {
                  // Check if this is a date-related field
                  const isDateField = key.toLowerCase().includes('date') || 
                                    key.toLowerCase().includes('time') || 
                                    key.toLowerCase().includes('when');
                  
                  return (
                    <div className="mb-2" key={key}>
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        {isDateField && <Calendar className="h-3.5 w-3.5" />}
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {String(value)}
                      </p>
                    </div>
                  );
                })
              }
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}