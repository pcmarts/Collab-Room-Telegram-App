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
      <DialogContent className="max-w-md">
        {step === "initial" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add a note to your request</DialogTitle>
              <DialogDescription>
                Let {recipientName || "the collaboration host"} know why you're interested in this opportunity.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col space-y-4 py-4">
              <Button 
                onClick={() => setStep("compose")} 
                className="flex items-center justify-start px-4 py-6 h-auto"
              >
                <div className="mr-3 bg-primary/10 p-2 rounded-full">
                  <Send className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Add a note</div>
                  <div className="text-sm text-muted-foreground">Personalize your request with a brief message</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onSendWithoutNote}
                className="flex items-center justify-start px-4 py-6 h-auto"
              >
                <div className="mr-3 bg-primary/10 p-2 rounded-full">
                  <Check className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Just send</div>
                  <div className="text-sm text-muted-foreground">Send your request without a note</div>
                </div>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Write a personalized note</DialogTitle>
              <DialogDescription>
                Tell {recipientName || "the collaboration host"} why you're interested and what you bring to the table.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi, I'm interested in this collaboration because..."
                className="min-h-[120px] resize-none"
                autoFocus
              />
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("initial")}>
                Back
              </Button>
              <Button 
                onClick={handleSendWithNote} 
                disabled={isNoteEmpty}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}