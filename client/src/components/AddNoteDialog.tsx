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
    handleCloseDialog(); // Close dialog first
    onSendWithNote(note);
  };
  
  // Only enable the send button when there's text in the note
  const isNoteEmpty = note.trim().length === 0;
  
  const handleCloseDialog = () => {
    // Ensure dialog state is reset on close
    setNote("");
    setStep("initial");
    onClose();
  };
  
  const handleJustSend = () => {
    console.log("Just send button clicked - dialog closing");
    handleCloseDialog(); // Close dialog first
    console.log("Executing send without note action");
    onSendWithoutNote();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-[95vw] w-[330px] sm:w-auto sm:max-w-md px-4 sm:px-6 dark:bg-background/95 border-muted/50 backdrop-blur-sm">
        {step === "initial" ? (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-center text-lg font-semibold text-foreground">Add a note to your request</DialogTitle>
              <DialogDescription className="text-center text-sm px-1 text-muted-foreground/90 dark:text-foreground/70">
                Let {recipientName || "the collaboration host"} know why you're interested.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col space-y-3 py-3">
              <Button 
                onClick={() => setStep("compose")} 
                className="flex items-center justify-start px-3 py-4 h-auto bg-primary/10 hover:bg-primary/15 dark:bg-primary/20 dark:hover:bg-primary/25"
                type="button"
              >
                <div className="mr-2 bg-primary/30 p-1.5 rounded-full shrink-0">
                  <Send className="h-4 w-4 text-primary dark:text-primary-foreground" />
                </div>
                <div className="text-left truncate">
                  <div className="font-medium text-primary dark:text-primary-foreground">Add a note</div>
                  <div className="text-xs text-primary/90 dark:text-primary-foreground/80 truncate">Personalize with a brief message</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleJustSend}
                className="flex items-center justify-start px-3 py-4 h-auto border-muted hover:bg-muted/30 dark:border-muted/50 dark:hover:bg-muted"
                type="button"
              >
                <div className="mr-2 bg-muted p-1.5 rounded-full shrink-0">
                  <Check className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left truncate">
                  <div className="font-medium text-foreground">Just send</div>
                  <div className="text-xs text-muted-foreground truncate">Send request without a note</div>
                </div>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-center text-lg font-semibold text-foreground">Write a note</DialogTitle>
              <DialogDescription className="text-center text-sm px-1 text-muted-foreground/90 dark:text-foreground/70">
                Tell {recipientName || "the collaboration host"} why you're interested.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-3">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi, I'm interested in this collaboration because..."
                className="min-h-[100px] resize-none text-sm dark:bg-muted/30 dark:border-muted focus:border-primary/50 dark:focus:border-primary"
                autoFocus
              />
            </div>
            
            <DialogFooter className="flex justify-between space-x-2 pt-1">
              <Button 
                variant="outline" 
                onClick={() => setStep("initial")}
                size="sm"
                className="text-sm dark:bg-background dark:hover:bg-muted/50 dark:border-muted/50"
              >
                Back
              </Button>
              <Button 
                onClick={handleSendWithNote} 
                disabled={isNoteEmpty}
                className="gap-1.5 text-sm bg-primary hover:bg-primary/90"
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