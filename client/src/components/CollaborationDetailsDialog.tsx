import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LogoAvatar } from "@/components/ui/logo-avatar";
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
  Mail,
  MessageSquare,
  Filter,
  TrendingUp,
  PenTool,
  Coffee
} from "lucide-react";

interface CollaborationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCollaboration?: () => void;
  onShowSignupDialog?: () => void;
  currentUserId?: string;
  isAuthenticated?: boolean;
  collaboration?: {
    id?: string;
    title?: string;
    collab_type?: string;
    description?: string;
    date?: string;
    date_type?: string;
    specific_date?: string;
    topics?: string[];
    companyName?: string;
    company_logo_url?: string;
    creator_id?: string;
    status?: string;
    twitter_followers?: string;
    company_twitter_followers?: string;
    funding_stage?: string;
    company_tags?: string[];
    requestStatus?: 'pending' | 'accepted' | 'hidden' | 'skipped' | null;
    company_data?: {
      name?: string;
      short_description?: string;
      long_description?: string;
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
      logo_url?: string;
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
      date_type?: string;
      specific_date?: string;
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
  onRequestCollaboration,
  onShowSignupDialog,
  currentUserId,
  isAuthenticated = false,
  collaboration
}: CollaborationDetailsDialogProps) {
  
  if (!collaboration) return null;

  // Get collaboration type color - matches CollaborationListItem.tsx
  const getTypeColor = (type?: string) => {
    if (!type) return "bg-gray-100 text-gray-800";
    const lowerType = type.toLowerCase();
    if (lowerType.includes("twitter") || lowerType.includes("social")) return "bg-blue-100 text-blue-800";
    if (lowerType.includes("podcast")) return "bg-purple-100 text-purple-800";
    if (lowerType.includes("blog") || lowerType.includes("content")) return "bg-emerald-100 text-emerald-800";
    if (lowerType.includes("research") || lowerType.includes("report")) return "bg-amber-100 text-amber-800";
    if (lowerType.includes("newsletter")) return "bg-indigo-100 text-indigo-800";
    if (lowerType.includes("livestream") || lowerType.includes("stream")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get collaboration type icon - matches CollaborationListItem.tsx
  const getCollabTypeIcon = (collabType: string) => {
    const lowerType = collabType.toLowerCase();
    if (lowerType.includes('podcast')) {
      return <Mic className="h-4 w-4" />;
    }
    if (lowerType.includes('twitter') || lowerType.includes('social')) {
      return <Twitter className="h-4 w-4" />;
    }
    if (lowerType.includes('live stream') || lowerType.includes('livestream') || lowerType.includes('webinar')) {
      return <Video className="h-4 w-4" />;
    }
    if (lowerType.includes('newsletter')) {
      return <Mail className="h-4 w-4" />;
    }
    if (lowerType.includes('blog')) {
      return <PenTool className="h-4 w-4" />;
    }
    if (lowerType.includes('research') || lowerType.includes('report')) {
      return <FileSearch className="h-4 w-4" />;
    }
    if (lowerType.includes('coffee')) {
      return <Coffee className="h-4 w-4" />;
    }
    // Default collaboration icon
    return <MessageSquare className="h-4 w-4" />;
  };
  
  // Get collaboration data from the appropriate source
  let collabData = collaboration;
  
  // For potential matches, check if we have collaboration data in the collaboration field
  if (collaboration.isPotentialMatch && collaboration.collaboration) {
    // Merge the collaboration data with the main object, but let the collaboration field take precedence
    collabData = {
      ...collaboration,
      title: collaboration.collaboration.title || collaboration.title,
      description: collaboration.collaboration.description || collaboration.description,
      collab_type: collaboration.collaboration.collab_type || collaboration.collab_type,
      topics: collaboration.collaboration.topics || collaboration.topics,
      details: collaboration.collaboration.details || collaboration.details
    };
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
  
  // Check if this is the user's own collaboration
  const isOwnCollaboration = isAuthenticated && currentUserId && 
    (collabData.creator_id === currentUserId || collaboration.collaboration?.creator_id === currentUserId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="w-full sm:max-w-lg md:max-w-xl max-w-[95vw] max-h-[90vh] mx-2 sm:mx-auto p-0 overflow-hidden flex flex-col"
        aria-describedby="collaboration-description"
      >
        <DialogHeader className="relative px-0 py-0 sticky top-0 bg-background z-10 border-b shrink-0">
          <div className="relative flex items-center justify-between h-16 px-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              size="icon"
              className="rounded-full"
              aria-label="Close collaboration details dialog"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 flex justify-center">
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${getTypeColor(collabType)}`}>
                {getCollabTypeIcon(collabType)}
                <span>{collabType}</span>
              </span>
            </div>
            <div className="w-11" /> {/* Spacer for balance */}
          </div>
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription id="collaboration-description" className="sr-only">
            {collabType} collaboration opportunity with {companyName}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto" role="region" aria-label="Collaboration details content">
          <div className="space-y-4 p-4 pb-6">
            {/* Company header at the very top */}
            <div className="flex items-center gap-3 mb-6">
              <LogoAvatar 
                name={companyName}
                logoUrl={collaboration.company_logo_url || companyData.logo_url} 
                className="w-12 h-12 sm:w-10 sm:h-10"
                size="md"
              />
              <h2 className="text-xl sm:text-xl font-semibold leading-tight">{companyName}</h2>
            </div>
            
            {/* Collaboration details section */}
            <Card className="p-4 bg-card/50 border shadow-sm">
              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
                
              {/* Date Information - simplified */}
              <div className="mb-6">
                {(collabData.date_type || collabData.specific_date) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span>
                      {collabData.date_type === 'specific_date' && collabData.specific_date ? (
                        <span className="text-primary font-medium">
                          {new Date(collabData.specific_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      ) : collabData.date_type === 'any_future_date' ? (
                        <span>Any future date</span>
                      ) : (
                        <span>To be discussed</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
                
              {/* Collaboration Requirements */}
              {(collabData.twitter_followers || collabData.company_twitter_followers || collabData.funding_stage || (collabData.company_tags && collabData.company_tags.length > 0)) && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Requirements
                  </h5>
                  <div className="space-y-3">
                    {collabData.twitter_followers && (
                      <div className="flex items-center gap-2 text-sm py-1">
                        <Twitter className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Personal Twitter followers: {collabData.twitter_followers}</span>
                      </div>
                    )}
                    {collabData.company_twitter_followers && (
                      <div className="flex items-center gap-2 text-sm py-1">
                        <Building className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>Company Twitter followers: {collabData.company_twitter_followers}</span>
                      </div>
                    )}
                    {collabData.funding_stage && (
                      <div className="flex items-center gap-2 text-sm py-1">
                        <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
                        <span>Funding stage: {collabData.funding_stage}</span>
                      </div>
                    )}
                    {collabData.company_tags && collabData.company_tags.length > 0 && (
                      <div className="flex items-start gap-2 text-sm py-1">
                        <Tag className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="block mb-2">Company sectors:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {collabData.company_tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
                
              {/* Type-specific Details */}
              {details && Object.keys(details).length > 0 && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Additional Details
                  </h5>
                  <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                    {/* Twitter Co-Marketing specific details */}
                    {collabType?.includes('Twitter') && details.twittercomarketing_type && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Co-marketing types: </span>
                        <span className="text-muted-foreground">{Array.isArray(details.twittercomarketing_type) ? details.twittercomarketing_type.join(', ') : details.twittercomarketing_type}</span>
                      </div>
                    )}
                    {collabType?.includes('Twitter') && details.host_twitter_handle && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Host Twitter: </span>
                        <a href={details.host_twitter_handle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {details.host_twitter_handle}
                        </a>
                      </div>
                    )}
                    {collabType?.includes('Twitter') && details.host_follower_count && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Host followers: </span>
                        <span className="text-muted-foreground">{details.host_follower_count}</span>
                      </div>
                    )}
                    
                    {/* Podcast specific details */}
                    {collabType?.includes('Podcast') && details.podcast_name && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Podcast Name: </span>
                        <span className="text-muted-foreground">{details.podcast_name}</span>
                        {details.podcast_url && (
                          <a 
                            href={details.podcast_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 ml-2 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Previous Episodes
                          </a>
                        )}
                      </div>
                    )}
                    {collabType?.includes('Podcast') && details.episode_duration && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Duration: </span>
                        <span className="text-muted-foreground">{details.episode_duration}</span>
                      </div>
                    )}
                    {collabType?.includes('Podcast') && details.podcast_audience_size && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Audience size: </span>
                        <span className="text-muted-foreground">{details.podcast_audience_size}</span>
                      </div>
                    )}
                    
                    {/* Live Stream specific details */}
                    {collabType?.includes('Live Stream') && details.platform && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Platform: </span>
                        <span className="text-muted-foreground">{details.platform}</span>
                        {details.stream_url && (
                          <a 
                            href={details.stream_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 ml-2 px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Previous Streams
                          </a>
                        )}
                      </div>
                    )}
                    {collabType?.includes('Live Stream') && details.stream_duration && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Duration: </span>
                        <span className="text-muted-foreground">{details.stream_duration}</span>
                      </div>
                    )}
                    
                    {/* Report & Research specific details */}
                    {collabType?.includes('Report') && details.report_type && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Report type: </span>
                        <span className="text-muted-foreground">{details.report_type}</span>
                      </div>
                    )}
                    {collabType?.includes('Report') && details.publication_name && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Publication: </span>
                        <span className="text-muted-foreground">{details.publication_name}</span>
                      </div>
                    )}
                    
                    {/* Topics section under additional details */}
                    {topics && topics.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Topics: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {topics.map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    
                    {/* Generic details for other fields */}
                    {Object.entries(details).map(([key, value]) => {
                      // Skip already handled fields
                      if ([
                          'twittercomarketing_type', 'host_twitter_handle', 'host_follower_count',
                          'podcast_name', 'episode_duration', 'podcast_audience_size',
                          'platform', 'stream_duration', 'report_type', 'publication_name',
                          'date_type', 'specific_date', // Skip date fields as they're handled above
                          'podcast_url', 'stream_url' // Skip URL fields as they're handled as buttons
                        ].includes(key)) {
                          return null;
                        }
                        
                        // Skip empty values
                        if (!value || (Array.isArray(value) && value.length === 0)) {
                          return null;
                        }
                        
                        // Check if this is a URL field and render as a button
                        const isUrl = (String(value).startsWith('http://') || String(value).startsWith('https://'));
                        const isStreamLink = key.toLowerCase().includes('stream') && key.toLowerCase().includes('link');
                        const isPodcastLink = (key.toLowerCase().includes('podcast') && key.toLowerCase().includes('url')) || 
                                            (key.toLowerCase().includes('podcast') && key.toLowerCase().includes('link'));
                        
                        if (isUrl && (isStreamLink || isPodcastLink)) {
                          const linkText = isStreamLink ? 'Previous Streams' : 'Previous Episodes';
                          const colorClass = isStreamLink ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
                          
                          return (
                            <div key={key} className="text-sm">
                              <span className="font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                              <a 
                                href={String(value)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={`inline-flex items-center gap-1 ml-2 px-2 py-1 text-xs border rounded transition-colors ${colorClass}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                                {linkText}
                              </a>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                            <span className="text-muted-foreground">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
              {/* Collaboration Status */}
              {collabData.status && collabData.status !== 'active' && (
                <div className="mb-6">
                  <h5 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Status
                  </h5>
                  <Badge variant={collabData.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                    {collabData.status}
                  </Badge>
                </div>
              )}
              
              {/* Action buttons - moved to bottom of collaboration details */}
              <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
                {!isOwnCollaboration && (
                  <Button
                    size="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        // Trigger signup dialog via callback and close this dialog
                        if (onShowSignupDialog) {
                          onShowSignupDialog();
                          onClose(); // Close details dialog
                        }
                      } else {
                        // Call the collaboration request handler for authenticated users
                        if (onRequestCollaboration) {
                          onRequestCollaboration();
                          onClose(); // Close dialog after requesting
                        }
                      }
                    }}
                    className={`px-4 w-full min-h-[44px] text-sm ${
                      collaboration?.requestStatus === 'pending' 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                        : collaboration?.requestStatus === 'accepted'
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-primary hover:bg-primary/90 text-white'
                    }`}
                    disabled={collaboration?.requestStatus === 'pending' || collaboration?.requestStatus === 'accepted'}
                    aria-label={`Send collaboration request to ${companyName} for ${collabType}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {collaboration?.requestStatus === 'pending' 
                      ? 'Request Pending' 
                      : collaboration?.requestStatus === 'accepted' 
                        ? 'Already Matched' 
                        : 'Send Collab Request (Free)'
                    }
                  </Button>
                )}
                
                {/* Close button as secondary button */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="w-full bg-background hover:bg-muted border-2 font-medium min-h-[44px] text-sm"
                  aria-label="Close collaboration details dialog"
                >
                  Close
                </Button>
              </div>
            </Card>
            
            {/* Company info section - MOVED TO BOTTOM */}
            <Card className="p-4 bg-card/50 border shadow-sm">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                About {companyName}
              </h3>
              
              <Separator className="my-3" />
              
              {/* Company description - highlighted and more prominent */}
              {(companyData.short_description || companyData.long_description) && (
                <div className="mb-3 p-3 bg-secondary/10 rounded-md border border-secondary/20">
                  <p className="text-sm">{companyData.short_description || companyData.long_description}</p>
                </div>
              )}
              
              {/* Show personalized note if exists */}
              {isPotentialMatch && potentialMatchData.note && (
                <div className="mb-3 bg-primary/5 p-3 rounded-md border border-primary/10">
                  <h4 className="text-sm font-medium text-primary mb-1">Personalized Note</h4>
                  <p className="text-sm italic">{potentialMatchData.note}</p>
                </div>
              )}
              
              {/* Company social links and details - single row */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {companyData.website && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a 
                      href={companyData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Website
                    </a>
                  </div>
                )}
                
                {companyData.twitter_handle && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Twitter className="h-4 w-4 text-[#1DA1F2] shrink-0" />
                    <a 
                      href={companyData.twitter_handle.startsWith('https://') 
                        ? companyData.twitter_handle 
                        : `https://x.com/${companyData.twitter_handle.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Twitter
                    </a>
                  </div>
                )}
                
                {companyData.linkedin_url && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Linkedin className="h-4 w-4 text-[#0077B5] shrink-0" />
                    <a 
                      href={companyData.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                
                {companyData.twitter_followers && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{companyData.twitter_followers} followers</span>
                  </div>
                )}
                
                {companyData.funding_stage && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{companyData.funding_stage}</span>
                  </div>
                )}
                
                {companyData.has_token && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Coins className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      Token {companyData.token_ticker ? `(${companyData.token_ticker})` : ""}
                    </span>
                  </div>
                )}
                
                {companyData.blockchain_networks && companyData.blockchain_networks.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      {Array.isArray(companyData.blockchain_networks) 
                        ? companyData.blockchain_networks.join(', ') 
                        : companyData.blockchain_networks}
                    </span>
                  </div>
                )}
              </div>
              
              {companyData.tags && companyData.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(companyData.tags) 
                      ? companyData.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))
                      : (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {String(companyData.tags)}
                        </Badge>
                      )
                    }
                  </div>
                </div>
              )}
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}