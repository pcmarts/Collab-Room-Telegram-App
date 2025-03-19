import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";

// Dummy data for testing
const DUMMY_MATCHES = [
  {
    id: "1",
    title: "Podcast Guest",
    companyName: "Web3 Insights",
    roleTitle: "VP of Marketing",
    matchDate: "March 15, 2025",
    collaborationType: "Marketing",
    matchedPerson: "Alex Thompson",
  },
  {
    id: "2",
    title: "Web3 Gaming Blog Post",
    companyName: "CryptoTech Solutions",
    roleTitle: "Technical Content Writer",
    matchDate: "March 14, 2025",
    collaborationType: "Content",
    matchedPerson: "Maria Garcia",
  },
  {
    id: "3",
    title: "Twitter Space Co-host",
    companyName: "DeFi Daily",
    roleTitle: "Content Director",
    matchDate: "March 13, 2025",
    collaborationType: "Marketing",
    matchedPerson: "James Wilson",
  },
  {
    id: "4",
    title: "Research Report Collaboration",
    companyName: "Blockchain Analytics",
    roleTitle: "Market Researcher",
    matchDate: "March 17, 2025",
    collaborationType: "Research",
    matchedPerson: "Sarah Johnson",
  },
  {
    id: "5",
    title: "Live Stream Panel",
    companyName: "Crypto Education Hub",
    roleTitle: "Industry Expert",
    matchDate: "March 18, 2025",
    collaborationType: "Event",
    matchedPerson: "Michael Chen",
  },
  {
    id: "6",
    title: "Newsletter Feature",
    companyName: "Web3 Weekly",
    roleTitle: "Guest Contributor",
    matchDate: "March 19, 2025",
    collaborationType: "Content",
    matchedPerson: "Emma Rodriguez",
  },
];

export default function MatchesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  
  // Calculate the drag constraints
  useEffect(() => {
    // First render we need to measure the element heights
    if (containerRef.current) {
      const container = containerRef.current;
      const content = container.firstElementChild as HTMLElement;
      
      if (content) {
        const contentHeight = content.scrollHeight;
        const containerHeight = container.clientHeight;
        
        setContentHeight(contentHeight);
        setContainerHeight(containerHeight);
      }
    }
  }, [DUMMY_MATCHES]);
  
  // The maximum distance we can drag (content height - container height)
  const maxDrag = Math.max(0, contentHeight - containerHeight);
  
  const handleDragStart = () => {
    setIsDragging(true);
    setDragStartY(y.get());
  };
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Ensure we stay within bounds
    const currentY = y.get();
    if (currentY > 0) {
      y.set(0);
    } else if (currentY < -maxDrag) {
      y.set(-maxDrag);
    }
  };
  
  // This removes the page style overrides that might conflict
  useEffect(() => {
    // We're using a direct Framer Motion solution, so we don't need 
    // to modify body styles anymore
    return () => {};
  }, []);
  
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <h1 className="text-2xl font-bold p-6">My Matches</h1>
      
      <motion.div
        ref={containerRef}
        className="flex-1 overflow-hidden touch-none mobile-drag-container"
        style={{ position: 'relative', userSelect: 'none' }}
      >
        <motion.div
          drag="y"
          dragElastic={0.05}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
          dragConstraints={{ top: -maxDrag, bottom: 0 }}
          style={{ y }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="px-4 mobile-drag-container"
        >
          {DUMMY_MATCHES.length > 0 ? (
            <div className="space-y-4 pb-24">
              {DUMMY_MATCHES.map((match) => (
                <Card key={match.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{match.title}</CardTitle>
                        <CardDescription>{match.companyName}</CardDescription>
                      </div>
                      <Badge variant="outline">{match.collaborationType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{match.matchedPerson}</p>
                        <p className="text-sm text-muted-foreground">{match.roleTitle}</p>
                        <p className="text-xs text-muted-foreground">Matched on {match.matchDate}</p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => window.open('https://t.me/thisispaulm', '_blank')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No matches yet</p>
              <Button variant="outline">Start Discovering</Button>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}