import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ArrowRight,
  Mic,
  Video,
  Mail,
  PenTool,
  Coffee,
  MessageSquare,
  ListChecks
} from "lucide-react";
import { FaTwitter as Twitter } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

interface RequestsSummaryCardProps {
  recentRequests: Array<{
    id: string;
    collaboration_id: string;
    collaboration_type: string;
    collaboration_title: string;
    requester: {
      id: string;
      first_name: string;
      last_name?: string;
      avatar_url?: string;
    };
    company: {
      name: string;
      twitter_handle?: string;
    };
    note?: string;
    created_at: string;
  }>;
  totalPendingCount: number;
  onViewAllRequests: () => void;
}

export function RequestsSummaryCard({ 
  recentRequests, 
  totalPendingCount, 
  onViewAllRequests 
}: RequestsSummaryCardProps) {
  const getCollabTypeIcon = (collabType: string) => {
    switch(collabType) {
      case 'Podcast Guest Appearance':
      case 'Podcast':
        return <Mic className="h-4 w-4" />;
      case 'Twitter Spaces Guest':
      case 'Twitter Space':
        return <Twitter className="h-4 w-4" />;
      case 'Twitter Co-Marketing':
      case 'Co-Marketing on Twitter':
        return <Twitter className="h-4 w-4" />;
      case 'Live Stream Guest Appearance':
      case 'Live Stream':
      case 'Webinar':
        return <Video className="h-4 w-4" />;
      case 'Report & Research Feature':
      case 'Research Report':
        return <ListChecks className="h-4 w-4" />;
      case 'Newsletter Feature':
      case 'Newsletter':
        return <Mail className="h-4 w-4" />;
      case 'Blog Post Feature':
      case 'Blog Post':
        return <PenTool className="h-4 w-4" />;
      case 'Conference Coffee':
        return <Coffee className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            New Collaboration Requests
          </CardTitle>
          <Badge variant="destructive" className="font-medium">
            {totalPendingCount} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recent Requests List */}
        <div className="space-y-3">
          {recentRequests.slice(0, 4).map((request) => (
            <div key={request.id} className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border/50">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm">
                  {request.requester.first_name.charAt(0)}
                  {request.requester.last_name?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {getCollabTypeIcon(request.collaboration_type)}
                  <p className="text-sm font-medium truncate">
                    {request.collaboration_title}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {request.requester.first_name} {request.requester.last_name || ''} 
                    {request.company.name && (
                      <span className="text-muted-foreground/80"> • {request.company.name}</span>
                    )}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <Button 
          onClick={onViewAllRequests}
          className="w-full"
          variant="outline"
        >
          View All Requests ({totalPendingCount})
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}