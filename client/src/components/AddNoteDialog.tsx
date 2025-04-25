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
import { useToast } from "@/hooks/use-toast";

interface AddNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendWithNote: (note: string) => void;
}

export default function AddNoteDialog({
  isOpen,
  onClose,
  onSendWithNote,
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
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Add an optional note to your collaboration request.
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
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Would you like to add a personalized note to your collaboration request?
            </p>
          </div>
          <DialogFooter className="flex justify-between w-full sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleJustSend}
              className="flex-1"
            >
              Just Send
            </Button>
            <Button 
              type="button" 
              onClick={handleAddNote}
              className="flex-1"
            >
              Add a Note
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}