import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { LogoAvatar } from "@/components/ui/logo-avatar";
import { Textarea } from "@/components/ui/textarea";
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
  const { toast } = useToast();

  // Reset the note each time the sheet opens
  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = note.trim();
    onSendWithNote(trimmed);
    onClose();
    toast({
      title: trimmed ? "Request sent with note" : "Request sent",
      description: trimmed
        ? "Your note was delivered to the host."
        : "The host has been notified.",
      variant: "success" as any,
    });
  };

  const handleSkip = () => {
    onSendWithNote("");
    onClose();
    toast({
      title: "Request sent",
      description: "The host has been notified.",
      variant: "success" as any,
    });
  };

  const hasNote = note.trim().length > 0;

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      eyebrow="Personalize"
      title="Add a note"
      subtitle={
        collaboration
          ? `Optional. Sharpens your request to ${collaboration.creator_company_name}.`
          : "Optional. A short note sharpens your request."
      }
      footer={
        <BottomSheet.ActionBar>
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleSend}>
            {hasNote ? "Send with note" : "Send"}
          </Button>
        </BottomSheet.ActionBar>
      }
    >
      {collaboration ? (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-hairline bg-surface p-3">
          <LogoAvatar
            name={collaboration.creator_company_name}
            logoUrl={collaboration.company_logo_url}
            className="h-9 w-9 shrink-0"
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text">
              {collaboration.creator_company_name}
            </p>
            <p className="truncate text-xs text-text-muted">
              {collaboration.collab_type}
            </p>
          </div>
        </div>
      ) : null}

      <Textarea
        placeholder="We'd be a strong fit — our audience overlaps with yours and we can co-promote across both channels."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[120px] resize-none"
        maxLength={500}
        autoFocus
      />
      <div className="mt-1.5 text-right text-xs tabular text-text-subtle">
        {note.length}/500
      </div>
    </BottomSheet>
  );
}
