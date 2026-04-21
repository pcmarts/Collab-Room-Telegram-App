import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { Eyebrow } from "@/components/brand";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReferralSuccessCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: string;
  shareableLink?: string;
}

const ReferralSuccessCelebration = ({
  open,
  onOpenChange,
  referralCode,
  shareableLink,
}: ReferralSuccessCelebrationProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      await apiRequest("/api/referrals/log-activity", "POST", {
        activity_type: "copy",
        details: { source: "celebration_modal" },
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Couldn't copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!shareableLink) return;

    const messageText = "Hey, I think you should check out Collab Room!";

    try {
      await apiRequest("/api/referrals/log-activity", "POST", {
        activity_type: "share",
        details: { platform: "telegram", source: "celebration_modal" },
      });

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          shareableLink,
        )}&text=${encodeURIComponent(messageText)}`;

        if (tg.isVersionAtLeast && tg.isVersionAtLeast("6.1")) {
          tg.openTelegramLink(shareUrl);
        } else {
          tg.openLink(shareUrl);
        }
        setTimeout(() => onOpenChange(false), 500);
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "Join me on Collab Room",
          text: `${messageText} ${shareableLink}`,
          url: shareableLink,
        });
        onOpenChange(false);
        return;
      }

      await navigator.clipboard.writeText(`${messageText} ${shareableLink}`);
      toast({
        title: "Link copied",
        description: "Share it wherever you like.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Share error:", error);
      try {
        await navigator.clipboard.writeText(
          `${messageText} ${shareableLink}`,
        );
        toast({
          title: "Link copied",
          description: "Share it wherever you like.",
        });
        onOpenChange(false);
      } catch {
        toast({
          title: "Share failed",
          description: "Couldn't share your referral link.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={
        <Eyebrow tone="warm" dot>
          Approved
        </Eyebrow>
      }
      title="You're invited."
      subtitle="Skip the line for up to 3 collaborators."
      footer={
        <BottomSheet.ActionBar>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Explore
          </Button>
          <Button onClick={handleShare} disabled={!shareableLink}>
            <Share2 className="h-4 w-4" />
            Share on Telegram
          </Button>
        </BottomSheet.ActionBar>
      }
    >
      <button
        type="button"
        onClick={handleCopy}
        className={`group flex w-full items-center justify-between gap-3 rounded-lg border border-warm-accent/25 bg-warm-surface px-4 py-3 text-left transition-colors hover:border-warm-accent/40 hover:bg-warm-surface-strong`}
        aria-label={`Copy referral code ${referralCode}`}
      >
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-warm-accent">
            Your code
          </p>
          <code className="block truncate font-mono text-lg tabular text-text">
            {referralCode}
          </code>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-warm-accent transition-colors group-hover:bg-warm-surface-strong">
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </span>
      </button>
      <p className="mt-2 text-center text-xs text-text-muted">
        {copied ? "Copied." : "Tap to copy."}
      </p>
    </BottomSheet>
  );
};

export { ReferralSuccessCelebration };
export default ReferralSuccessCelebration;
