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
    // Attempt to blur any active element (dismiss keyboard on mobile)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      handleCloseDialog(); // Close dialog first
      onSendWithNote(note);
    }, 50); // Short delay to allow keyboard to dismiss
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
    // Attempt to blur any active element (dismiss keyboard on mobile)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setTimeout(() => {
      handleCloseDialog(); // Close dialog first
      console.log("Executing send without note action");
      onSendWithoutNote();
    }, 50); // Short delay to allow keyboard to dismiss
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-[95vw] w-[330px] sm:w-auto sm:max-w-md px-4 sm:px-6 mobile-dialog">
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
                className="flex items-center justify-start px-3 py-4 h-auto bg-indigo-100 hover:bg-indigo-200"
                type="button"
              >
                <div className="mr-2 bg-indigo-500/20 p-1.5 rounded-full shrink-0">
                  <Send className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-left truncate">
                  <div className="font-medium text-indigo-700">Add a note</div>
                  <div className="text-xs text-indigo-600/80 truncate">Personalize with a brief message</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleJustSend}
                className="flex items-center justify-start px-3 py-4 h-auto border-gray-300 hover:bg-gray-100"
                type="button"
              >
                <div className="mr-2 bg-gray-200 p-1.5 rounded-full shrink-0">
                  <Check className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-left truncate">
                  <div className="font-medium text-gray-700">Just send</div>
                  <div className="text-xs text-gray-500 truncate">Send request without a note</div>
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
            
            <div className="py-2 relative">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi, I'm interested in this collaboration because..."
                className="min-h-[60px] resize-none text-sm"
                autoFocus
              />
              
              {/* Done button that appears when keyboard is showing */}
              {note.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute top-3 right-3 h-7 text-xs px-2 py-0 bg-gray-100 hover:bg-gray-200"
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  }}
                >
                  Done
                </Button>
              )}
            </div>
            
            {/* Fixed buttons for better mobile keyboard access */}
            <div className="flex justify-between items-center space-x-2 sticky mt-2">
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}