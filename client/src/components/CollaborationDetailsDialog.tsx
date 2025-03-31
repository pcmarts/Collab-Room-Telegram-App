import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Twitter, Linkedin, Building, X, Calendar, Megaphone, 
  Mic, Video, FileText, BookOpen, Link, Coffee, Users,
  Briefcase, Globe, ExternalLink, Clock, Tag, Coins, Network
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FiExternalLink } from "react-icons/fi";
import { FaTwitter } from "react-icons/fa";

interface CollaborationDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaboration: {
    // Basic collaboration info
    id?: string;
    title?: string;
    collab_type?: string; // Used instead of 'type' to match database schema
    description?: string;
    date?: string;
    topics?: string[];
    
    // Company Info
    companyName?: string;
    roleTitle?: string;
    companyWebsite?: string;
    companyTwitter?: string;
    twitterFollowers?: string;
    companyLinkedIn?: string;
    companySector?: string;
    fundingStage?: string;
    blockchainNetworks?: string[];
    tokenTicker?: string;
    hasToken?: boolean;
    
    // Details object (JSON from database)
    details?: Record<string, any>;
    
    // Legacy type field
    type?: string;
  };
}

export function CollaborationDetailsDialog({ 
  isOpen, 
  onClose, 
  collaboration 
}: CollaborationDetailsDialogProps) {
  
  // Get collaboration type from either field
  const collabType = collaboration.collab_type || collaboration.type || "";
  const details = collaboration.details || {};
  
  // Get title based on collaboration type
  const getDialogTitle = () => {
    // First check for explicit title
    if (collaboration.title) return collaboration.title;
    
    // Then try to extract type-specific titles from details or main object
    switch (collabType.toLowerCase()) {
      case "podcast":
      case "podcast guest appearance":
        return details.podcast_name || details.podcastName || "Podcast Opportunity";
      
      case "twitter spaces":
      case "twitter spaces guest":
      case "twitter-spaces":
        return details.topic || details.spaceTopic || "Twitter Space";
      
      case "livestream":
      case "live stream":
      case "live stream guest appearance":
        return details.stream_title || details.streamTitle || "Livestream Opportunity";
      
      case "research-report":
      case "research report":
      case "report & research feature":
        return details.report_name || details.reportName || "Research Report";
      
      case "newsletter":
      case "newsletter feature": 
        return details.newsletter_name || details.newsletterName || "Newsletter Feature";
        
      case "blog post":
      case "blog-post":
      case "blog post feature":
        return details.blog_title || details.blogTitle || "Blog Post Feature";
        
      default:
        return "Collaboration Opportunity";
    }
  };
  
  // Get short description
  const getShortDescription = () => {
    // First check main description field
    if (collaboration.description) return collaboration.description;
    
    // Then check details for short_description
    if (details.short_description) return details.short_description;
    if (details.shortDescription) return details.shortDescription;
    
    return "";
  };
  
  // Get all potential topics
  const getTopics = () => {
    // First check main topics array
    if (collaboration.topics && collaboration.topics.length > 0) {
      return collaboration.topics;
    }
    
    // Then check details for topics
    if (details.topics && Array.isArray(details.topics)) {
      return details.topics;
    }
    
    return [];
  };
  
  // Function to render blockchain networks if available
  const renderBlockchainNetworks = () => {
    const networks = collaboration.blockchainNetworks || 
                    details.blockchain_networks || 
                    [];
                    
    if (networks.length === 0) return null;
    
    return (
      <div>
        <h4 className="text-sm font-medium mb-1">Blockchain Networks</h4>
        <div className="flex flex-wrap gap-1">
          {networks.map((network, index) => (
            <Badge key={index} variant="outline" className="text-xs bg-blue-500/10">
              <Network className="h-3 w-3 mr-1" />
              {network}
            </Badge>
          ))}
        </div>
      </div>
    );
  };
  
  // Function to check if there's token info
  const hasTokenInfo = () => {
    return collaboration.hasToken || details.has_token || collaboration.tokenTicker || details.token_ticker;
  };
  
  // Get date information (could come from different fields)
  const getDateInfo = () => {
    return collaboration.date || 
           details.date || 
           details.specific_date || 
           details.scheduledDate || 
           details.target_release_date || 
           "";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{getDialogTitle()}</DialogTitle>
          {/* We're removing the custom close button since Dialog component already has one */}
          <DialogDescription className="text-lg font-medium">
            {collaboration.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Collaboration Type */}
          <div>
            <h4 className="text-sm font-medium mb-1">Collaboration Type</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>{collabType}</span>
            </div>
          </div>
          
          {/* Collaboration Details */}
          {Object.keys(details).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Collaboration Details</h4>
              <div className="space-y-2">
                {Object.entries(details).map(([key, value]) => {
                  // Skip certain fields that are handled specially elsewhere
                  if (['topics', 'short_description', 'shortDescription', 'company_name', 'companyName',
                       'blockchain_networks', 'has_token', 'token_ticker', 'date', 'specific_date'].includes(key)) {
                    return null;
                  }
                  
                  // Skip empty values or arrays
                  if (!value || (Array.isArray(value) && value.length === 0)) {
                    return null;
                  }
                  
                  // Format the key for display
                  const displayKey = key
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  
                  // Format the value based on type
                  let displayValue: React.ReactNode = value;
                  if (typeof value === 'object' && !Array.isArray(value)) {
                    return null; // Skip nested objects
                  } else if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                  } else if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  }
                  
                  return (
                    <div key={key} className="text-sm">
                      <span className="font-medium">{displayKey}:</span>{' '}
                      <span className="text-muted-foreground">{displayValue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Topics */}
          {getTopics().length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Topics</h4>
              <div className="flex flex-wrap gap-1">
                {getTopics().map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Short Description */}
          {getShortDescription() && (
            <div>
              <h4 className="text-sm font-medium mb-1">Short Description</h4>
              <p className="text-sm text-muted-foreground">{getShortDescription()}</p>
            </div>
          )}
          
          {/* Date */}
          {getDateInfo() && (
            <div>
              <h4 className="text-sm font-medium mb-1">Date</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{getDateInfo()}</span>
              </div>
            </div>
          )}
          
          {/* Removed duplicate blockchain networks section as it's now in Company Info */}
          
          {/* Removed duplicate token info section as it's now in Company Info */}
          
          {/* Company Information Section */}
          <Separator />
          <div>
            <h4 className="text-sm font-bold mb-2">Company Information</h4>
            <div className="space-y-3">
              {/* Company Name */}
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{collaboration.companyName}</span>
              </div>
              
              {/* Role Title */}
              {(collaboration.roleTitle || details.job_title || details.role) && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {collaboration.roleTitle || details.job_title || details.role}
                  </span>
                </div>
              )}
              
              {/* Company Website */}
              {(collaboration.companyWebsite || details.company_website || details.website) && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={collaboration.companyWebsite || details.company_website || details.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    Website
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              
              {/* Twitter */}
              {(collaboration.companyTwitter || details.twitter_handle) && (
                <div className="flex items-center gap-2">
                  <FaTwitter className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`https://twitter.com/${(collaboration.companyTwitter || details.twitter_handle || '').replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    @{(collaboration.companyTwitter || details.twitter_handle || '').replace('@', '')}
                  </a>
                  {(collaboration.twitterFollowers || details.twitter_followers) && (
                    <span className="text-sm text-muted-foreground flex items-center ml-1">
                      <Users className="h-3 w-3 mr-1" />
                      {collaboration.twitterFollowers || details.twitter_followers}
                    </span>
                  )}
                </div>
              )}

              {/* Company Short Description */}
              {(details.company_description || details.short_company_description) && (
                <div className="flex gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {details.company_description || details.short_company_description}
                  </p>
                </div>
              )}

              {/* LinkedIn */}
              {(collaboration.companyLinkedIn || details.linkedin_url) && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`https://linkedin.com/company/${collaboration.companyLinkedIn || details.linkedin_url || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    LinkedIn
                  </a>
                </div>
              )}

              {/* Company Sector */}
              {(collaboration.companySector || details.sector || details.company_sector) && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Sector: {collaboration.companySector || details.sector || details.company_sector}
                  </span>
                </div>
              )}
              
              {/* Funding Stage */}
              {(collaboration.fundingStage || details.funding_stage) && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Funding: {collaboration.fundingStage || details.funding_stage}
                  </span>
                </div>
              )}
              
              {/* Blockchain Networks */}
              {(collaboration.blockchainNetworks || details.blockchain_networks) && 
               (Array.isArray(collaboration.blockchainNetworks) || Array.isArray(details.blockchain_networks)) && 
               ((collaboration.blockchainNetworks || []).length > 0 || (details.blockchain_networks || []).length > 0) && (
                <div className="flex gap-2">
                  <Network className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Blockchain Networks:</span>
                    <div className="flex flex-wrap gap-1">
                      {(collaboration.blockchainNetworks || details.blockchain_networks || []).map((network, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {network}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Token Information */}
              {(collaboration.hasToken || details.has_token || collaboration.tokenTicker || details.token_ticker) && (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Token: {collaboration.tokenTicker || details.token_ticker || "Yes"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            console.log("Request collaboration:", getDialogTitle());
            onClose();
          }}>
            Request Collaboration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}