import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
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
  if (totalPendingCount === 0) {
    return null;
  }

  const getCollabTypeIcon = (collabType: string) => {
    // You can add specific icons for different collaboration types here
    return <Users className="h-3 w-3" />;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Requests</CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {totalPendingCount} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentRequests.length > 0 ? (
          <>
            {recentRequests.map((request) => (
              <div 
                key={request.id} 
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-sm">
                    {request.requester.first_name.charAt(0)}
                    {request.requester.last_name?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate">
                      {request.requester.first_name} {request.requester.last_name || ''}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground truncate">
                      {request.company.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {getCollabTypeIcon(request.collaboration_type)}
                    <span className="text-xs text-muted-foreground">
                      {request.collaboration_type}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onViewAllRequests}
              >
                View All Requests ({totalPendingCount})
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No recent requests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}