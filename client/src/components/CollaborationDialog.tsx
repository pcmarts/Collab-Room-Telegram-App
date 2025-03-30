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
  Mic, Video, FileText, BookOpen, Link, Coffee
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FiExternalLink } from "react-icons/fi";

interface CollaborationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaboration: {
    // Common fields
    title?: string;
    companyName: string;
    roleTitle?: string;
    collaborationType?: string;
    description?: string;
    companyTwitter?: string;
    twitterFollowers?: string;
    companyLinkedIn?: string;
    companySector?: string;
    goals?: string;
    expectations?: string;
    preferredTopics?: string[];
    topics?: string[];
    role?: string;
    date?: string;
    
    // Legacy & generic fields
    eventName?: string;
    availability?: string;
    requestingUser?: string;
    requestReason?: string;
    
    // Conference Coffee fields
    conferenceName?: string;
    conferenceDate?: string;
    
    // Podcast fields
    podcastName?: string;
    shortDescription?: string;
    estimatedReach?: string;
    streamingLink?: string;
    
    // Twitter Spaces fields
    topic?: string;
    hostHandle?: string;
    hostFollowerCount?: string;
    
    // Live Stream fields
    expectedAudience?: string;
    previousWebinarLink?: string;
    
    // Research Report fields
    reportName?: string;
    researchTopic?: string;
    reportTargetReleaseDate?: string;
    reportReach?: string;
    
    // Newsletter fields
    newsletterName?: string;
    totalSubscribers?: string;
    newsletterUrl?: string;
    
    // Type identifier
    type?: string;
  };
}

