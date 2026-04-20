import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";

interface MatchMomentProps {
  title: string;
  companyName: string;
  collaborationType: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
  onMessage?: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function MatchMoment({
  companyName,
  collaborationType,
  isOpen,
  onClose,
}: MatchMomentProps) {
  const [, navigate] = useLocation();
  const reduceMotion = useReducedMotion();

  const goToMatches = () => {
    onClose();
    navigate("/matches");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 border border-hairline rounded-lg bg-surface-raised">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: EASE_OUT }}
              className="flex flex-col p-5"
            >
              <div className="text-xs font-medium uppercase tracking-wider text-brand tabular">
                Matched
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text leading-tight">
                You're in with{" "}
                <span className="whitespace-nowrap">{companyName}</span>.
              </h2>

              <p className="mt-2 text-sm text-text-muted">
                {collaborationType}. Your profile is visible to them now, and a
                private Telegram chat is open.
              </p>

              <div className="mt-5 flex gap-2">
                <Button size="sm" onClick={goToMatches} className="flex-1">
                  Open chat
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  Keep browsing
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
