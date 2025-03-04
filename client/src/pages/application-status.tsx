import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileData } from '@/types/profile';
import { format } from 'date-fns';

export default function ApplicationStatus() {
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center min-h-[100svh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">No Application Found</h1>
        <p className="text-muted-foreground">Something went wrong. Please try again.</p>
      </div>
    );
  }

  const { user } = profile;
  const applicationDate = user.applied_at ? format(new Date(user.applied_at), 'MMMM d, yyyy') : 'Unknown';

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <h1 className="text-lg font-semibold">Application Status</h1>
      </div>

      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-primary rounded-full" />
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Application Under Review</h2>
            <p className="text-muted-foreground mb-4">
              Thanks for applying to join CollabRoom! We're reviewing your application and will notify you through Telegram once it's approved.
            </p>
            
            <div className="text-sm text-left space-y-3 mt-6">
              <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Telegram:</strong> @{user.handle}</p>
              <p><strong>Applied:</strong> {applicationDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
