import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Match } from '@shared/schema';
import { Loader2 } from 'lucide-react';

interface MatchWithDetails extends Match {
  opportunity: {
    title: string;
    collab_type: string;
  };
  company: {
    name: string;
    twitter_handle: string | null;
  };
  partner: {
    first_name: string;
    last_name: string;
    handle: string;
  };
}

export default function ActiveCollabs() {
  const { data: matches, isLoading } = useQuery<MatchWithDetails[]>({
    queryKey: ['/api/matches/active']
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Active Collaborations</h1>
      
      <div className="space-y-4">
        {matches?.map(match => (
          <Card key={match.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{match.opportunity.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    with {match.partner.first_name} {match.partner.last_name} from {match.company.name}
                  </p>
                </div>
                <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>
                  {match.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p className="text-muted-foreground">Type: {match.opportunity.collab_type}</p>
                <p className="text-muted-foreground">
                  Matched on: {format(new Date(match.matched_at), 'MMM d, yyyy')}
                </p>
                <p>
                  Contact via Telegram: @{match.partner.handle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {matches?.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No active collaborations yet. Start matching with opportunities to see them here!
          </div>
        )}
      </div>
    </div>
  );
}
