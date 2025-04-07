"use client"

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Send } from "lucide-react";

interface AddNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendWithNote: (note: string) => void;
  onSendWithoutNote: () => void;
  recipientName?: string;
}

export function AddNoteDialog({
  isOpen,
  onClose,
  onSendWithNote,
  onSendWithoutNote,
  recipientName
}: AddNoteDialogProps) {
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"initial" | "compose">("initial");
  
  // Reset dialog state when it closes
  useEffect(() => {
    if (!isOpen) {
      setNote("");
      setStep("initial");
    }
  }, [isOpen]);
  
  const handleSendWithNote = () => {
    onSendWithNote(note);
  };
  
  // Only enable the send button when there's text in the note
  const isNoteEmpty = note.trim().length === 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[330px] sm:w-auto sm:max-w-md px-4 sm:px-6">
        {step === "initial" ? (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-center text-lg">Add a note to your request</DialogTitle>
              <DialogDescription className="text-center text-sm px-1">
                Let {recipientName || "the collaboration host"} know why you're interested.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col space-y-3 py-3">
              <Button 
                onClick={() => setStep("compose")} 
                className="flex items-center justify-start px-3 py-4 h-auto"
              >
                <div className="mr-2 bg-primary/10 p-1.5 rounded-full shrink-0">
                  <Send className="h-4 w-4" />
                </div>
                <div className="text-left truncate">
                  <div className="font-medium">Add a note</div>
                  <div className="text-xs text-muted-foreground truncate">Personalize with a brief message</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onSendWithoutNote}
                className="flex items-center justify-start px-3 py-4 h-auto"
              >
                <div className="mr-2 bg-primary/10 p-1.5 rounded-full shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div className="text-left truncate">
                  <div className="font-medium">Just send</div>
                  <div className="text-xs text-muted-foreground truncate">Send request without a note</div>
                </div>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-center text-lg">Write a note</DialogTitle>
              <DialogDescription className="text-center text-sm px-1">
                Tell {recipientName || "the collaboration host"} why you're interested.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-3">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi, I'm interested in this collaboration because..."
                className="min-h-[100px] resize-none text-sm"
                autoFocus
              />
            </div>
            
            <DialogFooter className="flex justify-between space-x-2 pt-1">
              <Button 
                variant="outline" 
                onClick={() => setStep("initial")}
                size="sm"
                className="text-sm"
              >
                Back
              </Button>
              <Button 
                onClick={handleSendWithNote} 
                disabled={isNoteEmpty}
                className="gap-1.5 text-sm"
                size="sm"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}