import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CollaborationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaboration: {
    title: string;
    companyName: string;
    roleTitle: string;
    collaborationType: string;
    description: string;
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
