import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageCircle, Users } from "lucide-react";
import { LuCopy } from "react-icons/lu";
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

export function MatchMoment({ 
  title, 
  companyName, 
  collaborationType, 
  userName,
  isOpen, 
  onClose,
  onMessage
}: MatchMomentProps) {
  const [_, navigate] = useLocation();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-auto rounded-xl p-0 border-0 shadow-xl">
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-primary/10 to-background"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 mt-2">
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 10, scale: 1.2 }}
                  transition={{ 
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1.5
                  }}
                >
                  <Sparkles className="h-12 w-12 text-primary" />
                </motion.div>
              </div>
              
              <motion.h2 
                className="text-2xl font-bold mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                It's a Match!
              </motion.h2>
              
              <motion.p 
                className="text-muted-foreground mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                You've matched with{userName ? <> <span className="font-medium text-foreground">{userName}</span> from</> : ''} <span className="font-medium text-foreground">{companyName}</span>
              </motion.p>
              
              <motion.div 
                className="bg-card rounded-lg p-4 mb-6 w-full shadow-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="font-semibold text-lg">
                  Collaboration Opportunity
                </h3>
              </motion.div>
              
              <motion.div 
                className="flex flex-col gap-3 w-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {onMessage && (
                  <Button 
                    className="w-full gap-2" 
                    onClick={onMessage}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send Message
                  </Button>
                )}
                
                <Button 
                  variant="secondary" 
                  className="w-full gap-2" 
                  onClick={() => {
                    navigate('/matches');
                    onClose();
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  View My Matches
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  onClick={onClose}
                >
                  <LuCopy className="h-4 w-4" />
                  Continue Discovering
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}