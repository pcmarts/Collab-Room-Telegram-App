import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Collaboration } from '@shared/schema';

export default function Collaborations() {
  const { data: collaborations, isLoading } = useQuery<Collaboration[]>({
    queryKey: ['/api/collaborations']
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Collaborations</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Collaboration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborations?.map(collab => (
          <Card key={collab.id}>
            <CardHeader>
              <CardTitle>{collab.title}</CardTitle>
              <div className="flex gap-2">
                {collab.is_featured && (
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                    Featured
                  </span>
                )}
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs",
                  collab.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                )}>
                  {collab.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {collab.details && typeof collab.details === 'object' && 
                  (collab.details.short_description || collab.details.description || 
                   (collab.details.goals || "No description available"))}
              </p>
              <div className="flex gap-2">
                {collab.tags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-accent rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}