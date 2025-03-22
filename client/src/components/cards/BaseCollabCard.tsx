import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Clock, Briefcase, Calendar } from "lucide-react";

export interface BaseCollabCardProps {
  data: {
    id: string;
    companyName: string;
    title?: string;
    collaborationType?: string;
    description?: string;
    topics?: string[];
    companyTwitter?: string;
    twitterFollowers?: string;
    companyLinkedIn?: string;
    date?: string;
    [key: string]: any;
  };
}

export function BaseCollabCard({ data }: BaseCollabCardProps) {
  return (
    <div className="w-full h-full">
      <div className="flex flex-col h-full p-4">
        <div className="mb-3">
          <Badge variant="outline" className="bg-primary/10 mb-2">
            {data.collaborationType || "Collaboration"}
          </Badge>
          <h3 className="text-lg font-semibold mb-1">
            {data.title || "Collaboration"}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="w-3 h-3 mr-1 opacity-70" />
            <span>{data.companyName}</span>
          </div>
        </div>
        
        <p className="text-sm text-card-foreground mb-3 flex-grow">
          {data.description}
        </p>
        
        {data.topics && data.topics.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Tag className="w-3 h-3 mr-1" />
              <span>Topics</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.topics.map((topic: string, idx: number) => (
                <span 
                  key={idx} 
                  className="px-2 py-0.5 bg-primary/10 text-xs rounded-full"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {data.date && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            <span>Posted {data.date}</span>
          </div>
        )}
      </div>
    </div>
  );
}