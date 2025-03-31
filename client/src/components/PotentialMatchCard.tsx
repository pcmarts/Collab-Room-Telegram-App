import { UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCollabTypeIcon } from "@/lib/collab-utils";
import { GlowEffect } from "@/components/ui/glow-effect";

export interface PotentialMatchData {
  first_name: string;
  last_name?: string;
  company_name?: string; // Make optional to fix type issues
  job_title?: string;   // Make optional to fix type issues
  twitter_followers?: string;
  company_twitter_followers?: string;
  user_id: string;
  collaboration_id: string;
  swipe_created_at: string;
}

export interface PotentialMatchCardProps {
  collab_type: string;
  description?: string;
  topics?: string[];
  potentialMatchData: PotentialMatchData;
}

export function PotentialMatchCard({ 
  collab_type, 
  description, 
  topics, 
  potentialMatchData 
}: PotentialMatchCardProps) {
  const { first_name, last_name, company_name, job_title } = potentialMatchData;
  
  return (
    // Standard card size like regular cards
    <div className="rounded-xl relative overflow-hidden bg-background border border-border/40">
      {/* Subtle glow effect */}
      <GlowEffect
        colors={['#7B68EE', '#337DFF', '#33FFC4']}
        mode="pulse"
        blur="soft"
        scale={1.0} 
        duration={4}
        className="absolute inset-0 opacity-70"
      />
      
      {/* Content - normal layout without extreme stretching */}
      <div className="flex flex-col relative z-10">
        <div className="p-5 flex flex-col">
          <div className="mb-4">
            <Badge variant="outline" className="mb-2">
              <UserCheck className="w-3 h-3 mr-1" />
              Potential Match
            </Badge>
            <h3 className="text-lg font-semibold mb-1">
              {first_name} {company_name ? `from ${company_name}` : ''} is interested in your collab
            </h3>
            {job_title && (
              <p className="text-sm text-muted-foreground">
                {job_title}
              </p>
            )}
          </div>
          
          <div>
            <div className="rounded-lg bg-black/20 backdrop-blur-sm p-3 mb-4">
              <p className="text-sm font-medium mb-1">Your Collab:</p>
              <div className="flex items-center">
                {getCollabTypeIcon(collab_type)}
                <span className="ml-1 text-sm">{collab_type}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {description || "No additional details available"}
              </p>
            </div>
            
            {topics && topics.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {topics.map((topic: string, idx: number) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="text-xs"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}