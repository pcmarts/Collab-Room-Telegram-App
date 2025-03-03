import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { type User, type Collaboration } from '@shared/schema';

export default function Dashboard() {
  const { data: collaborations, isLoading: isLoadingCollabs } = useQuery<Collaboration[]>({
    queryKey: ['/api/collaborations']
  });

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/user']
  });

  if (isLoadingCollabs || isLoadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Welcome back, {user?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {collaborations?.filter(c => c.status === 'active').length || 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {collaborations?.filter(c => c.applicant_id === user?.id).length || 0}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Featured Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {collaborations?.filter(c => c.is_featured).length || 0}
            </span>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-6">Recent Collaborations</h2>
      {collaborations?.slice(0, 5).map(collab => (
        <Card key={collab.id} className="mb-4">
          <CardHeader>
            <CardTitle>{collab.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{collab.description}</p>
            <div className="flex gap-2 mt-4">
              {collab.tags?.map(tag => (
                <span key={tag} className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
