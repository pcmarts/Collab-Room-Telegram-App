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

  const companyHeader = collaboration && (
    <div className="flex items-center gap-3 p-3 rounded-md border border-hairline bg-surface">
      <LogoAvatar
        name={collaboration.creator_company_name}
        logoUrl={collaboration.company_logo_url}
        size="sm"
        className="h-8 w-8"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-text truncate">{collaboration.creator_company_name}</p>
        <p className="text-xs text-text-muted truncate">{collaboration.collab_type}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {showNoteComposer ? (
        <DialogContent className="sm:max-w-md top-[20%] translate-y-0">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-semibold">Add a note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {companyHeader}
            <p className="text-sm text-text-muted">
              Optional. A short note can sharpen your request{collaboration ? ` to ${collaboration.creator_company_name}` : ''}.
            </p>
            <Textarea
              placeholder="e.g. We'd be a strong fit — our audience overlaps with yours and we can co-promote across both channels."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          <DialogFooter className="flex justify-between w-full sm:justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="text-text-muted hover:text-text"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-brand text-brand-fg hover:bg-brand-hover"
            >
              Send with note
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-md top-[30%] translate-y-0">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-semibold">Send collab request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {companyHeader}
            <p className="text-sm text-text-muted">
              Want to add a personalized note{collaboration ? ` to ${collaboration.creator_company_name}` : ''}?
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 w-full sm:flex-col sm:gap-2">
            <Button
              type="button"
              onClick={handleAddNote}
              className="w-full bg-brand text-brand-fg hover:bg-brand-hover h-11"
            >
              Add a note
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleJustSend}
              className="w-full h-11"
            >
              Just send
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}