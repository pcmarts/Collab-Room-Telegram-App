import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { useToast } from "@/hooks/use-toast";

interface CollaborationData {
  id: string;
  creator_company_name: string;
  company_logo_url?: string;
  collab_type: string;
  description?: string;
}

interface AddNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendWithNote: (note: string) => void;
  collaboration?: CollaborationData;
}

export default function AddNoteDialog({
  isOpen,
  onClose,
  onSendWithNote,
  collaboration,
}: AddNoteDialogProps) {
  const [note, setNote] = useState("");
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const { toast } = useToast();

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Only reset the composer view when dialog opens, not when it closes
      setShowNoteComposer(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSendWithNote(note);
    setNote(""); // Reset the note after sending
    setShowNoteComposer(false); // Reset to initial state
    onClose();
    
    // Show success toast
    toast({
      title: "Request Sent Successfully",
      description: "Your collaboration request with a personalized note has been sent.",
      variant: "success" as any,
    });
  };

  const handleJustSend = () => {
    onSendWithNote(""); // Send with empty note
    setShowNoteComposer(false); // Reset to initial state
    onClose();
    
    // Show success toast
    toast({
      title: "Request Sent Successfully",
      description: "Your collaboration request has been sent.",
      variant: "success" as any,
    });
  };

  const handleAddNote = () => {
    setShowNoteComposer(true);
  };

  const handleCancel = () => {
    setNote("");
    setShowNoteComposer(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {showNoteComposer ? (
        // Note Composer View
        <DialogContent className="sm:max-w-md top-[20%] translate-y-0">
          <DialogHeader>
            <DialogTitle>Add a Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Company Header */}
            {collaboration && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <LogoAvatar
                  name={collaboration.creator_company_name}
                  logoUrl={collaboration.company_logo_url}
                  size="sm"
                  className="h-8 w-8"
                />
                <div>
                  <p className="text-sm font-medium">{collaboration.creator_company_name}</p>
                  <p className="text-xs text-muted-foreground">{collaboration.collab_type}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Add an optional note to your collaboration request{collaboration ? ` to ${collaboration.creator_company_name}` : ''}.
            </p>
            <Textarea
              placeholder="e.g., I'm interested in your Twitter collaboration opportunity. Our companies align well in the Web3 space..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          <DialogFooter className="flex justify-between w-full sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              Send Request with Note
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        // Initial Dialog View
        <DialogContent className="sm:max-w-md top-[30%] translate-y-0">
          <DialogHeader>
            <DialogTitle>Send Collaboration Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Company Header */}
            {collaboration && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <LogoAvatar
                  name={collaboration.creator_company_name}
                  logoUrl={collaboration.company_logo_url}
                  size="sm"
                  className="h-8 w-8"
                />
                <div>
                  <p className="text-sm font-medium">{collaboration.creator_company_name}</p>
                  <p className="text-xs text-muted-foreground">{collaboration.collab_type}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Would you like to add a personalized note to your collaboration request{collaboration ? ` to ${collaboration.creator_company_name}` : ''}?
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-3 w-full sm:flex-col sm:gap-3">
            <Button 
              type="button" 
              onClick={handleAddNote}
              className="w-full"
            >
              Add a Note
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleJustSend}
              className="w-full"
            >
              Just Send
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}