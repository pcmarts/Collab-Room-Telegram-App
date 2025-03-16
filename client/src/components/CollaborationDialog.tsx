import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Building, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CollaborationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaboration: {
    title: string;
    companyName: string;
    roleTitle: string;
    collaborationType?: string;
    description: string;
    companyTwitter: string;
    twitterFollowers: string;
    companyLinkedIn: string;
    companySector: string;
    goals?: string;
    expectations?: string;
    preferredTopics?: string[];
    eventName?: string;
    availability?: string;
    requestingUser?: string;
    requestReason?: string;
  };
}

export function CollaborationDialog({ isOpen, onClose, collaboration }: CollaborationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="pr-8">{collaboration.title}</DialogTitle>
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
          {/* Role Information */}
          <div>
            <h4 className="text-sm font-medium mb-1">Role</h4>
            <p className="text-sm text-muted-foreground">{collaboration.roleTitle}</p>
          </div>

          {/* Company Information */}
          <div>
            <h4 className="text-sm font-medium mb-2">Company Information</h4>
            <div className="space-y-2">
              {/* Twitter */}
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
                <span className="text-sm text-muted-foreground">
                  ({collaboration.twitterFollowers} followers)
                </span>
              </div>

              {/* LinkedIn */}
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

              {/* Company Sector */}
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {collaboration.companySector}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Type-specific Information */}
          {collaboration.collaborationType && (
            <div>
              <h4 className="text-sm font-medium mb-1">Collaboration Type</h4>
              <p className="text-sm text-muted-foreground">{collaboration.collaborationType}</p>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{collaboration.description}</p>
          </div>

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
                  <span
                    key={index}
                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                  >
                    {topic}
                  </span>
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
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            // Handle request action
            console.log("Requesting collaboration:", collaboration.title);
            onClose();
          }}>
            Request Collaboration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}