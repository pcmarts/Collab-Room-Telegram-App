import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageCircle, Users, Twitter, Mic, FileText, FileSearch, Mail, Video } from "lucide-react";
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
                <div className="flex items-center justify-center">
                  {/* Different badge styles based on collaboration type, matching the pill styling in SimpleCard */}
                  {(collaborationType?.toLowerCase()?.includes('twitter') || 
                    collaborationType?.toLowerCase()?.includes('co-marketing')) ? (
                    <Badge variant="outline" className="text-md bg-blue-500/10 border-blue-500/20 text-[#1DA1F2] py-2 px-3">
                      <Twitter className="w-4 h-4 mr-2" />
                      {collaborationType}
                    </Badge>
                  ) : collaborationType === 'Podcast Guest Appearance' ? (
                    <Badge variant="outline" className="text-md bg-purple-500/10 border-purple-500/20 text-purple-700 py-2 px-3">
                      <Mic className="w-4 h-4 mr-2" />
                      {collaborationType}
                    </Badge>
                  ) : collaborationType === 'Blog Post Feature' ? (
                    <Badge variant="outline" className="text-md bg-emerald-500/10 border-emerald-500/20 text-emerald-700 py-2 px-3">
                      <FileText className="w-4 h-4 mr-2" />
                      {collaborationType}
                    </Badge>
                  ) : collaborationType === 'Report & Research Feature' ? (
                    <Badge variant="outline" className="text-md bg-amber-500/10 border-amber-500/20 text-amber-700 py-2 px-3">
                      <FileSearch className="w-4 h-4 mr-2" />
                      {collaborationType}
                    </Badge>
                  ) : collaborationType === 'Newsletter Feature' ? (
                    <Badge variant="outline" className="text-md bg-indigo-500/10 border-indigo-500/20 text-indigo-700 py-2 px-3">
                      <Mail className="w-4 h-4 mr-2" />
                      {collaborationType}
                    </Badge>
                  ) : collaborationType === 'Live Stream Guest Appearance' ? (
                    <Badge variant="outline" className="text-md bg-red-500/10 border-red-500/20 text-red-700 py-2 px-3">
                      <Video className="w-4 h-4 mr-2" />
                      {collaborationType}
                    </Badge>
                  ) : (
                    <h3 className="font-semibold text-lg">{collaborationType}</h3>
                  )}
                </div>
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