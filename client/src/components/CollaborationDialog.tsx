import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee, Presentation, Inbox, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollaborationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaboration: {
    title: string;
    companyName: string;
    roleTitle: string;
    collaborationType: string;
    description: string;
    type: 'marketing' | 'conference' | 'request';
    eventName?: string;
    availability?: string;
    requestingUser?: {
      role: string;
      company: string;
    };
  };
}

export function CollaborationDialog({ isOpen, onClose, collaboration }: CollaborationDialogProps) {
  const renderTags = () => {
    switch (collaboration.type) {
      case 'marketing':
        return (
          <div className="flex gap-2 mb-4">
            <Badge variant="outline" className="bg-blue-50 flex items-center gap-1">
              <Presentation className="h-3 w-3" />
              {collaboration.collaborationType}
            </Badge>
            <Badge variant="outline" className="bg-green-50">{`${collaboration.roleTitle} at ${collaboration.companyName}`}</Badge>
          </div>
        );
      case 'conference':
        return (
          <div className="flex gap-2 mb-4">
            <Badge variant="outline" className="bg-purple-50 flex items-center gap-1">
              <Coffee className="h-3 w-3" />
              {collaboration.eventName}
            </Badge>
            <Badge variant="outline" className="bg-green-50">{`${collaboration.roleTitle} at ${collaboration.companyName}`}</Badge>
          </div>
        );
      case 'request':
        return (
          <div className="flex gap-2 mb-4">
            <Badge variant="outline" className="bg-orange-50 flex items-center gap-1">
              <Inbox className="h-3 w-3" />
              Collaboration Request
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              {`${collaboration.requestingUser?.role} at ${collaboration.requestingUser?.company}`}
            </Badge>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (collaboration.type) {
      case 'marketing':
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Role</h4>
              <p className="text-sm text-muted-foreground">{collaboration.roleTitle}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Collaboration Type</h4>
              <p className="text-sm text-muted-foreground">{collaboration.collaborationType}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{collaboration.description}</p>
            </div>
          </>
        );
      case 'conference':
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Event</h4>
              <p className="text-sm text-muted-foreground">{collaboration.eventName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Availability</h4>
              <p className="text-sm text-muted-foreground">{collaboration.availability}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Topics of Interest</h4>
              <p className="text-sm text-muted-foreground">{collaboration.description}</p>
            </div>
          </>
        );
      case 'request':
        return (
          <>
            <div>
              <h4 className="text-sm font-medium mb-1">Requesting User</h4>
              <p className="text-sm text-muted-foreground">
                {`${collaboration.requestingUser?.role} at ${collaboration.requestingUser?.company}`}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Request Details</h4>
              <p className="text-sm text-muted-foreground">{collaboration.description}</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

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
          {renderTags()}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {renderContent()}
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
            {collaboration.type === 'request' ? 'Accept Request' : 'Request Collaboration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}