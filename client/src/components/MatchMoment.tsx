import { useLocation } from "wouter";

import { Eyebrow } from "@/components/brand";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

interface MatchMomentProps {
  title: string;
  companyName: string;
  collaborationType: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
  onMessage?: () => void;
}

export function MatchMoment({
  companyName,
  collaborationType,
  isOpen,
  onClose,
}: MatchMomentProps) {
  const [, navigate] = useLocation();

  const goToMatches = () => {
    onClose();
    navigate("/matches");
  };

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      eyebrow={
        <Eyebrow tone="warm" dot>
          Matched
        </Eyebrow>
      }
      title={`You're in with ${companyName}.`}
      subtitle={collaborationType}
      footer={
        <BottomSheet.ActionBar>
          <Button variant="ghost" onClick={onClose}>
            Keep browsing
          </Button>
          <Button onClick={goToMatches}>Open chat</Button>
        </BottomSheet.ActionBar>
      }
    >
      <p className="text-[0.9375rem] leading-relaxed text-text-muted">
        Your profile is visible to {companyName} now, and a private Telegram
        chat is open. Reach out whenever.
      </p>
    </BottomSheet>
  );
}
