import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { SignupToCollaborateDialog } from "@/components/SignupToCollaborateDialog";
import { useState } from "react";
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
  TrendingUp
} from "lucide-react";

interface CollaborationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCollaboration?: () => void;
  currentUserId?: string;
  isAuthenticated?: boolean;
  collaboration?: {
    id?: string;
    title?: string;
    collab_type?: string;
    description?: string;
    date?: string;
    topics?: string[];
    companyName?: string;
    company_logo_url?: string;
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
  currentUserId,
  isAuthenticated = false,
  collaboration
}: CollaborationDetailsDialogProps) {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  
  if (!collaboration) return null;
  
  // Debug log to see what data we're receiving
  console.log('[CollabDetails] Full collaboration data received:', collaboration);
  console.log('[CollabDetails] Is potential match?', collaboration.isPotentialMatch);
  console.log('[CollabDetails] Potential match data:', collaboration.potentialMatchData);
  console.log('[CollabDetails] Company data structure:', collaboration.company_data);
  console.log('[CollabDetails] Company name from company_data:', collaboration.company_data?.name);
  
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
  
  // Check if this is the user's own collaboration
  const isOwnCollaboration = isAuthenticated && currentUserId && 
    (collabData.creator_id === currentUserId || collaboration.collaboration?.creator_id === currentUserId);

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
          <DialogTitle className="sr-only">Collaboration Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 p-4">
            {/* Collaboration details section - FIRST with company header */}
            <Card className="p-4 bg-card/50 border shadow-sm">
              {/* Company logo and name at the top */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-3">
                  <LogoAvatar 
                    name={companyName}
                    logoUrl={collaboration.company_logo_url || companyData.logo_url} 
                    className="w-8 h-8"
                    size="sm"
                  />
                  <span>{companyName}</span>
                </h3>
                
                {/* Request button - show for non-own collaborations */}
                {!isOwnCollaboration && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        // Show signup dialog for non-authenticated users
                        setShowSignupDialog(true);
                      } else {
                        // Call the collaboration request handler for authenticated users
                        if (onRequestCollaboration) {
                          onRequestCollaboration();
                          onClose(); // Close dialog after requesting
                        }
                      }
                    }}
                    className="bg-primary hover:bg-primary/90 text-white px-4"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Request
                  </Button>
                )}
              </div>
              
              <Separator className="mb-4" />
              
              {/* Collaboration details first */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {title && title !== collabType ? title : collabType}
                </h4>
                
                {/* Collaboration Type as Badge */}
                <div className="mb-3">
                  {collabType?.includes('Twitter Co-Marketing') || collabType?.includes('Co-Marketing on Twitter') ? (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/20 text-blue-700">
                      <Twitter className="w-3 h-3 mr-1" />
                      Twitter Co-Marketing
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
                
                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">{description}</p>
                
                {/* Topics/Tags if available */}
                {topics && topics.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium mb-2 text-muted-foreground">Topics</h5>
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
                {(collabData.date_type || collabData.specific_date) && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Timeline
                    </h5>
                    <div className="text-sm">
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
                        <span>Timeline to be discussed</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Collaboration Requirements */}
                {(collabData.twitter_followers || collabData.company_twitter_followers || collabData.funding_stage || collabData.company_tags?.length > 0) && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      Requirements
                    </h5>
                    <div className="space-y-2">
                      {collabData.twitter_followers && (
                        <div className="flex items-center gap-2 text-xs">
                          <Twitter className="w-3 h-3 text-blue-500" />
                          <span>Personal Twitter followers: {collabData.twitter_followers}</span>
                        </div>
                      )}
                      {collabData.company_twitter_followers && (
                        <div className="flex items-center gap-2 text-xs">
                          <Building className="w-3 h-3 text-gray-500" />
                          <span>Company Twitter followers: {collabData.company_twitter_followers}</span>
                        </div>
                      )}
                      {collabData.funding_stage && (
                        <div className="flex items-center gap-2 text-xs">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span>Funding stage: {collabData.funding_stage}</span>
                        </div>
                      )}
                      {collabData.company_tags && collabData.company_tags.length > 0 && (
                        <div className="flex items-start gap-2 text-xs">
                          <Tag className="w-3 h-3 text-purple-500 mt-0.5" />
                          <div>
                            <span className="block mb-1">Company sectors:</span>
                            <div className="flex flex-wrap gap-1">
                              {collabData.company_tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
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
                  <div className="mb-4">
                    <h5 className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Additional Details
                    </h5>
                    <div className="space-y-2">
                      {/* Twitter Co-Marketing specific details */}
                      {collabType?.includes('Twitter') && details.twittercomarketing_type && (
                        <div className="text-xs">
                          <span className="font-medium">Co-marketing types: </span>
                          <span>{Array.isArray(details.twittercomarketing_type) ? details.twittercomarketing_type.join(', ') : details.twittercomarketing_type}</span>
                        </div>
                      )}
                      {collabType?.includes('Twitter') && details.host_twitter_handle && (
                        <div className="text-xs">
                          <span className="font-medium">Host Twitter: </span>
                          <a href={details.host_twitter_handle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {details.host_twitter_handle}
                          </a>
                        </div>
                      )}
                      {collabType?.includes('Twitter') && details.host_follower_count && (
                        <div className="text-xs">
                          <span className="font-medium">Host followers: </span>
                          <span>{details.host_follower_count}</span>
                        </div>
                      )}
                      
                      {/* Podcast specific details */}
                      {collabType?.includes('Podcast') && details.podcast_name && (
                        <div className="text-xs">
                          <span className="font-medium">Podcast: </span>
                          <span>{details.podcast_name}</span>
                        </div>
                      )}
                      {collabType?.includes('Podcast') && details.episode_duration && (
                        <div className="text-xs">
                          <span className="font-medium">Duration: </span>
                          <span>{details.episode_duration}</span>
                        </div>
                      )}
                      {collabType?.includes('Podcast') && details.podcast_audience_size && (
                        <div className="text-xs">
                          <span className="font-medium">Audience size: </span>
                          <span>{details.podcast_audience_size}</span>
                        </div>
                      )}
                      
                      {/* Live Stream specific details */}
                      {collabType?.includes('Live Stream') && details.platform && (
                        <div className="text-xs">
                          <span className="font-medium">Platform: </span>
                          <span>{details.platform}</span>
                        </div>
                      )}
                      {collabType?.includes('Live Stream') && details.stream_duration && (
                        <div className="text-xs">
                          <span className="font-medium">Duration: </span>
                          <span>{details.stream_duration}</span>
                        </div>
                      )}
                      
                      {/* Report & Research specific details */}
                      {collabType?.includes('Report') && details.report_type && (
                        <div className="text-xs">
                          <span className="font-medium">Report type: </span>
                          <span>{details.report_type}</span>
                        </div>
                      )}
                      {collabType?.includes('Report') && details.publication_name && (
                        <div className="text-xs">
                          <span className="font-medium">Publication: </span>
                          <span>{details.publication_name}</span>
                        </div>
                      )}
                      
                      {/* Generic details for other fields */}
                      {Object.entries(details).map(([key, value]) => {
                        // Skip already handled fields
                        if ([
                          'twittercomarketing_type', 'host_twitter_handle', 'host_follower_count',
                          'podcast_name', 'episode_duration', 'podcast_audience_size',
                          'platform', 'stream_duration', 'report_type', 'publication_name'
                        ].includes(key)) {
                          return null;
                        }
                        
                        // Skip empty values
                        if (!value || (Array.isArray(value) && value.length === 0)) {
                          return null;
                        }
                        
                        return (
                          <div key={key} className="text-xs">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                            <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Collaboration Status */}
                {collabData.status && collabData.status !== 'active' && (
                  <div className="mb-4">
                    <h5 className="text-xs font-medium mb-2 text-muted-foreground">Status</h5>
                    <Badge variant={collabData.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {collabData.status}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Company info section - MOVED TO BOTTOM */}
            <Card className="p-4 bg-card/50 border shadow-sm">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                About {companyName}
              </h3>
              
              <Separator className="my-3" />
              
              {/* Job title - Show for potential matches or from company data */}
              {(isPotentialMatch && potentialMatchData.job_title) ? (
                <div className="flex items-center mb-3 text-sm text-primary font-medium">
                  <Briefcase className="h-4 w-4 mr-1 text-primary/70" />
                  <span>
                    {potentialMatchData.job_title}
                  </span>
                </div>
              ) : companyData.job_title ? (
                <div className="flex items-center mb-3 text-sm font-medium">
                  <Briefcase className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>
                    {companyData.job_title}
                  </span>
                </div>
              ) : null}
              
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
          </div>
        </ScrollArea>
      </DialogContent>
      
      {/* Signup Dialog for non-authenticated users */}
      <SignupToCollaborateDialog
        open={showSignupDialog}
        onOpenChange={setShowSignupDialog}
        companyName={companyName}
        companyLogoUrl={collaboration.company_logo_url || companyData.logo_url}
        collaborationType={collabType}
      />
    </Dialog>
  );
}