export function CollaborationDialog({ isOpen, onClose, collaboration }: CollaborationDialogProps) {
  // Helper function to determine dialog title based on card type
  const getDialogTitle = () => {
    switch (collaboration.type) {
      case "conference-coffee":
        return collaboration.conferenceName;
      case "podcast":
        return collaboration.podcastName;
      case "twitter-spaces":
        return collaboration.topic;
      case "livestream":
        return collaboration.title;
      case "research-report":
        return collaboration.reportName;
      case "newsletter":
        return collaboration.newsletterName;
      default:
        return collaboration.title;
    }
  };

  // Helper function to render specific content based on card type
  const renderTypeSpecificContent = () => {
    switch (collaboration.type) {
      case "conference-coffee":
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Event</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coffee className="h-4 w-4" />
                <span>Conference Coffee Chat</span>
              </div>
            </div>
            {collaboration.role && (
              <div>
                <h4 className="text-sm font-medium mb-1">Role</h4>
                <p className="text-sm text-muted-foreground">{collaboration.role}</p>
              </div>
            )}
            {collaboration.conferenceDate && (
              <div>
                <h4 className="text-sm font-medium mb-1">Conference Date</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{collaboration.conferenceDate}</span>
                </div>
              </div>
            )}
          </>
        );
        
      case "podcast":
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Podcast Details</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mic className="h-4 w-4" />
                <span>Podcast Guest Appearance</span>
              </div>
            </div>
            {collaboration.shortDescription && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{collaboration.shortDescription}</p>
              </div>
            )}
            {collaboration.estimatedReach && (
              <div>
                <h4 className="text-sm font-medium mb-1">Estimated Reach</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Megaphone className="h-4 w-4" />
                  <span>{collaboration.estimatedReach}</span>
                </div>
              </div>
            )}
            {collaboration.streamingLink && (
              <div>
                <h4 className="text-sm font-medium mb-1">Listen</h4>
                <div className="flex items-center gap-2 text-sm">
                  <FiExternalLink className="h-4 w-4" />
                  <a
                    href={collaboration.streamingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Listen to podcast
                  </a>
                </div>
              </div>
            )}
          </>
        );
        
      case "twitter-spaces":
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Twitter Space</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                <span>Twitter Spaces Guest</span>
              </div>
            </div>
            {collaboration.hostHandle && (
              <div>
                <h4 className="text-sm font-medium mb-1">Host</h4>
                <div className="flex items-center gap-2 text-sm">
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  <a
                    href={`https://twitter.com/${collaboration.hostHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @{collaboration.hostHandle}
                  </a>
                  {collaboration.hostFollowerCount && (
                    <span className="text-muted-foreground">
                      ({collaboration.hostFollowerCount} followers)
                    </span>
                  )}
                </div>
              </div>
            )}
            {collaboration.date && (
              <div>
                <h4 className="text-sm font-medium mb-1">Date</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{collaboration.date}</span>
                </div>
              </div>
            )}
          </>
        );
        
      case "livestream":
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Live Stream</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4 text-red-500" />
                <span>Live Stream Guest Appearance</span>
              </div>
            </div>
            {collaboration.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{collaboration.description}</p>
              </div>
            )}
            {collaboration.topics && collaboration.topics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {collaboration.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {collaboration.expectedAudience && (
              <div>
                <h4 className="text-sm font-medium mb-1">Expected Audience</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Megaphone className="h-4 w-4" />
                  <span>{collaboration.expectedAudience}</span>
                </div>
              </div>
            )}
            {collaboration.date && (
              <div>
                <h4 className="text-sm font-medium mb-1">Date</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{collaboration.date}</span>
                </div>
              </div>
            )}
            {collaboration.previousWebinarLink && (
              <div>
                <h4 className="text-sm font-medium mb-1">Previous Webinar</h4>
                <div className="flex items-center gap-2 text-sm">
                  <FiExternalLink className="h-4 w-4" />
                  <a
                    href={collaboration.previousWebinarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View previous webinar
                  </a>
                </div>
              </div>
            )}
          </>
        );
        
      case "research-report":
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Research Report</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Research Report Feature</span>
              </div>
            </div>
            {collaboration.researchTopic && (
              <div>
                <h4 className="text-sm font-medium mb-1">Research Topic</h4>
                <p className="text-sm text-muted-foreground">{collaboration.researchTopic}</p>
              </div>
            )}
            {collaboration.reportTargetReleaseDate && (
              <div>
                <h4 className="text-sm font-medium mb-1">Target Release Date</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{collaboration.reportTargetReleaseDate}</span>
                </div>
              </div>
            )}
            {collaboration.reportReach && (
              <div>
                <h4 className="text-sm font-medium mb-1">Report Reach</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Megaphone className="h-4 w-4" />
                  <span>{collaboration.reportReach}</span>
                </div>
              </div>
            )}
          </>
        );
        
      case "newsletter":
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Newsletter</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Newsletter Feature</span>
              </div>
            </div>
            {collaboration.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{collaboration.description}</p>
              </div>
            )}
            {collaboration.topics && collaboration.topics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {collaboration.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {collaboration.totalSubscribers && (
              <div>
                <h4 className="text-sm font-medium mb-1">Total Subscribers</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Megaphone className="h-4 w-4" />
                  <span>{collaboration.totalSubscribers}</span>
                </div>
              </div>
            )}
            {collaboration.newsletterUrl && (
              <div>
                <h4 className="text-sm font-medium mb-1">Newsletter URL</h4>
                <div className="flex items-center gap-2 text-sm">
                  <FiExternalLink className="h-4 w-4" />
                  <a
                    href={collaboration.newsletterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View newsletter
                  </a>
                </div>
              </div>
            )}
            {collaboration.date && (
              <div>
                <h4 className="text-sm font-medium mb-1">Date</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{collaboration.date}</span>
                </div>
              </div>
            )}
          </>
        );
        
      default:
        // Legacy format
        return (
          <>
            {/* Role Information */}
            {collaboration.roleTitle && (
              <div>
                <h4 className="text-sm font-medium mb-1">Role</h4>
                <p className="text-sm text-muted-foreground">{collaboration.roleTitle}</p>
              </div>
            )}
            
            {/* Type-specific Information */}
            {collaboration.collaborationType && (
              <div>
                <h4 className="text-sm font-medium mb-1">Collaboration Type</h4>
                <p className="text-sm text-muted-foreground">{collaboration.collaborationType}</p>
              </div>
            )}

            {/* Description */}
            {collaboration.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{collaboration.description}</p>
              </div>
            )}

            {/* Goals & Expectations (Marketing) */}
            {collaboration.goals && (
              <div>
                <h4 className="text-sm font-medium mb-1">Goals</h4>
                <p className="text-sm text-muted-foreground">{collaboration.goals}</p>
              </div>
            )}

            {collaboration.expectations && (
              <div>
                <h4 className="text-sm font-medium mb-1">Expectations</h4>
                <p className="text-sm text-muted-foreground">{collaboration.expectations}</p>
              </div>
            )}

            {/* Conference Specific Info */}
            {collaboration.eventName && (
              <div>
                <h4 className="text-sm font-medium mb-1">Event</h4>
                <p className="text-sm text-muted-foreground">{collaboration.eventName}</p>
                {collaboration.availability && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {collaboration.availability}
                  </p>
                )}
              </div>
            )}

            {/* Preferred Topics (Conference) */}
            {collaboration.preferredTopics && collaboration.preferredTopics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Preferred Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {collaboration.preferredTopics.map((topic, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Request Specific Info */}
            {collaboration.requestReason && (
              <div>
                <h4 className="text-sm font-medium mb-1">Request Reason</h4>
                <p className="text-sm text-muted-foreground">{collaboration.requestReason}</p>
              </div>
            )}
          </>
        );
    }
  };

  // Helper function to determine if we should show company info
  const shouldShowCompanyInfo = () => {
    return (
      collaboration.companyTwitter || 
      collaboration.companyLinkedIn || 
      collaboration.companySector
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="pr-8">{getDialogTitle()}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogDescription className="text-lg font-medium">
            {collaboration.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Type-specific content */}
          {renderTypeSpecificContent()}

          {/* Company Information - show if relevant company info exists */}
          {shouldShowCompanyInfo() && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Company Information</h4>
                <div className="space-y-2">
                  {/* Twitter */}
                  {collaboration.companyTwitter && (
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                      <a
                        href={`https://twitter.com/${collaboration.companyTwitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        @{collaboration.companyTwitter}
                      </a>
                      {collaboration.twitterFollowers && (
                        <span className="text-sm text-muted-foreground">
                          ({collaboration.twitterFollowers} followers)
                        </span>
                      )}
                    </div>
                  )}

                  {/* LinkedIn */}
                  {collaboration.companyLinkedIn && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                      <a
                        href={`https://linkedin.com/company/${collaboration.companyLinkedIn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {collaboration.companyName}
                      </a>
                    </div>
                  )}

                  {/* Company Sector */}
                  {collaboration.companySector && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {collaboration.companySector}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            // Handle request action
            console.log("Requesting collaboration:", getDialogTitle());
            onClose();
          }}>
            Request Collaboration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}