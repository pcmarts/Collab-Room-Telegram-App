import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

  const handleSubmit = () => {
    onSendWithNote(note);
    setNote(""); // Reset the note after sending
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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
          />
        </div>
        <DialogFooter className="flex justify-between w-full sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setNote("");
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Send Request with Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}