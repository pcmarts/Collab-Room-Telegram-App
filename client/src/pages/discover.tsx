import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { X, Info, Check, Twitter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Company } from "@shared/schema";

interface Match {
  user: User;
  company: Company;
  score: number;
  type: 'marketing' | 'conference';
  isIncomingRequest?: boolean;
}

export default function Discover() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['/api/matches'],
  });

  const handleSwipe = (direction: 'left' | 'right', index: number) => {
    if (direction === 'right') {
      // Handle match request
      console.log('Requested match with:', matches?.[index]);
    }
    setCurrentIndex(prev => prev + 1);
  };

  const toggleCardFlip = (index: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentMatch = matches?.[currentIndex];

  if (!currentMatch) {
    return (
      <div className="min-h-[100svh] bg-background">
        <PageHeader
          title="Discover"
          subtitle="Find collaboration opportunities"
        />
        <div className="p-4 text-center text-muted-foreground">
          No more matches available. Check back later!
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="Discover"
        subtitle="Find collaboration opportunities"
      />
      
      <div className="p-4">
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <Card className={`
              w-full transform transition-transform duration-500 
              ${flippedCards[currentIndex] ? 'rotate-y-180' : ''} 
              ${currentMatch.isIncomingRequest ? 'border-primary' : ''}
            `}>
              <CardContent className="p-6">
                {/* Front of card */}
                <div className={`${flippedCards[currentIndex] ? 'hidden' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge variant={currentMatch.type === 'marketing' ? 'default' : 'secondary'}>
                        {currentMatch.type === 'marketing' ? 'Marketing Collab' : 'Coffee Meet'}
                      </Badge>
                      {currentMatch.isIncomingRequest && (
                        <Badge variant="outline" className="ml-2">
                          Incoming Request
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-medium">{currentMatch.company.job_title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span>{currentMatch.company.name}</span>
                    {currentMatch.company.twitter_handle && (
                      <a 
                        href={`https://twitter.com/${currentMatch.company.twitter_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentMatch.company.tags?.map(tag => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Back of card */}
                <div className={`${!flippedCards[currentIndex] ? 'hidden' : ''}`}>
                  <h3 className="font-medium mb-4">Company Details</h3>
                  <dl className="space-y-2">
                    <dt className="font-medium">Funding Stage</dt>
                    <dd className="text-muted-foreground">{currentMatch.company.funding_stage}</dd>
                    
                    {currentMatch.company.has_token && (
                      <>
                        <dt className="font-medium mt-2">Token</dt>
                        <dd className="text-muted-foreground">
                          {currentMatch.company.token_ticker} 
                          ({currentMatch.company.blockchain_networks?.join(", ")})
                        </dd>
                      </>
                    )}
                    
                    <dt className="font-medium mt-2">Description</dt>
                    <dd className="text-muted-foreground">{currentMatch.company.short_description}</dd>
                  </dl>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => handleSwipe('left', currentIndex)}
              >
                <X className="h-6 w-6" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => toggleCardFlip(currentIndex)}
              >
                <Info className="h-6 w-6" />
              </Button>

              <Button
                variant="default"
                size="icon"
                className="rounded-full h-12 w-12"
                onClick={() => handleSwipe('right', currentIndex)}
              >
                <Check className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
