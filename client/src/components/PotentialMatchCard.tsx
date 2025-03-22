import { UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCollabTypeIcon } from "@/lib/collab-utils";

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
    <div 
      className="w-full h-full rounded-xl" 
      style={{ background: 'linear-gradient(to bottom right, rgba(76, 29, 149, 1), #0A0A0B)' }}
    >
      <div className="flex flex-col h-full p-6">
        <div className="mb-4">
          <Badge variant="outline" className="bg-primary/10 mb-2">
            <UserCheck className="w-3 h-3 mr-1" />
            Potential Match
          </Badge>
          <h3 className="text-lg font-semibold mb-1">
            {first_name} from {company_name} is interested in your collab
          </h3>
          <p className="text-sm text-muted-foreground">
            {job_title}
          </p>
        </div>
        
        <div className="mb-4 flex-1">
          <div className="rounded-lg bg-black/10 p-3 mb-4">
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
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 bg-transparent text-gray-500 border border-[#6B7280] text-xs rounded-full"
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