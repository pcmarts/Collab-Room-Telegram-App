import { UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCollabTypeIcon } from "@/lib/collab-utils";
import { GlowEffect } from "@/components/ui/glow-effect";

export interface PotentialMatchData {
  first_name: string;
  last_name?: string;
  company_name: string;
  job_title: string;
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
    <div className="w-full h-full rounded-xl relative overflow-hidden bg-background">
      {/* Glow effect */}
      <GlowEffect
        colors={['#7B68EE', '#337DFF', '#33FFC4', '#F433FF']}
        mode="pulse"
        blur="medium"
        scale={1.1}
        duration={6}
      />
      
      {/* Content */}
      <div className="flex flex-col h-full p-6 relative z-10">
        <div className="mb-4">
          <Badge variant="outline" className="bg-background mb-2 border-none">
            <UserCheck className="w-3 h-3 mr-1" />
            Potential Match
          </Badge>
          <h3 className="text-lg font-semibold mb-1 text-[#FAFAFA]">
            {first_name} from {company_name} is interested in your collab
          </h3>
          <p className="text-sm text-muted-foreground">
            {job_title}
          </p>
        </div>
        
        <div className="mb-4 flex-1">
          <div className="rounded-lg bg-black/20 backdrop-blur-sm p-3 mb-4">
            <p className="text-sm font-medium mb-1 text-[#FAFAFA]">Your Collab:</p>
            <div className="flex items-center">
              {getCollabTypeIcon(collab_type)}
              <span className="ml-1 text-sm text-[#FAFAFA]">{collab_type}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {description || "No additional details available"}
            </p>
          </div>
          
          {topics && topics.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {topics.map((topic: string, idx: number) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 bg-black/20 text-[#FAFAFA] text-xs rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}