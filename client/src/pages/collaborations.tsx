import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Twitter, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import type { CollaborationOpportunity } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export default function Collaborations() {
  const { toast } = useToast();
  const { data: collaborations, isLoading } = useQuery<CollaborationOpportunity[]>({
    queryKey: ['/api/opportunities']
  });

  const handleMatch = async (opportunityId: string) => {
    try {
      const response = await apiRequest('POST', '/api/matches', { opportunity_id: opportunityId });
      if (!response.ok) {
        throw new Error('Failed to create match');
      }

      toast({
        title: "Success!",
        description: "Match request sent. Check your Telegram for contact details.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create match. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Collaboration Opportunities</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborations?.map(collab => (
          <Card key={collab.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  {collab.title}
                  <div className="flex gap-2 mt-2">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      collab.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                    )}>
                      {collab.status}
                    </span>
                    <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                      {collab.collab_type}
                    </span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-grow">
              <p className="text-muted-foreground mb-4">{collab.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a href="#" className="hover:underline">Visit Website</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Twitter className="h-4 w-4" />
                  <a href="#" className="hover:underline">Twitter Profile</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Linkedin className="h-4 w-4" />
                  <a href="#" className="hover:underline">LinkedIn Profile</a>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t pt-4">
              <Button 
                className="w-full" 
                onClick={() => handleMatch(collab.id)}
                disabled={collab.status !== 'active'}
              >
                Connect & Collaborate
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}